import { describe, it, expect } from "vitest";
import { getCatalogItemById, matchesCatalogSearch, rankCatalogReplacementOptions } from "@/features/planner/store/catalogHelpers";
import type { CatalogItem, FurnitureCategory } from "@/features/planner/store/catalogData";

describe("catalogHelpers", () => {
  const categoryLabels: Record<FurnitureCategory, string> = {
    seating: "Seating",
    desks: "Desks",
    tables: "Tables",
    storage: "Storage",
    "soft-seating": "Soft Seating",
    education: "Education",
    misc: "Misc",
  };

  const mockCatalog: CatalogItem[] = [
    { id: "1", name: "Task Chair", sku: "SKU1", category: "seating", widthMm: 500, depthMm: 500, heightMm: 900, iconPath: "", priceInr: 100, shape: "task-chair" },
    { id: "2", name: "Desk 1200", sku: "SKU2", category: "desks", widthMm: 1200, depthMm: 600, heightMm: 750, iconPath: "", priceInr: 200, shape: "workstation-linear" },
    { id: "3", name: "Desk 1400", sku: "SKU3", category: "desks", widthMm: 1400, depthMm: 700, heightMm: 750, iconPath: "", priceInr: 300, shape: "workstation-linear" },
    { id: "4", name: "Lounge Chair", sku: "SKU4", category: "soft-seating", widthMm: 700, depthMm: 700, heightMm: 800, iconPath: "", priceInr: 150, shape: "lounge-chair" },
  ];

  describe("getCatalogItemById", () => {
    it("returns correct item by ID", () => {
      expect(getCatalogItemById(mockCatalog, "2")).toEqual(mockCatalog[1]);
    });

    it("returns undefined for non-existent ID", () => {
      expect(getCatalogItemById(mockCatalog, "99")).toBeUndefined();
    });

    it("returns undefined for null/undefined ID", () => {
      expect(getCatalogItemById(mockCatalog, null)).toBeUndefined();
      expect(getCatalogItemById(mockCatalog, undefined)).toBeUndefined();
    });
  });

  describe("matchesCatalogSearch", () => {
    it("returns true for empty query", () => {
      expect(matchesCatalogSearch(mockCatalog[0] as CatalogItem, "", categoryLabels)).toBe(true);
    });

    it("matches by name", () => {
      expect(matchesCatalogSearch(mockCatalog[0] as CatalogItem, "Task Chair", categoryLabels)).toBe(true);
      expect(matchesCatalogSearch(mockCatalog[0] as CatalogItem, "Desk", categoryLabels)).toBe(false);
    });

    it("matches by sku", () => {
      expect(matchesCatalogSearch(mockCatalog[1] as CatalogItem, "sku2", categoryLabels)).toBe(true);
    });

    it("matches by category", () => {
      expect(matchesCatalogSearch(mockCatalog[3] as CatalogItem, "soft-seating", categoryLabels)).toBe(true);
      expect(matchesCatalogSearch(mockCatalog[3] as CatalogItem, "Soft Seating", categoryLabels)).toBe(true);
    });

    it("matches by dimensions", () => {
      expect(matchesCatalogSearch(mockCatalog[1] as CatalogItem, "1200", categoryLabels)).toBe(true);
      expect(matchesCatalogSearch(mockCatalog[1] as CatalogItem, "120x60", categoryLabels)).toBe(true);
    });

    it("matches multiple tokens", () => {
      expect(matchesCatalogSearch(mockCatalog[2] as CatalogItem, "desk 1400", categoryLabels)).toBe(true);
      expect(matchesCatalogSearch(mockCatalog[2] as CatalogItem, "desk sku1", categoryLabels)).toBe(false);
    });
  });

  describe("rankCatalogReplacementOptions", () => {
    it("returns options excluding current item", () => {
      const results = rankCatalogReplacementOptions(mockCatalog, categoryLabels, mockCatalog[1], "");
      expect(results.some(r => r.id === "2")).toBe(false);
      expect(results.length).toBe(3);
    });

    it("filters options by query", () => {
      const results = rankCatalogReplacementOptions(mockCatalog, categoryLabels, mockCatalog[1], "chair");
      expect(results.length).toBe(2);
      expect(results.map(r => r.id)).toEqual(["4", "1"]);
    });

    it("ranks items with same category and shape higher", () => {
      const results = rankCatalogReplacementOptions(mockCatalog, categoryLabels, mockCatalog[1], "");
      // Desk 1400 (id 3) has same category and shape, should be ranked first
      expect(results[0]?.id).toBe("3");
    });

    it("ranks based on query match score", () => {
      const results = rankCatalogReplacementOptions(mockCatalog, categoryLabels, undefined, "desk");
      expect(results.length).toBe(2);
      // Desk 1200 and 1400 should be the only results
      expect(results.map(r => r.id)).toEqual(["2", "3"]);
    });

    it("sorts by name alphabetically as tie-breaker", () => {
      const results = rankCatalogReplacementOptions(mockCatalog, categoryLabels, undefined, "chair");
      // Lounge Chair and Task Chair
      expect(results[0]?.name).toBe("Lounge Chair");
      expect(results[1]?.name).toBe("Task Chair");
    });
  });
});

