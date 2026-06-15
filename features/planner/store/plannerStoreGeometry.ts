import type { Point } from "./plannerStore";

export function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** @deprecated Use `dist` — kept for legacy R3F imports */
export const distance = dist;

export function projectT(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return 0;
  return Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
}

export function isPointOnSegment(p: Point, a: Point, b: Point, threshold: number): boolean {
  const t = projectT(p, a, b);
  const projected = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
  return dist(p, projected) < threshold;
}
