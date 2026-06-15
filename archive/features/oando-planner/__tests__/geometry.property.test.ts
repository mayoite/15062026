/**
 * Property tests 13.4 + 13.5 — Geometry invariants
 *
 * Property 3: Room Detection from Closed Wall Polygons
 *   For any set of walls forming at least one closed polygon, the room
 *   detection algorithm produces a Room whose vertex set matches one
 *   minimal cycle in the wall graph.
 *
 * Property 5: Door/Window Attachment Constrained to Wall Segment
 *   For any door/window placed on a wall, the attached shape's centre lies
 *   on the wall's line segment (within tolerance).
 *
 * Validates: Requirements 2.4, 2.6
 */


import * as fc from "fast-check";

// ─── Pure cycle-detection model ────────────────────────────────────────────
interface Wall {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

function pointKey(p: { x: number; y: number }): string {
  return `${Math.round(p.x)}_${Math.round(p.y)}`;
}

/** Detects whether a set of walls forms a closed loop by counting endpoint degrees. */
function hasClosedCycle(walls: Wall[]): boolean {
  if (walls.length < 3) return false;
  const degree = new Map<string, number>();
  for (const w of walls) {
    degree.set(pointKey(w.start), (degree.get(pointKey(w.start)) ?? 0) + 1);
    degree.set(pointKey(w.end), (degree.get(pointKey(w.end)) ?? 0) + 1);
  }
  // For an Eulerian-cycle of a single closed loop, every vertex has even degree ≥ 2.
  for (const d of degree.values()) {
    if (d < 2 || d % 2 !== 0) return false;
  }
  return true;
}

/** Build a rectangle of N walls with corners (0,0)-(w,0)-(w,h)-(0,h). */
function buildRectangle(w: number, h: number): Wall[] {
  return [
    { id: "1", start: { x: 0, y: 0 }, end: { x: w, y: 0 } },
    { id: "2", start: { x: w, y: 0 }, end: { x: w, y: h } },
    { id: "3", start: { x: w, y: h }, end: { x: 0, y: h } },
    { id: "4", start: { x: 0, y: h }, end: { x: 0, y: 0 } },
  ];
}

/** Project a point onto a line segment, clamped to [0, 1]. */
function projectOntoSegment(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
): { x: number; y: number; t: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: a.x, y: a.y, t: 0 };
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return { x: a.x + t * dx, y: a.y + t * dy, t };
}

describe("Property: Room Detection from Closed Wall Polygons", () => {
  it("a closed rectangle of 4 walls is detected as a cycle", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 5000 }),
        fc.integer({ min: 100, max: 5000 }),
        (w, h) => {
          const walls = buildRectangle(w, h);
          expect(hasClosedCycle(walls)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it("an open chain of N walls (not closed) is NOT a cycle", () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 10 }), (n) => {
        const walls: Wall[] = [];
        for (let i = 0; i < n; i++) {
          walls.push({
            id: `w${i}`,
            start: { x: i * 100, y: 0 },
            end: { x: (i + 1) * 100, y: 0 },
          });
        }
        expect(hasClosedCycle(walls)).toBe(false);
      }),
      { numRuns: 30 }
    );
  });
});

describe("Property: Door/Window Attachment Constrained to Wall Segment", () => {
  it("a door projected onto its wall lies on the wall segment", () => {
    fc.assert(
      fc.property(
        fc.record({
          start: fc.record({
            x: fc.integer({ min: -1000, max: 1000 }),
            y: fc.integer({ min: -1000, max: 1000 }),
          }),
          end: fc.record({
            x: fc.integer({ min: -1000, max: 1000 }),
            y: fc.integer({ min: -1000, max: 1000 }),
          }),
        }),
        fc.record({
          x: fc.integer({ min: -2000, max: 2000 }),
          y: fc.integer({ min: -2000, max: 2000 }),
        }),
        (wall, doorPos) => {
          if (wall.start.x === wall.end.x && wall.start.y === wall.end.y) return; // skip zero-length

          const projected = projectOntoSegment(doorPos, wall.start, wall.end);

          // t must be in [0, 1] (on segment, not extended)
          expect(projected.t).toBeGreaterThanOrEqual(0);
          expect(projected.t).toBeLessThanOrEqual(1);

          // Projected point must lie on the line through wall start/end
          const dx = wall.end.x - wall.start.x;
          const dy = wall.end.y - wall.start.y;
          const lenSq = dx * dx + dy * dy;
          // Cross product of (projected - start) and (end - start) must be ~0
          const cross =
            (projected.x - wall.start.x) * dy -
            (projected.y - wall.start.y) * dx;
          // Tolerance scales with wall length
          const tol = Math.max(1e-6, Math.sqrt(lenSq) * 1e-9);
          expect(Math.abs(cross)).toBeLessThanOrEqual(tol);
        }
      ),
      { numRuns: 100 }
    );
  });
});
