import { describe, expect, it } from "vitest";

import {
  DEFAULT_WALL_PROPS,
  getWallThicknessCanvasUnits,
  STANDARD_WALL_THICKNESSES_MM,
} from "@/features/planner/tldraw/shapes/WallShape";

describe("WallShape", () => {
  it("DEFAULT_WALL_PROPS includes drywall defaults", () => {
    expect(DEFAULT_WALL_PROPS.material).toBe("drywall");
    expect(DEFAULT_WALL_PROPS.isLoadBearing).toBe(false);
    expect(DEFAULT_WALL_PROPS.showDimensions).toBe(true);
  });

  it("STANDARD_WALL_THICKNESSES_MM lists all materials", () => {
    expect(STANDARD_WALL_THICKNESSES_MM.drywall).toBe(100);
    expect(STANDARD_WALL_THICKNESSES_MM.glass).toBe(12);
    expect(STANDARD_WALL_THICKNESSES_MM.brick).toBe(200);
  });

  it("getWallThicknessCanvasUnits converts mm to canvas units", () => {
    const drywall = getWallThicknessCanvasUnits("drywall");
    const glass = getWallThicknessCanvasUnits("glass");
    expect(drywall).toBeGreaterThan(glass);
    expect(getWallThicknessCanvasUnits("unknown" as "drywall")).toBe(drywall);
  });
});