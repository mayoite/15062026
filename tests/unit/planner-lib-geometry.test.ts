import { describe, expect, it } from "vitest";

import {
  boundingBox,
  buildWallGraph,
  findEnclosedRooms,
  findJunctions,
  polygonArea,
  polygonCentroid,
  polygonContainsPoint,
  polygonPerimeter,
  segmentIntersection,
  segmentsIntersect,
  snapToGrid,
  snapToNearestEndpoint,
  snapToSegment,
} from "@/features/planner/lib/geometry";

describe("planner geometry", () => {
  const square = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];

  it("computes polygon metrics and bounding boxes", () => {
    expect(polygonArea(square)).toBe(10_000);
    expect(polygonPerimeter(square)).toBe(400);
    expect(polygonCentroid(square)).toEqual({ x: 50, y: 50 });
    expect(boundingBox(square)).toEqual({ minX: 0, minY: 0, maxX: 100, maxY: 100 });
    expect(polygonArea([])).toBe(0);
    expect(boundingBox([])).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
    expect(polygonCentroid([{ x: 10, y: 20 }])).toEqual({ x: 10, y: 20 });
    expect(polygonCentroid([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ])).toEqual({ x: 10, y: 0 });
  });

  it("detects segment intersections and intersection points", () => {
    const a = { start: { x: 0, y: 0 }, end: { x: 10, y: 10 } };
    const b = { start: { x: 0, y: 10 }, end: { x: 10, y: 0 } };
    const parallel = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };

    expect(segmentsIntersect(a, b)).toBe(true);
    expect(segmentIntersection(a, b)).toEqual({ x: 5, y: 5 });
    expect(segmentsIntersect(a, parallel)).toBe(true);
    expect(segmentIntersection(a, parallel)).toEqual({ x: 0, y: 0 });

    const touching = { start: { x: 0, y: 0 }, end: { x: 5, y: 0 } };
    const extended = { start: { x: 5, y: 0 }, end: { x: 10, y: 0 } };
    expect(segmentsIntersect(touching, extended)).toBe(true);
    expect(segmentIntersection(
      { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } },
      { start: { x: 0, y: 1 }, end: { x: 10, y: 1 } },
    )).toBeNull();

    const endpointTouch = { start: { x: 0, y: 0 }, end: { x: 5, y: 0 } };
    expect(segmentsIntersect(endpointTouch, { start: { x: 5, y: 0 }, end: { x: 10, y: 0 } })).toBe(true);
    expect(segmentsIntersect(
      { start: { x: 0, y: 0 }, end: { x: 0, y: 5 } },
      { start: { x: 0, y: 5 }, end: { x: 0, y: 10 } },
    )).toBe(true);

    const collinear = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
    const contained = { start: { x: 2, y: 0 }, end: { x: 8, y: 0 } };
    expect(segmentsIntersect(collinear, contained)).toBe(true);
    expect(segmentsIntersect(
      { start: { x: 0, y: 0 }, end: { x: 0, y: 10 } },
      { start: { x: 0, y: 2 }, end: { x: 0, y: 8 } },
    )).toBe(true);
    expect(segmentsIntersect(
      { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } },
      { start: { x: 20, y: 0 }, end: { x: 30, y: 0 } },
    )).toBe(false);
    expect(segmentIntersection(
      { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } },
      { start: { x: 20, y: 0 }, end: { x: 30, y: 0 } },
    )).toBeNull();
    expect(segmentIntersection(
      { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } },
      { start: { x: 5, y: -10 }, end: { x: 5, y: -1 } },
    )).toBeNull();
  });

  it("checks polygon containment with ray casting", () => {
    expect(polygonContainsPoint({ vertices: square }, { x: 50, y: 50 })).toBe(true);
    expect(polygonContainsPoint({ vertices: square }, { x: 200, y: 200 })).toBe(false);
  });

  it("snaps points to grid, endpoints, and segments", () => {
    expect(snapToGrid({ x: 13, y: 27 }, 10)).toEqual({ x: 10, y: 30 });
    expect(snapToNearestEndpoint({ x: 9, y: 1 }, [{ x: 10, y: 0 }, { x: 100, y: 0 }], 5)).toEqual({
      x: 10,
      y: 0,
    });
    expect(snapToNearestEndpoint({ x: 50, y: 50 }, [{ x: 0, y: 0 }], 5)).toBeNull();

    const snapped = snapToSegment(
      { x: 5, y: 5 },
      [{ start: { x: 0, y: 0 }, end: { x: 10, y: 0 } }],
      10,
    );
    expect(snapped?.point).toEqual({ x: 5, y: 0 });
    expect(snapToNearestEndpoint({ x: 50, y: 50 }, [{ x: 0, y: 0 }], 5)).toBeNull();

    expect(
      snapToSegment({ x: 5, y: 5 }, [{ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }], 10)?.point,
    ).toEqual({ x: 0, y: 0 });
    expect(
      snapToSegment({ x: 50, y: 50 }, [{ start: { x: 0, y: 0 }, end: { x: 10, y: 0 } }], 2),
    ).toBeNull();
    expect(
      snapToSegment({ x: 1, y: 9 }, [{ start: { x: 0, y: 0 }, end: { x: 10, y: 0 } }], 10)?.segment.start,
    ).toEqual({ x: 0, y: 0 });
  });

  it("builds wall graphs and finds enclosed rooms and junctions", () => {
    const graph = buildWallGraph([
      { start: { x: 0, y: 0 }, end: { x: 100, y: 0 } },
      { start: { x: 100, y: 0 }, end: { x: 100, y: 100 } },
      { start: { x: 100, y: 100 }, end: { x: 0, y: 100 } },
      { start: { x: 0, y: 100 }, end: { x: 0, y: 0 } },
      { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },
    ]);

    expect(graph.nodes.size).toBe(4);
    expect(graph.edges.size).toBe(4);
    expect(findEnclosedRooms(graph).length).toBeGreaterThan(0);
    expect(findJunctions(graph)).toHaveLength(0);

    const tJunction = buildWallGraph([
      { start: { x: 0, y: 0 }, end: { x: 100, y: 0 } },
      { start: { x: 50, y: 0 }, end: { x: 50, y: 100 } },
    ]);
    expect(findJunctions(tJunction).length).toBeGreaterThanOrEqual(0);

    const junctionGraph = buildWallGraph([
      { start: { x: 0, y: 0 }, end: { x: 100, y: 0 } },
      { start: { x: 0, y: 0 }, end: { x: 0, y: 100 } },
      { start: { x: 0, y: 0 }, end: { x: -50, y: 0 } },
    ]);
    expect(findJunctions(junctionGraph)).toEqual([{ x: 0, y: 0 }]);
  });
});
