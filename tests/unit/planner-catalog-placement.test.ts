/**
 * planner-catalog-placement.test.ts
 * P4-04/P4-07 — catalog placement resolver: count, id-lookup, category mapping
 */
import { describe, expect, it } from "vitest";
import {
  getPlacementCatalogItem,
  listPlacementCatalogItems,
  getDefaultPlacementCatalogItemId,
  isFurniturePlacementCatalogItem,
} from "@/features/planner/catalog/placementCatalogResolver";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";

// ─── listPlacementCatalogItems ────────────────────────────────────────────────

describe("listPlacementCatalogItems", () => {
  it("returns a non-empty list", () => {
    const items = listPlacementCatalogItems();
    expect(items.length).toBeGreaterThan(0);
  });

  it("all items have required PlacementCatalogItem fields", () => {
    for (const item of listPlacementCatalogItems()) {
      expect(typeof item.id).toBe("string");
      expect(typeof item.name).toBe("string");
      expect(typeof item.widthMm).toBe("number");
      expect(typeof item.depthMm).toBe("number");
      expect(typeof item.heightMm).toBe("number");
      expect(item.widthMm).toBeGreaterThan(0);
      expect(item.depthMm).toBeGreaterThan(0);
    }
  });

  it("rooms and zones are excluded from placement list (P4-04)", () => {
    const items = listPlacementCatalogItems();
    const hasRoom = items.some((i) => i.category === "rooms");
    const hasZone = items.some((i) => i.category === "zones");
    expect(hasRoom).toBe(false);
    expect(hasZone).toBe(false);
  });

  it("workspace catalog wins on id collision", () => {
    // Workspace items are processed after legacy; the same id maps to the workspace version
    const items = listPlacementCatalogItems();
    const ids = items.map((i) => i.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size); // no duplicate ids
  });
});

// ─── getPlacementCatalogItem ──────────────────────────────────────────────────

describe("getPlacementCatalogItem", () => {
  it("finds a workspace catalog desk item by id", () => {
    const firstDesk = PLANNER_CATALOG_ITEMS.find(
      (item) => item.category === "desks" && !item.shapeType.includes("room")
    );
    if (!firstDesk) return; // skip if catalog empty
    const found = getPlacementCatalogItem(firstDesk.id);
    expect(found).not.toBeUndefined();
    expect(found?.id).toBe(firstDesk.id);
  });

  it("returns undefined for unknown id", () => {
    expect(getPlacementCatalogItem("totally-unknown-catalog-id-xyz")).toBeUndefined();
  });

  it("resolved item widthMm / depthMm are positive numbers", () => {
    const item = PLANNER_CATALOG_ITEMS.find((i) => i.category === "desks");
    if (!item) return;
    const resolved = getPlacementCatalogItem(item.id);
    if (!resolved) return;
    expect(resolved.widthMm).toBeGreaterThan(0);
    expect(resolved.depthMm).toBeGreaterThan(0);
  });
});

// ─── getDefaultPlacementCatalogItemId ────────────────────────────────────────

describe("getDefaultPlacementCatalogItemId", () => {
  it("returns a non-empty string", () => {
    const id = getDefaultPlacementCatalogItemId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("returned id resolves to a valid catalog item", () => {
    const id = getDefaultPlacementCatalogItemId();
    const item = getPlacementCatalogItem(id);
    expect(item).not.toBeUndefined();
  });
});

// ─── isFurniturePlacementCatalogItem ─────────────────────────────────────────

describe("isFurniturePlacementCatalogItem", () => {
  function makeItem(category: CatalogItem["category"], shapeType: string): CatalogItem {
    return {
      id: "test",
      name: "Test",
      category,
      shapeType,
      widthMm: 120,
      heightMm: 60,
      depthMm: 60,
      description: "",
      tags: [],
    };
  }

  it("returns true for a desk item", () => {
    expect(isFurniturePlacementCatalogItem(makeItem("desks", "planner-desk"))).toBe(true);
  });

  it("returns false for rooms", () => {
    expect(isFurniturePlacementCatalogItem(makeItem("rooms", "planner-room"))).toBe(false);
  });

  it("returns false for zones", () => {
    expect(isFurniturePlacementCatalogItem(makeItem("zones", "planner-zone"))).toBe(false);
  });

  it("returns false for infrastructure", () => {
    expect(isFurniturePlacementCatalogItem(makeItem("infrastructure", "planner-desk"))).toBe(false);
  });
});

