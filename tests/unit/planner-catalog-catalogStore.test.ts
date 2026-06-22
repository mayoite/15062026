import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePlannerCatalogStore } from "@/features/planner/catalog/catalogStore";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";

const RECENT_STORAGE_KEY = "planner-catalog-recent";

const sampleItem =
  PLANNER_CATALOG_ITEMS.find((item) => item.id === "room-meeting-8") ?? PLANNER_CATALOG_ITEMS[0];

describe("planner/catalog/catalogStore", () => {
  beforeEach(() => {
    localStorage.clear();
    usePlannerCatalogStore.setState({
      query: "",
      purposeFilter: null,
      recentIds: [],
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("exposes enriched catalog items and filter helpers", () => {
    const state = usePlannerCatalogStore.getState();
    expect(state.items.length).toBeGreaterThan(10);
    expect(state.getFilteredItems().length).toBeGreaterThan(0);
    expect(state.getByCategory("desks").length).toBeGreaterThan(0);
  });

  it("filters items by search query and purpose", () => {
    usePlannerCatalogStore.getState().setQuery("meeting");
    const searched = usePlannerCatalogStore.getState().getFilteredItems();
    expect(searched.some((item) => item.name.toLowerCase().includes("meeting"))).toBe(true);

    usePlannerCatalogStore.getState().setQuery("");
    usePlannerCatalogStore.getState().setPurposeFilter("meeting-rooms");
    const meetingScoped = usePlannerCatalogStore.getState().getFilteredItems();
    expect(meetingScoped.every((item) => ["rooms", "equipment", "desks", "storage", "infrastructure"].includes(item.category))).toBe(true);
  });

  it("records recent placements in state and localStorage", () => {
    usePlannerCatalogStore.getState().recordRecentPlacement(sampleItem.id);
    expect(usePlannerCatalogStore.getState().recentIds).toEqual([sampleItem.id]);

    const stored = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) ?? "[]") as string[];
    expect(stored).toEqual([sampleItem.id]);

    const recentItems = usePlannerCatalogStore.getState().getRecentItems();
    expect(recentItems[0]?.id).toBe(sampleItem.id);
  });

  it("returns only known items for recent placements", () => {
    usePlannerCatalogStore.setState({ recentIds: ["missing-id", sampleItem.id] });
    const recentItems = usePlannerCatalogStore.getState().getRecentItems();
    expect(recentItems).toHaveLength(1);
    expect(recentItems[0]?.id).toBe(sampleItem.id);
  });

  it("tolerates localStorage write failures when recording recents", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => usePlannerCatalogStore.getState().recordRecentPlacement(sampleItem.id)).not.toThrow();
    expect(usePlannerCatalogStore.getState().recentIds[0]).toBe(sampleItem.id);

    setItem.mockRestore();
  });

  it("deduplicates recent placements and caps the list", () => {
    const store = usePlannerCatalogStore.getState();
    for (const id of ["a", "b", "c", "d", "e", "f", "g", "h", "i"]) {
      store.recordRecentPlacement(id);
    }
    const recentIds = usePlannerCatalogStore.getState().recentIds;
    expect(recentIds).toHaveLength(8);
    expect(recentIds[0]).toBe("i");
    expect(recentIds).not.toContain("a");
  });
});

