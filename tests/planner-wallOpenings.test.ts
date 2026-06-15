import { describe, it, expect } from 'vitest';
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
} from '@/features/planner/lib/geometry/wallOpenings';
import { getWallThicknessCanvasUnits } from '@/features/planner/tldraw/shapes/WallShape';

const wall = (overrides: Partial<WallSegmentSpec> = {}): WallSegmentSpec => ({
  id: 'wall-1',
  start: { x: 0, y: 0 },
  end: { x: 400, y: 0 },
  thickness: 10,
  ...overrides,
});

const door = (overrides: Partial<OpeningCandidate> = {}): OpeningCandidate => ({
  id: 'door-1',
  kind: 'door',
  center: { x: 200, y: 0 },
  width: 90,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Unit conversion
// ---------------------------------------------------------------------------

describe('mmToCanvasUnits', () => {
  it('converts a 900mm door to 90 canvas units (1 unit = 1cm)', () => {
    expect(mmToCanvasUnits(900)).toBe(90);
  });

  it('converts wall thickness 100mm to 10 units', () => {
    expect(mmToCanvasUnits(100)).toBe(10);
  });

  it('maps standard wall materials to calibrated canvas thickness units', () => {
    expect(getWallThicknessCanvasUnits('drywall')).toBe(10);
    expect(getWallThicknessCanvasUnits('brick')).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// projectPointOntoSegment
// ---------------------------------------------------------------------------

describe('projectPointOntoSegment', () => {
  it('projects a point above the middle of a horizontal segment', () => {
    const result = projectPointOntoSegment({ x: 200, y: 5 }, { x: 0, y: 0 }, { x: 400, y: 0 });
    expect(result.t).toBeCloseTo(0.5);
    expect(result.along).toBeCloseTo(200);
    expect(result.distance).toBeCloseTo(5);
    expect(result.point).toEqual({ x: 200, y: 0 });
  });

  it('clamps points beyond the segment end', () => {
    const result = projectPointOntoSegment({ x: 500, y: 0 }, { x: 0, y: 0 }, { x: 400, y: 0 });
    expect(result.t).toBe(1);
    expect(result.along).toBeCloseTo(400);
    expect(result.distance).toBeCloseTo(100);
  });

  it('handles diagonal segments', () => {
    const result = projectPointOntoSegment({ x: 100, y: 0 }, { x: 0, y: 0 }, { x: 100, y: 100 });
    expect(result.along).toBeCloseTo(Math.hypot(50, 50));
    expect(result.distance).toBeCloseTo(Math.hypot(50, 50));
  });

  it('degenerates gracefully on zero-length segments', () => {
    const result = projectPointOntoSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 });
    expect(result.t).toBe(0);
    expect(result.distance).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// computeWallOpenings
// ---------------------------------------------------------------------------

describe('computeWallOpenings', () => {
  it('cuts an opening for a door centered on the wall axis', () => {
    const openings = computeWallOpenings(wall(), [door()]);
    expect(openings).toHaveLength(1);
    expect(openings[0]).toMatchObject({ id: 'door-1', kind: 'door' });
    expect(openings[0].start).toBeCloseTo(155);
    expect(openings[0].end).toBeCloseTo(245);
  });

  it('accepts a door slightly off the wall axis (within tolerance)', () => {
    const openings = computeWallOpenings(wall(), [door({ center: { x: 200, y: 9 } })]);
    expect(openings).toHaveLength(1);
  });

  it('rejects a door beyond the perpendicular tolerance', () => {
    const openings = computeWallOpenings(wall(), [door({ center: { x: 200, y: 30 } })]);
    expect(openings).toHaveLength(0);
  });

  it('clamps openings that hang off the wall end', () => {
    const openings = computeWallOpenings(wall(), [door({ center: { x: 395, y: 0 } })]);
    expect(openings).toHaveLength(1);
    expect(openings[0].end).toBeCloseTo(400);
    expect(openings[0].start).toBeCloseTo(350);
  });

  it('drops openings that barely overlap the wall', () => {
    // Center 44 units past the end of a 90-wide door: overlap is 1 unit.
    const openings = computeWallOpenings(wall(), [door({ center: { x: 444, y: 0 } })]);
    expect(openings).toHaveLength(0);
  });

  it('sorts multiple openings by start position', () => {
    const openings = computeWallOpenings(wall(), [
      door({ id: 'door-b', center: { x: 300, y: 0 } }),
      door({ id: 'door-a', center: { x: 100, y: 0 } }),
    ]);
    expect(openings.map((o) => o.id)).toEqual(['door-a', 'door-b']);
  });

  it('works for diagonal walls', () => {
    const diagonal = wall({ end: { x: 300, y: 300 } });
    const openings = computeWallOpenings(diagonal, [
      door({ center: { x: 150, y: 150 }, width: 90 }),
    ]);
    expect(openings).toHaveLength(1);
    const mid = wallLength(diagonal) / 2;
    expect(openings[0].start).toBeCloseTo(mid - 45);
    expect(openings[0].end).toBeCloseTo(mid + 45);
  });

  it('ignores zero-width candidates and zero-length walls', () => {
    expect(computeWallOpenings(wall(), [door({ width: 0 })])).toHaveLength(0);
    expect(
      computeWallOpenings(wall({ end: { x: 0, y: 0 } }), [door()]),
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// computeSolidSpans
// ---------------------------------------------------------------------------

describe('computeSolidSpans', () => {
  it('returns the full wall when there are no openings', () => {
    expect(computeSolidSpans(400, [])).toEqual([{ start: 0, end: 400 }]);
  });

  it('splits the wall around a single opening', () => {
    expect(computeSolidSpans(400, [{ start: 155, end: 245 }])).toEqual([
      { start: 0, end: 155 },
      { start: 245, end: 400 },
    ]);
  });

  it('merges overlapping openings', () => {
    expect(
      computeSolidSpans(400, [
        { start: 100, end: 200 },
        { start: 180, end: 260 },
      ]),
    ).toEqual([
      { start: 0, end: 100 },
      { start: 260, end: 400 },
    ]);
  });

  it('drops sliver spans between adjacent openings', () => {
    expect(
      computeSolidSpans(400, [
        { start: 100, end: 200 },
        { start: 201, end: 300 },
      ]),
    ).toEqual([
      { start: 0, end: 100 },
      { start: 300, end: 400 },
    ]);
  });

  it('handles an opening that spans the entire wall', () => {
    expect(computeSolidSpans(400, [{ start: 0, end: 400 }])).toEqual([]);
  });

  it('clamps openings that extend past the wall bounds', () => {
    expect(computeSolidSpans(400, [{ start: -50, end: 100 }])).toEqual([
      { start: 100, end: 400 },
    ]);
  });

  it('returns nothing for non-positive wall length', () => {
    expect(computeSolidSpans(0, [])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// findWallAttachment
// ---------------------------------------------------------------------------

describe('findWallAttachment', () => {
  const walls = [
    wall(),
    wall({ id: 'wall-2', start: { x: 0, y: 0 }, end: { x: 0, y: 300 } }),
  ];

  it('attaches to the nearest wall and reports position + angle', () => {
    const attachment = findWallAttachment(walls, { x: 100, y: 4 });
    expect(attachment).not.toBeNull();
    expect(attachment?.wallId).toBe('wall-1');
    expect(attachment?.t).toBeCloseTo(0.25);
    expect(attachment?.along).toBeCloseTo(100);
    expect(attachment?.angle).toBeCloseTo(0);
    expect(attachment?.point).toEqual({ x: 100, y: 0 });
  });

  it('prefers the closer of two candidate walls', () => {
    const attachment = findWallAttachment(walls, { x: 3, y: 8 });
    expect(attachment?.wallId).toBe('wall-2');
  });

  it('returns null when no wall is within range', () => {
    expect(findWallAttachment(walls, { x: 200, y: 100 })).toBeNull();
  });

  it('reports the wall angle for vertical walls', () => {
    const attachment = findWallAttachment(walls, { x: 2, y: 150 });
    expect(attachment?.angle).toBeCloseTo(Math.PI / 2);
  });
});

// ---------------------------------------------------------------------------
// Plan-size helpers
// ---------------------------------------------------------------------------

describe('doorPlanSize / windowPlanSize', () => {
  it('converts a standard 900x40mm door to 90x4 canvas units', () => {
    expect(doorPlanSize({ widthMm: 900, thicknessMm: 40 })).toEqual({ width: 90, depth: 4 });
  });

  it('derives window plan depth from frame thickness, clamped', () => {
    expect(windowPlanSize({ widthMm: 1200, frameThicknessMm: 50 })).toEqual({ width: 120, depth: 10 });
    expect(windowPlanSize({ widthMm: 600, frameThicknessMm: 10 })).toEqual({ width: 60, depth: 8 });
    expect(windowPlanSize({ widthMm: 600, frameThicknessMm: 200 })).toEqual({ width: 60, depth: 14 });
  });

  it('falls back to a sane frame when frameThicknessMm is missing', () => {
    expect(windowPlanSize({ widthMm: 600 })).toEqual({ width: 60, depth: 10 });
  });
});

// ---------------------------------------------------------------------------
// rectCenterAt
// ---------------------------------------------------------------------------

describe('rectCenterAt', () => {
  it('returns the rectangle center for unrotated shapes', () => {
    expect(rectCenterAt(10, 20, 90, 4, 0)).toEqual({ x: 55, y: 22 });
  });

  it('rotates the center offset around the shape origin', () => {
    const center = rectCenterAt(0, 0, 90, 4, Math.PI / 2);
    expect(center.x).toBeCloseTo(-2);
    expect(center.y).toBeCloseTo(45);
  });
});
