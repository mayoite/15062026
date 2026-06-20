import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_MM_PER_CANVAS_UNIT,
  canvasUnitsToMillimeters,
  getCalibrationScale,
  getMmPerCanvasUnit,
  millimetersToCanvasUnits,
  readCalibrationScale,
  readMmPerCanvasUnit,
} from "@/features/planner/lib/calibrationScale";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

describe("planner calibration scale", () => {
  beforeEach(() => {
    usePlannerWorkspaceStore.setState((state) => ({
      blueprint: { ...state.blueprint, mmPerUnit: null },
    }));
  });

  it("falls back to the default mm-per-unit when calibration is missing", () => {
    expect(getMmPerCanvasUnit(null)).toBe(DEFAULT_MM_PER_CANVAS_UNIT);
    expect(getMmPerCanvasUnit(0)).toBe(DEFAULT_MM_PER_CANVAS_UNIT);
    expect(getCalibrationScale(null)).toBe(1);
  });

  it("converts between canvas units and millimeters", () => {
    expect(canvasUnitsToMillimeters(120, 10)).toBe(1200);
    expect(millimetersToCanvasUnits(1200, 10)).toBe(120);
    expect(getCalibrationScale(20)).toBe(2);
  });

  it("reads live calibration from the workspace store", () => {
    usePlannerWorkspaceStore.getState().setBlueprint({ mmPerUnit: 25 });
    expect(readMmPerCanvasUnit()).toBe(25);
    expect(readCalibrationScale()).toBe(2.5);
  });
});