import { afterEach, describe, expect, it, vi } from "vitest";

import type { MeshFamily } from "@/features/planner/shared/mesh-contract";
import {
  filterByCategory,
  loadPlannerCatalog,
  normalizeCatalogBatch,
  normalizeCatalogItem,
  searchCatalog,
} from "@/features/planner/shared/catalog/catalogAdapter";

const VALID_MESH_FAMILIES: MeshFamily[] = [
  "task-chair",
  "lounge-chair",
  "sofa",
  "desk-rect",
  "desk-l",
  "table-round",
  "table-rect",
  "storage-locker",
  "storage-cabinet",
  "screen",
  "column-round",
  "column-square",
  "plant",
  "door",
  "window",
  "utility-box",
];

describe("normalizeCatalogItem", () => {
  it("derives a valid MeshFamily value for 'Tables' category", () => {
    const item = normalizeCatalogItem({ id: "t1", name: "Test Table", category: "Tables" });
    expect(VALID_MESH_FAMILIES).toContain(item.meshType);
    expect(item.meshType).toBe("table-rect");
  });

  it("derives a valid MeshFamily value for 'Desks' category", () => {
    const item = normalizeCatalogItem({ id: "d1", name: "Test Desk", category: "Desks" });
    expect(VALID_MESH_FAMILIES).toContain(item.meshType);
    expect(item.meshType).toBe("desk-rect");
  });

  it("derives a valid MeshFamily value for 'Seating' category", () => {
    const item = normalizeCatalogItem({ id: "s1", name: "Test Chair", category: "Seating" });
    expect(VALID_MESH_FAMILIES).toContain(item.meshType);
    expect(item.meshType).toBe("task-chair");
  });

  it("derives a valid MeshFamily value for 'Storage' category", () => {
    const item = normalizeCatalogItem({ id: "c1", name: "Test Cabinet", category: "Storage" });
    expect(VALID_MESH_FAMILIES).toContain(item.meshType);
    expect(item.meshType).toBe("storage-cabinet");
  });

  it("falls back to a valid MeshFamily value for unknown categories", () => {
    const item = normalizeCatalogItem({ id: "u1", name: "Unknown", category: "Accessories" });
    expect(VALID_MESH_FAMILIES).toContain(item.meshType);
  });

  it("maps thumbnail from heroImageUrl when available", () => {
    const item = normalizeCatalogItem({
      id: "i1",
      name: "Hero Item",
      category: "Tables",
      heroImageUrl: "/images/hero.webp",
      imageUrl: "/images/fallback.webp",
    });
    expect(item.thumbnail).toBe("/images/hero.webp");
  });

  it("falls back thumbnail to imageUrl when heroImageUrl is absent", () => {
    const item = normalizeCatalogItem({
      id: "i2",
      name: "Fallback Item",
      category: "Tables",
      imageUrl: "/images/fallback.webp",
    });
    expect(item.thumbnail).toBe("/images/fallback.webp");
  });

  it("uses fallback dimensions when none are provided", () => {
    const item = normalizeCatalogItem({ id: "x1", name: "No Dims", category: "Tables" });
    expect(item.dimensions.widthMm).toBe(600);
    expect(item.dimensions.depthMm).toBe(600);
    expect(item.dimensions.heightMm).toBe(750);
  });

  it("normalizes category to lowercase", () => {
    const item = normalizeCatalogItem({ id: "cat1", name: "Cased", category: "DESKS" });
    expect(item.category).toBe("desks");
  });

  it("parses dimensions from specs.dimensions when numeric fields are missing", () => {
    const item = normalizeCatalogItem({
      id: "spec-dims",
      name: "Specs Dims",
      category: "tables",
      specs: { dimensions: "1400 x 700 x 750 mm" },
    });
    expect(item.dimensions).toEqual({ widthMm: 1400, depthMm: 700, heightMm: 750 });
  });

  it("parses centimetre dimensions from specs.dimensions", () => {
    const item = normalizeCatalogItem({
      id: "spec-cm",
      name: "Specs Cm",
      category: "desks",
      specs: { dimensions: "140 x 70 x 75 cm" },
    });
    expect(item.dimensions).toEqual({ widthMm: 1400, depthMm: 700, heightMm: 750 });
  });

  it("derives color from metadata and finish fallback fields", () => {
    const fromMetadata = normalizeCatalogItem({
      id: "meta-color",
      name: "Metadata Color",
      category: "seating",
      metadata: { colorOptions: ["#ABCDEF"] },
    });
    expect(fromMetadata.color).toBe("#ABCDEF");

    const fromFinishes = normalizeCatalogItem({
      id: "finish-color",
      name: "Finish Color",
      category: "seating",
      finishes: ["#123456"],
    });
    expect(fromFinishes.color).toBe("#123456");
  });
});

describe("catalog adapter helpers", () => {
  const sampleItems = [
    normalizeCatalogItem({
      id: "desk-1",
      name: "Focus Desk",
      category: "Desks",
      subcategory: "Benching",
      series: "Axis",
    }),
    normalizeCatalogItem({
      id: "chair-1",
      name: "Task Chair",
      category: "Seating",
      series: "Motion",
    }),
  ];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes batches and filters by category or text query", () => {
    const batch = normalizeCatalogBatch([
      { id: "desk-1", name: "Focus Desk", category: "Desks" },
      { id: "chair-1", name: "Task Chair", category: "Seating" },
    ]);

    expect(batch).toHaveLength(2);
    expect(filterByCategory(batch, "all")).toEqual(batch);
    expect(filterByCategory(batch, "seat")).toEqual([batch[1]]);
    expect(searchCatalog(sampleItems, "  axis ")).toEqual([sampleItems[0]]);
    expect(searchCatalog(sampleItems, "bench")).toEqual([sampleItems[0]]);
    expect(searchCatalog(sampleItems, "")).toEqual(sampleItems);
  });

  it("loads the planner catalog from either a top-level array or an items wrapper", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "desk-1", name: "Focus Desk", category: "Desks" }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ id: "chair-1", name: "Task Chair", category: "Seating" }],
        }),
      } as Response);

    await expect(loadPlannerCatalog()).resolves.toEqual([
      expect.objectContaining({ id: "desk-1", category: "desks" }),
    ]);
    await expect(loadPlannerCatalog()).resolves.toEqual([
      expect.objectContaining({ id: "chair-1", category: "seating" }),
    ]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("throws a descriptive error when the planner catalog fetch fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    } as Response);

    await expect(loadPlannerCatalog()).rejects.toThrow(
      "Failed to load planner catalog (503 Service Unavailable)",
    );
  });
});
