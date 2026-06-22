import { beforeEach, describe, expect, it } from "vitest";

import { usePlannerUIStore } from "@/features/planner/store/plannerUIStore";

function resetStore() {
  usePlannerUIStore.setState({
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    sidebarCollapsed: false,
    viewMode: "2d",
    show3D: false,
    showGrid: true,
    backgroundImage: null,
    lightingPreset: "day",
    tags: [],
  });
}

describe("plannerUIStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("zoom and pan", () => {
    it("sets zoom and pan offset", () => {
      const store = usePlannerUIStore.getState();
      store.setZoom(1.75);
      store.setPanOffset({ x: 40, y: -20 });

      expect(usePlannerUIStore.getState().zoom).toBe(1.75);
      expect(usePlannerUIStore.getState().panOffset).toEqual({ x: 40, y: -20 });
    });
  });

  describe("sidebar", () => {
    it("toggles and sets sidebar collapsed state", () => {
      const store = usePlannerUIStore.getState();
      expect(store.sidebarCollapsed).toBe(false);

      store.toggleSidebar();
      expect(usePlannerUIStore.getState().sidebarCollapsed).toBe(true);

      store.setSidebarCollapsed(false);
      expect(usePlannerUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe("view mode", () => {
    it("enables show3D for 3d and split modes", () => {
      const store = usePlannerUIStore.getState();

      store.setViewMode("3d");
      expect(usePlannerUIStore.getState().viewMode).toBe("3d");
      expect(usePlannerUIStore.getState().show3D).toBe(true);

      store.setViewMode("split");
      expect(usePlannerUIStore.getState().show3D).toBe(true);

      store.setViewMode("2d");
      expect(usePlannerUIStore.getState().show3D).toBe(false);
    });
  });

  describe("background image", () => {
    const sampleBg = {
      url: "/bg.png",
      width: 800,
      height: 600,
      scale: 1,
      opacity: 0.5,
      x: 0,
      y: 0,
      isCalibrating: false,
      isLocked: false,
    };

    it("sets and updates background image", () => {
      const store = usePlannerUIStore.getState();
      store.setBackgroundImage(sampleBg);
      store.updateBackgroundImage({ opacity: 0.9, isLocked: true });

      expect(usePlannerUIStore.getState().backgroundImage).toMatchObject({
        url: "/bg.png",
        opacity: 0.9,
        isLocked: true,
      });
    });

    it("leaves background null when updating without an image", () => {
      const store = usePlannerUIStore.getState();
      store.updateBackgroundImage({ opacity: 0.5 });
      expect(usePlannerUIStore.getState().backgroundImage).toBeNull();
    });
  });

  describe("lighting", () => {
    it("sets lighting preset", () => {
      usePlannerUIStore.getState().setLightingPreset("evening");
      expect(usePlannerUIStore.getState().lightingPreset).toBe("evening");
    });
  });

  describe("tags", () => {
    it("sanitizes tags on setTags", () => {
      usePlannerUIStore.getState().setTags(["  alpha  ", "", "  beta "]);
      expect(usePlannerUIStore.getState().tags).toEqual(["alpha", "beta"]);
    });

    it("adds a valid tag", () => {
      const result = usePlannerUIStore.getState().addTag("  Office  ");
      expect(result).toEqual({ success: true });
      expect(usePlannerUIStore.getState().tags).toEqual(["Office"]);
    });

    it("rejects empty, duplicate, long, and max-count tags", () => {
      const store = usePlannerUIStore.getState();

      expect(store.addTag("   ")).toEqual({ success: false, error: "Tag cannot be empty" });
      expect(store.addTag("a".repeat(31))).toEqual({
        success: false,
        error: "Tag too long (max 30 chars)",
      });

      store.setTags(["Existing"]);
      expect(store.addTag("existing")).toEqual({ success: false, error: "Tag already exists" });

      store.setTags(Array.from({ length: 10 }, (_, i) => `tag-${i}`));
      expect(store.addTag("overflow")).toEqual({
        success: false,
        error: "Maximum 10 tags allowed",
      });
    });

    it("removes tags case-insensitively", () => {
      const store = usePlannerUIStore.getState();
      store.setTags(["Alpha", "Beta"]);
      store.removeTag("alpha");
      expect(usePlannerUIStore.getState().tags).toEqual(["Beta"]);
    });
  });

  describe("grid", () => {
    it("sets and toggles grid visibility", () => {
      const store = usePlannerUIStore.getState();
      store.setShowGrid(false);
      expect(usePlannerUIStore.getState().showGrid).toBe(false);

      store.toggleGrid();
      expect(usePlannerUIStore.getState().showGrid).toBe(true);
    });
  });

  describe("facade getters via direct reads", () => {
    it("exposes zoom, pan, sidebar, and lighting through state", () => {
      const store = usePlannerUIStore.getState();
      store.setZoom(2.25);
      store.setPanOffset({ x: 12, y: -8 });
      store.setSidebarCollapsed(true);
      store.setLightingPreset("night");

      const state = usePlannerUIStore.getState();
      expect(state.zoom).toBe(2.25);
      expect(state.panOffset).toEqual({ x: 12, y: -8 });
      expect(state.sidebarCollapsed).toBe(true);
      expect(state.lightingPreset).toBe("night");
      expect(state.show3D).toBe(false);
    });
  });
});
