import { describe, expect, it } from "vitest";

import plannerCanvasConfig from "@/config/planner-canvas.json";
import {
  PLANNER_MAX_CANVAS_MM,
  PLANNER_MAX_CANVAS_UNITS,
  canvasUnitsToMillimeters,
  clampCanvasPoint,
  clampCanvasRect,
  capMillimetersToCanvas,
  clampViewportTransform,
  isWithinCanvasBounds,
  millimetersToCanvasUnits,
} from "@/features/planner/lib/canvasBounds";

describe("canvasBounds", () => {
  it("derives limits from config/planner-canvas.json", () => {
    const expectedMm = plannerCanvasConfig.bounds.maxExtentMeters * 1000;
    const expectedUnits = expectedMm / plannerCanvasConfig.scale.mmPerCanvasUnit;
    expect(PLANNER_MAX_CANVAS_UNITS).toBe(expectedUnits);
    expect(PLANNER_MAX_CANVAS_MM).toBe(expectedMm);
    expect(millimetersToCanvasUnits(expectedMm)).toBe(expectedUnits);
    expect(canvasUnitsToMillimeters(expectedUnits)).toBe(expectedMm);
  });

  it("clamps points to the canvas extent", () => {
    expect(clampCanvasPoint({ x: -5, y: 50 })).toEqual({ x: 0, y: 50 });
    expect(clampCanvasPoint({ x: PLANNER_MAX_CANVAS_UNITS + 1, y: 1 })).toEqual({
      x: PLANNER_MAX_CANVAS_UNITS,
      y: 1,
    });
  });

  it("clamps rects inside the canvas", () => {
    const clamped = clampCanvasRect({
      left: PLANNER_MAX_CANVAS_UNITS - 50,
      top: 10,
      width: 100,
      height: 80,
    });
    expect(clamped.left).toBe(PLANNER_MAX_CANVAS_UNITS - 100);
    expect(isWithinCanvasBounds(clamped)).toBe(true);
  });

  it("caps millimeters with configured minimum floor", () => {
    expect(capMillimetersToCanvas(500)).toBe(plannerCanvasConfig.bounds.minRoomDimensionMm);
    expect(capMillimetersToCanvas(PLANNER_MAX_CANVAS_MM + 1)).toBe(PLANNER_MAX_CANVAS_MM);
    expect(capMillimetersToCanvas(5000)).toBe(5000);
  });

  it("clamps viewport pan inside the world extent", () => {
    const max = PLANNER_MAX_CANVAS_UNITS;
    const zoom = 0.5;
    const farPan = { translateX: -max * zoom, translateY: -max * zoom };
    const clamped = clampViewportTransform(800, 600, zoom, farPan.translateX, farPan.translateY, 0);
    expect(clamped.translateX).toBeGreaterThan(farPan.translateX);
    expect(clamped.translateY).toBeGreaterThan(farPan.translateY);
    const farRight = clampViewportTransform(800, 600, zoom, max * zoom, 0, 0);
    expect(farRight.translateX).toBeLessThan(max * zoom);
    expect(farRight.translateX).toBeGreaterThanOrEqual(800 - max * zoom);
  });
});
