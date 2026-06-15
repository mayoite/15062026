import type { Editor, TLShape, TLShapeId } from "@tldraw/editor";

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
import type { PlannerDoorTLShape, PlannerWindowTLShape } from "@/features/planner/tldraw/shapes/tldrawShapeTypes";

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

export function wallSegmentFromEditorShape(shape: TLShape): WallSegmentSpec | null {
  if (shape.type !== "planner-wall") return null;
  const props = shape.props as {
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    thickness?: number;
  };
  return {
    id: String(shape.id),
    start: { x: shape.x + (props.startX ?? 0), y: shape.y + (props.startY ?? 0) },
    end: { x: shape.x + (props.endX ?? 0), y: shape.y + (props.endY ?? 0) },
    thickness: Math.max(1, props.thickness ?? 8),
  };
}

export function openingCandidateFromShape(shape: TLShape): OpeningCandidate | null {
  if (shape.type === "planner-door") {
    const door = shape as PlannerDoorTLShape;
    const { width, depth } = doorPlanSize({
      widthMm: door.props.widthMm,
      thicknessMm: door.props.thicknessMm ?? 40,
    });
    return {
      id: String(shape.id),
      kind: "door",
      center: rectCenterAt(shape.x, shape.y, width, depth, shape.rotation ?? 0),
      width,
    };
  }

  if (shape.type === "planner-window") {
    const window = shape as PlannerWindowTLShape;
    const { width, depth } = windowPlanSize({
      widthMm: window.props.widthMm,
      frameThicknessMm: window.props.frameThicknessMm,
    });
    return {
      id: String(shape.id),
      kind: "window",
      center: rectCenterAt(shape.x, shape.y, width, depth, shape.rotation ?? 0),
      width,
    };
  }

  return null;
}

export function collectOpeningCandidates(
  editor: Editor,
  wall: WallSegmentSpec,
  excludeId?: TLShapeId | string | null,
): OpeningCandidate[] {
  const maxDistance = wall.thickness / 2 + 8;
  const ignored = excludeId ? String(excludeId) : null;
  const candidates: OpeningCandidate[] = [];

  for (const shape of editor.getCurrentPageShapes()) {
    if (ignored && String(shape.id) === ignored) continue;
    const candidate = openingCandidateFromShape(shape);
    if (!candidate) continue;
    const projection = projectPointOntoSegment(candidate.center, wall.start, wall.end);
    if (projection.distance <= maxDistance) {
      candidates.push(candidate);
    }
  }

  return candidates;
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