import { describe, expect, it } from "vitest";
import {
  getDefaultPlacementCatalogItemId,
  getPlacementCatalogItem,
  isFurniturePlacementCatalogItem,
} from "@/features/planner/catalog/placementCatalogResolver";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";

describe("placementCatalogResolver", () => {
  it("resolves legacy catalog ids", () => {
    const item = getPlacementCatalogItem("ws-linear-120");
    expect(item?.name).toContain("Linear Desk");
    expect(item?.widthMm).toBe(1200);
  });

  it("resolves workspace catalog ids with real-world dimensions", () => {
    const workspaceItem = PLANNER_CATALOG_ITEMS.find((item) => item.category === "desks");
    expect(workspaceItem).toBeTruthy();

    const resolved = getPlacementCatalogItem(workspaceItem!.id);
    expect(resolved).toBeTruthy();
    expect(resolved!.widthMm).toBeGreaterThanOrEqual(1000);
  });

  it("excludes room and zone catalog items from furniture placement", () => {
    const roomItem = PLANNER_CATALOG_ITEMS.find((item) => item.category === "rooms");
    expect(roomItem).toBeTruthy();
    expect(isFurniturePlacementCatalogItem(roomItem!)).toBe(false);
    expect(getPlacementCatalogItem(roomItem!.id)).toBeUndefined();
  });

  it("returns a default placement catalog id", () => {
    expect(getDefaultPlacementCatalogItemId()).toBeTruthy();
  });
});