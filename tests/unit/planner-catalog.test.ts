import { describe, expect, it } from "vitest";
import {
  furnitureCatalog,
  getCatalogItemById,
  matchesCatalogSearch,
} from "@/features/planner/store/catalogData";
import {
  getUnifiedCatalog,
  getCatalogCategories,
  searchCatalog,
} from "@/features/planner/store/unifiedCatalog";

describe("catalogData", () => {
  it("returns a catalog item by id", () => {
    const item = getCatalogItemById("task-chair");
    expect(item).toBeDefined();
    expect(item?.name).toBe("Task Chair");
  });

  it("matches catalog search by item name", () => {
    const item = getCatalogItemById("meeting-6");
    expect(item).toBeDefined();
    if (!item) {
      throw new Error("Expected meeting-6 catalog item");
    }
    expect(matchesCatalogSearch(item, "meeting")).toBe(true);
  });

  it("keeps the local furniture catalog populated", () => {
    expect(furnitureCatalog.length).toBeGreaterThan(20);
  });
});

describe("unifiedCatalog", () => {
  it("returns active built-in catalog items", () => {
    const items = getUnifiedCatalog();
    expect(items.length).toBeGreaterThan(10);
    expect(items.every((item) => item.active)).toBe(true);
  });

  it("returns stable user-facing category ordering", () => {
    expect(getCatalogCategories()).toEqual([
      "Workstations",
      "Seating",
      "Tables",
      "Storage",
      "Soft Seating",
      "Accessories",
    ]);
  });

  it("searches the unified catalog by free text", () => {
    const results = searchCatalog("executive");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((item) => item.name === "Executive Desk")).toBe(true);
  });
});

