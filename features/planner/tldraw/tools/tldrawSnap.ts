import { Vec, type Editor, type TLShape, type TLShapeId } from "@tldraw/editor";
import { usePlannerStore } from "@/features/planner/store/plannerStore";
import { SnapManager, type SnapPoint } from "@/features/planner/lib/snapManager";
import { findWallAttachment } from "@/features/planner/lib/geometry/wallOpenings";

interface WallSegment {
  id: string;
  start: Vec;
  end: Vec;
  thickness: number;
}

export interface EditorSnapResult {
  point: Vec;
  snapped: boolean;
  source?: string;
  kind?: SnapPoint["type"] | "wall-segment" | "angle-constraint";
  distance: number;
}

function getSnapDistance(): number {
  return usePlannerStore.getState().snapDistance;
}

export function getEditorSnapThreshold(): number {
  return Math.max(12, getSnapDistance());
}

export function wallSegmentFromShape(shape: TLShape): WallSegment | null {
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
    start: new Vec(shape.x + (props.startX ?? 0), shape.y + (props.startY ?? 0)),
    end: new Vec(shape.x + (props.endX ?? 0), shape.y + (props.endY ?? 0)),
    thickness: Math.max(1, props.thickness ?? 8),
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

export interface OpeningSnapResult {
  /** Point on the wall axis (page coordinates). */
  position: Vec;
  /** Wall axis angle in radians (tldraw rotation convention). */
  angleRad: number;
  wallId: string;
  /** Normalized position along the wall, 0..1. */
  t: number;
  /** Wall thickness in canvas units. */
  thickness: number;
}

export function snapOpeningToWall(editor: Editor, point: Vec): OpeningSnapResult | null {
  const walls = [];
  for (const shape of editor.getCurrentPageShapes()) {
    const wall = wallSegmentFromShape(shape);
    if (wall) walls.push(wall);
  }

  const attachment = findWallAttachment(walls, point, getEditorSnapThreshold());
  if (!attachment) return null;

  return {
    position: new Vec(attachment.point.x, attachment.point.y),
    angleRad: attachment.angle,
    wallId: attachment.wallId,
    t: attachment.t,
    thickness: attachment.thickness,
  };
}

/**
 * Constrain a point to the nearest angle increment relative to an origin.
 * Used with Shift key held during wall drawing to snap to 0/45/90/135/180 etc.
 */
export function constrainToAngle(origin: Vec, point: Vec, incrementDeg: number = 45): Vec {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return point;

  const angleRad = Math.atan2(dy, dx);
  const incrementRad = (incrementDeg * Math.PI) / 180;
  const snappedAngle = Math.round(angleRad / incrementRad) * incrementRad;

  return new Vec(
    origin.x + length * Math.cos(snappedAngle),
    origin.y + length * Math.sin(snappedAngle)
  );
}

/**
 * Snap the endpoint of a wall being drawn:
 * 1. First applies angle constraint if shiftKey is held (45-degree increments)
 * 2. Then snaps the resulting point to grid/wall endpoints
 * This gives predictable orthogonal/diagonal walls while still snapping to geometry.
 */
export function snapWallEndpoint(
  editor: Editor,
  origin: Vec,
  rawEnd: Vec,
  shiftKey: boolean,
  excludeId?: TLShapeId | string | null
): EditorSnapResult {
  let constrained = rawEnd;

  if (shiftKey) {
    constrained = constrainToAngle(origin, rawEnd, 45);
  }

  // Now apply standard snap (grid + wall endpoints + wall segments)
  const result = snapEditorPoint(editor, constrained, excludeId);

  // If shift is held and snapping did not find anything close, use angle-constrained point
  if (shiftKey && !result.snapped) {
    return {
      point: constrained,
      snapped: true,
      kind: "angle-constraint" as EditorSnapResult["kind"],
      distance: 0,
    };
  }

  // If shift is held but snap found something, check if the snap is reasonably close
  // to the constrained direction. If not, prefer the angle constraint.
  if (shiftKey && result.snapped) {
    const snapDist = constrained.dist(result.point);
    if (snapDist > getEditorSnapThreshold() * 0.7) {
      return {
        point: constrained,
        snapped: true,
        kind: "angle-constraint" as EditorSnapResult["kind"],
        distance: 0,
      };
    }
  }

  return result;
}
