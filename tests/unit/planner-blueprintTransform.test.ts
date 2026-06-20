import { describe, expect, it } from "vitest";

import {
  clampBlueprintOpacity,
  clampBlueprintScale,
  formatBlueprintScalePercent,
  nudgeBlueprintOffset,
  stepBlueprintOpacity,
} from "@/features/planner/editor/blueprintTransform";

describe("blueprintTransform", () => {
  it("clamps blueprint scale into the supported range", () => {
    expect(clampBlueprintScale(0.1)).toBe(0.25);
    expect(clampBlueprintScale(1.5)).toBe(1.5);
    expect(clampBlueprintScale(8)).toBe(4);
  });

  it("formats the scale as a readable percentage", () => {
    expect(formatBlueprintScalePercent(1)).toBe("100%");
    expect(formatBlueprintScalePercent(0.25)).toBe("25%");
  });

  it("clamps and steps blueprint opacity safely", () => {
    expect(clampBlueprintOpacity(0.05)).toBe(0.1);
    expect(clampBlueprintOpacity(2)).toBe(1);
    expect(stepBlueprintOpacity(0.45, "up")).toBe(0.55);
    expect(stepBlueprintOpacity(0.15, "down")).toBe(0.1);
  });

  it("nudges blueprint position by direction", () => {
    expect(nudgeBlueprintOffset({ x: 0, y: 0 }, "left")).toEqual({ x: -50, y: 0 });
    expect(nudgeBlueprintOffset({ x: 10, y: 20 }, "down", 25)).toEqual({ x: 10, y: 45 });
  });
});
