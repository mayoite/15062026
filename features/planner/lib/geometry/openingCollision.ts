import {
  doorPlanSize,
  projectPointOntoSegment,
  rectCenterAt,
  wallLength,
  windowPlanSize,
  type OpeningCandidate,
  type Point2,
  type WallSegmentSpec,
} from "@/features/planner/lib/geometry/wallOpenings";

const END_MARGIN = 8;
const OPENING_GAP = 6;

export interface OpeningPlacementCheck {
  blocked: boolean;
  reason?: "overlap" | "wall-end" | "off-wall";
}

export function spansOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number },
  gap = OPENING_GAP,
): boolean {
  return a.start < b.end + gap && b.start < a.end + gap;
}

export function clampOpeningAlong(
  wallLengthUnits: number,
  along: number,
  openingWidth: number,
  endMargin = END_MARGIN,
): number {
  const half = openingWidth / 2;
  const min = half + endMargin;
  const max = wallLengthUnits - half - endMargin;
  if (min > max) return wallLengthUnits / 2;
  return Math.max(min, Math.min(max, along));
}

export function pointAlongWall(wall: WallSegmentSpec, along: number): Point2 {
  const length = wallLength(wall);
  if (length <= 0) return { x: wall.start.x, y: wall.start.y };
  const t = along / length;
  return {
    x: wall.start.x + (wall.end.x - wall.start.x) * t,
    y: wall.start.y + (wall.end.y - wall.start.y) * t,
  };
}

/** Stub — wall segments come from the fabric canvas, not editor shapes. */
export function wallSegmentFromEditorShape(_shape: unknown): WallSegmentSpec | null {
  return null;
}

/** Stub — openings come from the fabric canvas, not editor shapes. */
export function openingCandidateFromShape(_shape: unknown): OpeningCandidate | null {
  return null;
}

export function collectOpeningCandidates(
  _editor: null,
  _wall: WallSegmentSpec,
  _excludeId?: string | null,
): OpeningCandidate[] {
  return [];
}

export function checkOpeningPlacementOnWall(
  wall: WallSegmentSpec,
  center: Point2,
  openingWidth: number,
  existing: readonly OpeningCandidate[],
  excludeId?: string | null,
): OpeningPlacementCheck {
  const length = wallLength(wall);
  if (length <= 0) return { blocked: true, reason: "off-wall" };

  const projection = projectPointOntoSegment(center, wall.start, wall.end);
  const maxDistance = wall.thickness / 2 + 8;
  if (projection.distance > maxDistance) {
    return { blocked: true, reason: "off-wall" };
  }

  const clampedAlong = clampOpeningAlong(length, projection.along, openingWidth);
  const half = openingWidth / 2;
  const span = { start: clampedAlong - half, end: clampedAlong + half };

  if (span.start < END_MARGIN || span.end > length - END_MARGIN) {
    return { blocked: true, reason: "wall-end" };
  }

  for (const other of existing) {
    if (excludeId && other.id === excludeId) continue;
    const otherProjection = projectPointOntoSegment(other.center, wall.start, wall.end);
    if (otherProjection.distance > maxDistance) continue;
    const otherSpan = {
      start: otherProjection.along - other.width / 2,
      end: otherProjection.along + other.width / 2,
    };
    if (spansOverlap(span, otherSpan)) {
      return { blocked: true, reason: "overlap" };
    }
  }

  return { blocked: false };
}

// Re-export geometry helpers used by tests
export { doorPlanSize, windowPlanSize, rectCenterAt };