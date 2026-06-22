import "server-only";

import { unstable_cache } from "next/cache";
import { supabase } from '@/platform/drizzle/db';
import { buildLocalCatalogFallbackProducts } from "@/lib/catalog/fallback";
import { summarizeSupabaseError } from '@/platform/supabase/safe';
import { CATALOG_REVALIDATE_SECONDS } from "@/lib/site-data/fallbacks";

type SupabaseErrorLike = {
  code?: string | null;
  message?: string | null;
} | null;

type ProductSlugAliasRow = {
  alias_slug?: string | null;
  canonical_slug?: string | null;
};

const ALIAS_TABLE_CANDIDATES = ["catalog_product_slug_aliases", "product_slug_aliases"] as const;
let preferredAliasTable: (typeof ALIAS_TABLE_CANDIDATES)[number] | null = null;
let aliasLookupDisabled = false;
let aliasLookupDisabledLogged = false;
const LOG_MISSING_ALIAS_TABLE = String(process.env.LOG_MISSING_ALIAS_TABLE || "").toLowerCase() === "true";

export type ProductSlugResolution<T> = {
  row: T | null;
  requestedSlug: string;
  canonicalSlug: string;
  resolvedViaAlias: boolean;
  aliasSlug: string | null;
};

function normalizeProductUrlKey(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function isNoRowsError(error: SupabaseErrorLike): boolean {
  const code = String(error?.code || "");
  if (code === "PGRST116") return true;
  const msg = String(error?.message || "").toLowerCase();
  return msg.includes("no rows") || msg.includes("not found");
}

function isMissingAliasTableError(error: SupabaseErrorLike): boolean {
  const code = String(error?.code || "");
  if (code === "42P01" || code === "PGRST205") return true;
  const msg = String(error?.message || "").toLowerCase();
  if (msg.includes("schema cache") && msg.includes("product_slug_aliases")) return true;
  if (msg.includes("could not find the table") && msg.includes("product_slug_aliases")) return true;
  return msg.includes("relation") && msg.includes("product_slug_aliases") && msg.includes("does not exist");
}

function disableAliasLookupOnce(reason: string): void {
  aliasLookupDisabled = true;
  if (aliasLookupDisabledLogged || !LOG_MISSING_ALIAS_TABLE) return;
  aliasLookupDisabledLogged = true;
  console.warn(`[slug-resolver] alias lookup disabled: ${reason}`);
}

async function fetchProductBySlug<T>(slug: string, selectClause: string): Promise<T | null> {
  const { data, error } = await supabase
    .from("products")
    .select(selectClause)
    .eq("slug", slug)
    .single();

  if (error) {
    if (!isNoRowsError(error)) {
      console.error(`[slug-resolver] product lookup failed for "${slug}": ${summarizeSupabaseError(error)}`);
    }
    return null;
  }
  return (data as T) ?? null;
}

function fetchFallbackProductBySlug<T>(slug: string): T | null {
  const fallbackProduct = buildLocalCatalogFallbackProducts().find(
    (product) => product.slug === slug,
  );
  return (fallbackProduct as T) ?? null;
}

async function fetchAliasMapping(slug: string): Promise<ProductSlugAliasRow | null> {
  if (aliasLookupDisabled) return null;

  const tryTables = preferredAliasTable
    ? [preferredAliasTable, ...ALIAS_TABLE_CANDIDATES.filter((t) => t !== preferredAliasTable)]
    : [...ALIAS_TABLE_CANDIDATES];

  for (const tableName of tryTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select("alias_slug, canonical_slug")
      .eq("alias_slug", slug)
      .eq("is_active", true)
      .single();

    if (!error) {
      preferredAliasTable = tableName;
      return (data as ProductSlugAliasRow) ?? null;
    }

    if (isNoRowsError(error)) {
      preferredAliasTable = tableName;
      return null;
    }

    if (isMissingAliasTableError(error)) continue;

    console.error(
      `[slug-resolver] alias lookup failed for "${slug}" on "${tableName}": ${summarizeSupabaseError(error)}`,
    );
    return null;
  }

  disableAliasLookupOnce("alias table not found in schema cache (checked catalog + legacy names)");
  return null;
}

async function resolveProductByUrlKeyLive<T>(
  requestedUrlKey: string,
  selectClause = "*",
): Promise<ProductSlugResolution<T>> {
  const requestedSlug = normalizeProductUrlKey(requestedUrlKey);
  if (!requestedSlug) {
    return {
      row: null,
      requestedSlug: "",
      canonicalSlug: "",
      resolvedViaAlias: false,
      aliasSlug: null,
    };
  }

  // Alias-first so legacy rows can be overridden to the intended canonical slug.
  const aliasRow = await fetchAliasMapping(requestedSlug);
  const aliasCanonical = String(aliasRow?.canonical_slug || "").trim().toLowerCase();
  if (aliasCanonical && aliasCanonical !== requestedSlug) {
    const aliasedProduct = await fetchProductBySlug<T>(aliasCanonical, selectClause);
    if (aliasedProduct) {
      return {
        row: aliasedProduct,
        requestedSlug,
        canonicalSlug: aliasCanonical,
        resolvedViaAlias: true,
        aliasSlug: requestedSlug,
      };
    }
  }

  const directProduct = await fetchProductBySlug<T>(requestedSlug, selectClause);
  if (directProduct) {
    return {
      row: directProduct,
      requestedSlug,
      canonicalSlug: requestedSlug,
      resolvedViaAlias: false,
      aliasSlug: null,
    };
  }

  const fallbackProduct = fetchFallbackProductBySlug<T>(requestedSlug);
  if (!fallbackProduct) {
    return {
      row: null,
      requestedSlug,
      canonicalSlug: requestedSlug,
      resolvedViaAlias: false,
      aliasSlug: null,
    };
  }

  return {
    row: fallbackProduct,
    requestedSlug,
    canonicalSlug: requestedSlug,
    resolvedViaAlias: false,
    aliasSlug: null,
  };
}

const getCachedProductResolution = unstable_cache(
  async <T>(requestedUrlKey: string, selectClause = "*") =>
    resolveProductByUrlKeyLive<T>(requestedUrlKey, selectClause),
  ["catalog-product-resolution-v2"],
  {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: ["catalog", "catalog-products", "catalog-slugs"],
  },
);

export async function resolveProductByUrlKey<T>(
  requestedUrlKey: string,
  selectClause = "*",
): Promise<ProductSlugResolution<T>> {
  return getCachedProductResolution<T>(requestedUrlKey, selectClause);
}
