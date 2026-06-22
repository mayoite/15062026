import { describe, it, expect } from "vitest";
import {
  normalizePlannerCatalogProduct,
  normalizePlannerCatalogProducts,
  mergePlannerCatalogProducts,
  buildPlannerCatalogIndex,
  resolvePlannerCatalogProductByReference,
  resolvePlannerCatalogProductById,
  resolvePlannerCatalogProductBySlug,
  type PlannerCatalogProduct
} from "@/features/planner/store/plannerCatalogCore";
import type { CompatCategory, CompatProduct } from "@/features/catalog/getProducts";

describe("plannerCatalogCore", () => {
  const mockCompatProduct: CompatProduct = {
    id: "prod-1",
    slug: "prod-1-slug",
    name: "Mock Product",
    flagshipImage: "image1.jpg",
    images: ["image1.jpg", "image2.jpg"],
    sceneImages: [],
    priceInCents: 10000,
    priceInCentsMax: 10000,
    categoryId: "cat-1",
    seriesId: "series-1",
    materials: [],
    specs: { dimensions: "10x10" },
    detailedInfo: { features: [], materials: [], dimensions: "10x10" },
    relatedProducts: [],
    metadata: {
      category: "Desks",
      categoryIdCanonical: "canonical-cat",
      priceRange: "budget",
    }
  };

  const mockCategory: CompatCategory = {
    id: "cat-1",
    slug: "cat-slug",
    name: "Category 1",
    series: [
      {
        id: "series-1",
        slug: "series-slug",
        name: "Series 1",
        description: "",
        categoryName: "Category 1",
        products: [mockCompatProduct]
      }
    ]
  };

  describe("normalizePlannerCatalogProduct", () => {
    it("normalizes a product correctly", () => {
      const result = normalizePlannerCatalogProduct(mockCategory, mockCategory.series[0]!, mockCompatProduct);

      expect(result.id).toBe("prod-1");
      expect(result.slug).toBe("prod-1-slug");
      expect(result.name).toBe("Mock Product");
      expect(result.category).toBe("Desks");
      expect(result.price).toBe(18000); // budget -> 18000
      expect(result.categoryId).toBe("canonical-cat"); // from metadata
      expect(result.plannerSourceSlug).toBe("prod-1-slug");
      expect(result.images).toContain("image1.jpg"); // assuming normalizeAssetList prefixes if needed
    });
  });

  describe("normalizePlannerCatalogProducts", () => {
    it("flattens and normalizes catalog", () => {
      const results = normalizePlannerCatalogProducts([mockCategory]);
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe("prod-1");
    });
  });

  describe("mergePlannerCatalogProducts", () => {
    it("merges legacy and managed products", () => {
      const legacyProducts = normalizePlannerCatalogProducts([mockCategory]);
      
      const managedProduct: PlannerCatalogProduct = {
        ...legacyProducts[0]!,
        price: 9999, // Updated price
        name: "Updated Mock Product",
      };

      const merged = mergePlannerCatalogProducts(legacyProducts, [managedProduct]);
      
      expect(merged).toHaveLength(1);
      expect(merged[0]?.id).toBe("prod-1");
      expect(merged[0]?.name).toBe("Updated Mock Product");
      expect(merged[0]?.price).toBe(9999);
    });

    it("adds new managed products", () => {
      const legacyProducts = normalizePlannerCatalogProducts([mockCategory]);
      const newProduct: PlannerCatalogProduct = {
        ...legacyProducts[0]!,
        id: "prod-2",
        slug: "prod-2-slug",
        plannerSourceSlug: "prod-2-slug",
        name: "New Product",
        metadata: {},
      };

      const merged = mergePlannerCatalogProducts(legacyProducts, [newProduct]);
      
      expect(merged).toHaveLength(2);
      expect(merged.find(p => p.id === "prod-2")).toBeDefined();
    });
  });

  describe("buildPlannerCatalogIndex", () => {
    it("builds indexes by id, slug, and sourceSlug", () => {
      const products = normalizePlannerCatalogProducts([mockCategory]);
      const index = buildPlannerCatalogIndex(products);

      expect(index.byId.get("prod-1")?.name).toBe("Mock Product");
      expect(index.bySlug.get("prod-1-slug")?.name).toBe("Mock Product");
      expect(index.bySourceSlug.get("prod-1-slug")?.name).toBe("Mock Product");
    });
  });

  describe("resolve functions", () => {
    const products = normalizePlannerCatalogProducts([mockCategory]);

    it("resolvePlannerCatalogProductByReference resolves by productId", () => {
      const result = resolvePlannerCatalogProductByReference(products, { productId: "prod-1" });
      expect(result?.name).toBe("Mock Product");
    });

    it("resolvePlannerCatalogProductByReference resolves by productSlug", () => {
      const result = resolvePlannerCatalogProductByReference(products, { productSlug: "prod-1-slug" });
      expect(result?.name).toBe("Mock Product");
    });

    it("resolvePlannerCatalogProductById", () => {
      expect(resolvePlannerCatalogProductById(products, "prod-1")?.name).toBe("Mock Product");
      expect(resolvePlannerCatalogProductById(products, "unknown")).toBeNull();
    });

    it("resolvePlannerCatalogProductBySlug", () => {
      expect(resolvePlannerCatalogProductBySlug(products, "prod-1-slug")?.name).toBe("Mock Product");
      expect(resolvePlannerCatalogProductBySlug(products, "unknown")).toBeNull();
    });
  });
});

