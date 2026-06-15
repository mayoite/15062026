import { hasSupabasePublicEnv, supabase } from '@/platform/drizzle/db';
import { buildLocalCatalogFallbackProducts } from "./fallback";
import { isMissingTableError, normalizeProducts } from "./adapters";
import type { Product } from "./types";

const PRODUCT_TABLE_CANDIDATES = ["products", "catalog_products"] as const;

function catalogFallbackProducts(): Product[] {
  const localFallbackProducts = buildLocalCatalogFallbackProducts();
  return localFallbackProducts.length > 0 ? localFallbackProducts : [];
}

export async function fetchAllProductsLive(): Promise<Product[]> {
  if (!hasSupabasePublicEnv()) {
    return catalogFallbackProducts();
  }

  try {
  for (const tableName of PRODUCT_TABLE_CANDIDATES) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .order("name", { ascending: true });

    if (!error) {
      return normalizeProducts((data ?? []) as Product[]);
    }

    if (!isMissingTableError(error.message, tableName)) {
      console.error("[getProducts] Supabase error:", error.message);
      break;
    }
  }

  return catalogFallbackProducts();
  } catch (error) {
    console.error("[getProducts] Supabase unavailable:", error);
    return catalogFallbackProducts();
  }
}

export async function fetchProductsByCategoryLive(categoryId: string): Promise<Product[]> {
  if (!hasSupabasePublicEnv()) {
    return catalogFallbackProducts().filter((product) => product.category_id === categoryId);
  }

  try {
  for (const tableName of PRODUCT_TABLE_CANDIDATES) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("category_id", categoryId)
      .order("name", { ascending: true });

    if (!error) {
      return normalizeProducts((data ?? []) as Product[]);
    }

    if (!isMissingTableError(error.message, tableName)) {
      console.error("[getProductsByCategory] Supabase error:", error.message);
      break;
    }
  }

  return catalogFallbackProducts().filter((product) => product.category_id === categoryId);
  } catch (error) {
    console.error("[getProductsByCategory] Supabase unavailable:", error);
    return catalogFallbackProducts().filter((product) => product.category_id === categoryId);
  }
}

export async function fetchProductByUrlKeyLive(productUrlKey: string): Promise<Product | null> {
  if (!hasSupabasePublicEnv()) {
    return catalogFallbackProducts().find((product) => product.slug === productUrlKey) ?? null;
  }

  try {
  for (const tableName of PRODUCT_TABLE_CANDIDATES) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("slug", productUrlKey)
      .single();

    if (!error) {
      const row = data as Product;
      return normalizeProducts([row])[0] ?? null;
    }

    if (!isMissingTableError(error.message, tableName)) {
      console.error("[getProductByUrlKey] Supabase error:", error.message);
      break;
    }
  }

  return catalogFallbackProducts().find((product) => product.slug === productUrlKey) ?? null;
  } catch (error) {
    console.error("[getProductByUrlKey] Supabase unavailable:", error);
    return catalogFallbackProducts().find((product) => product.slug === productUrlKey) ?? null;
  }
}

export async function fetchCategoryIdsLive(): Promise<string[]> {
  if (!hasSupabasePublicEnv()) {
    return [...new Set(catalogFallbackProducts().map((product) => product.category_id).filter(Boolean))];
  }

  try {
  let data: Array<{ category_id?: string | null }> | null = null;
  let lastError = "";
  let missingTablesOnly = true;

  for (const tableName of PRODUCT_TABLE_CANDIDATES) {
    const response = await supabase
      .from(tableName)
      .select("category_id")
      .order("category_id");

    if (!response.error) {
      data = response.data as Array<{ category_id?: string | null }>;
      lastError = "";
      break;
    }

    lastError = response.error.message || "";
    if (!isMissingTableError(lastError, tableName)) {
      missingTablesOnly = false;
      console.error("[getCategoryIds] Supabase error:", lastError);
      break;
    }
  }

  if (!data) {
    if (lastError && !missingTablesOnly) {
      console.error("[getCategoryIds] Supabase error:", lastError);
    }

    return [...new Set(catalogFallbackProducts().map((product) => product.category_id).filter(Boolean))];
  }

  return [
    ...new Set(
      data
        .map((row) => (typeof row.category_id === "string" ? row.category_id : ""))
        .filter(Boolean),
    ),
  ];
  } catch (error) {
    console.error("[getCategoryIds] Supabase unavailable:", error);
    return [...new Set(catalogFallbackProducts().map((product) => product.category_id).filter(Boolean))];
  }
}
