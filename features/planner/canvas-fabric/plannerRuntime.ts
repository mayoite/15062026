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
};

export type PlannerFabricRuntimeState = {
  serializedDraft: string | null;
  selections: PlannerFabricSelection[];
  layerVisible: Record<PlannerLayerCategory, boolean>;
};

const DEFAULT_LAYER_VISIBLE: Record<PlannerLayerCategory, boolean> = {
  underlay: true,
  walls: true,
  rooms: true,
  zones: true,
  furniture: true,
  measurements: true,
};

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
  currentRuntime = runtime;
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
