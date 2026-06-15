import type { Editor, TLShapeId, TLShapePartial } from "@tldraw/editor";
import { Vec } from "@tldraw/editor";

import {
  checkOpeningPlacementOnWall,
  clampOpeningAlong,
  collectOpeningCandidates,
  pointAlongWall,
  wallSegmentFromEditorShape,
} from "@/features/planner/lib/geometry/openingCollision";
import {
  doorPlanSize,
  rectCenterAt,
  wallLength,
  windowPlanSize,
} from "@/features/planner/lib/geometry/wallOpenings";
import type { PlannerDoorTLShape, PlannerWindowTLShape } from "@/features/planner/tldraw/shapes/tldrawShapeTypes";
import { snapOpeningToWall } from "@/features/planner/tldraw/tools/tldrawSnap";

export type OpeningShape = PlannerDoorTLShape | PlannerWindowTLShape;

export interface OpeningWallSnapResult {
  x: number;
  y: number;
  rotation: number;
  wallId: string;
  wallT: number;
  blocked: boolean;
  blockReason?: "overlap" | "wall-end" | "off-wall";
}

function openingFootprint(shape: OpeningShape): { width: number; depth: number } {
  if (shape.type === "planner-door") {
    return doorPlanSize({
      widthMm: shape.props.widthMm,
      thicknessMm: shape.props.thicknessMm ?? 40,
    });
  }
  return windowPlanSize({
    widthMm: shape.props.widthMm,
    frameThicknessMm: shape.props.frameThicknessMm,
  });
}

function anchorFromCenter(
  center: { x: number; y: number },
  rotation: number,
  width: number,
  depth: number,
): { x: number; y: number } {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: center.x - (width / 2) * cos + (depth / 2) * sin,
    y: center.y - (width / 2) * sin - (depth / 2) * cos,
  };
}

export function resolveOpeningWallSnap(
  editor: Editor,
  shape: OpeningShape,
  excludeId?: TLShapeId | string | null,
): OpeningWallSnapResult | null {
  const { width, depth } = openingFootprint(shape);
  const center = rectCenterAt(shape.x, shape.y, width, depth, shape.rotation ?? 0);
  const rawSnap = snapOpeningToWall(editor, new Vec(center.x, center.y));
  if (!rawSnap) {
    return {
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation ?? 0,
      wallId: "",
      wallT: shape.props.wallPosition ?? 0.5,
      blocked: true,
      blockReason: "off-wall",
    };
  }

  const wallShape = editor.getShape(rawSnap.wallId as TLShapeId);
  const wall = wallShape ? wallSegmentFromEditorShape(wallShape) : null;
  if (!wall) {
    return {
      x: shape.x,
      y: shape.y,
      rotation: rawSnap.angleRad,
      wallId: rawSnap.wallId,
      wallT: rawSnap.t,
      blocked: true,
      blockReason: "off-wall",
    };
  }

  const length = wallLength(wall);
  const along = clampOpeningAlong(length, rawSnap.t * length, width);
  const wallT = length > 0 ? along / length : rawSnap.t;
  const snappedCenter = pointAlongWall(wall, along);
  const existing = collectOpeningCandidates(editor, wall, excludeId ?? shape.id);
  const check = checkOpeningPlacementOnWall(
    wall,
    snappedCenter,
    width,
    existing,
    excludeId ? String(excludeId) : String(shape.id),
  );
  const anchor = anchorFromCenter(snappedCenter, rawSnap.angleRad, width, depth);

  return {
    x: anchor.x,
    y: anchor.y,
    rotation: rawSnap.angleRad,
    wallId: rawSnap.wallId,
    wallT,
    blocked: check.blocked,
    blockReason: check.reason,
  };
}

function openingSnapPatch<T extends OpeningShape>(
  shape: T,
  snap: OpeningWallSnapResult,
): TLShapePartial<T> {
  const strokeColor = snap.blocked ? "var(--color-danger)" : "var(--color-primary)";
  return {
    id: shape.id,
    type: shape.type,
    x: snap.x,
    y: snap.y,
    rotation: snap.rotation,
    props: {
      ...shape.props,
      wallId: snap.wallId,
      wallPosition: snap.wallT,
      isAttached: Boolean(snap.wallId) && !snap.blocked,
      strokeColor,
    },
  } as TLShapePartial<T>;
}

export function applyDoorWallSnap(
  editor: Editor,
  shape: PlannerDoorTLShape,
): TLShapePartial<PlannerDoorTLShape> | null {
  const snap = resolveOpeningWallSnap(editor, shape);
  return snap ? openingSnapPatch(shape, snap) : null;
}

export function applyWindowWallSnap(
  editor: Editor,
  shape: PlannerWindowTLShape,
): TLShapePartial<PlannerWindowTLShape> | null {
  const snap = resolveOpeningWallSnap(editor, shape);
  return snap ? openingSnapPatch(shape, snap) : null;
}