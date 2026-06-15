import { create } from "zustand";

import type { PlannerStep } from "../editor/plannerStep";
import type { PlannerProjectMetadata } from "../onboarding/projectSetup";

export type PlannerLayerCategory =
  | "walls"
  | "rooms"
  | "furniture"
  | "zones"
  | "measurements"
  | "underlay";

export const PLANNER_LAYER_CATEGORIES: PlannerLayerCategory[] = [
  "underlay",
  "walls",
  "rooms",
  "zones",
  "furniture",
  "measurements",
];

export interface BlueprintState {
  dataUrl: string | null;
  sourceKind: "image" | "pdf" | null;
  sourcePage: number | null;
  sourcePageCount: number | null;
  interactionMode: "idle" | "move";
  x: number;
  y: number;
  scale: number;
  widthPx: number;
  heightPx: number;
  opacity: number;
  /** Millimetres per canvas unit after calibration. */
  mmPerUnit: number | null;
  calibrating: boolean;
  calibrationPoints: Array<{ x: number; y: number }>;
  knownDistanceMm: number;
}

export type WorkspacePersisted = {
  blueprint: BlueprintState;
  layerVisible: Record<PlannerLayerCategory, boolean>;
  unitSystem: "metric" | "imperial";
  projectMetadata: PlannerProjectMetadata | null;
};

interface WorkspaceState extends WorkspacePersisted {
  plannerStep: PlannerStep;
  setPlannerStep: (step: PlannerStep) => void;
  setBlueprint: (patch: Partial<BlueprintState>) => void;
  resetBlueprint: () => void;
  toggleLayer: (category: PlannerLayerCategory) => void;
  setLayerVisible: (category: PlannerLayerCategory, visible: boolean) => void;
  setUnitSystem: (unit: "metric" | "imperial") => void;
  setProjectMetadata: (metadata: PlannerProjectMetadata | null) => void;
}

export function serializeWorkspaceState(): WorkspacePersisted {
  const s = usePlannerWorkspaceStore.getState();
  return {
    blueprint: { ...s.blueprint },
    layerVisible: { ...s.layerVisible },
    unitSystem: s.unitSystem,
    projectMetadata: s.projectMetadata ? { ...s.projectMetadata } : null,
  };
}

export function hydrateWorkspaceState(persisted: Partial<WorkspacePersisted>) {
  usePlannerWorkspaceStore.setState((s) => ({
    blueprint: persisted.blueprint ? { ...DEFAULT_BLUEPRINT, ...persisted.blueprint } : s.blueprint,
    layerVisible: persisted.layerVisible ? { ...DEFAULT_LAYERS, ...persisted.layerVisible } : s.layerVisible,
    unitSystem: persisted.unitSystem ?? s.unitSystem,
    projectMetadata: persisted.projectMetadata ?? s.projectMetadata,
  }));
}

export { DEFAULT_LAYERS };

const DEFAULT_BLUEPRINT: BlueprintState = {
  dataUrl: null,
  sourceKind: null,
  sourcePage: null,
  sourcePageCount: null,
  interactionMode: "idle",
  x: 0,
  y: 0,
  scale: 1,
  widthPx: 0,
  heightPx: 0,
  opacity: 0.45,
  mmPerUnit: null,
  calibrating: false,
  calibrationPoints: [],
  knownDistanceMm: 3000,
};

const DEFAULT_LAYERS: Record<PlannerLayerCategory, boolean> = {
  underlay: true,
  walls: true,
  rooms: true,
  zones: true,
  furniture: true,
  measurements: true,
};

export const usePlannerWorkspaceStore = create<WorkspaceState>((set) => ({
  blueprint: { ...DEFAULT_BLUEPRINT },
  layerVisible: { ...DEFAULT_LAYERS },
  unitSystem: "metric",
  projectMetadata: null,
  plannerStep: "catalog",
  setPlannerStep: (step) => set({ plannerStep: step }),
  setBlueprint: (patch) =>
    set((s) => ({ blueprint: { ...s.blueprint, ...patch } })),
  resetBlueprint: () => set({ blueprint: { ...DEFAULT_BLUEPRINT } }),
  toggleLayer: (category) =>
    set((s) => ({
      layerVisible: { ...s.layerVisible, [category]: !s.layerVisible[category] },
    })),
  setLayerVisible: (category, visible) =>
    set((s) => ({
      layerVisible: { ...s.layerVisible, [category]: visible },
    })),
  setUnitSystem: (unit) => set({ unitSystem: unit }),
  setProjectMetadata: (metadata) => set({ projectMetadata: metadata }),
}));
