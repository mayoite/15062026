import { beforeEach, describe, expect, it, vi } from "vitest";

const RECENT_STORAGE_KEY = "planner-catalog-recent";

describe("planner/catalog/catalogStore init", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("hydrates recent ids from valid localStorage JSON", async () => {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(["room-meeting-8", 42, null]));
    const { usePlannerCatalogStore } = await import("@/features/planner/catalog/catalogStore");
    expect(usePlannerCatalogStore.getState().recentIds).toEqual(["room-meeting-8"]);
  });

  it("returns an empty recent list for invalid localStorage payloads", async () => {
    localStorage.setItem(RECENT_STORAGE_KEY, "not-json");
    const { usePlannerCatalogStore: corruptStore } = await import("@/features/planner/catalog/catalogStore");
    expect(corruptStore.getState().recentIds).toEqual([]);

    vi.resetModules();
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify({ not: "an-array" }));
    const { usePlannerCatalogStore: objectStore } = await import("@/features/planner/catalog/catalogStore");
    expect(objectStore.getState().recentIds).toEqual([]);
  });
});
