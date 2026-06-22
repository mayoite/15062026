import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_LAYER_MANAGER_UI_STATE,
  loadLayerManagerUiStateFromStorage,
  normalizeLayerManagerUiState,
} from "@/features/planner/editor/layerManagerUiState";
import { applyLayerVisibility, isShapeLayerHidden } from "@/features/planner/editor/layerVisibility";
import {
  canAdvancePlannerStep,
  countMeasurementShapes,
  evaluatePlannerStepGates,
  getPlannerStepActionLabel,
  getPlannerStepHint,
  nextPlannerStep,
} from "@/features/planner/editor/plannerStep";
import { computePlanMetrics } from "@/features/planner/editor/planMetrics";
import { getStepLeftTab, getStepToolBinding } from "@/features/planner/editor/plannerStepBindings";
import { resetFabricRuntimeState, seedFabricRuntime } from "../integration/planner-fabric-mockRuntime";

describe("layer manager ui state", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("normalizes invalid persisted state", () => {
    expect(normalizeLayerManagerUiState(null)).toEqual(DEFAULT_LAYER_MANAGER_UI_STATE);
    expect(loadLayerManagerUiStateFromStorage()).toEqual(DEFAULT_LAYER_MANAGER_UI_STATE);
  });
});

describe("layer visibility", () => {
  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("delegates visibility to the Fabric runtime bridge", () => {
    const { setLayerVisibility } = seedFabricRuntime();
    applyLayerVisibility(null, {
      walls: false,
      rooms: true,
      zones: true,
      furniture: true,
      measurements: true,
    });
    expect(setLayerVisibility).toHaveBeenCalled();
    expect(isShapeLayerHidden({ type: "planner-wall", meta: { layerHidden: true } })).toBe(false);
  });
});

describe("planner step workflow", () => {
  it("counts measurement shapes and evaluates gates", () => {
    expect(countMeasurementShapes()).toBe(0);
    const gates = evaluatePlannerStepGates(null, {
      shapeCount: 3,
      roomAreaSqm: 12,
      zoneAreaSqm: 0,
      totalFloorAreaSqm: 12,
      wallCount: 2,
      furnitureCount: 1,
      calibrated: false,
    });
    expect(gates.hasSpaceShell).toBe(true);
    expect(gates.hasFurniture).toBe(true);
    expect(gates.canOpenExport).toBe(true);
    expect(getPlannerStepHint("review", gates)).toContain("ready");
    expect(getPlannerStepActionLabel("review")).toBe("Open Export");
    expect(canAdvancePlannerStep("review", gates)).toBe(true);
    expect(nextPlannerStep("draw")).toBe("place");
    expect(getStepToolBinding("draw").plannerTool).toBe("wall");
    expect(getStepLeftTab("place")).toBe("library");
  });
});

describe("plan metrics", () => {
  it("computes plan metrics from Fabric objects", () => {
    const result = computePlanMetrics([
      { name: "CORNER", left: 0, top: 0, width: 4, height: 4 },
      { name: "CORNER", left: 100, top: 0, width: 4, height: 4 },
      { name: "CORNER", left: 100, top: 80, width: 4, height: 4 },
      { name: "WALL:1", left: 0, top: 0, width: 100, height: 4 },
      { name: "GENERIC:desk", left: 10, top: 10, width: 60, height: 40 },
      { name: "DRAW:rectangle", left: 0, top: 0, width: 50, height: 30 },
    ], 2);
    expect(result.shapeCount).toBe(6);
    expect(result.wallCount).toBe(1);
    expect(result.furnitureCount).toBe(1);
  });
});

