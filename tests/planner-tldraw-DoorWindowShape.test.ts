import { describe, expect, it } from "vitest";

import {
  createDoorShapeProps,
  createWindowShapeProps,
  doorToSvg,
  DOOR_SHAPE_TYPE,
  WINDOW_SHAPE_TYPE,
  windowToSvg,
} from "@/features/planner/tldraw/shapes/DoorWindowShape";

describe("DoorWindowShape SVG helpers", () => {
  it("exports shape type constants", () => {
    expect(DOOR_SHAPE_TYPE).toBe("planner-door");
    expect(WINDOW_SHAPE_TYPE).toBe("planner-window");
  });

  it("doorToSvg renders single left swing", () => {
    const svg = doorToSvg(createDoorShapeProps({ swing: "left" }));
    expect(svg).toContain("<rect");
    expect(svg).toContain("<path");
  });

  it("doorToSvg renders right, double, and sliding swings", () => {
    expect(doorToSvg(createDoorShapeProps({ swing: "right" }))).toContain("stroke-dasharray");
    expect(doorToSvg(createDoorShapeProps({ swing: "double" }))).toContain("<path");
    expect(doorToSvg(createDoorShapeProps({ swing: "sliding" }))).toContain("stroke-dasharray");
  });

  it("windowToSvg renders single, double, and sliding types", () => {
    expect(windowToSvg(createWindowShapeProps({ windowType: "single" }))).toContain("surface-glass");
    expect(windowToSvg(createWindowShapeProps({ windowType: "double" }))).toContain("surface-glass");
    expect(windowToSvg(createWindowShapeProps({ windowType: "sliding" }))).toContain("stroke-dasharray");
  });

  it("createDoorShapeProps and createWindowShapeProps apply overrides", () => {
    expect(createDoorShapeProps({ widthMm: 800 }).widthMm).toBe(800);
    expect(createWindowShapeProps({ sillHeightMm: 600 }).sillHeightMm).toBe(600);
  });
});