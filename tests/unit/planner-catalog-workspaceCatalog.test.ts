import { describe, expect, it } from "vitest";

import {
  CATALOG_CATEGORIES,
  PLANNER_CATALOG_ITEMS,
  getPlannerCatalogByCategory,
  searchPlannerCatalog,
} from "@/features/planner/catalog/workspaceCatalog";

describe("planner/catalog/workspaceCatalog", () => {
  it("merges curated and generated catalog items", () => {
    expect(PLANNER_CATALOG_ITEMS.length).toBeGreaterThan(50);
    expect(PLANNER_CATALOG_ITEMS.some((item) => item.category === "rooms")).toBe(true);
    expect(PLANNER_CATALOG_ITEMS.some((item) => item.category === "desks")).toBe(true);
    expect(CATALOG_CATEGORIES.length).toBeGreaterThan(0);
  });

  it("filters catalog items by category", () => {
    const desks = getPlannerCatalogByCategory("desks");
    expect(desks.length).toBeGreaterThan(0);
    expect(desks.every((item) => item.category === "desks")).toBe(true);
  });

  it("searches catalog items by free text", () => {
    expect(searchPlannerCatalog("")).toHaveLength(PLANNER_CATALOG_ITEMS.length);
    const results = searchPlannerCatalog("meeting");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some(
        (item) =>
          item.name.toLowerCase().includes("meeting") ||
          item.description.toLowerCase().includes("meeting") ||
          item.tags.some((tag) => tag.includes("meeting")),
      ),
    ).toBe(true);
  });
});
