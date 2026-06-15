import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("uuid", () => ({ v4: () => "mock-uuid-" + Math.random().toString(36).slice(2, 8) }));

import { usePlannerFurnitureStore } from "@/features/planner/store/plannerFurnitureStore";
import type { FurnitureItem } from "@/features/planner/store/plannerTypes";

function resetStore() {
  usePlannerFurnitureStore.setState({
    furniture: [],
    instancedFurniture: [],
    activeCatalogId: null,
    selectedId: null,
    selectedIds: [],
  });
}

const baseFurniture: Omit<FurnitureItem, "id" | "zIndex"> = {
  catalogId: "task-chair",
  name: "Task Chair",
  x: 100,
  y: 200,
  width: 50,
  height: 50,
  rotation: 0,
  color: "#333",
  shape: "task-chair",
};

describe("plannerFurnitureStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("addFurniture", () => {
    it("adds a furniture item with generated id and zIndex", () => {
      const store = usePlannerFurnitureStore.getState();
      store.addFurniture(baseFurniture);

      const { furniture, instancedFurniture } = usePlannerFurnitureStore.getState();
      expect(furniture).toHaveLength(1);
      expect(furniture[0].name).toBe("Task Chair");
      expect(furniture[0].x).toBe(100);
      expect(furniture[0].y).toBe(200);
      expect(typeof furniture[0].id).toBe("string");
      expect(furniture[0].zIndex).toBe(0);
      expect(instancedFurniture).toEqual([
        {
          id: furniture[0].id,
          catalogId: "task-chair",
          type: "task-chair",
          position: [100, 0, 200],
          rotation: [0, 0, 0],
          dimensions: [50, 0, 50],
          color: "#333",
        },
      ]);
    });

    it("increments zIndex for each added item", () => {
      const store = usePlannerFurnitureStore.getState();
      store.addFurniture(baseFurniture);
      store.addFurniture({ ...baseFurniture, name: "Desk" });

      const { furniture } = usePlannerFurnitureStore.getState();
      expect(furniture[1].zIndex).toBe(1);
    });
  });

  describe("deleteFurniture", () => {
    it("removes the item by id", () => {
      const store = usePlannerFurnitureStore.getState();
      store.addFurniture(baseFurniture);
      const itemId = usePlannerFurnitureStore.getState().furniture[0].id;

      store.deleteFurniture(itemId);
      expect(usePlannerFurnitureStore.getState().furniture).toHaveLength(0);
    });

    it("clears selectedId if deleted item was selected", () => {
      const store = usePlannerFurnitureStore.getState();
      store.addFurniture(baseFurniture);
      const itemId = usePlannerFurnitureStore.getState().furniture[0].id;
      store.setSelectedId(itemId);

      store.deleteFurniture(itemId);
      expect(usePlannerFurnitureStore.getState().selectedId).toBeNull();
    });

    it("removes deleted id from selectedIds", () => {
      const store = usePlannerFurnitureStore.getState();
      store.addFurniture(baseFurniture);
      store.addFurniture({ ...baseFurniture, name: "Desk" });
      const state = usePlannerFurnitureStore.getState();
      const id0 = state.furniture[0].id;
      const id1 = state.furniture[1].id;
      store.setSelectedIds([id0, id1]);

      store.deleteFurniture(id0);
      expect(usePlannerFurnitureStore.getState().selectedIds).toEqual([id1]);
    });
  });

  describe("updateFurniture", () => {
    it("updates properties of the specified item", () => {
      const store = usePlannerFurnitureStore.getState();
      store.addFurniture(baseFurniture);
      const itemId = usePlannerFurnitureStore.getState().furniture[0].id;

      store.updateFurniture(itemId, { x: 300, rotation: 45 });
      const updated = usePlannerFurnitureStore.getState().furniture[0];
      expect(updated.x).toBe(300);
      expect(updated.rotation).toBe(45);
      expect(updated.y).toBe(200); // unchanged
    });

    it("no-ops when updating an unknown furniture id", () => {
      const store = usePlannerFurnitureStore.getState();
      store.addFurniture(baseFurniture);
      store.updateFurniture("missing-id", { x: 999 });
      expect(usePlannerFurnitureStore.getState().furniture[0].x).toBe(100);
    });
  });

  describe("bringToFront / sendToBack", () => {
    it("bringToFront sets highest zIndex", () => {
      const store = usePlannerFurnitureStore.getState();
      store.addFurniture(baseFurniture);
      store.addFurniture({ ...baseFurniture, name: "Desk" });
      const state = usePlannerFurnitureStore.getState();
      const id0 = state.furniture[0].id;

      store.bringToFront(id0);
      const after = usePlannerFurnitureStore.getState().furniture;
      const item0 = after.find((f) => f.id === id0);
      const maxZ = Math.max(...after.map((f) => f.zIndex));
      expect(item0).toBeDefined();
      expect(item0.zIndex).toBe(maxZ);
    });

    it("sendToBack sets lowest zIndex", () => {
      const store = usePlannerFurnitureStore.getState();
      store.addFurniture(baseFurniture);
      store.addFurniture({ ...baseFurniture, name: "Desk" });
      const state = usePlannerFurnitureStore.getState();
      const id1 = state.furniture[1].id;

      store.sendToBack(id1);
      const after = usePlannerFurnitureStore.getState().furniture;
      const item1 = after.find((f) => f.id === id1);
      const minZ = Math.min(...after.map((f) => f.zIndex));
      expect(item1).toBeDefined();
      expect(item1.zIndex).toBe(minZ);
    });
  });

  describe("selection", () => {
    it("toggleSelectedId adds and removes ids", () => {
      const store = usePlannerFurnitureStore.getState();
      store.addFurniture(baseFurniture);
      const itemId = usePlannerFurnitureStore.getState().furniture[0].id;

      store.toggleSelectedId(itemId);
      expect(usePlannerFurnitureStore.getState().selectedIds).toContain(itemId);

      store.toggleSelectedId(itemId);
      expect(usePlannerFurnitureStore.getState().selectedIds).not.toContain(itemId);
    });

    it("clearSelection resets both selectedId and selectedIds", () => {
      const store = usePlannerFurnitureStore.getState();
      store.addFurniture(baseFurniture);
      const itemId = usePlannerFurnitureStore.getState().furniture[0].id;
      store.setSelectedId(itemId);
      store.setSelectedIds([itemId]);

      store.clearSelection();
      const state = usePlannerFurnitureStore.getState();
      expect(state.selectedId).toBeNull();
      expect(state.selectedIds).toEqual([]);
    });
  });

  describe("addFurnitureBatch", () => {
    it("adds multiple items at once with incrementing zIndex", () => {
      const store = usePlannerFurnitureStore.getState();
      store.addFurnitureBatch([
        baseFurniture,
        { ...baseFurniture, name: "Desk", x: 200 },
        { ...baseFurniture, name: "Sofa", x: 300 },
      ]);

      const { furniture } = usePlannerFurnitureStore.getState();
      expect(furniture).toHaveLength(3);
      expect(furniture[0].zIndex).toBeLessThan(furniture[1].zIndex);
      expect(furniture[1].zIndex).toBeLessThan(furniture[2].zIndex);
    });
  });
});
