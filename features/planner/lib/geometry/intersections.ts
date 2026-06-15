import type { Point2D, Polygon, Segment } from "./types";

const EPSILON = 1e-10;

/**
 * Cross product of vectors (b-a) and (c-a)
 */
function cross(a: Point2D, b: Point2D, c: Point2D): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

/**
 * Check if point c lies on segment ab (assuming collinearity)
 */
function onSegment(a: Point2D, b: Point2D, c: Point2D): boolean {
  return (
    Math.min(a.x, b.x) - EPSILON <= c.x &&
    c.x <= Math.max(a.x, b.x) + EPSILON &&
    Math.min(a.y, b.y) - EPSILON <= c.y &&
    c.y <= Math.max(a.y, b.y) + EPSILON
  );
}

/**
 * Returns true if segments a and b intersect.
 */
export function segmentsIntersect(a: Segment, b: Segment): boolean {
  const d1 = cross(b.start, b.end, a.start);
  const d2 = cross(b.start, b.end, a.end);
  const d3 = cross(a.start, a.end, b.start);
  const d4 = cross(a.start, a.end, b.end);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  if (Math.abs(d1) < EPSILON && onSegment(b.start, b.end, a.start)) return true;
  if (Math.abs(d2) < EPSILON && onSegment(b.start, b.end, a.end)) return true;
  if (Math.abs(d3) < EPSILON && onSegment(a.start, a.end, b.start)) return true;
  if (Math.abs(d4) < EPSILON && onSegment(a.start, a.end, b.end)) return true;

  return false;
}

/**
 * Returns the intersection point of two segments, or null if they don't intersect.
 * Uses parametric line intersection.
 */
export function segmentIntersection(a: Segment, b: Segment): Point2D | null {
  const dx1 = a.end.x - a.start.x;
  const dy1 = a.end.y - a.start.y;
  const dx2 = b.end.x - b.start.x;
  const dy2 = b.end.y - b.start.y;

  const denom = dx1 * dy2 - dy1 * dx2;

  if (Math.abs(denom) < EPSILON) {
    // Parallel or collinear
    return null;
  }

  const dx3 = b.start.x - a.start.x;
  const dy3 = b.start.y - a.start.y;

  const t = (dx3 * dy2 - dy3 * dx2) / denom;
  const u = (dx3 * dy1 - dy3 * dx1) / denom;

  if (t >= -EPSILON && t <= 1 + EPSILON && u >= -EPSILON && u <= 1 + EPSILON) {
    return {
      x: a.start.x + t * dx1,
      y: a.start.y + t * dy1,
    };
  }

  return null;
}

/**
 * Ray-casting algorithm to determine if a point is inside a polygon.
 */
export function polygonContainsPoint(poly: Polygon, point: Point2D): boolean {
  const { vertices } = poly;
  const n = vertices.length;
  let inside = false;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const vi = vertices[i];
    const vj = vertices[j];

    if (
      (vi.y > point.y) !== (vj.y > point.y) &&
      point.x < ((vj.x - vi.x) * (point.y - vi.y)) / (vj.y - vi.y) + vi.x
    ) {
      inside = !inside;
    }
  }

  return inside;
}
