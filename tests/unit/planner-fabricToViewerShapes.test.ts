import { describe, expect, it } from "vitest";

import { fabricSerializedToViewerShapes } from "@/features/planner/canvas-fabric/fabricToViewerShapes";

describe("fabricSerializedToViewerShapes", () => {
  it("maps Fabric structural and placed objects into viewer shapes", () => {
    const shapes = fabricSerializedToViewerShapes(
      JSON.stringify({
        objects: [
          { name: "WALL:North", type: "line", x1: 110, y1: 20, x2: 10, y2: 20 },
          { name: "DOOR:Entry", left: 5, top: 6, width: 20, height: 4, angle: 90 },
          { name: "WINDOW:North", left: 8, top: 9, width: 30, height: 5 },
          { name: "ROOM:Focus", left: 0, top: 0, width: 400, height: 300, scaleX: 1.5, scaleY: 2 },
          { name: "ZONE:Collab", left: 2, top: 3, width: 40, height: 50 },
          { name: "GENERIC:Desk", left: 11, top: 12, width: 60, height: 30, scaleX: 2, scaleY: 0.5, angle: 15 },
          { name: "GROUP", left: 0, top: 0, width: 10, height: 10 },
        ],
      }),
    );

    expect(shapes).toHaveLength(6);
    expect(shapes[0]).toEqual({
      id: "fabric-wall-0",
      type: "planner-wall",
      x: 10,
      y: 20,
      rotation: 0,
      width: 100,
      height: 4,
      wall: {
        startX: 110,
        startY: 20,
        endX: 10,
        endY: 20,
        thickness: 4,
      },
    });
    expect(shapes[1]).toMatchObject({
      id: "fabric-1-DOOR:Entry",
      type: "planner-door",
      x: 5,
      y: 6,
      rotation: 90,
      width: 20,
      height: 4,
      label: "Entry",
    });
    expect(shapes[2]).toMatchObject({
      type: "planner-window",
      label: "North",
    });
    expect(shapes[3]).toMatchObject({
      type: "planner-room",
      width: 600,
      height: 600,
      label: "Focus",
    });
    expect(shapes[4]).toMatchObject({
      type: "planner-zone",
      label: "Collab",
    });
    expect(shapes[5]).toMatchObject({
      type: "planner-furniture",
      x: 11,
      y: 12,
      rotation: 15,
      width: 120,
      height: 15,
      label: "Desk",
    });
  });

  it("returns an empty viewer scene for malformed Fabric payloads", () => {
    expect(fabricSerializedToViewerShapes("{not-json")).toEqual([]);
    expect(fabricSerializedToViewerShapes(null)).toEqual([]);
  });
});

