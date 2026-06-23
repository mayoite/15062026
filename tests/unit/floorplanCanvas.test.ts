import type { FabricObject } from "fabric";
import { describe, expect, it } from "vitest";

import {
  getBoundingRect,
  resolveLayerCategory,
} from "@/features/planner/canvas-fabric/hooks/floorplanCanvas";

function obj(top: number, left: number, name = "GENERIC:Desk") {
  return { top, left, name } as unknown as FabricObject;
}

describe("floorplanCanvas helpers", () => {
  it("maps object names to planner layer categories", () => {
    expect(resolveLayerCategory({ name: "CORNER" })).toBe("walls");
    expect(resolveLayerCategory({ name: "WALL:0" })).toBe("walls");
    expect(resolveLayerCategory({ name: "DOOR:1" })).toBe("walls");
    expect(resolveLayerCategory({ name: "WINDOW:2" })).toBe("walls");
    expect(resolveLayerCategory({ name: "DRAW:measure" })).toBe("measurements");
    expect(resolveLayerCategory({ name: "DRAW:line" })).toBe("zones");
    expect(resolveLayerCategory({ name: "GENERIC:Sofa" })).toBe("furniture");
    expect(resolveLayerCategory({ name: "TABLE:Meeting" })).toBe("furniture");
    expect(resolveLayerCategory({ name: "unknown-name" })).toBeNull();
  });

  it("returns correct bounds for objects at mixed positions", () => {
    const rect = getBoundingRect([
      obj(240, 320),
      obj(90, 180),
      obj(140, 480),
      obj(300, 260),
    ]);

    expect(rect).toEqual({
      top: 90,
      left: 180,
      right: 480,
      bottom: 300,
      center: 330,
      middle: 195,
      width: 300,
      height: 210,
    });
  });
});
