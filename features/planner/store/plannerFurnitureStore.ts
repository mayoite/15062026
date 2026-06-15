import { create } from "zustand";
import { v4 as uuid } from "uuid";
import { bringFurnitureItemToFront, buildFurnitureBatch, sendFurnitureItemToBack } from "./plannerFurnitureOrdering";
import { applyFurnitureBatchUpdates, toggleSelectedIdInList } from "./plannerMutationUtils";
import type { FurnitureItem } from "./plannerTypes";

export interface PlannerFurnitureInstanceItem {
  id: string;
  catalogId: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  dimensions: [number, number, number];
  color: string;
}

function toPlannerFurnitureInstances(
  furniture: FurnitureItem[],
): PlannerFurnitureInstanceItem[] {
  return furniture.map((item) => ({
    id: item.id,
    catalogId: item.catalogId,
    type: item.shape,
    position: [item.x, 0, item.y],
    rotation: [0, item.rotation, 0],
    dimensions: [item.width, 0, item.height],
    color: item.color,
  }));
}

interface FurnitureState {
  furniture: FurnitureItem[];
  instancedFurniture: PlannerFurnitureInstanceItem[];
  activeCatalogId: string | null;
  selectedId: string | null;
  selectedIds: string[];

  addFurniture: (item: Omit<FurnitureItem, "id" | "zIndex">) => void;
  addFurnitureBatch: (items: Omit<FurnitureItem, "id" | "zIndex">[]) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  updateFurnitureBatch: (updates: Array<{ id: string; updates: Partial<FurnitureItem> }>) => void;
  deleteFurniture: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  setActiveCatalogId: (id: string | null) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelectedId: (id: string) => void;
  clearSelection: () => void;
}

export const usePlannerFurnitureStore = create<FurnitureState>((set, get) => ({
  furniture: [],
  instancedFurniture: [],
  activeCatalogId: null,
  selectedId: null,
  selectedIds: [],

  addFurniture: (item) => {
    const newItem: FurnitureItem = { ...item, id: uuid(), zIndex: get().furniture.length };
    set((s) => {
      const furniture = [...s.furniture, newItem];
      return {
        furniture,
        instancedFurniture: toPlannerFurnitureInstances(furniture),
      };
    });
  },

  addFurnitureBatch: (items) => {
    const s = get();
    const newItems = buildFurnitureBatch(s.furniture, items, uuid);
    set((st) => {
      const furniture = [...st.furniture, ...newItems];
      return {
        furniture,
        instancedFurniture: toPlannerFurnitureInstances(furniture),
      };
    });
  },

  updateFurniture: (id, updates) => {
    set((s) => {
      const furniture = s.furniture.map((f) => (f.id === id ? { ...f, ...updates } : f));
      return {
        furniture,
        instancedFurniture: toPlannerFurnitureInstances(furniture),
      };
    });
  },

  updateFurnitureBatch: (updates) => {
    set((s) => {
      const furniture = applyFurnitureBatchUpdates(
        s.furniture,
        updates.map((u) => ({ id: u.id, changes: u.updates }))
      );
      return {
        furniture,
        instancedFurniture: toPlannerFurnitureInstances(furniture),
      };
    });
  },

  deleteFurniture: (id) => {
    set((s) => {
      const furniture = s.furniture.filter((f) => f.id !== id);
      return {
        furniture,
        instancedFurniture: toPlannerFurnitureInstances(furniture),
        selectedId: s.selectedId === id ? null : s.selectedId,
        selectedIds: s.selectedIds.filter((sid) => sid !== id),
      };
    });
  },

  bringToFront: (id) => {
    set((s) => {
      const furniture = bringFurnitureItemToFront(s.furniture, id);
      return {
        furniture,
        instancedFurniture: toPlannerFurnitureInstances(furniture),
      };
    });
  },

  sendToBack: (id) => {
    set((s) => {
      const furniture = sendFurnitureItemToBack(s.furniture, id);
      return {
        furniture,
        instancedFurniture: toPlannerFurnitureInstances(furniture),
      };
    });
  },

  setActiveCatalogId: (id) => set({ activeCatalogId: id }),
  setSelectedId: (id) => set({ selectedId: id }),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  toggleSelectedId: (id) => {
    const s = get();
    set({ selectedIds: toggleSelectedIdInList(s.selectedIds, id) });
  },
  clearSelection: () => set({ selectedId: null, selectedIds: [] }),
}));
