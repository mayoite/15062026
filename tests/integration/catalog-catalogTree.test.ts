import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryResult = { data: unknown; error: { message?: string } | null };

function createSupabaseMock(responses: Record<string, QueryResult>) {
  const from = vi.fn((table: string) => ({
    select: vi.fn(() => {
      const response = responses[table] ?? { data: null, error: { message: `No mock for ${table}` } };
      const terminal = async () => response;
      const chain = {
        order: terminal,
        eq: vi.fn(() => ({
          order: terminal,
          single: terminal,
        })),
        single: terminal,
        then: (resolve: (value: QueryResult) => void, reject?: (reason: unknown) => void) =>
          Promise.resolve(response).then(resolve, reject),
      };
      return chain;
    }),
  }));
  return { from };
}

const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: {
    from: vi.fn(),
  },
}));

vi.mock("@/platform/drizzle/db", () => ({
  supabase: supabaseMock,
}));

describe("catalog tree", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("builds grouped categories with series from live Supabase data", async () => {
    const local = createSupabaseMock({
      categories: {
        data: [{ id: "seating", name: "Seating" }],
        error: null,
      },
      products: {
        data: [
          {
            id: "chair-1",
            category_id: "seating",
            name: "Mesh Chair",
            slug: "mesh-chair",
            series_id: "mesh-series",
            series_name: "Mesh",
            description: "Comfortable mesh chair",
            images: [],
            specs: { dimensions: "", materials: [], features: [] },
            created_at: "2024-01-01",
          },
        ],
        error: null,
      },
    });
    supabaseMock.from.mockImplementation((table: string) => local.from(table));

    const { buildCatalogLive } = await import("@/lib/catalog/catalogTree");
    const catalog = await buildCatalogLive();

    expect(catalog).toHaveLength(1);
    expect(catalog[0].id).toBe("seating");
    expect(catalog[0].series).toHaveLength(1);
    expect(catalog[0].series[0].products[0].name).toBe("Mesh Chair");
  });

  it("falls back to local products when both tables are missing", async () => {
    const local = createSupabaseMock({
      categories: { data: null, error: { message: "relation categories does not exist" } },
      catalog_categories: { data: null, error: { message: "relation catalog_categories does not exist" } },
      products: { data: null, error: { message: "relation products does not exist" } },
      catalog_products: { data: null, error: { message: "relation catalog_products does not exist" } },
    });
    supabaseMock.from.mockImplementation((table: string) => local.from(table));

    const { buildCatalogLive } = await import("@/lib/catalog/catalogTree");
    const catalog = await buildCatalogLive();
    expect(catalog.length).toBeGreaterThan(0);
    expect(catalog[0].series.length).toBeGreaterThan(0);
  });

  it("returns an empty catalog when live data has categories but no products", async () => {
    const local = createSupabaseMock({
      categories: { data: [{ id: "seating", name: "Seating" }], error: null },
      products: { data: [], error: null },
    });
    supabaseMock.from.mockImplementation((table: string) => local.from(table));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { buildCatalogLive } = await import("@/lib/catalog/catalogTree");
    const catalog = await buildCatalogLive();
    expect(catalog).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("skips empty categories and synthesizes series ids when missing", async () => {
    const local = createSupabaseMock({
      categories: {
        data: [
          { id: "seating", name: "Seating" },
          { id: "empty-cat", name: "Empty" },
        ],
        error: null,
      },
      products: {
        data: [
          {
            id: "chair-1",
            category_id: "seating",
            name: "Chair",
            slug: "chair",
            description: "",
            images: [],
            specs: { dimensions: "", materials: [], features: [] },
            created_at: "2024-01-01",
          },
        ],
        error: null,
      },
    });
    supabaseMock.from.mockImplementation((table: string) => local.from(table));

    const { buildCatalogLive } = await import("@/lib/catalog/catalogTree");
    const catalog = await buildCatalogLive();
    expect(catalog).toHaveLength(1);
    expect(catalog[0].series[0].id).toBe("seating-series");
    expect(catalog[0].series[0].name).toBe("Series");
  });

  it("retries transient fetch failures before succeeding", async () => {
    let productQueryCount = 0;
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === "products") {
        productQueryCount += 1;
        if (productQueryCount === 1) {
          return createSupabaseMock({
            products: { data: null, error: { message: "fetch failed: network timeout" } },
          }).from(table);
        }
        return createSupabaseMock({
          categories: { data: [{ id: "seating", name: "Seating" }], error: null },
          products: {
            data: [
              {
                id: "chair-1",
                category_id: "seating",
                name: "Chair",
                slug: "chair",
                description: "",
                images: [],
                specs: { dimensions: "", materials: [], features: [] },
                created_at: "2024-01-01",
              },
            ],
            error: null,
          },
        }).from(table);
      }
      return createSupabaseMock({
        categories: { data: [{ id: "seating", name: "Seating" }], error: null },
        catalog_categories: { data: null, error: { message: "relation catalog_categories does not exist" } },
        products: { data: null, error: { message: "fetch failed: network timeout" } },
        catalog_products: { data: null, error: { message: "relation catalog_products does not exist" } },
      }).from(table);
    });

    const { buildCatalogLive } = await import("@/lib/catalog/catalogTree");
    const catalog = await buildCatalogLive();
    expect(catalog).toHaveLength(1);
    expect(productQueryCount).toBeGreaterThanOrEqual(2);
  });

  it("logs non-missing product errors and falls back to local catalog", async () => {
    const local = createSupabaseMock({
      categories: { data: [{ id: "seating", name: "Seating" }], error: null },
      catalog_categories: { data: null, error: { message: "relation catalog_categories does not exist" } },
      products: { data: null, error: { message: "permission denied for table products" } },
      catalog_products: { data: null, error: { message: "relation catalog_products does not exist" } },
    });
    supabaseMock.from.mockImplementation((table: string) => local.from(table));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { buildCatalogLive } = await import("@/lib/catalog/catalogTree");
    const catalog = await buildCatalogLive();
    expect(catalog.length).toBeGreaterThan(0);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});