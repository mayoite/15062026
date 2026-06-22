import {
  furnitureCatalog,
  categories,
  categoryLabels,
  getCatalogItemById,
  matchesCatalogSearch,
  rankCatalogReplacementOptions,
} from "@/features/planner/store/catalogData";

describe("catalogData", () => {
  describe("furnitureCatalog data integrity", () => {
    it("is a non-empty array", () => {
      expect(Array.isArray(furnitureCatalog)).toBe(true);
      expect(furnitureCatalog.length).toBeGreaterThan(0);
    });

    it("each item has required fields with valid types", () => {
      for (const item of furnitureCatalog) {
        expect(typeof item.id).toBe("string");
        expect(item.id.length).toBeGreaterThan(0);
        expect(typeof item.name).toBe("string");
        expect(item.name.length).toBeGreaterThan(0);
        expect(typeof item.sku).toBe("string");
        expect(item.sku.length).toBeGreaterThan(0);
        expect(categories).toContain(item.category);
        expect(typeof item.widthMm).toBe("number");
        expect(item.widthMm).toBeGreaterThan(0);
        expect(typeof item.depthMm).toBe("number");
        expect(item.depthMm).toBeGreaterThan(0);
        expect(typeof item.heightMm).toBe("number");
        expect(item.heightMm).toBeGreaterThan(0);
        expect(typeof item.iconPath).toBe("string");
        expect(typeof item.priceInr).toBe("number");
        expect(item.priceInr).toBeGreaterThanOrEqual(0);
        expect(typeof item.shape).toBe("string");
      }
    });

    it("all IDs are unique", () => {
      const ids = furnitureCatalog.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("all SKUs are unique", () => {
      const skus = furnitureCatalog.map((item) => item.sku);
      expect(new Set(skus).size).toBe(skus.length);
    });
  });

  describe("categories", () => {
    it("contains all expected categories", () => {
      expect(categories).toContain("desks");
      expect(categories).toContain("seating");
      expect(categories).toContain("tables");
      expect(categories).toContain("storage");
      expect(categories).toContain("soft-seating");
      expect(categories).toContain("misc");
    });

    it("categoryLabels has a label for every category", () => {
      for (const cat of categories) {
        expect(typeof categoryLabels[cat]).toBe("string");
        expect(categoryLabels[cat].length).toBeGreaterThan(0);
      }
    });
  });

  describe("getCatalogItemById", () => {
    it("returns the correct item by id", () => {
      const item = getCatalogItemById("task-chair");
      expect(item).toBeDefined();
      expect(item?.name).toBe("Task Chair");
    });

    it("returns undefined for null/undefined/unknown id", () => {
      expect(getCatalogItemById(null)).toBeUndefined();
      expect(getCatalogItemById(undefined)).toBeUndefined();
      expect(getCatalogItemById("nonexistent-xyz")).toBeUndefined();
    });
  });

  describe("matchesCatalogSearch", () => {
    const chair = furnitureCatalog.find((i) => i.id === "task-chair");

    it("matches on name substring", () => {
      expect(chair).toBeDefined();
      if (!chair) {
        throw new Error("Expected task-chair catalog entry");
      }
      expect(matchesCatalogSearch(chair, "task")).toBe(true);
      expect(matchesCatalogSearch(chair, "Task Chair")).toBe(true);
    });

    it("matches on SKU", () => {
      expect(matchesCatalogSearch(chair, "OOFPL-SEA-001")).toBe(true);
    });

    it("matches on category", () => {
      expect(matchesCatalogSearch(chair, "seating")).toBe(true);
    });

    it("returns true for empty query", () => {
      expect(matchesCatalogSearch(chair, "")).toBe(true);
    });

    it("returns false for non-matching query", () => {
      expect(matchesCatalogSearch(chair, "bookshelf")).toBe(false);
    });
  });

  describe("rankCatalogReplacementOptions", () => {
    it("excludes the current item from results", () => {
      const current = getCatalogItemById("task-chair");
      const results = rankCatalogReplacementOptions(current, "");
      expect(results.find((r) => r.id === "task-chair")).toBeUndefined();
    });

    it("ranks same-category items higher", () => {
      const current = getCatalogItemById("task-chair");
      const results = rankCatalogReplacementOptions(current, "");
      const seatingResults = results.filter((r) => r.category === "seating");
      expect(seatingResults.length).toBeGreaterThan(0);
      // First result should be from same category
      expect(results[0].category).toBe("seating");
    });

    it("filters results by query", () => {
      const current = getCatalogItemById("task-chair");
      const results = rankCatalogReplacementOptions(current, "executive");
      expect(results.length).toBeGreaterThan(0);
      // All results should match the query somehow
      for (const r of results) {
        const text = (r.name + r.sku + r.category + r.shape).toLowerCase();
        expect(text).toContain("executive");
      }
    });

    it("ranks replacements without a current item and resolves ids safely", () => {
      expect(getCatalogItemById(null)).toBeUndefined();
      expect(getCatalogItemById("missing")).toBeUndefined();
      const results = rankCatalogReplacementOptions(undefined, "task");
      expect(results.length).toBeGreaterThan(0);
      const taskChair = getCatalogItemById("task-chair");
      expect(taskChair).toBeDefined();
      expect(matchesCatalogSearch(taskChair!, "task chair")).toBe(true);
    });

    it("prefers same shape and category when ranking replacements", () => {
      const current = getCatalogItemById("task-chair");
      expect(current).toBeDefined();
      const results = rankCatalogReplacementOptions(current, "");
      const sameCategory = results.filter((item) => item.category === current!.category);
      const sameShape = sameCategory.find((item) => item.shape === current!.shape);
      const differentShape = sameCategory.find((item) => item.shape !== current!.shape);
      if (sameShape && differentShape) {
        expect(results.indexOf(sameShape)).toBeLessThan(results.indexOf(differentShape));
      }
      expect(matchesCatalogSearch(current!, "OOFPL-SEA-001")).toBe(true);
      expect(matchesCatalogSearch(current!, "task missing-token")).toBe(false);
    });

    it("boosts ranking for sku and category query matches", () => {
      const current = getCatalogItemById("executive-chair");
      const bySku = rankCatalogReplacementOptions(current, "OOFPL-SEA");
      expect(bySku.length).toBeGreaterThan(0);
      const byCategory = rankCatalogReplacementOptions(undefined, "seating");
      expect(byCategory.length).toBeGreaterThan(0);
      expect(byCategory.some((item) => item.category === "seating")).toBe(true);
    });
  });
});

