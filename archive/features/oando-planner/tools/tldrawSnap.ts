// @ts-nocheck
import { Vec, type Editor, type TLShape, type TLShapeId } from "@tldraw/editor";
import { usePlannerStore } from "../data/plannerStore";
import { SnapManager, type SnapPoint } from "../lib/snapManager";

interface WallSegment {
  id: string;
  start: Vec;
  end: Vec;
}

export interface EditorSnapResult {
  point: Vec;
  snapped: boolean;
  source?: string;
  kind?: SnapPoint["type"] | "wall-segment";
  distance: number;
}

function getSnapDistance(): number {
  return usePlannerStore.getState().snapDistance;
}

export function getEditorSnapThreshold(): number {
  return Math.max(12, getSnapDistance());
}

function wallSegmentFromShape(shape: TLShape): WallSegment | null {
  if (shape.type !== "planner-wall") return null;
  const props = shape.props as {
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
  };
  return {
    id: String(shape.id),
    start: new Vec(shape.x + (props.startX ?? 0), shape.y + (props.startY ?? 0)),
    end: new Vec(shape.x + (props.endX ?? 0), shape.y + (props.endY ?? 0)),
  };
}

function closestPointOnSegment(point: Vec, start: Vec, end: Vec): Vec {
  const line = end.clone().sub(start);
  const rel = point.clone().sub(start);
  const len = line.len();
  if (len === 0) return start;
  const t = Math.max(0, Math.min(1, (rel.x * line.x + rel.y * line.y) / (len * len)));
  return start.clone().add(line.mul(t));
}

export function collectEditorSnapPoints(editor: Editor, excludeId?: TLShapeId | string | null): SnapPoint[] {
  const points: SnapPoint[] = [];
  const ignored = excludeId ? String(excludeId) : null;

  for (const shape of editor.getCurrentPageShapes()) {
    if (ignored && String(shape.id) === ignored) continue;

    const wall = wallSegmentFromShape(shape);
    if (wall) {
      points.push(...SnapManager.generateWallSnapPoints({
        id: wall.id,
        startX: wall.start.x,
        startY: wall.start.y,
        endX: wall.end.x,
        endY: wall.end.y,
      }));
      continue;
    }

    if (shape.type === "planner-room" || shape.type === "planner-zone") {
      const props = shape.props as { points?: Array<{ x: number; y: number }> };
      if (Array.isArray(props.points)) {
        points.push(...SnapManager.generatePolygonSnapPoints({
          id: String(shape.id),
          points: props.points.map((point) => ({ x: shape.x + point.x, y: shape.y + point.y })),
        }));
      }
    }
  }

  return points;
}

export function snapEditorPoint(editor: Editor, point: Vec, excludeId?: TLShapeId | string | null): EditorSnapResult {
  const snapDistance = getSnapDistance();
  const threshold = getEditorSnapThreshold();
  const snapManager = new SnapManager({
    gridSpacing: snapDistance,
    snapThreshold: threshold,
    snapToGrid: true,
    gridEnabled: true,
  });
  snapManager.addSnapPoints(collectEditorSnapPoints(editor, excludeId));

  const pointSnap = snapManager.findSnap(point.x, point.y);
  let best: EditorSnapResult = pointSnap.snapped
    ? {
        point: new Vec(pointSnap.point.x, pointSnap.point.y),
        snapped: true,
        source: pointSnap.snapPoint?.source,
        kind: pointSnap.snapPoint?.type ?? "grid",
        distance: pointSnap.distance,
      }
    : { point, snapped: false, distance: Infinity };

  for (const shape of editor.getCurrentPageShapes()) {
    if (excludeId && String(shape.id) === String(excludeId)) continue;
    const wall = wallSegmentFromShape(shape);
    if (!wall) continue;
    const candidate = closestPointOnSegment(point, wall.start, wall.end);
    const distance = point.dist(candidate);
    if (distance <= threshold && distance < best.distance) {
      best = {
        point: candidate,
        snapped: true,
        source: wall.id,
        kind: "wall-segment",
        distance,
      };
    }
  }

  return best.snapped ? best : { point, snapped: false, distance: 0 };
}

export function snapEditorPointOrGrid(editor: Editor, point: Vec, excludeId?: TLShapeId | string | null): Vec {
  return snapEditorPoint(editor, point, excludeId).point;
}

export function snapOpeningToWall(editor: Editor, point: Vec): { position: Vec; rotation: number; wallId: string } | null {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const snapDistance = getSnapDistance();
  const threshold = getEditorSnapThreshold();
  let best: { position: Vec; rotation: number; wallId: string; distance: number } | null = null;

  for (const shape of editor.getCurrentPageShapes()) {
    const wall = wallSegmentFromShape(shape);
    if (!wall) continue;
    const candidate = closestPointOnSegment(point, wall.start, wall.end);
    const distance = point.dist(candidate);
    if (distance > threshold || (best && distance >= best.distance)) continue;
    best = {
      position: candidate,
      rotation: (Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * 180) / Math.PI,
      wallId: wall.id,
      distance,
    };
  }

  if (!best) return null;
  return { position: best.position, rotation: best.rotation, wallId: best.wallId };
}
