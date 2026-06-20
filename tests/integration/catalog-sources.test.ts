import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type QueryResult = { data: unknown; error: { message?: string } | null };

type ChainState = {
  eq?: { column: string; value: string };
  single?: boolean;
};

function createSupabaseMock(responses: Record<string, QueryResult | ((state: ChainState) => QueryResult)>) {
  const resolve = (table: string, state: ChainState): QueryResult => {
    const handler = responses[table];
    if (!handler) return { data: null, error: { message: `No mock for ${table}` } };
    return typeof handler === "function" ? handler(state) : handler;
  };

  const buildTerminal = (table: string, state: ChainState) => ({
    order: vi.fn(async () => resolve(table, state)),
    single: vi.fn(async () => {
      const result = resolve(table, state);
      if (Array.isArray(result.data) && result.data.length === 1) {
        return { data: result.data[0], error: null };
      }
      return result;
    }),
  });

  const from = vi.fn((table: string) => ({
    select: vi.fn(() => {
      const state: ChainState = {};
      const terminal = buildTerminal(table, state);
      const response = () => resolve(table, state);
      return {
        order: terminal.order,
        eq: vi.fn((column: string, value: string) => {
          state.eq = { column, value };
          return {
            order: terminal.order,
            single: terminal.single,
          };
        }),
        single: terminal.single,
        then: (onFulfilled: (value: QueryResult) => void, onRejected?: (reason: unknown) => void) =>
          response().then(onFulfilled, onRejected),
      };
    }),
  }));

  return { from };
}

const { hasSupabasePublicEnv, supabaseMock } = vi.hoisted(() => ({
  hasSupabasePublicEnv: vi.fn(),
  supabaseMock: {
    from: vi.fn(),
  },
}));

vi.mock("@/platform/drizzle/db", () => ({
  hasSupabasePublicEnv,
  supabase: supabaseMock,
}));

import {
  fetchAllProductsLive,
  fetchCategoryIdsLive,
  fetchProductByUrlKeyLive,
  fetchProductsByCategoryLive,
} from "@/lib/catalog/sources";
import { buildLocalCatalogFallbackProducts } from "@/lib/catalog/fallback";

describe("catalog sources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSupabasePublicEnv.mockReturnValue(false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses local fallback when Supabase env is missing", async () => {
    const products = await fetchAllProductsLive();
    expect(products.length).toBeGreaterThan(0);
    expect(products).toEqual(buildLocalCatalogFallbackProducts());
  });

  it("filters fallback products by category and slug", async () => {
    const fallback = buildLocalCatalogFallbackProducts();
    const categoryId = fallback[0].category_id;
    const slug = fallback[0].slug;

    const byCategory = await fetchProductsByCategoryLive(categoryId);
    expect(byCategory.every((product) => product.category_id === categoryId)).toBe(true);

    const bySlug = await fetchProductByUrlKeyLive(slug);
    expect(bySlug?.slug).toBe(slug);

    const missing = await fetchProductByUrlKeyLive("__missing-slug__");
    expect(missing).toBeNull();

    const categoryIds = await fetchCategoryIdsLive();
    expect(categoryIds.length).toBeGreaterThan(0);
    expect(categoryIds).toContain(categoryId);
  });

  it("returns live products from the first successful table", async () => {
    hasSupabasePublicEnv.mockReturnValue(true);
    const live = createSupabaseMock({
      products: {
        data: [
          {
            id: "live-1",
            category_id: "seating",
            name: "Live Chair",
            slug: "live-chair",
            images: [],
            specs: { dimensions: "", materials: [], features: [] },
            series_id: "seating-series",
            series_name: "Seating",
            created_at: "2024-01-01",
          },
        ],
        error: null,
      },
      catalog_products: { data: null, error: { message: "Could not find the table catalog_products" } },
    });
    supabaseMock.from.mockImplementation((table: string) => live.from(table));

    const products = await fetchAllProductsLive();
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Live Chair");
  });

  it("falls back when only missing-table errors are returned", async () => {
    hasSupabasePublicEnv.mockReturnValue(true);
    const local = createSupabaseMock({
      products: { data: null, error: { message: "relation products does not exist" } },
      catalog_products: { data: null, error: { message: "Could not find the table catalog_products" } },
    });
    supabaseMock.from.mockImplementation((table: string) => local.from(table));

    const products = await fetchAllProductsLive();
    expect(products.length).toBeGreaterThan(0);
    expect(products).toEqual(buildLocalCatalogFallbackProducts());
  });

  it("logs and falls back on non-missing Supabase errors", async () => {
    hasSupabasePublicEnv.mockReturnValue(true);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const local = createSupabaseMock({
      products: { data: null, error: { message: "permission denied for table products" } },
      catalog_products: { data: null, error: { message: "permission denied for table catalog_products" } },
    });
    supabaseMock.from.mockImplementation((table: string) => local.from(table));

    const products = await fetchAllProductsLive();
    expect(products).toEqual(buildLocalCatalogFallbackProducts());
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("handles thrown Supabase client failures", async () => {
    hasSupabasePublicEnv.mockReturnValue(true);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseMock.from.mockImplementation(() => {
      throw new Error("Supabase offline");
    });

    const products = await fetchAllProductsLive();
    expect(products).toEqual(buildLocalCatalogFallbackProducts());
    expect(consoleSpy).toHaveBeenCalledWith("[getProducts] Supabase unavailable:", expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("loads distinct category ids from Supabase rows", async () => {
    hasSupabasePublicEnv.mockReturnValue(true);
    const local = createSupabaseMock({
      products: {
        data: [{ category_id: "seating" }, { category_id: "tables" }, { category_id: null }, { category_id: "seating" }],
        error: null,
      },
    });
    supabaseMock.from.mockImplementation((table: string) => local.from(table));

    const ids = await fetchCategoryIdsLive();
    expect(ids).toEqual(["seating", "tables"]);
  });

  it("fetches live products by category and url key", async () => {
    hasSupabasePublicEnv.mockReturnValue(true);
    const row = {
      id: "live-2",
      category_id: "tables",
      name: "Live Table",
      slug: "live-table",
      images: [],
      specs: { dimensions: "", materials: [], features: [] },
      series_id: "tables-series",
      series_name: "Tables",
      created_at: "2024-01-01",
    };
    const local = createSupabaseMock({
      products: { data: [row], error: null },
      catalog_products: { data: null, error: { message: "Could not find the table catalog_products" } },
    });
    supabaseMock.from.mockImplementation((table: string) => local.from(table));

    const byCategory = await fetchProductsByCategoryLive("tables");
    expect(byCategory).toHaveLength(1);
    expect(byCategory[0].slug).toBe("live-table");

    const bySlug = await fetchProductByUrlKeyLive("live-table");
    expect(bySlug?.name).toBe("Live Table");
  });

  it("handles category and url-key fetch failures with fallback", async () => {
    hasSupabasePublicEnv.mockReturnValue(true);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const local = createSupabaseMock({
      products: { data: null, error: { message: "permission denied for table products" } },
      catalog_products: { data: null, error: { message: "permission denied for table catalog_products" } },
    });
    supabaseMock.from.mockImplementation((table: string) => local.from(table));

    const fallback = buildLocalCatalogFallbackProducts();
    const categoryId = fallback[0].category_id;
    const byCategory = await fetchProductsByCategoryLive(categoryId);
    expect(byCategory.every((product) => product.category_id === categoryId)).toBe(true);

    const bySlug = await fetchProductByUrlKeyLive(fallback[0].slug);
    expect(bySlug?.slug).toBe(fallback[0].slug);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("falls back quietly when only missing tables are reported for category ids", async () => {
    hasSupabasePublicEnv.mockReturnValue(true);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const local = createSupabaseMock({
      products: { data: null, error: { message: "relation products does not exist" } },
      catalog_products: { data: null, error: { message: "Could not find the table catalog_products" } },
    });
    supabaseMock.from.mockImplementation((table: string) => local.from(table));

    const ids = await fetchCategoryIdsLive();
    expect(ids.length).toBeGreaterThan(0);
    expect(consoleSpy).not.toHaveBeenCalledWith("[getCategoryIds] Supabase error:", expect.any(String));
    consoleSpy.mockRestore();
  });

  it("falls back when category id query throws", async () => {
    hasSupabasePublicEnv.mockReturnValue(true);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseMock.from.mockImplementation(() => {
      throw new Error("network down");
    });

    const ids = await fetchCategoryIdsLive();
    expect(ids.length).toBeGreaterThan(0);
    expect(consoleSpy).toHaveBeenCalledWith("[getCategoryIds] Supabase unavailable:", expect.any(Error));
    consoleSpy.mockRestore();
  });
});