import { describe, expect, it } from "vitest";

import {
  canvasUnitsToMillimeters,
  millimetersToCanvasUnits,
} from "@/features/planner/lib/calibrationScale";

describe("planner calibration scale", () => {
  it("converts between canvas units and millimeters", () => {
    expect(canvasUnitsToMillimeters(120)).toBe(1200);
    expect(millimetersToCanvasUnits(1200)).toBe(120);
  });
});

