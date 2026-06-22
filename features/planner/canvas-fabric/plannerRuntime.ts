"use client";

import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import type { InsertPayload } from "@/features/planner/canvas-fabric/context/FloorplanContext";
import type { PlannerLayerCategory } from "@/features/planner/store/workspaceStore";

export type PlannerFabricSelection = Record<string, unknown>;

export type PlannerFabricRuntime = {
  exportDraft: () => string | null;
  importDraft: (serialized: string) => Promise<void>;
  exportSvg: () => string | null;
  exportPngBlob: () => Promise<Blob | null>;
  placeCatalogItem: (item: CatalogItem) => void;
  insertObject: (payload: InsertPayload) => void;
  setLayerVisibility: (layerVisible: Record<PlannerLayerCategory, boolean>) => void;
  resizeObject: (shapeId: string, widthMm: number, heightMm: number) => void;
  editRoom: () => void;
  endEditRoom: () => void;
  fitToContent: (padding?: number) => number;
  clientToSceneUnits: (clientX: number, clientY: number) => { x: number; y: number } | null;
  setFloorPlanUnderlay: (
    source: string,
    options?: { opacity?: number; fileName?: string },
  ) => Promise<void>;
};

export type PlannerFabricRuntimeState = {
  serializedDraft: string | null;
  selections: PlannerFabricSelection[];
  layerVisible: Record<PlannerLayerCategory, boolean>;
};

const DEFAULT_LAYER_VISIBLE: Record<PlannerLayerCategory, boolean> = {
  walls: true,
  rooms: true,
  zones: true,
  furniture: true,
  measurements: true,
};

// BUG-05 fix: generation counter prevents React strict-mode double-mount from
// wiping the second mount's runtime when the first mount's cleanup fires.
// Each setPlannerFabricRuntime() increments the generation; cleanup only clears
// if the captured generation is still current.
let runtimeGeneration = 0;
let currentRuntime: PlannerFabricRuntime | null = null;
let currentState: PlannerFabricRuntimeState = {
  serializedDraft: null,
  selections: [],
  layerVisible: { ...DEFAULT_LAYER_VISIBLE },
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setPlannerFabricRuntime(runtime: PlannerFabricRuntime | null) {
  if (runtime !== null) {
    // New mount: claim this generation.
    runtimeGeneration += 1;
    currentRuntime = runtime;
    return runtimeGeneration;
  }
  // Cleanup: only clear if the caller's generation is still active.
  // Callers that pass null without a generation (legacy) always clear.
  currentRuntime = null;
  return runtimeGeneration;
}

/** Creates a cleanup function scoped to the current mount generation. */
export function createPlannerFabricRuntimeCleanup(): () => void {
  const generation = runtimeGeneration;
  return () => {
    if (runtimeGeneration === generation) {
      currentRuntime = null;
    }
  };
}

export function getPlannerFabricRuntime() {
  return currentRuntime;
}

export function setPlannerFabricRuntimeState(
  patch: Partial<PlannerFabricRuntimeState>,
) {
  currentState = {
    ...currentState,
    ...patch,
    layerVisible: patch.layerVisible
      ? { ...patch.layerVisible }
      : currentState.layerVisible,
    selections: patch.selections
      ? [...patch.selections]
      : currentState.selections,
  };
  emit();
}

export function getPlannerFabricRuntimeState() {
  return currentState;
}

export function subscribePlannerFabricRuntimeState(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
