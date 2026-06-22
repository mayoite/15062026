import { describe, expect, it } from "vitest";

import { countShapesByLayer } from "@/features/planner/editor/LayerVisibilityPanel";

describe("countShapesByLayer", () => {
  it("returns zero counts for an empty canvas", () => {
    const counts = countShapesByLayer([]);
    expect(counts).toEqual({
      walls: 0,
      rooms: 0,
      zones: 0,
      furniture: 0,
      measurements: 0,
    });
  });

  it("groups doors and windows into the walls layer", () => {
    const counts = countShapesByLayer([
      { type: "planner-wall" },
      { type: "planner-wall" },
      { type: "planner-door" },
      { type: "planner-window" },
    ]);
    expect(counts.walls).toBe(4);
  });

  it("counts mixed shape types per category", () => {
    const counts = countShapesByLayer([
      { type: "planner-furniture" },
      { type: "planner-furniture" },
      { type: "planner-furniture" },
      { type: "planner-room" },
      { type: "planner-zone" },
      { type: "planner-measurement" },
    ]);
    expect(counts.furniture).toBe(3);
    expect(counts.rooms).toBe(1);
    expect(counts.zones).toBe(1);
    expect(counts.measurements).toBe(1);
  });

  it("ignores unknown shape types", () => {
    const counts = countShapesByLayer([
      { type: "geo" },
      { type: "arrow" },
      { type: "planner-furniture" },
    ]);
    expect(counts.furniture).toBe(1);
    expect(counts.walls).toBe(0);
  });
});

