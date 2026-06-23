import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getPlannerFabricRuntime,
  getPlannerFabricRuntimeState,
  createPlannerFabricRuntimeCleanup,
  setPlannerFabricRuntime,
  setPlannerFabricRuntimeState,
  subscribePlannerFabricRuntimeState,
} from "@/features/planner/canvas-fabric/plannerRuntime";

const DEFAULT_LAYERS = {
  underlay: true,
  walls: true,
  rooms: true,
  zones: true,
  furniture: true,
  measurements: true,
};

function resetRuntime() {
  setPlannerFabricRuntime(null);
  setPlannerFabricRuntimeState({
    serializedDraft: null,
    selections: [],
    layerVisible: { ...DEFAULT_LAYERS },
  });
}

describe("plannerRuntime", () => {
  afterEach(() => {
    resetRuntime();
  });

  it("returns default state before any patch", () => {
    resetRuntime();
    expect(getPlannerFabricRuntimeState()).toEqual({
      serializedDraft: null,
      selections: [],
      layerVisible: { ...DEFAULT_LAYERS },
    });
    expect(getPlannerFabricRuntime()).toBe(null);
  });

  it("stores and retrieves the runtime", () => {
    const runtime = {
      exportDraft: () => null,
      importDraft: vi.fn(),
      exportSvg: () => null,
      exportPngBlob: vi.fn(),
      placeCatalogItem: vi.fn(),
      insertObject: vi.fn(),
      setLayerVisibility: vi.fn(),
      editRoom: vi.fn(),
      endEditRoom: vi.fn(),
    };
    setPlannerFabricRuntime(runtime);
    expect(getPlannerFabricRuntime()).toBe(runtime);
    setPlannerFabricRuntime(null);
    expect(getPlannerFabricRuntime()).toBe(null);
  });

  it("keeps a newer runtime when an older generation cleanup runs", () => {
    const runtime1 = {
      exportDraft: () => null,
      importDraft: vi.fn(),
      exportSvg: () => null,
      exportPngBlob: vi.fn(),
      placeCatalogItem: vi.fn(),
      insertObject: vi.fn(),
      setLayerVisibility: vi.fn(),
      editRoom: vi.fn(),
      endEditRoom: vi.fn(),
    };
    const runtime2 = {
      exportDraft: () => null,
      importDraft: vi.fn(),
      exportSvg: () => null,
      exportPngBlob: vi.fn(),
      placeCatalogItem: vi.fn(),
      insertObject: vi.fn(),
      setLayerVisibility: vi.fn(),
      editRoom: vi.fn(),
      endEditRoom: vi.fn(),
    };

    setPlannerFabricRuntime(runtime1);
    const cleanup1 = createPlannerFabricRuntimeCleanup();
    setPlannerFabricRuntime(runtime2);
    cleanup1();

    expect(getPlannerFabricRuntime()).toBe(runtime2);
  });

  it("patches state while copying layerVisible and selections defensively", () => {
    const inputLayers = { ...DEFAULT_LAYERS, walls: false };
    const inputSelections = [{ id: "a" }];
    setPlannerFabricRuntimeState({
      serializedDraft: "draft-1",
      selections: inputSelections,
      layerVisible: inputLayers,
    });

    const state = getPlannerFabricRuntimeState();
    expect(state.serializedDraft).toBe("draft-1");
    expect(state.selections).toEqual(inputSelections);
    expect(state.layerVisible).toEqual(inputLayers);

    // Mutating the input arrays/objects after the call should not affect state.
    inputSelections.push({ id: "b" });
    inputLayers.walls = true;
    expect(state.selections).toHaveLength(1);
    expect(state.layerVisible.walls).toBe(false);
  });

  it("preserves existing layerVisible/selections when patch omits them", () => {
    setPlannerFabricRuntimeState({
      serializedDraft: "draft-1",
      selections: [{ id: "a" }],
      layerVisible: { ...DEFAULT_LAYERS, furniture: false },
    });
    setPlannerFabricRuntimeState({ serializedDraft: "draft-2" });
    const state = getPlannerFabricRuntimeState();
    expect(state.serializedDraft).toBe("draft-2");
    expect(state.selections).toEqual([{ id: "a" }]);
    expect(state.layerVisible.furniture).toBe(false);
  });

  it("notifies subscribers on state changes and unsubscribes correctly", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePlannerFabricRuntimeState(listener);
    setPlannerFabricRuntimeState({ serializedDraft: "x" });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    setPlannerFabricRuntimeState({ serializedDraft: "y" });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

