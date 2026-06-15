import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type Point2D = [number, number];
export type Point3D = [number, number, number];

export interface WallEntity {
  id: string;
  start: Point2D;
  end: Point2D;
  height: number;
  thickness: number;
}

export interface ItemEntity {
  id: string;
  sku: string;
  position: Point3D;
  rotation: number; // Y-axis rotation in degrees
  dimensions: { width: number; height: number; depth: number };
}

interface EnvelopeState {
  walls: Record<string, WallEntity>;
  items: Record<string, ItemEntity>;
  
  // Deterministic operations (Bypass React Diffing via Transient Updates)
  addWall: (wall: WallEntity) => void;
  updateWall: (id: string, updates: Partial<WallEntity>) => void;
  removeWall: (id: string) => void;

  addItem: (item: ItemEntity) => void;
  updateItemPosition: (id: string, position: Point3D, rotation?: number) => void;
  removeItem: (id: string) => void;

  // The Compiler (Handoff from tldraw)
  hydrateFromSketch: (walls: WallEntity[], items: ItemEntity[]) => void;
}

export const useEnvelopeStore = create<EnvelopeState>()(
  subscribeWithSelector((set) => ({
    walls: {},
    items: {},

    addWall: (wall) => set((state) => ({ 
      walls: { ...state.walls, [wall.id]: wall } 
    })),
    
    updateWall: (id, updates) => set((state) => {
      const existing = state.walls[id];
      if (!existing) return state;
      return { walls: { ...state.walls, [id]: { ...existing, ...updates } } };
    }),

    removeWall: (id) => set((state) => {
      const { [id]: _, ...rest } = state.walls;
      return { walls: rest };
    }),

    addItem: (item) => set((state) => ({ 
      items: { ...state.items, [item.id]: item } 
    })),

    updateItemPosition: (id, position, rotation) => set((state) => {
      const existing = state.items[id];
      if (!existing) return state;
      return { 
        items: { 
          ...state.items, 
          [id]: { 
            ...existing, 
            position, 
            ...(rotation !== undefined ? { rotation } : {}) 
          } 
        } 
      };
    }),

    removeItem: (id) => set((state) => {
      const { [id]: _, ...rest } = state.items;
      return { items: rest };
    }),

    hydrateFromSketch: (newWalls, newItems) => set(() => {
      const wallsDict: Record<string, WallEntity> = {};
      newWalls.forEach(w => wallsDict[w.id] = w);
      
      const itemsDict: Record<string, ItemEntity> = {};
      newItems.forEach(i => itemsDict[i.id] = i);
      
      return { walls: wallsDict, items: itemsDict };
    })
  }))
);

/**
 * BEST PRACTICE: For dragging operations in Konva/Three, use transient subscriptions
 * to avoid React re-renders. 
 * 
 * Example:
 * useEnvelopeStore.subscribe(
 *   (state) => state.items['chair_1'].position,
 *   (position) => { meshRef.current.position.set(...position) }
 * );
 */
