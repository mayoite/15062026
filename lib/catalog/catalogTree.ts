import { supabase } from '@/platform/drizzle/db';
import { buildLocalCatalogFallbackProducts } from "./fallback";
import { isMissingTableError, normalizeProducts, toCompatProduct } from "./adapters";
import type { CategoryRow, CompatCategory, CompatSeries, Product } from "./types";

const PRODUCT_TABLE_CANDIDATES = ["products", "catalog_products"] as const;
const CATEGORY_TABLE_CANDIDATES = ["categories", "catalog_categories"] as const;
const CATALOG_FETCH_RETRIES =
  process.env.NEXT_PHASE === "phase-production-build" || process.env.CI === "true" ? 1 : 3;
const CATALOG_RETRY_DELAY_MS = 500;
const CATALOG_FAILURE_COOLDOWN_MS = 60_000;

let lastCatalogFailureAt = 0;
const loggedCatalogErrors = new Set<string>();

function summarizeSupabaseError(message?: string): string {
  if (!message) return "Unknown Supabase error";
  const singleLine = message.replace(/\s+/g, " ").trim();
  return singleLine.length > 260 ? `${singleLine.slice(0, 260)}...` : singleLine;
}

function isTransientCatalogError(message?: string): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("ssl handshake failed") ||
    normalized.includes("error code 525") ||
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("timeout") ||
    normalized.includes("<!doctype html") ||
    normalized.includes("<html") ||
    normalized.includes("cloudflare") ||
    normalized.includes("origin is unreachable") ||
    normalized.includes("temporarily unavailable")
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function buildCatalogLive(): Promise<CompatCategory[]> {
  let categories: CategoryRow[] = [];
  let products: Product[] = [];
  let lastError = "";

  const now = Date.now();
  const hasRecentFailure =
    lastCatalogFailureAt > 0 && now - lastCatalogFailureAt < CATALOG_FAILURE_COOLDOWN_MS;
  if (hasRecentFailure) {
    return [];
  }

  for (let attempt = 1; attempt <= CATALOG_FETCH_RETRIES; attempt += 1) {
    const categoryTableCandidates =
      attempt === 1 ? [...CATEGORY_TABLE_CANDIDATES] : [...CATEGORY_TABLE_CANDIDATES].reverse();
    const productTableCandidates =
      attempt === 1 ? [...PRODUCT_TABLE_CANDIDATES] : [...PRODUCT_TABLE_CANDIDATES].reverse();

    let catRes:
      | { data: CategoryRow[] | null; error: { message?: string } | null }
      | null = null;
    let categoryTablesMissing = false;
    for (const tableName of categoryTableCandidates) {
      const response = await supabase.from(tableName).select("*");
      if (!response.error || !isMissingTableError(response.error.message, tableName)) {
        catRes = response as { data: CategoryRow[] | null; error: { message?: string } | null };
        break;
      }
    }
    if (!catRes) {
      categoryTablesMissing = true;
      catRes = { data: null, error: { message: "Missing categories/catalog_categories tables" } };
    }

    let prodRes:
      | { data: Product[] | null; error: { message?: string } | null }
      | null = null;
    let productTablesMissing = false;
    for (const tableName of productTableCandidates) {
      const response = await supabase
        .from(tableName)
        .select("*")
        .order("name", { ascending: true });
      if (!response.error || !isMissingTableError(response.error.message, tableName)) {
        prodRes = response as { data: Product[] | null; error: { message?: string } | null };
        break;
      }
    }
    if (!prodRes) {
      productTablesMissing = true;
      prodRes = { data: null, error: { message: "Missing products/catalog_products tables" } };
    }

    const categoryError = catRes.error?.message;
    const productError = prodRes.error?.message;

    if (!categoryError && !productError) {
      categories = catRes.data as CategoryRow[];
      products = normalizeProducts((prodRes.data ?? []) as Product[]);
      lastCatalogFailureAt = 0;
      break;
    }

    const summarizedCategoryError = summarizeSupabaseError(categoryError);
    const summarizedProductError = summarizeSupabaseError(productError);
    const combinedError = categoryError || productError || "Unknown fetch error";
    lastError = combinedError;

    if (categoryError && !categoryTablesMissing) {
      console.error(
        `[getCatalog] Categories error (attempt ${attempt}/${CATALOG_FETCH_RETRIES}):`,
        summarizedCategoryError,
      );
    }
    if (productError && !productTablesMissing) {
      console.error(
        `[getCatalog] Products error (attempt ${attempt}/${CATALOG_FETCH_RETRIES}):`,
        summarizedProductError,
      );
    }

    if (categoryTablesMissing && productTablesMissing) {
      break;
    }

    if (attempt < CATALOG_FETCH_RETRIES && isTransientCatalogError(combinedError)) {
      await wait(CATALOG_RETRY_DELAY_MS * attempt);
      continue;
    }

    if (!categoryTablesMissing || !productTablesMissing) {
      const summarized = summarizeSupabaseError(combinedError);
      lastCatalogFailureAt = Date.now();
      if (!loggedCatalogErrors.has(summarized)) {
        loggedCatalogErrors.add(summarized);
        console.error(`[getCatalog] failed: ${summarized}`);
      }
    }
    break;
  }

  if (categories.length === 0 && products.length === 0 && lastError) {
    const localFallbackProducts = buildLocalCatalogFallbackProducts();
    if (localFallbackProducts.length > 0) {
      products = localFallbackProducts;
      const categoryIds = [
        ...new Set(localFallbackProducts.map((product) => product.category_id).filter(Boolean)),
      ];
      categories = categoryIds.map((id) => ({ id, name: id }));
      lastCatalogFailureAt = 0;
    } else {
      const summarized = summarizeSupabaseError(lastError);
      lastCatalogFailureAt = Date.now();
      if (!loggedCatalogErrors.has(summarized)) {
        loggedCatalogErrors.add(summarized);
        console.error(`[getCatalog] failed: ${summarized}`);
      }
      return [];
    }
  }

  const categoryMap = new Map<string, { info: CategoryRow; products: Product[] }>();

  for (const category of categories) {
    categoryMap.set(category.id, { info: category, products: [] });
  }

  for (const product of products) {
    const categoryId = product.category_id;
    const categoryEntry = categoryMap.get(categoryId);
    if (!categoryEntry) continue;
    categoryEntry.products.push(product);
  }

  const result: CompatCategory[] = [];

  for (const [categoryId, categoryData] of categoryMap) {
    if (categoryData.products.length === 0) continue;

    const seriesMap = new Map<string, Product[]>();
    for (const product of categoryData.products) {
      const seriesId = product.series_id || `${categoryId}-series`;
      const existing = seriesMap.get(seriesId);
      if (existing) {
        existing.push(product);
      } else {
        seriesMap.set(seriesId, [product]);
      }
    }

    const series: CompatSeries[] = [];
    for (const [seriesId, seriesProducts] of seriesMap) {
      series.push({
        id: seriesId,
        name: seriesProducts[0]?.series_name || "Series",
        description: `Premium ${categoryData.info.name.toLowerCase()} solutions`,
        products: seriesProducts.map(toCompatProduct),
      });
    }

    result.push({
      id: categoryId,
      name: categoryData.info.name,
      description: `Professional furniture systems for ${categoryData.info.name.toLowerCase()}`,
      series,
    });
  }

  if (result.length === 0) {
    const message = "Supabase catalog returned no usable categories";
    if (!loggedCatalogErrors.has(message)) {
      loggedCatalogErrors.add(message);
      console.error(`[getCatalog] ${message}`);
    }
    return [];
  }

  return result;
}
