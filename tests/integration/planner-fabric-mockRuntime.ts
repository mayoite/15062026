import { vi } from "vitest";

import {
  setPlannerFabricRuntime,
  setPlannerFabricRuntimeState,
  type PlannerFabricRuntime,
} from "@/features/planner/canvas-fabric";
import type { PlannerLayerCategory } from "@/features/planner/store/workspaceStore";

const DEFAULT_LAYER_VISIBLE: Record<PlannerLayerCategory, boolean> = {
  underlay: true,
  walls: true,
  rooms: true,
  zones: true,
  furniture: true,
  measurements: true,
};

export type FabricObjectFixture = {
  name?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  angle?: number;
  id?: string;
  stroke?: string;
  selectable?: boolean;
};

export function buildFabricDraft(objects: FabricObjectFixture[]): string {
  return JSON.stringify({ objects });
}

export function resetFabricRuntimeState() {
  setPlannerFabricRuntimeState({
    serializedDraft: null,
    selections: [],
    layerVisible: { ...DEFAULT_LAYER_VISIBLE },
  });
  setPlannerFabricRuntime(null);
}

export function seedFabricRuntime(options: {
  objects?: FabricObjectFixture[];
  selections?: Array<Record<string, unknown>>;
  layerVisible?: Partial<Record<PlannerLayerCategory, boolean>>;
  runtime?: Partial<PlannerFabricRuntime>;
} = {}) {
  const serializedDraft = options.objects ? buildFabricDraft(options.objects) : null;
  setPlannerFabricRuntimeState({
    serializedDraft,
    selections: options.selections ?? [],
    layerVisible: {
      ...DEFAULT_LAYER_VISIBLE,
      ...(options.layerVisible ?? {}),
    },
  });

  const insertObject = vi.fn();
  const setLayerVisibility = vi.fn();
  setPlannerFabricRuntime({
    exportDraft: () => serializedDraft,
    importDraft: vi.fn(async () => undefined),
    exportSvg: vi.fn(() => null),
    exportPngBlob: vi.fn(async () => null),
    placeCatalogItem: vi.fn(),
    insertObject,
    setLayerVisibility,
    editRoom: vi.fn(),
    endEditRoom: vi.fn(),
    clientToSceneUnits: vi.fn(() => null),
    ...options.runtime,
  });

  return { insertObject, setLayerVisibility, serializedDraft };
}
