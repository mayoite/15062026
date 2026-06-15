import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clampBlueprintOpacity,
  clampBlueprintScale,
  formatBlueprintScalePercent,
  nudgeBlueprintOffset,
  stepBlueprintOpacity,
} from "@/features/planner/editor/blueprintTransform";
import { moveBlueprintFromPageDelta, getBlueprintScreenFrame } from "@/features/planner/editor/blueprintCanvasTransform";
import { getBlueprintTraceGuide } from "@/features/planner/editor/blueprintTraceGuide";
import {
  BLUEPRINT_MAX_BYTES,
  getBlueprintImportKind,
  validateBlueprintImportFile,
} from "@/features/planner/editor/blueprintImport";
import { clampBlueprintPdfPage } from "@/features/planner/editor/blueprintPdfSession";
import {
  DEFAULT_LAYER_MANAGER_UI_STATE,
  loadLayerManagerUiStateFromStorage,
  normalizeLayerManagerUiState,
} from "@/features/planner/editor/layerManagerUiState";
import {
  applyLayerVisibility,
  isShapeLayerHidden,
  nextLayerVisibilityUpdate,
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
  getCalibrationScaleFromBlueprint,
  getPageMetrics,
} from "@/features/planner/editor/planMetrics";
import {
  configurePlannerCamera,
  fitPlannerContent,
  setDefaultPlannerCamera,
} from "@/features/planner/editor/plannerCamera";
import {
  confirmResetPlannerCanvas,
  resetPlannerCanvas,
} from "@/features/planner/editor/resetPlannerCanvas";
import { createPlannerEditorMock, makeShape } from "./planner-editor-mockEditor";

describe("blueprint pure helpers", () => {
  it("clamps scale and opacity", () => {
    expect(clampBlueprintScale(10)).toBe(4);
    expect(clampBlueprintScale(0)).toBe(0.25);
    expect(clampBlueprintScale(Number.NaN)).toBe(1);
    expect(clampBlueprintOpacity(2)).toBe(1);
    expect(clampBlueprintOpacity(0)).toBe(0.1);
    expect(clampBlueprintOpacity(Number.NaN)).toBe(0.45);
  });

  it("formats scale percent and steps opacity", () => {
    expect(formatBlueprintScalePercent(0.5)).toBe("50%");
    expect(stepBlueprintOpacity(0.5, "up")).toBe(0.6);
    expect(stepBlueprintOpacity(0.15, "down")).toBe(0.1);
  });

  it("nudges blueprint offset in each direction", () => {
    const origin = { x: 100, y: 200 };
    expect(nudgeBlueprintOffset(origin, "left")).toEqual({ x: 50, y: 200 });
    expect(nudgeBlueprintOffset(origin, "right")).toEqual({ x: 150, y: 200 });
    expect(nudgeBlueprintOffset(origin, "up")).toEqual({ x: 100, y: 150 });
    expect(nudgeBlueprintOffset(origin, "down")).toEqual({ x: 100, y: 250 });
  });

  it("moves blueprint from page delta and computes screen frame", () => {
    expect(moveBlueprintFromPageDelta({ x: 10, y: 20 }, { x: 5, y: -3 })).toEqual({
      x: 15,
      y: 17,
    });
    expect(
      getBlueprintScreenFrame({
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
    expect(getBlueprintTraceGuide("wall", true).title).toContain("Trace wall");
    expect(getBlueprintTraceGuide("wall", false).title).toContain("calibrating");
    expect(getBlueprintTraceGuide("room", true).title).toContain("Block the room");
    expect(getBlueprintTraceGuide("room", false).tip).toContain("quick room shell");
  });

  it("validates blueprint import files", () => {
    expect(getBlueprintImportKind({ type: "image/png" })).toBe("image");
    expect(getBlueprintImportKind({ type: "application/pdf" })).toBe("pdf");
    expect(getBlueprintImportKind({ type: "text/plain" })).toBe("unsupported");
    expect(validateBlueprintImportFile(null)).toEqual({ ok: false, reason: "missing" });
    expect(
      validateBlueprintImportFile({ type: "image/png", size: BLUEPRINT_MAX_BYTES + 1 }),
    ).toEqual({ ok: false, reason: "too-large" });
    expect(validateBlueprintImportFile({ type: "text/plain", size: 10 })).toEqual({
      ok: false,
      reason: "unsupported",
    });
    expect(validateBlueprintImportFile({ type: "image/jpeg", size: 100 })).toEqual({
      ok: true,
      kind: "image",
    });
  });

  it("clamps blueprint pdf page numbers", () => {
    expect(clampBlueprintPdfPage(0, 5)).toBe(1);
    expect(clampBlueprintPdfPage(3.4, 5)).toBe(3);
    expect(clampBlueprintPdfPage(9, 5)).toBe(5);
    expect(clampBlueprintPdfPage(2, 0)).toBe(1);
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
  it("detects hidden shapes and computes next visibility update", () => {
    expect(isShapeLayerHidden({ type: "planner-wall", meta: { layerHidden: true } })).toBe(true);
    expect(isShapeLayerHidden({ type: "planner-wall" })).toBe(false);

    expect(nextLayerVisibilityUpdate({ isLocked: false, meta: {} }, false)).toEqual({
      isLocked: true,
      meta: { layerHidden: true, layerWasLocked: false },
    });
    expect(
      nextLayerVisibilityUpdate(
        { isLocked: true, meta: { layerHidden: true, layerWasLocked: false } },
        true,
      ),
    ).toEqual({
      isLocked: false,
      meta: { layerHidden: false },
    });
    expect(
      nextLayerVisibilityUpdate(
        { isLocked: false, meta: { layerWasLocked: true, note: "keep" } },
        false,
      ),
    ).toEqual({
      isLocked: true,
      meta: { layerHidden: true, layerWasLocked: true, note: "keep" },
    });
  });

  it("applies layer visibility to mapped shape types", () => {
    const editor = createPlannerEditorMock({
      shapes: [
        makeShape("shape:1", "planner-wall"),
        makeShape("shape:2", "planner-furniture"),
        makeShape("shape:3", "planner-text"),
      ],
    });

    applyLayerVisibility(editor, {
      walls: false,
      rooms: true,
      zones: true,
      furniture: true,
      measurements: true,
      underlay: true,
    });

    expect(editor.run).toHaveBeenCalled();
    expect(editor.updateShape).toHaveBeenCalledWith(
      expect.objectContaining({ id: "shape:1", isLocked: true }),
    );
    expect(editor.updateShape).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: "shape:3" }),
    );
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
    const editor = createPlannerEditorMock({
      shapes: [
        makeShape("m1", "planner-measurement", {}, { meta: {} }),
        makeShape("m2", "line", {}, { meta: {} }),
        makeShape("hidden", "planner-measurement", {}, { meta: { layerHidden: true } }),
      ],
    });
    expect(countMeasurementShapes(null)).toBe(0);
    expect(countMeasurementShapes(editor)).toBe(2);

    const gates = evaluatePlannerStepGates(editor, metrics);
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
      catalog: true,
      measure: true,
      review: true,
    });
    expect(getPlannerStepHint("room", emptyGates)).toContain("Draw walls");
    const fullGates = evaluatePlannerStepGates(null, metrics);
    expect(getPlannerStepHint("room", fullGates)).toContain("Space shell is set");
    expect(getPlannerStepHint("catalog", fullGates)).toContain("Catalog items placed");
    expect(getPlannerStepHint("measure", fullGates)).toContain("Measurements captured");
    expect(getPlannerStepHint("review", fullGates)).toContain("Plan is ready");
    expect(getPlannerStepHint("catalog", emptyGates)).toContain("Drag workstations");
    expect(getPlannerStepHint("measure", emptyGates)).toContain("Use the measure tool");
    expect(getPlannerStepHint("review", emptyGates)).toContain("Add space shell");
    expect(getPlannerStepHint("catalog", evaluatePlannerStepGates(null, metrics))).toContain(
      "Catalog items placed",
    );
    expect(getPlannerStepActionLabel("review")).toBe("Open Export");
    expect(canAdvancePlannerStep("room", emptyGates)).toBe(false);
    expect(canAdvancePlannerStep("review", evaluatePlannerStepGates(null, metrics))).toBe(true);
    expect(nextPlannerStep("review")).toBeNull();
    expect(nextPlannerStep("room")).toBe("catalog");
    expect(PLANNER_STEPS).toHaveLength(4);
  });

  it("maps steps to tool bindings and left tabs", () => {
    expect(getStepToolBinding("room").plannerTool).toBe("wall");
    expect(getStepToolBinding("catalog").toolId).toBe("planner-furniture");
    expect(getStepToolBinding("measure").plannerTool).toBe("measure");
    expect(getStepToolBinding("review").toolId).toBe("select");
    expect(getStepLeftTab("room")).toBe("blueprint");
    expect(getStepLeftTab("catalog")).toBe("library");
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

describe("plan metrics and camera", () => {
  it("computes plan metrics from shapes", () => {
    const shapes = [
      makeShape("r1", "planner-room", { widthMm: 100, heightMm: 80 }),
      makeShape("z1", "planner-zone", { areaSqm: 5 }),
      makeShape("w1", "planner-wall"),
      makeShape("f1", "planner-furniture"),
      makeShape("hidden", "planner-furniture", {}, { meta: { layerHidden: true } }),
    ];
    const metrics = computePlanMetrics(shapes, 2);
    expect(metrics.shapeCount).toBe(4);
    expect(metrics.wallCount).toBe(1);
    expect(metrics.furnitureCount).toBe(1);
    expect(metrics.roomAreaSqm).toBeGreaterThan(0);
    expect(metrics.zoneAreaSqm).toBe(20);
    expect(metrics.calibrated).toBe(true);
  });

  it("returns empty metrics without editor", () => {
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

  it("reads calibration scale from blueprint mmPerUnit", () => {
    expect(getCalibrationScaleFromBlueprint(20)).toBe(2);
    expect(getCalibrationScaleFromBlueprint(null)).toBe(1);
  });

  it("configures planner camera with fallbacks", () => {
    const editor = createPlannerEditorMock();
    configurePlannerCamera(editor);
    setDefaultPlannerCamera(editor);
    expect(editor.zoomToBounds).toHaveBeenCalled();

    const failing = createPlannerEditorMock();
    failing.zoomToBounds = vi.fn(() => {
      throw new Error("unsupported");
    });
    setDefaultPlannerCamera(failing);
    expect(failing.setCamera).toHaveBeenCalled();

    const empty = createPlannerEditorMock({ shapes: [] });
    fitPlannerContent(empty);
    expect(empty.zoomToBounds).toHaveBeenCalled();

    const filled = createPlannerEditorMock({
      shapes: [makeShape("shape:1", "planner-wall")],
    });
    fitPlannerContent(filled);
    expect(filled.zoomToFit).toHaveBeenCalled();
  });
});

describe("reset planner canvas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clears shapes and resets camera/history", () => {
    const editor = createPlannerEditorMock({
      shapes: [makeShape("shape:1", "planner-wall"), makeShape("shape:2", "planner-room")],
    });
    resetPlannerCanvas(editor);
    expect(editor.deleteShapes).toHaveBeenCalledWith(["shape:1", "shape:2"]);
    expect(editor.selectNone).toHaveBeenCalled();
    expect(editor.clearHistory).toHaveBeenCalled();
  });

  it("confirms before clearing populated canvas", () => {
    const confirm = vi.fn();
    vi.stubGlobal("confirm", confirm);

    const editor = createPlannerEditorMock({
      shapes: [makeShape("shape:1", "planner-wall")],
    });
    confirm.mockReturnValue(false);
    expect(confirmResetPlannerCanvas(editor)).toBe(false);
    expect(editor.deleteShapes).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    expect(confirmResetPlannerCanvas(editor)).toBe(true);
    expect(editor.deleteShapes).toHaveBeenCalled();

    const empty = createPlannerEditorMock({ shapes: [] });
    expect(confirmResetPlannerCanvas(empty)).toBe(false);
    vi.unstubAllGlobals();
  });
});