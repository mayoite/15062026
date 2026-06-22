import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CompatCategory } from '@/features/catalog/getProducts';

import {
  mergePlannerCatalogProducts,
  normalizePlannerCatalogProducts,
  type PlannerCatalogProduct,
  resolvePlannerCatalogProductById,
  resolvePlannerCatalogProductByReference,
  resolvePlannerCatalogProductBySlug,
} from "@/features/planner/store/plannerCatalogCore";
import { getPlannerCatalogProducts } from "@/features/planner/store/plannerCatalog";

const { getCatalogMock } = vi.hoisted(() => ({
  getCatalogMock: vi.fn(),
}));

vi.mock('@/features/catalog/getProducts', () => ({
  getCatalog: getCatalogMock,
}));

vi.mock("server-only", () => ({}));

import * as plannerManagedProductsMod from "@/features/planner/store/plannerManagedProducts";

describe("planner catalog adapter", () => {
  const catalog: CompatCategory[] = [
    {
      id: "cat-1",
      name: "Workstations",
      description: "Planner source category",
      series: [
        {
          id: "series-1",
          name: "Executive",
          description: "Series description",
          products: [
            {
              id: "prod-1",
              slug: "alpha-desk",
              name: "Alpha Desk",
              description: "Desk description",
              flagshipImage: "/desk.png",
              sceneImages: ["/desk-scene.png"],
              variants: [],
              detailedInfo: {
                overview: "Desk overview",
                features: ["Cable tray"],
                dimensions: "1600 x 800 x 750 mm",
                materials: ["Wood"],
              },
              metadata: {
                category: "Desks",
                categoryIdCanonical: "cat-1",
                canonicalSlugV2: "alpha-desk",
                canonicalSeriesId: "series-1",
                priceRange: "premium",
              },
              "3d_model": "/desk.glb",
              threeDModelUrl: "/desk.glb",
              technicalDrawings: [],
              documents: [],
              images: ["/desk-1.png"],
              altText: "Alpha Desk",
              specs: {
                dimensions: "1600 x 800 x 750 mm",
                features: ["Cable tray"],
                materials: ["Wood"],
              },
            },
          ],
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    getCatalogMock.mockReset();
    getCatalogMock.mockResolvedValue(catalog);
    vi.spyOn(plannerManagedProductsMod, "listPlannerManagedProductsForPlannerCatalog").mockResolvedValue([]);
  });

  function buildManagedProduct(
    legacyProduct: PlannerCatalogProduct,
  ): PlannerCatalogProduct {
    return {
      ...legacyProduct,
      id: "managed-prod-1",
      slug: "alpha-desk-v2",
      images: [],
      flagship_image: "",
      metadata: {
        ...legacyProduct.metadata,
        source: "planner-managed",
        rollout: "managed",
      },
    };
  }

  it("normalizes the legacy catalog into planner-ready products", () => {
    const products = normalizePlannerCatalogProducts(catalog);

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: "prod-1",
      slug: "alpha-desk",
      name: "Alpha Desk",
      category: "Desks",
      categoryId: "cat-1",
      categoryName: "Workstations",
      seriesId: "series-1",
      seriesName: "Executive",
      plannerSourceSlug: "alpha-desk",
      flagship_image: "/desk.png",
      images: ["/desk-1.png"],
    });
    expect(products[0].metadata).toMatchObject({
      plannerCatalogProductId: "prod-1",
      plannerCatalogSlug: "alpha-desk",
      plannerCatalogCategoryId: "cat-1",
      plannerCatalogSeriesId: "series-1",
      plannerCatalogLookupIds: ["prod-1"],
      plannerCatalogLookupSlugs: ["alpha-desk"],
      plannerCatalogLookupSourceSlugs: ["alpha-desk"],
    });
  });

  it("merges managed products over legacy data and preserves legacy aliases for lookup", () => {
    const legacyProducts = normalizePlannerCatalogProducts(catalog);
    const managedProducts = [buildManagedProduct(legacyProducts[0])];
    const products = mergePlannerCatalogProducts(
      legacyProducts,
      managedProducts,
    );

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: "managed-prod-1",
      slug: "alpha-desk-v2",
      plannerSourceSlug: "alpha-desk",
      flagship_image: "/desk.png",
      images: ["/desk-1.png"],
    });

    expect(
      resolvePlannerCatalogProductById(products, "managed-prod-1")?.name,
    ).toBe("Alpha Desk");
    expect(resolvePlannerCatalogProductById(products, "prod-1")?.name).toBe(
      "Alpha Desk",
    );
    expect(
      resolvePlannerCatalogProductBySlug(products, "alpha-desk-v2")?.name,
    ).toBe("Alpha Desk");
    expect(
      resolvePlannerCatalogProductBySlug(products, "alpha-desk")?.name,
    ).toBe("Alpha Desk");
    expect(
      resolvePlannerCatalogProductByReference(products, {
        plannerSourceSlug: "alpha-desk",
      })?.name,
    ).toBe("Alpha Desk");
    expect(products[0].metadata).toMatchObject({
      source: "planner-managed",
      rollout: "managed",
      plannerCatalogLookupIds: ["managed-prod-1", "prod-1"],
      plannerCatalogLookupSlugs: ["alpha-desk-v2", "alpha-desk"],
    });
  });

  it("keeps the legacy fetch path by default and merges an optional managed source when supplied", async () => {
    const legacyOnlyProducts = await getPlannerCatalogProducts();
    const mergedProducts = await getPlannerCatalogProducts({
      plannerManagedProducts: async () => [
        buildManagedProduct(normalizePlannerCatalogProducts(catalog)[0]),
      ],
    });

    expect(getCatalogMock).toHaveBeenCalledTimes(2);
    expect(legacyOnlyProducts).toHaveLength(1);
    expect(legacyOnlyProducts[0].id).toBe("prod-1");
    expect(mergedProducts).toHaveLength(1);
    expect(mergedProducts[0].id).toBe("managed-prod-1");
    expect(resolvePlannerCatalogProductById(mergedProducts, "prod-1")?.id).toBe(
      "managed-prod-1",
    );
  });

  it("tolerates legacy and managed source failures while merging available products", async () => {
    getCatalogMock.mockRejectedValueOnce("catalog down");
    vi.spyOn(plannerManagedProductsMod, "listPlannerManagedProductsForPlannerCatalog").mockRejectedValueOnce(
      new Error("managed down"),
    );

    const products = await getPlannerCatalogProducts();
    expect(products).toEqual([]);

    getCatalogMock.mockResolvedValueOnce(catalog);
    const fromArray = await getPlannerCatalogProducts({
      plannerManagedProducts: [buildManagedProduct(normalizePlannerCatalogProducts(catalog)[0])],
    });
    expect(fromArray[0].id).toBe("managed-prod-1");

    getCatalogMock.mockResolvedValueOnce(catalog);
    const fromFn = await getPlannerCatalogProducts({
      plannerManagedProducts: async () => null,
    });
    expect(fromFn[0].id).toBe("prod-1");
  });

  it("normalizes sparse legacy products and merges duplicate legacy matches", () => {
    const sparseCatalog: CompatCategory[] = [
      {
        id: "cat-sparse",
        name: "Sparse",
        description: "",
        series: [
          {
            id: "series-sparse",
            name: "Series",
            description: "",
            products: [
              {
                id: "no-slug-product",
                slug: "",
                name: "No Slug Product",
                description: "Uses detailed info",
                flagshipImage: "",
                sceneImages: [],
                variants: [],
                detailedInfo: {
                  overview: "Overview",
                  features: ["Adjustable"],
                  dimensions: "1200 x 800 mm",
                  materials: ["Steel"],
                },
                metadata: {},
                technicalDrawings: [],
                documents: [],
                images: [],
                altText: "",
                specs: {},
              },
            ],
          },
        ],
      },
    ];
    const sparseProducts = normalizePlannerCatalogProducts(sparseCatalog);
    expect(sparseProducts[0].plannerSourceSlug).toBe("no-slug-product");
    expect(sparseProducts[0].specs.dimensions).toBe("1200 x 800 mm");

    const legacyProducts = normalizePlannerCatalogProducts(catalog);
    const mergedManaged = mergePlannerCatalogProducts(legacyProducts, [
      buildManagedProduct(legacyProducts[0]),
    ]);
    expect(mergedManaged[0].flagship_image).toBe("/desk.png");
    expect(mergedManaged[0].images).toContain("/desk-1.png");
  });

  it("merges managed-only catalogs and resolves by product id and slug", () => {
    const legacyProducts = normalizePlannerCatalogProducts(catalog);
    const managedOnly = mergePlannerCatalogProducts([], [
      buildManagedProduct(legacyProducts[0]),
    ]);
    expect(managedOnly).toHaveLength(1);
    expect(managedOnly[0].metadata.plannerCatalogLookupIds).toContain("managed-prod-1");

    expect(
      resolvePlannerCatalogProductByReference(managedOnly, {
        productId: "managed-prod-1",
      })?.name,
    ).toBe("Alpha Desk");
    expect(
      resolvePlannerCatalogProductByReference(managedOnly, {
        productSlug: "alpha-desk-v2",
      })?.name,
    ).toBe("Alpha Desk");
    expect(resolvePlannerCatalogProductByReference(managedOnly, null)).toBeNull();
    expect(
      resolvePlannerCatalogProductByReference(managedOnly, { productId: "missing" }),
    ).toBeNull();
    expect(
      resolvePlannerCatalogProductByReference(managedOnly, { productSlug: "missing-slug" }),
    ).toBeNull();
  });

  it("returns legacy catalogs unchanged when managed products are absent", () => {
    const legacyProducts = normalizePlannerCatalogProducts(catalog);
    expect(mergePlannerCatalogProducts(legacyProducts)).toEqual(legacyProducts);
  });

  it("normalizes scene images, canonical slugs, and source slug lookups", () => {
    const sceneOnlyCatalog: CompatCategory[] = [
      {
        id: "cat-scene",
        name: "Scene",
        description: "",
        series: [
          {
            id: "series-scene",
            name: "Scene Series",
            description: "",
            products: [
              {
                id: "scene-prod",
                slug: "",
                name: "Scene Desk",
                description: "",
                flagshipImage: "",
                sceneImages: ["/scene.png"],
                variants: [],
                detailedInfo: {
                  overview: "",
                  features: [],
                  dimensions: "1000 x 600 mm",
                  materials: ["Wood"],
                },
                metadata: { canonicalSlugV2: "scene-desk" },
                technicalDrawings: [],
                documents: [],
                images: [],
                altText: "",
                specs: {
                  features: ["Cable tray"],
                  materials: ["Steel"],
                },
              },
            ],
          },
        ],
      },
    ];
    const products = normalizePlannerCatalogProducts(sceneOnlyCatalog);
    expect(products[0].slug).toBe("scene-desk");
    expect(products[0].images.length).toBeGreaterThan(0);
    expect(products[0].specs.features).toEqual(["Cable tray"]);
    expect(
      resolvePlannerCatalogProductByReference(products, {
        plannerSourceSlug: "scene-desk",
      })?.name,
    ).toBe("Scene Desk");
  });

  it("uses the planner-managed product source when present in the write-side store", async () => {
    const listSpy = vi.spyOn(plannerManagedProductsMod, "listPlannerManagedProductsForPlannerCatalog").mockResolvedValueOnce([
      buildManagedProduct(normalizePlannerCatalogProducts(catalog)[0]),
    ]);

    const products = await getPlannerCatalogProducts();

    expect(products).toHaveLength(1);
    expect(products[0].id).toBe("managed-prod-1");
    expect(resolvePlannerCatalogProductById(products, "prod-1")?.id).toBe(
      "managed-prod-1",
    );
    expect(listSpy).toHaveBeenCalledTimes(1);
  });
});