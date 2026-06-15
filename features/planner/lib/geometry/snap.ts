import type { Point2D, Segment } from "./types";

/**
 * Snap a point to the nearest grid intersection.
 */
export function snapToGrid(point: Point2D, gridSize: number): Point2D {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/**
 * Snap to the nearest endpoint within a threshold distance.
 * Returns the snapped point or null if no endpoint is close enough.
 */
export function snapToNearestEndpoint(
  point: Point2D,
  endpoints: Point2D[],
  threshold: number
): Point2D | null {
  let closest: Point2D | null = null;
  let minDist = threshold;

  for (const ep of endpoints) {
    const dx = ep.x - point.x;
    const dy = ep.y - point.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minDist) {
      minDist = dist;
      closest = ep;
    }
  }

  return closest;
}

/**
 * Project a point onto a segment and return the closest point on the segment.
 */
function projectPointOnSegment(point: Point2D, seg: Segment): Point2D {
  const dx = seg.end.x - seg.start.x;
  const dy = seg.end.y - seg.start.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return { x: seg.start.x, y: seg.start.y };

  let t = ((point.x - seg.start.x) * dx + (point.y - seg.start.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  return {
    x: seg.start.x + t * dx,
    y: seg.start.y + t * dy,
  };
}

/**
 * Snap to the nearest point on any segment within a threshold distance.
 * Returns the projected point and the segment it snapped to, or null.
 */
export function snapToSegment(
  point: Point2D,
  segments: Segment[],
  threshold: number
): { point: Point2D; segment: Segment } | null {
  let best: { point: Point2D; segment: Segment } | null = null;
  let minDist = threshold;

  for (const seg of segments) {
    const projected = projectPointOnSegment(point, seg);
    const dx = projected.x - point.x;
    const dy = projected.y - point.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minDist) {
      minDist = dist;
      best = { point: projected, segment: seg };
    }
  }

  return best;
}
