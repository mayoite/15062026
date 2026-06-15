"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { MeshFamily } from "@/features/planner/shared/mesh-contract";

export type CameraMode = "top-down" | "orbit" | "walk";
export type TransformMode = "translate" | "rotate";
export type PlannerMode = "layout" | "walk" | "export";
export type RoomPreset = "rectangle" | "l-shape" | "u-shape" | "open-plan" | "custom";

export type PlacedItem = {
  id: string;
  catalogId: string;
  name: string;
  category: string;
  meshType: MeshFamily;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  position: [number, number, number];
  rotation: number;
  color?: string;
};

export type RoomConfig = {
  widthMm: number;
  depthMm: number;
  wallHeightMm: number;
};

type HistoryEntry = {
  items: PlacedItem[];
  room: RoomConfig;
};

export type GhostItem = {
  catalogId: string;
  name: string;
  category: string;
  meshType: MeshFamily;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  color?: string;
} | null;

type PlannerR3FState = {
  room: RoomConfig;
  items: PlacedItem[];
  selectedId: string | null;
  selectedIds: string[];
  cameraMode: CameraMode;
  pendingCameraPreset: { position: [number, number, number]; target: [number, number, number]; fov: number } | null;
  liveCameraState: { position: [number, number, number]; target: [number, number, number]; fov: number } | null;
  plannerMode: PlannerMode;
  transformMode: TransformMode;
  snapEnabled: boolean;
  snapGridMm: number;
  snapAngleDeg: number;
  showGrid: boolean;
  showWalls: boolean;
  ghostItem: GhostItem;
  showRoomPresets: boolean;
  roomPresetApplied: boolean;

  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  setRoom: (room: Partial<RoomConfig>) => void;
  addItem: (item: Omit<PlacedItem, "id">) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, patch: Partial<PlacedItem>) => void;
  duplicateItem: (id: string) => void;
  clearItems: () => void;
  setSelectedId: (id: string | null) => void;
  toggleSelectId: (id: string) => void;
  clearSelection: () => void;
  removeSelected: () => void;
  setCameraMode: (mode: CameraMode) => void;
  applyCameraPreset: (preset: { position: [number, number, number]; target: [number, number, number]; fov: number }) => void;
  clearCameraPreset: () => void;
  updateLiveCameraState: (state: { position: [number, number, number]; target: [number, number, number]; fov: number }) => void;
  setPlannerMode: (mode: PlannerMode) => void;
  setTransformMode: (mode: TransformMode) => void;
  toggleSnap: () => void;
  toggleGrid: () => void;
  toggleWalls: () => void;
  setGhostItem: (item: GhostItem) => void;
  setShowRoomPresets: (show: boolean) => void;
  applyRoomPreset: (preset: RoomPreset, width?: number, depth?: number) => void;
  undo: () => void;
  redo: () => void;

  // Magnetic snap & wall-rotation snap (Phase 03 feature set)
  magneticSnapEnabled: boolean;
  magneticSnapThresholdMm: number;
  wallRotationSnapEnabled: boolean;
  toggleMagneticSnap: () => void;
  toggleWallRotationSnap: () => void;
};

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `item-${Date.now()}-${idCounter}`;
}

function snapshot(state: PlannerR3FState): HistoryEntry {
  return {
    items: state.items.map((i) => ({ ...i, position: [...i.position] as [number, number, number] })),
    room: { ...state.room },
  };
}

const DEFAULT_ROOM: RoomConfig = {
  widthMm: 6000,
  depthMm: 5000,
  wallHeightMm: 2800,
};

const ROOM_PRESETS: Record<string, RoomConfig> = {
  rectangle: { widthMm: 6000, depthMm: 5000, wallHeightMm: 2800 },
  "l-shape": { widthMm: 8000, depthMm: 6000, wallHeightMm: 2800 },
  "u-shape": { widthMm: 10000, depthMm: 7000, wallHeightMm: 2800 },
  "open-plan": { widthMm: 12000, depthMm: 10000, wallHeightMm: 3000 },
};

const MAX_UNDO = 50;

export const usePlannerR3FStore = create<PlannerR3FState>()(
  devtools(
    (set) => ({
      room: { ...DEFAULT_ROOM },
      items: [],
      selectedId: null,
      selectedIds: [],
      cameraMode: "orbit",
      pendingCameraPreset: null,
      liveCameraState: null,
      plannerMode: "layout",
      transformMode: "translate",
      snapEnabled: true,
      snapGridMm: 100,
      snapAngleDeg: 15,
      showGrid: true,
      showWalls: true,
      ghostItem: null,
      showRoomPresets: true,
      roomPresetApplied: false,

      undoStack: [],
      redoStack: [],

      // Magnetic snap defaults
      magneticSnapEnabled: true,
      magneticSnapThresholdMm: 200,
      wallRotationSnapEnabled: true,

      toggleMagneticSnap: () => set((s) => ({ magneticSnapEnabled: !s.magneticSnapEnabled }), false, 'planner/toggleMagneticSnap'),
      toggleWallRotationSnap: () => set((s) => ({ wallRotationSnapEnabled: !s.wallRotationSnapEnabled }), false, 'planner/toggleWallRotationSnap'),

      setRoom: (patch) =>
        set(
          (s) => {
            const entry = snapshot(s);
            return {
              room: { ...s.room, ...patch },
              undoStack: [...s.undoStack, entry].slice(-MAX_UNDO),
              redoStack: [],
            };
          },
          false,
          "planner/setRoom",
        ),

      addItem: (item) =>
        set(
          (s) => {
            const entry = snapshot(s);
            const newItem: PlacedItem = { ...item, id: nextId() };
            return {
              items: [...s.items, newItem],
              selectedId: newItem.id,
              selectedIds: [newItem.id],
              ghostItem: null,
              undoStack: [...s.undoStack, entry].slice(-MAX_UNDO),
              redoStack: [],
            };
          },
          false,
          "planner/addItem",
        ),

      removeItem: (id) =>
        set(
          (s) => {
            const entry = snapshot(s);
            return {
              items: s.items.filter((i) => i.id !== id),
              selectedId: s.selectedId === id ? null : s.selectedId,
              selectedIds: s.selectedIds.filter((sid) => sid !== id),
              undoStack: [...s.undoStack, entry].slice(-MAX_UNDO),
              redoStack: [],
            };
          },
          false,
          "planner/removeItem",
        ),

      updateItem: (id, patch) =>
        set(
          (s) => ({
            items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
          }),
          false,
          "planner/updateItem",
        ),

      duplicateItem: (id) =>
        set(
          (s) => {
            const source = s.items.find((i) => i.id === id);
            if (!source) return s;
            const entry = snapshot(s);
            const dup: PlacedItem = {
              ...source,
              id: nextId(),
              position: [
                source.position[0] + 0.3,
                source.position[1],
                source.position[2] + 0.3,
              ],
            };
            return {
              items: [...s.items, dup],
              selectedId: dup.id,
              selectedIds: [dup.id],
              undoStack: [...s.undoStack, entry].slice(-MAX_UNDO),
              redoStack: [],
            };
          },
          false,
          "planner/duplicateItem",
        ),

      clearItems: () =>
        set(
          (s) => {
            const entry = snapshot(s);
            return {
              items: [],
              selectedId: null,
              selectedIds: [],
              undoStack: [...s.undoStack, entry].slice(-MAX_UNDO),
              redoStack: [],
            };
          },
          false,
          "planner/clearItems",
        ),

      setSelectedId: (id) =>
        set({ selectedId: id, selectedIds: id ? [id] : [] }, false, "planner/select"),

      toggleSelectId: (id) =>
        set(
          (s) => {
            const exists = s.selectedIds.includes(id);
            const newIds = exists
              ? s.selectedIds.filter((sid) => sid !== id)
              : [...s.selectedIds, id];
            return {
              selectedIds: newIds,
              selectedId: newIds.length > 0 ? newIds[newIds.length - 1] : null,
            };
          },
          false,
          "planner/toggleSelect",
        ),

      clearSelection: () =>
        set({ selectedId: null, selectedIds: [] }, false, "planner/clearSelection"),

      removeSelected: () =>
        set(
          (s) => {
            if (s.selectedIds.length === 0) return s;
            const entry = snapshot(s);
            const idSet = new Set(s.selectedIds);
            return {
              items: s.items.filter((i) => !idSet.has(i.id)),
              selectedId: null,
              selectedIds: [],
              undoStack: [...s.undoStack, entry].slice(-MAX_UNDO),
              redoStack: [],
            };
          },
          false,
          "planner/removeSelected",
        ),

      setCameraMode: (mode) =>
        set(
          (s) => {
            const updates: Partial<PlannerR3FState> = { cameraMode: mode };
            if (mode === "walk") {
              updates.plannerMode = "walk";
            } else if (s.plannerMode === "walk") {
              updates.plannerMode = "layout";
            }
            return updates;
          },
          false,
          "planner/cameraMode",
        ),

      applyCameraPreset: (preset) =>
        set(
          () => ({
            cameraMode: "orbit" as CameraMode,
            pendingCameraPreset: preset,
          }),
          false,
          "planner/applyCameraPreset",
        ),

      clearCameraPreset: () =>
        set(() => ({ pendingCameraPreset: null }), false, "planner/clearCameraPreset"),

      updateLiveCameraState: (state) =>
        set(() => ({ liveCameraState: state }), false, "planner/updateLiveCamera"),

      setPlannerMode: (mode) =>
        set(
          (s) => {
            const updates: Partial<PlannerR3FState> = { plannerMode: mode };
            if (mode === "walk") {
              updates.cameraMode = "walk";
            } else if (mode === "layout" && s.cameraMode === "walk") {
              updates.cameraMode = "orbit";
            }
            return updates;
          },
          false,
          "planner/plannerMode",
        ),

      setTransformMode: (mode) => set({ transformMode: mode }, false, "planner/transformMode"),

      toggleSnap: () =>
        set((s) => ({ snapEnabled: !s.snapEnabled }), false, "planner/toggleSnap"),

      toggleGrid: () =>
        set((s) => ({ showGrid: !s.showGrid }), false, "planner/toggleGrid"),

      toggleWalls: () =>
        set((s) => ({ showWalls: !s.showWalls }), false, "planner/toggleWalls"),

      setGhostItem: (item) =>
        set({ ghostItem: item }, false, "planner/setGhostItem"),

      setShowRoomPresets: (show) =>
        set({ showRoomPresets: show }, false, "planner/showRoomPresets"),

      applyRoomPreset: (preset, width, depth) =>
        set(
          (s) => {
            const entry = snapshot(s);
            let room: RoomConfig;
            if (preset === "custom" && width && depth) {
              room = { widthMm: width, depthMm: depth, wallHeightMm: 2800 };
            } else {
              room = ROOM_PRESETS[preset] ?? { ...DEFAULT_ROOM };
            }
            return {
              room,
              showRoomPresets: false,
              roomPresetApplied: true,
              undoStack: [...s.undoStack, entry].slice(-MAX_UNDO),
              redoStack: [],
            };
          },
          false,
          "planner/applyRoomPreset",
        ),

      undo: () =>
        set(
          (s) => {
            if (s.undoStack.length === 0) return s;
            const prev = s.undoStack[s.undoStack.length - 1];
            const current = snapshot(s);
            return {
              items: prev.items,
              room: prev.room,
              selectedId: null,
              selectedIds: [],
              undoStack: s.undoStack.slice(0, -1),
              redoStack: [...s.redoStack, current],
            };
          },
          false,
          "planner/undo",
        ),

      redo: () =>
        set(
          (s) => {
            if (s.redoStack.length === 0) return s;
            const next = s.redoStack[s.redoStack.length - 1];
            const current = snapshot(s);
            return {
              items: next.items,
              room: next.room,
              selectedId: null,
              selectedIds: [],
              undoStack: [...s.undoStack, current],
              redoStack: s.redoStack.slice(0, -1),
            };
          },
          false,
          "planner/redo",
        ),
    }),
    { name: "PlannerR3F", enabled: process.env.NODE_ENV !== "production" },
  ),
);
