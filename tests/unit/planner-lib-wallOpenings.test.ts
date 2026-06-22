import { describe, expect, it } from "vitest";

import {
  computeSolidSpans,
  computeWallOpenings,
  doorPlanSize,
  findWallAttachment,
  mmToCanvasUnits,
  projectPointOntoSegment,
  rectCenterAt,
  wallLength,
  windowPlanSize,
  type OpeningCandidate,
  type WallSegmentSpec,
} from "@/features/planner/lib/geometry/wallOpenings";

const wall = (overrides: Partial<WallSegmentSpec> = {}): WallSegmentSpec => ({
  id: "wall-1",
  start: { x: 0, y: 0 },
  end: { x: 400, y: 0 },
  thickness: 10,
  ...overrides,
});

const door = (overrides: Partial<OpeningCandidate> = {}): OpeningCandidate => ({
  id: "door-1",
  kind: "door",
  center: { x: 200, y: 0 },
  width: 90,
  ...overrides,
});

describe("planner wall openings", () => {
  it("converts millimeters to canvas units", () => {
    expect(mmToCanvasUnits(900)).toBe(90);
    expect(mmToCanvasUnits(100)).toBe(10);
  });

  it("projects points onto wall segments and measures wall length", () => {
    expect(projectPointOntoSegment({ x: 200, y: 5 }, { x: 0, y: 0 }, { x: 400, y: 0 })).toMatchObject({
      t: 0.5,
      along: 200,
      distance: 5,
      point: { x: 200, y: 0 },
    });
    expect(projectPointOntoSegment({ x: 500, y: 0 }, { x: 0, y: 0 }, { x: 400, y: 0 })).toMatchObject({
      t: 1,
      along: 400,
    });
    expect(projectPointOntoSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toMatchObject({
      t: 0,
      distance: 5,
    });
    expect(wallLength(wall())).toBe(400);
  });

  it("computes door and window plan sizes", () => {
    expect(doorPlanSize({ widthMm: 900, thicknessMm: 40 })).toEqual({ width: 90, depth: 4 });
    expect(windowPlanSize({ widthMm: 1200, frameThicknessMm: 50 })).toEqual({ width: 120, depth: 10 });
    expect(windowPlanSize({ widthMm: 600, frameThicknessMm: 10 })).toEqual({ width: 60, depth: 8 });
    expect(windowPlanSize({ widthMm: 600, frameThicknessMm: 200 })).toEqual({ width: 60, depth: 14 });
    expect(windowPlanSize({ widthMm: 600 })).toEqual({ width: 60, depth: 10 });
  });

  it("finds wall attachments and centers rectangles on walls", () => {
    const walls = [
      wall(),
      wall({ id: "wall-2", start: { x: 0, y: 0 }, end: { x: 0, y: 300 } }),
    ];

    expect(findWallAttachment(walls, { x: 100, y: 4 })?.wallId).toBe("wall-1");
    expect(findWallAttachment(walls, { x: 3, y: 8 })?.wallId).toBe("wall-2");
    expect(findWallAttachment(walls, { x: 200, y: 100 })).toBeNull();
    expect(findWallAttachment(walls, { x: 2, y: 150 })?.angle).toBeCloseTo(Math.PI / 2);

    expect(rectCenterAt(10, 20, 90, 4, 0)).toEqual({ x: 55, y: 22 });
    const rotated = rectCenterAt(0, 0, 90, 4, Math.PI / 2);
    expect(rotated.x).toBeCloseTo(-2);
    expect(rotated.y).toBeCloseTo(45);
  });

  it("computes wall openings with tolerance and sorting rules", () => {
    expect(computeWallOpenings(wall(), [door()])).toHaveLength(1);
    expect(computeWallOpenings(wall(), [door({ center: { x: 200, y: 9 } })])).toHaveLength(1);
    expect(computeWallOpenings(wall(), [door({ center: { x: 200, y: 30 } })])).toHaveLength(0);
    expect(computeWallOpenings(wall(), [door({ center: { x: 395, y: 0 } })])[0]?.end).toBeCloseTo(400);
    expect(computeWallOpenings(wall(), [door({ center: { x: 444, y: 0 } })])).toHaveLength(0);
    expect(
      computeWallOpenings(wall(), [
        door({ id: "door-b", center: { x: 300, y: 0 } }),
        door({ id: "door-a", center: { x: 100, y: 0 } }),
      ]).map((opening) => opening.id),
    ).toEqual(["door-a", "door-b"]);
    expect(computeWallOpenings(wall(), [door({ width: 0 })])).toHaveLength(0);
    expect(computeWallOpenings(wall({ end: { x: 0, y: 0 } }), [door()])).toHaveLength(0);
  });

  it("computes solid spans around openings", () => {
    expect(computeSolidSpans(400, [])).toEqual([{ start: 0, end: 400 }]);
    expect(computeSolidSpans(400, [{ start: 155, end: 245 }])).toEqual([
      { start: 0, end: 155 },
      { start: 245, end: 400 },
    ]);
    expect(
      computeSolidSpans(400, [
        { start: 100, end: 200 },
        { start: 180, end: 260 },
      ]),
    ).toEqual([
      { start: 0, end: 100 },
      { start: 260, end: 400 },
    ]);
    expect(
      computeSolidSpans(400, [
        { start: 100, end: 200 },
        { start: 201, end: 300 },
      ]),
    ).toEqual([
      { start: 0, end: 100 },
      { start: 300, end: 400 },
    ]);
    expect(computeSolidSpans(400, [{ start: 0, end: 400 }])).toEqual([]);
    expect(computeSolidSpans(400, [{ start: -50, end: 100 }])).toEqual([{ start: 100, end: 400 }]);
    expect(computeSolidSpans(0, [])).toEqual([]);
  });
});
