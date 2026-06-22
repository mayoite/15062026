import { describe, expect, it } from "vitest";

import type { CompatCategory } from "@/lib/getProducts";
import {
  buildPlannerCatalogIndex,
  mergePlannerCatalogProducts,
  normalizePlannerCatalogProduct,
  normalizePlannerCatalogProducts,
  resolvePlannerCatalogProductById,
  resolvePlannerCatalogProductByReference,
  resolvePlannerCatalogProductBySlug,
} from "@/features/planner/catalog/plannerCatalogCore";

const catalogFixture: CompatCategory[] = [
  {
    id: "cat-work",
    name: "Workstations",
    description: "Work category",
    series: [
      {
        id: "series-exec",
        name: "Executive",
        description: "Exec series",
        products: [
          {
            id: "prod-budget",
            slug: "budget-desk",
            name: "Budget Desk",
            description: "Budget desk",
            flagshipImage: "/budget.png",
            sceneImages: [],
            variants: [],
            detailedInfo: {
              overview: "Overview",
              features: ["Compact"],
              dimensions: "1200 mm",
              materials: ["Laminate"],
            },
            metadata: { priceRange: "budget", category: "Desks" },
            "3d_model": "",
            threeDModelUrl: "",
            technicalDrawings: [],
            documents: [],
            images: [],
            altText: "Budget Desk",
            specs: {},
          },
          {
            id: "prod-luxury",
            slug: "luxury-desk",
            name: "Luxury Desk",
            description: "Luxury desk",
            flagshipImage: "/luxury.png",
            sceneImages: [],
            variants: [],
            detailedInfo: {
              overview: "Overview",
              features: ["Premium finish"],
              dimensions: "1800 mm",
              materials: ["Veneer"],
            },
            metadata: { priceRange: "luxury", category: "Desks" },
            "3d_model": "",
            threeDModelUrl: "",
            technicalDrawings: [],
            documents: [],
            images: [],
            altText: "Luxury Desk",
            specs: {},
          },
        ],
      },
    ],
  },
];

describe("planner/catalog/plannerCatalogCore", () => {
  it("normalizes compat products with price tiers from metadata", () => {
    const products = normalizePlannerCatalogProducts(catalogFixture);
    expect(products).toHaveLength(2);
    expect(products[0].price).toBe(18000);
    expect(products[1].price).toBe(65000);
    expect(products[0].plannerSourceSlug).toBe("budget-desk");
  });

  it("builds lookup index with id, slug, and source slug aliases", () => {
    const products = normalizePlannerCatalogProducts(catalogFixture);
    const index = buildPlannerCatalogIndex(products);
    expect(index.byId.get("prod-budget")?.name).toBe("Budget Desk");
    expect(index.bySlug.get("budget-desk")?.id).toBe("prod-budget");
    expect(index.bySourceSlug.get("budget-desk")?.id).toBe("prod-budget");
  });

  it("merges managed products and resolves legacy ids", () => {
    const legacy = normalizePlannerCatalogProducts(catalogFixture);
    const managed = [
      {
        ...legacy[0],
        id: "managed-1",
        slug: "budget-desk-v2",
        metadata: { ...legacy[0].metadata, source: "planner-managed" },
      },
    ];
    const merged = mergePlannerCatalogProducts(legacy, managed);
    expect(merged).toHaveLength(2);
    expect(resolvePlannerCatalogProductById(merged, "prod-budget")?.id).toBe("managed-1");
    expect(
      resolvePlannerCatalogProductByReference(merged, { plannerSourceSlug: "budget-desk" })?.slug,
    ).toBe("budget-desk-v2");
  });

  it("normalizes a single product with series context", () => {
    const category = catalogFixture[0];
    const series = category.series[0];
    const product = series.products[1];
    const normalized = normalizePlannerCatalogProduct(category, series, product);
    expect(normalized).toMatchObject({
      id: "prod-luxury",
      categoryName: "Workstations",
      seriesName: "Executive",
      price: 65000,
    });
  });

  it("resolves price tiers and lookup aliases from metadata", () => {
    const midProduct = {
      ...catalogFixture[0].series[0].products[0],
      id: "prod-mid",
      metadata: { priceRange: "mid" },
    };
    const premiumProduct = {
      ...catalogFixture[0].series[0].products[0],
      id: "prod-premium",
      metadata: { priceRange: "premium" },
    };
    const defaultProduct = {
      ...catalogFixture[0].series[0].products[0],
      id: "prod-default",
      metadata: {},
      slug: "",
    };

    expect(normalizePlannerCatalogProduct(catalogFixture[0], catalogFixture[0].series[0], midProduct).price).toBe(25000);
    expect(normalizePlannerCatalogProduct(catalogFixture[0], catalogFixture[0].series[0], premiumProduct).price).toBe(45000);
    expect(normalizePlannerCatalogProduct(catalogFixture[0], catalogFixture[0].series[0], defaultProduct).price).toBe(25000);
    expect(normalizePlannerCatalogProduct(catalogFixture[0], catalogFixture[0].series[0], defaultProduct).plannerSourceSlug).toBe("prod-default");
  });

  it("merges managed-only catalogs and resolves by slug", () => {
    const legacy = normalizePlannerCatalogProducts(catalogFixture);
    const managedOnly = mergePlannerCatalogProducts([], [
      {
        ...legacy[0],
        id: "managed-only",
        slug: "managed-only-slug",
      },
    ]);
    expect(managedOnly).toHaveLength(1);
    expect(resolvePlannerCatalogProductBySlug(managedOnly, "managed-only-slug")?.id).toBe("managed-only");
    expect(resolvePlannerCatalogProductByReference(null)).toBeNull();
    expect(resolvePlannerCatalogProductByReference(managedOnly, { productSlug: "missing" })).toBeNull();
  });

  it("returns legacy catalog unchanged when no managed products are supplied", () => {
    const legacy = normalizePlannerCatalogProducts(catalogFixture);
    expect(mergePlannerCatalogProducts(legacy, [])).toHaveLength(legacy.length);
  });

  it("merges duplicate managed matches and preserves lookup aliases", () => {
    const legacy = normalizePlannerCatalogProducts(catalogFixture);
    const duplicateManaged = [
      {
        ...legacy[0],
        id: "managed-a",
        slug: "managed-a-slug",
        plannerSourceSlug: "budget-desk",
        metadata: {
          ...legacy[0].metadata,
          plannerCatalogLookupIds: ["prod-budget", "alias-budget"],
          plannerCatalogLookupSourceSlugs: ["budget-desk"],
        },
      },
      {
        ...legacy[1],
        id: "managed-b",
        slug: "managed-b-slug",
        metadata: { ...legacy[1].metadata, plannerCatalogLookupIds: ["prod-budget"] },
      },
    ];
    const merged = mergePlannerCatalogProducts(legacy, duplicateManaged);
    expect(merged.length).toBeLessThan(legacy.length + duplicateManaged.length);
    expect(resolvePlannerCatalogProductByReference(merged, { productId: "prod-budget" })?.id).toBe(
      "managed-b",
    );
    expect(resolvePlannerCatalogProductByReference(merged, { productSlug: "managed-b-slug" })?.id).toBe(
      "managed-b",
    );
  });

  it("appends managed products that do not match legacy entries", () => {
    const legacy = normalizePlannerCatalogProducts(catalogFixture);
    const unmatchedManaged = [
      {
        ...legacy[0],
        id: "managed-new",
        slug: "managed-new-slug",
        plannerSourceSlug: "managed-new-source",
        metadata: {},
      },
    ];
    const merged = mergePlannerCatalogProducts(legacy, unmatchedManaged);
    expect(merged).toHaveLength(legacy.length + 1);
    expect(resolvePlannerCatalogProductByReference(merged, { productId: "managed-new" })?.slug).toBe(
      "managed-new-slug",
    );
  });

  it("uses detailed info when compat specs are sparse", () => {
    const sparseCategory = catalogFixture[0];
    const sparseSeries = sparseCategory.series[0];
    const sparseProduct = {
      ...sparseSeries.products[0],
      specs: {},
      metadata: { priceRange: "budget", categoryIdCanonical: "  CAT-WORK  ", canonicalSlugV2: "  budget-desk  " },
    };
    const normalized = normalizePlannerCatalogProduct(sparseCategory, sparseSeries, sparseProduct);
    expect(normalized.specs.dimensions).toBe(sparseProduct.detailedInfo.dimensions);
    expect(normalized.specs.features).toEqual(sparseProduct.detailedInfo.features);
    expect(normalized.categoryId).toBe("cat-work");
  });
});
