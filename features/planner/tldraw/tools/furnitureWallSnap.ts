import type { Editor, TLShapePartial } from "@tldraw/editor";

import {
  findWallAttachment,
  rectCenterAt,
  type WallSegmentSpec,
} from "@/features/planner/lib/geometry/wallOpenings";
import { plannerCanvasUnits } from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";
import type { PlannerFurnitureTLShape } from "@/features/planner/tldraw/shapes/tldrawShapeTypes";
import { getEditorSnapThreshold, wallSegmentFromShape } from "@/features/planner/tldraw/tools/tldrawSnap";

export interface FurnitureWallSnapResult {
  x: number;
  y: number;
  rotation: number;
  snapped: boolean;
  wallId?: string;
}

function furnitureFootprint(shape: PlannerFurnitureTLShape): { width: number; depth: number } {
  return {
    width: Math.max(1, plannerCanvasUnits(shape.props.widthMm, shape.props.heightMm)),
    depth: Math.max(1, plannerCanvasUnits(shape.props.heightMm, shape.props.widthMm)),
  };
}

function anchorFromCenter(
  center: { x: number; y: number },
  width: number,
  depth: number,
  rotation: number,
): { x: number; y: number } {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: center.x - (width / 2) * cos + (depth / 2) * sin,
    y: center.y - (width / 2) * sin - (depth / 2) * cos,
  };
}

function collectWallSegments(editor: Editor): WallSegmentSpec[] {
  const walls: WallSegmentSpec[] = [];
  for (const shape of editor.getCurrentPageShapes()) {
    const wall = wallSegmentFromShape(shape);
    if (!wall) continue;
    walls.push({
      id: wall.id,
      start: { x: wall.start.x, y: wall.start.y },
      end: { x: wall.end.x, y: wall.end.y },
      thickness: wall.thickness,
    });
  }
  return walls;
}

function wallNormalTowardPoint(wall: WallSegmentSpec, point: { x: number; y: number }): { x: number; y: number } {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const leftNormal = { x: -uy, y: ux };
  const rightNormal = { x: uy, y: -ux };
  const mid = {
    x: (wall.start.x + wall.end.x) / 2,
    y: (wall.start.y + wall.end.y) / 2,
  };
  const toPoint = { x: point.x - mid.x, y: point.y - mid.y };
  const leftDot = leftNormal.x * toPoint.x + leftNormal.y * toPoint.y;
  return leftDot >= 0 ? leftNormal : rightNormal;
}

export function snapFurnitureAtPoint(
  editor: Editor,
  anchor: { x: number; y: number },
  footprint: { widthMm: number; heightMm: number },
  rotation = 0,
): FurnitureWallSnapResult | null {
  const probe = {
    id: "furniture-snap-probe",
    type: "planner-furniture",
    x: anchor.x,
    y: anchor.y,
    rotation,
    props: {
      widthMm: footprint.widthMm,
      heightMm: footprint.heightMm,
      isAgainstWall: false,
    },
  } as PlannerFurnitureTLShape;
  return snapFurnitureAgainstWall(editor, probe);
}

export function snapFurnitureAgainstWall(
  editor: Editor,
  shape: PlannerFurnitureTLShape,
): FurnitureWallSnapResult | null {
  const rotation = shape.rotation ?? 0;
  const { width, depth } = furnitureFootprint(shape);
  const threshold =
    getEditorSnapThreshold() * 1.35 + Math.max(width, depth) * 0.5;
  const walls = collectWallSegments(editor);
  if (walls.length === 0) return null;

  const center = rectCenterAt(shape.x, shape.y, width, depth, rotation);

  const attachment = findWallAttachment(walls, center, threshold);
  if (!attachment) return null;

  const wall = walls.find((segment) => segment.id === attachment.wallId);
  if (!wall) return null;

  const alignedRotation = attachment.angle;
  const normal = wallNormalTowardPoint(wall, center);
  const flushCenter = {
    x: attachment.point.x + normal.x * (depth / 2),
    y: attachment.point.y + normal.y * (depth / 2),
  };
  const anchor = anchorFromCenter(flushCenter, width, depth, alignedRotation);

  return {
    x: anchor.x,
    y: anchor.y,
    rotation: alignedRotation,
    snapped: true,
    wallId: attachment.wallId,
  };
}

export function applyFurnitureWallSnap(
  editor: Editor,
  shape: PlannerFurnitureTLShape,
): TLShapePartial<PlannerFurnitureTLShape> | null {
  const snap = snapFurnitureAgainstWall(editor, shape);
  if (!snap) {
    if (shape.props.isAgainstWall) {
      return {
        id: shape.id,
        type: "planner-furniture",
        props: { ...shape.props, isAgainstWall: false },
      };
    }
    return null;
  }

  return {
    id: shape.id,
    type: "planner-furniture",
    x: snap.x,
    y: snap.y,
    rotation: snap.rotation,
    props: {
      ...shape.props,
      isAgainstWall: true,
    },
  };
}