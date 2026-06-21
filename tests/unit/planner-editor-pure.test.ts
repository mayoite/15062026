import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
import {
import {
  DEFAULT_LAYER_MANAGER_UI_STATE,
  loadLayerManagerUiStateFromStorage,
  normalizeLayerManagerUiState,
} from "@/features/planner/editor/layerManagerUiState";
import {
  applyLayerVisibility,
  isShapeLayerHidden,
} from "@/features/planner/editor/layerVisibility";
import {
  canAdvancePlannerStep,
  countMeasurementShapes,
  evaluatePlannerStepGates,
  getDisabledPlannerSteps,
  getPlannerStepActionLabel,
  getPlannerStepHint,
  nextPlannerStep,
  PLANNER_STEPS,
} from "@/features/planner/editor/plannerStep";
import { getStepLeftTab, getStepToolBinding } from "@/features/planner/editor/plannerStepBindings";
import {
  PLANNER_TOOL_KEY_BINDINGS,
  resolvePlannerToolKey,
} from "@/features/planner/editor/plannerKeyboardShortcuts";
import {
  computePlanMetrics,
  getPageMetrics,
} from "@/features/planner/editor/planMetrics";
import {
  confirmResetPlannerCanvas,
} from "@/features/planner/editor/resetPlannerCanvas";
import { resetFabricRuntimeState, seedFabricRuntime } from "../integration/planner-fabric-mockRuntime";

  it("clamps scale and opacity", () => {
  });

  it("formats scale percent and steps opacity", () => {
  });

    const origin = { x: 100, y: 200 };
  });

      x: 15,
      y: 17,
    });
    expect(
        pageTopLeft: { x: 40, y: 60 },
        widthPx: 200,
        heightPx: 100,
        scale: 2,
      }),
    ).toEqual({
      left: 40,
      top: 60,
      width: 400,
      height: 200,
      centerX: 240,
      centerY: 160,
    });
  });

  it("returns trace guide copy for wall and room tools", () => {
  });

    expect(
    ).toEqual({ ok: false, reason: "too-large" });
      ok: false,
      reason: "unsupported",
    });
      ok: true,
      kind: "image",
    });
  });

  });
});

describe("layer manager ui state", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("normalizes invalid persisted state", () => {
    expect(normalizeLayerManagerUiState(null)).toEqual(DEFAULT_LAYER_MANAGER_UI_STATE);
    expect(
      normalizeLayerManagerUiState({
        activeCategory: "invalid",
        query: 42,
        collapsedGroups: { walls: true, bad: "x" },
      }),
    ).toEqual({
      activeCategory: "all",
      query: "",
      collapsedGroups: { walls: true },
    });
    expect(
      normalizeLayerManagerUiState({
        activeCategory: "wall",
        query: "desk",
        collapsedGroups: { furniture: false },
      }),
    ).toEqual({
      activeCategory: "wall",
      query: "desk",
      collapsedGroups: { furniture: false },
    });
  });

  it("loads ui state from localStorage with fallback", () => {
    expect(loadLayerManagerUiStateFromStorage()).toEqual(DEFAULT_LAYER_MANAGER_UI_STATE);
    localStorage.setItem(
      "planner.layer-manager.ui-state",
      JSON.stringify({ activeCategory: "furniture", query: "chair" }),
    );
    expect(loadLayerManagerUiStateFromStorage()).toEqual({
      activeCategory: "furniture",
      query: "chair",
      collapsedGroups: {},
    });
    localStorage.setItem("planner.layer-manager.ui-state", "{bad json");
    expect(loadLayerManagerUiStateFromStorage()).toEqual(DEFAULT_LAYER_MANAGER_UI_STATE);
  });
});

describe("layer visibility", () => {
  it("delegates visibility to the Fabric runtime bridge", () => {
    const { setLayerVisibility } = seedFabricRuntime();
    applyLayerVisibility(null, {
      walls: false,
      rooms: true,
      zones: true,
      furniture: true,
      measurements: true,
      underlay: true,
    });
    expect(setLayerVisibility).toHaveBeenCalled();
    resetFabricRuntimeState();
  });

  it("reports legacy hidden meta as visible in the Fabric bridge", () => {
    expect(isShapeLayerHidden({ type: "planner-wall", meta: { layerHidden: true } })).toBe(false);
  });
});

describe("planner step workflow", () => {
  const metrics = {
    shapeCount: 3,
    roomAreaSqm: 12,
    zoneAreaSqm: 0,
    totalFloorAreaSqm: 12,
    wallCount: 2,
    furnitureCount: 1,
    calibrated: false,
  };

  it("counts measurement shapes and evaluates gates", () => {
    expect(countMeasurementShapes()).toBe(0);

    const gates = evaluatePlannerStepGates(null, metrics);
    expect(gates.hasSpaceShell).toBe(true);
    expect(gates.hasFurniture).toBe(true);
    expect(gates.hasMeasurement).toBe(true);
    expect(gates.canOpenExport).toBe(true);
  });

  it("derives disabled steps, hints, and action labels", () => {
    const emptyGates = evaluatePlannerStepGates(null, {
      ...metrics,
      wallCount: 0,
      roomAreaSqm: 0,
      zoneAreaSqm: 0,
      furnitureCount: 0,
    });
    expect(getDisabledPlannerSteps(emptyGates)).toEqual({
    });
    expect(getPlannerStepHint("draw", emptyGates)).toContain("drawing walls and rooms");
    const fullGates = evaluatePlannerStepGates(null, metrics);
    expect(getPlannerStepHint("draw", fullGates)).toContain("Space shell is ready");
    expect(getPlannerStepHint("place", fullGates)).toContain("Furniture and openings are in place");
    expect(getPlannerStepHint("review", fullGates)).toContain("ready whenever you are");
    expect(getPlannerStepHint("place", emptyGates)).toContain("Use the library for furniture");
    expect(getPlannerStepHint("review", emptyGates)).toContain("Export unlocks once");
    expect(getPlannerStepHint("place", evaluatePlannerStepGates(null, metrics))).toContain(
      "Furniture and openings are in place",
    );
    expect(getPlannerStepActionLabel("review")).toBe("Open Export");
    expect(canAdvancePlannerStep("draw", emptyGates)).toBe(true);
    expect(canAdvancePlannerStep("review", evaluatePlannerStepGates(null, metrics))).toBe(true);
    expect(nextPlannerStep("review")).toBeNull();
    expect(nextPlannerStep("draw")).toBe("place");
    expect(PLANNER_STEPS).toHaveLength(3);
  });

  it("maps steps to tool bindings and left tabs", () => {
    expect(getStepToolBinding("draw").plannerTool).toBe("wall");
    expect(getStepToolBinding("place").toolId).toBe("planner-furniture");
    expect(getStepToolBinding("review").toolId).toBe("planner-measurement");
    expect(getStepLeftTab("place")).toBe("library");
  });
});

describe("planner keyboard shortcuts", () => {
  it("resolves tool keys and ignores inputs/modifiers", () => {
    expect(PLANNER_TOOL_KEY_BINDINGS.w.plannerTool).toBe("wall");
    const input = document.createElement("input");
    const blocked = new KeyboardEvent("keydown", { key: "w", bubbles: true });
    Object.defineProperty(blocked, "target", { value: input });
    expect(resolvePlannerToolKey(blocked)).toBeNull();

    const plain = new KeyboardEvent("keydown", { key: "w", bubbles: true });
    Object.defineProperty(plain, "target", { value: document.body });
    expect(resolvePlannerToolKey(plain)?.plannerTool).toBe("wall");

    const windowTool = new KeyboardEvent("keydown", { key: "D", shiftKey: true, bubbles: true });
    Object.defineProperty(windowTool, "target", { value: document.body });
    expect(resolvePlannerToolKey(windowTool)?.plannerTool).toBe("window");

    const shiftedWall = new KeyboardEvent("keydown", { key: "w", shiftKey: true, bubbles: true });
    Object.defineProperty(shiftedWall, "target", { value: document.body });
    expect(resolvePlannerToolKey(shiftedWall)).toBeNull();

    const ctrl = new KeyboardEvent("keydown", { key: "w", ctrlKey: true, bubbles: true });
    Object.defineProperty(ctrl, "target", { value: document.body });
    expect(resolvePlannerToolKey(ctrl)).toBeNull();
  });
});

describe("plan metrics", () => {
  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("computes plan metrics from Fabric objects", () => {
    const shapes = [
      { name: "CORNER", left: 0, top: 0, width: 4, height: 4 },
      { name: "CORNER", left: 100, top: 0, width: 4, height: 4 },
      { name: "CORNER", left: 100, top: 80, width: 4, height: 4 },
      { name: "WALL:1", left: 0, top: 0, width: 100, height: 4 },
      { name: "GENERIC:desk", left: 10, top: 10, width: 60, height: 40 },
      { name: "DRAW:rectangle", left: 0, top: 0, width: 50, height: 30 },
    ];
    const result = computePlanMetrics(shapes, 2);
    expect(result.shapeCount).toBe(6);
    expect(result.wallCount).toBe(1);
    expect(result.furnitureCount).toBe(1);
    expect(result.roomAreaSqm).toBeGreaterThan(0);
    expect(result.zoneAreaSqm).toBeGreaterThan(0);
    expect(result.calibrated).toBe(true);
  });

  it("returns empty metrics without a Fabric draft", () => {
    resetFabricRuntimeState();
    expect(getPageMetrics(null)).toEqual({
      shapeCount: 0,
      roomAreaSqm: 0,
      zoneAreaSqm: 0,
      totalFloorAreaSqm: 0,
      wallCount: 0,
      furnitureCount: 0,
      calibrated: false,
    });
  });

  });
});

describe("reset planner canvas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("confirms before clearing the canvas", () => {
    const confirm = vi.fn();
    vi.stubGlobal("confirm", confirm);

    confirm.mockReturnValue(false);
    expect(confirmResetPlannerCanvas()).toBe(false);

    confirm.mockReturnValue(true);
    expect(confirmResetPlannerCanvas()).toBe(true);

    vi.unstubAllGlobals();
  });
});
