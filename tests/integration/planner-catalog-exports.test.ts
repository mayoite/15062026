import { describe, expect, it, vi } from "vitest";

import * as catalogIndex from "@/features/planner/catalog";
import { CatalogSidebar } from "@/features/planner/catalog/CatalogSidebar";
import { ROOM_PRESETS } from "@/features/planner/catalog/roomPresets";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";

vi.mock("server-only", () => ({}));

describe("planner/catalog exports", () => {
  it("re-exports catalog panel building blocks from index", () => {
    expect(catalogIndex.CatalogPanel).toBeTypeOf("function");
    expect(catalogIndex.CatalogSidebar).toBeTypeOf("function");
    expect(catalogIndex.CatalogBlockPreview).toBeTypeOf("function");
    expect(catalogIndex.CatalogDropGhost).toBeTypeOf("function");
    expect(catalogIndex.RoomPresetsPanel).toBeTypeOf("function");
    expect(catalogIndex.enrichCatalogItem).toBeTypeOf("function");
    expect(catalogIndex.CATALOG_PURPOSE_TABS.length).toBeGreaterThan(0);
  });

  it("re-exports workspace catalog through compatibility surface", async () => {
    const plannerCatalogCompat = await import("@/features/planner/catalog/plannerCatalog");
    expect(plannerCatalogCompat.PLANNER_CATALOG_ITEMS.length).toBeGreaterThan(0);
    expect(PLANNER_CATALOG_ITEMS.length).toBeGreaterThan(0);
    expect(CatalogSidebar).toBe(catalogIndex.CatalogSidebar);
    expect(CatalogSidebar).toBe(catalogIndex.CatalogPanel);
    expect(ROOM_PRESETS.length).toBeGreaterThan(3);
    expect(ROOM_PRESETS[0]).toMatchObject({ id: expect.any(String), widthMm: expect.any(Number) });
  });
});