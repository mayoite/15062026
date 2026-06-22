import { describe, expect, it } from "vitest";

import { fabricSerializedToViewerShapes } from "@/features/planner/canvas-fabric/fabricToViewerShapes";

describe("fabricSerializedToViewerShapes", () => {
  it("returns empty array for null or empty input", () => {
    expect(fabricSerializedToViewerShapes(null)).toEqual([]);
    expect(fabricSerializedToViewerShapes("")).toEqual([]);
  });

  it("returns empty array for invalid JSON", () => {
    expect(fabricSerializedToViewerShapes("{not-json")).toEqual([]);
  });

  it("skips objects with no name or GROUP name", () => {
    const serialized = JSON.stringify({
      objects: [
        { type: "rect", name: "", left: 10, top: 10, width: 50, height: 30 },
        { type: "group", name: "GROUP", left: 10, top: 10, width: 50, height: 30 },
      ],
    });
    expect(fabricSerializedToViewerShapes(serialized)).toEqual([]);
  });

  it("maps WALL line objects to planner-wall shapes with wall coords", () => {
    const serialized = JSON.stringify({
      objects: [
        {
          type: "line",
          name: "WALL:0",
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 0,
          left: 0,
          top: 0,
        },
      ],
    });
    const shapes = fabricSerializedToViewerShapes(serialized);
    expect(shapes).toHaveLength(1);
    expect(shapes[0]).toMatchObject({
      id: "fabric-wall-0",
      type: "planner-wall",
      x: 0,
      y: 0,
      width: 100,
      height: 4,
      wall: { startX: 0, startY: 0, endX: 100, endY: 0, thickness: 4 },
    });
  });

  it("falls back to left/top when wall line lacks x1/y1", () => {
    const serialized = JSON.stringify({
      objects: [
        { type: "line", name: "WALL:1", left: 20, top: 30, x2: 60, y2: 30 },
      ],
    });
    const shapes = fabricSerializedToViewerShapes(serialized);
    expect(shapes[0]).toMatchObject({
      x: 20,
      y: 30,
      wall: { startX: 20, startY: 30, endX: 60, endY: 30 },
    });
  });

    it("maps furniture-like names to the right shape type and applies scale", () => {
      // mapFurnitureType checks DOOR/WINDOW/ROOM/ZONE case-sensitively.
      const serialized = JSON.stringify({
        objects: [
          { type: "group", name: "DOOR:front", left: 5, top: 6, width: 10, height: 20, scaleX: 2, scaleY: 1, angle: 90 },
          { type: "group", name: "WINDOW:left", left: 1, top: 2, width: 8, height: 8 },
          { type: "group", name: "ROOM:main", left: 0, top: 0, width: 100, height: 80 },
          { type: "group", name: "DRAW:ZONE-A", left: 0, top: 0, width: 40, height: 30 },
          { type: "group", name: "GENERIC:Desk", left: 2, top: 3, width: 0, height: 0 },
        ],
      });
      const shapes = fabricSerializedToViewerShapes(serialized);
      expect(shapes.map((s) => s.type)).toEqual([
        "planner-door",
        "planner-window",
        "planner-room",
        "planner-zone",
        "planner-furniture",
      ]);
      // lowercase 'zone' falls through to the default furniture type.
      const lowerZone = fabricSerializedToViewerShapes(
        JSON.stringify({ objects: [{ type: "group", name: "DRAW:zone-a", width: 1, height: 1 }] }),
      );
      expect(lowerZone[0]?.type).toBe("planner-furniture");
      // scaled width = max(1, 10 * 2) = 20
      expect(shapes[0]?.width).toBe(20);
      expect(shapes[0]?.rotation).toBe(90);
      // zero width/height floor to 1
      expect(shapes[4]?.width).toBe(1);
      expect(shapes[4]?.height).toBe(1);
    });

  it("derives the label from the part after the first colon", () => {
    const serialized = JSON.stringify({
      objects: [
        { type: "group", name: "GENERIC:My:Deep:Label", left: 0, top: 0, width: 10, height: 10 },
      ],
    });
    const shapes = fabricSerializedToViewerShapes(serialized);
    expect(shapes[0]?.label).toBe("My:Deep:Label");
  });

  it("uses the full name as label when there is no colon", () => {
    const serialized = JSON.stringify({
      objects: [{ type: "group", name: "STANDALONE", left: 0, top: 0, width: 10, height: 10 }],
    });
    const shapes = fabricSerializedToViewerShapes(serialized);
    expect(shapes[0]?.label).toBe("STANDALONE");
  });
});

