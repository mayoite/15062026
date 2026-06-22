import { describe, expect, it } from "vitest";

import {
  getUnifiedCatalog,
  getCatalogCategories,
  getCatalogSeries,
  searchCatalog,
  getCatalogItemBySlug,
  mergeDatabaseProducts,
} from "@/features/planner/store/unifiedCatalog";

describe("unifiedCatalog", () => {
  it("returns active built-in catalog items", () => {
    const catalog = getUnifiedCatalog();
    expect(catalog.length).toBeGreaterThan(10);
    expect(catalog.every((item) => item.active)).toBe(true);
  });

  it("lists categories in priority order with extras sorted", () => {
    const categories = getCatalogCategories();
    expect(categories[0]).toBe("Workstations");
    expect(categories).toContain("Seating");
  });

  it("lists series for a category", () => {
    const series = getCatalogSeries("Seating");
    expect(series.length).toBeGreaterThan(0);
    expect(series).toContain("Task");
  });

  it("searches by name, category, series, and description", () => {
    const chairs = searchCatalog("chair");
    expect(chairs.some((item) => item.id === "task-chair")).toBe(true);

    const seatingOnly = searchCatalog("desk", "Workstations");
    expect(seatingOnly.every((item) => item.category === "Workstations")).toBe(true);
  });

  it("finds catalog items by slug", () => {
    expect(getCatalogItemBySlug("task-chair")?.name).toBe("Task Chair");
    expect(getCatalogItemBySlug("missing-slug")).toBeNull();
  });

  it("mergeDatabaseProducts skips duplicate slugs and parses dimensions", () => {
    const merged = mergeDatabaseProducts([
      {
        slug: "task-chair",
        name: "Duplicate",
      },
      {
        id: "db-1",
        slug: "custom-bench",
        name: "Custom Bench",
        category: "Tables",
        specs: { dimensions: "120 cm x 60 cm" },
        flagship_image: "img.png",
        images: ["a.png"],
        seriesName: "Custom",
      },
      {
        name: "No Slug Product",
        specs: { dimensions: "800 x 600 mm" },
      },
    ]);

    const custom = merged.find((item) => item.slug === "custom-bench");
    expect(custom?.source).toBe("database");
    expect(custom?.widthMm).toBe(1200);
    expect(custom?.depthMm).toBe(600);

    const generated = merged.find((item) => item.slug === "no-slug-product");
    expect(generated?.id).toMatch(/^db-/);

    const defaults = mergeDatabaseProducts([
      {
        slug: "default-dims",
        name: "Default Dims",
        specs: {},
      },
      {
        slug: "inch-dims",
        name: "Inch Dims",
        specs: { dimensions: "80 x 60" },
      },
    ]);
    expect(defaults.find((item) => item.slug === "default-dims")?.widthMm).toBe(1000);
    expect(defaults.find((item) => item.slug === "inch-dims")?.widthMm).toBe(800);
  });

  it("matches search queries against series and descriptions", () => {
    const bySeries = searchCatalog("linear");
    expect(bySeries.some((item) => item.series === "Linear")).toBe(true);

    const byDescription = searchCatalog("ergonomic");
    expect(byDescription.some((item) => item.id === "task-chair")).toBe(true);
  });
});
