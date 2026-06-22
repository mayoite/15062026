import { describe, it, expect, vi } from "vitest";
import { getPlannerCatalogProducts } from "@/features/planner/store/plannerCatalog";
import * as getProductsModule from "@/features/catalog/getProducts";
import * as plannerManagedProductsModule from "@/features/planner/store/plannerManagedProducts";
import type { PlannerCatalogProduct } from "@/features/planner/store/plannerCatalogCore";

vi.mock("server-only", () => ({}));

describe("plannerCatalog", () => {
  it("getPlannerCatalogProducts combines legacy and managed products", async () => {
    // Mock getCatalog
    vi.spyOn(getProductsModule, "getCatalog").mockResolvedValue([
      {
        id: "cat-1",
        slug: "cat-1",
        name: "Category 1",
        series: [
          {
            id: "series-1",
            slug: "series-1",
            name: "Series 1",
            description: "",
            categoryName: "Category 1",
            products: [
              {
                id: "legacy-prod-1",
                slug: "legacy-prod-1",
                name: "Legacy Product",
                flagshipImage: "",
                images: [],
                sceneImages: [],
                priceInCents: 1000,
                priceInCentsMax: 1000,
                categoryId: "cat-1",
                seriesId: "series-1",
                materials: [],
                specs: {},
                detailedInfo: { features: [], materials: [], dimensions: "" },
                relatedProducts: []
              }
            ]
          }
        ]
      }
    ]);

    // Mock plannerManagedProducts
    const mockManagedProduct = {
      id: "legacy-prod-1", // Same ID to test merging
      slug: "legacy-prod-1",
      name: "Merged Managed Product",
      price: 5000,
      flagship_image: "",
      images: [],
      specs: {},
      metadata: {},
      categoryId: "cat-1",
      categoryName: "Category 1",
      seriesId: "series-1",
      seriesName: "Series 1",
      category: "Desks",
      plannerSourceSlug: "legacy-prod-1",
    } as PlannerCatalogProduct;

    vi.spyOn(plannerManagedProductsModule, "listPlannerManagedProductsForPlannerCatalog").mockResolvedValue([
      mockManagedProduct
    ]);

    const result = await getPlannerCatalogProducts();

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("legacy-prod-1");
    // Managed product properties should take precedence in merge
    expect(result[0]?.name).toBe("Merged Managed Product");
  });

  it("getPlannerCatalogProducts handles errors gracefully", async () => {
    vi.spyOn(getProductsModule, "getCatalog").mockRejectedValue(new Error("Network Error"));
    vi.spyOn(plannerManagedProductsModule, "listPlannerManagedProductsForPlannerCatalog").mockResolvedValue([]);

    const result = await getPlannerCatalogProducts();
    // Should return empty array if both fail or legacy fails and managed is empty
    expect(result).toEqual([]);
  });

  it("getPlannerCatalogProducts accepts options override", async () => {
    vi.spyOn(getProductsModule, "getCatalog").mockResolvedValue([]);
    
    const customManagedProduct = {
      id: "custom-prod",
      slug: "custom-prod",
      name: "Custom Product",
      price: 5000,
      flagship_image: "",
      images: [],
      specs: {},
      metadata: {},
      categoryId: "cat-1",
      categoryName: "Category 1",
      seriesId: "series-1",
      seriesName: "Series 1",
      category: "Desks",
      plannerSourceSlug: "custom-prod",
    } as PlannerCatalogProduct;

    const result = await getPlannerCatalogProducts({
      plannerManagedProducts: [customManagedProduct]
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("custom-prod");
    expect(result[0]?.name).toBe("Custom Product");
  });
});

