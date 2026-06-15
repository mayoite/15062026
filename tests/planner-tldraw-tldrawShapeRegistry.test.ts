import { describe, expect, it } from "vitest";

import {
  getAllShapeTypes,
  getShapeMetadata,
  getShapeProps,
  isValidShapeType,
  SHAPE_METADATA,
  SHAPE_TYPES,
  TldrawFurnitureShapeProps,
  TldrawWallShapeProps,
} from "@/features/planner/tldraw/shapes/tldrawShapeRegistry";

describe("tldrawShapeRegistry", () => {
  it("exports all planner shape type constants", () => {
    expect(SHAPE_TYPES.WALL).toBe("planner-wall");
    expect(SHAPE_TYPES.ROOM).toBe("planner-room");
    expect(SHAPE_TYPES.FURNITURE).toBe("planner-furniture");
    expect(SHAPE_TYPES.MEASUREMENT).toBe("planner-measurement");
  });

  it("getAllShapeTypes returns every registered type", () => {
    const types = getAllShapeTypes();
    expect(types).toContain("planner-wall");
    expect(types).toContain("planner-zone");
    expect(types.length).toBe(Object.keys(SHAPE_TYPES).length);
  });

  it("isValidShapeType accepts known types and rejects unknown", () => {
    expect(isValidShapeType("planner-wall")).toBe(true);
    expect(isValidShapeType("planner-furniture")).toBe(true);
    expect(isValidShapeType("not-a-shape")).toBe(false);
  });

  it("getShapeMetadata returns props and isLine flag", () => {
    const wall = getShapeMetadata(SHAPE_TYPES.WALL);
    const room = getShapeMetadata(SHAPE_TYPES.ROOM);
    expect(wall?.isLine).toBe(true);
    expect(room?.isLine).toBe(false);
    expect(wall?.props).toBe(TldrawWallShapeProps);
  });

  it("getShapeProps returns validator map for a type", () => {
    expect(getShapeProps(SHAPE_TYPES.FURNITURE)).toBe(TldrawFurnitureShapeProps);
    expect(getShapeProps("unknown")).toBeUndefined();
  });

  it("SHAPE_METADATA covers every SHAPE_TYPES entry", () => {
    for (const type of Object.values(SHAPE_TYPES)) {
      expect(SHAPE_METADATA[type as keyof typeof SHAPE_METADATA]).toBeDefined();
    }
  });
});