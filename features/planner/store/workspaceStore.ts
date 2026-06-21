import { create } from "zustand";

import type { SuggestedLayoutJson } from "../ai/types";
import type { PlannerStep } from "../editor/plannerStep";
import type { PlannerProjectMetadata } from "../onboarding/projectSetup";

export type PlannerLayerCategory =
  | "walls"
  | "rooms"
  | "furniture"
  | "zones"
  | "measurements";

export const PLANNER_LAYER_CATEGORIES: PlannerLayerCategory[] = [
  "walls",
  "rooms",
  "zones",
  "furniture",
  "measurements",
];

export type WorkspacePersisted = {
  layerVisible: Record<PlannerLayerCategory, boolean>;
  unitSystem: "metric" | "imperial";
  projectMetadata: PlannerProjectMetadata | null;
};

interface WorkspaceState extends WorkspacePersisted {
  plannerStep: PlannerStep;
  pendingBootstrapLayout: SuggestedLayoutJson | null;
  setPlannerStep: (step: PlannerStep) => void;
  toggleLayer: (category: PlannerLayerCategory) => void;
  setLayerVisible: (category: PlannerLayerCategory, visible: boolean) => void;
  setUnitSystem: (unit: "metric" | "imperial") => void;
  setProjectMetadata: (metadata: PlannerProjectMetadata | null) => void;
  setPendingBootstrapLayout: (layout: SuggestedLayoutJson | null) => void;
}

export function serializeWorkspaceState(): WorkspacePersisted {
  const s = usePlannerWorkspaceStore.getState();
  return {
    layerVisible: { ...s.layerVisible },
    unitSystem: s.unitSystem,
    projectMetadata: s.projectMetadata ? { ...s.projectMetadata } : null,
  };
}

export function hydrateWorkspaceState(persisted: Partial<WorkspacePersisted>) {
  usePlannerWorkspaceStore.setState((s) => ({
    layerVisible: persisted.layerVisible ? { ...DEFAULT_LAYERS, ...persisted.layerVisible } : s.layerVisible,
    unitSystem: persisted.unitSystem ?? s.unitSystem,
    projectMetadata: persisted.projectMetadata ?? s.projectMetadata,
  }));
}

export { DEFAULT_LAYERS };

const DEFAULT_LAYERS: Record<PlannerLayerCategory, boolean> = {
  walls: true,
  rooms: true,
  zones: true,
  furniture: true,
  measurements: true,
};

export const usePlannerWorkspaceStore = create<WorkspaceState>((set) => ({
  layerVisible: { ...DEFAULT_LAYERS },
  unitSystem: "metric",
  projectMetadata: null,
  plannerStep: "draw",
  pendingBootstrapLayout: null,
  setPlannerStep: (step) => set({ plannerStep: step }),
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
  setPendingBootstrapLayout: (layout) => set({ pendingBootstrapLayout: layout }),
}));
