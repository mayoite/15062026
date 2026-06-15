import type { Editor, TLShapeId } from "tldraw";

import { plannerCanvasUnits } from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";

type DimProps = {
  widthMm?: number;
  heightMm?: number;
  depthMm?: number;
};

type Point2D = { x: number; y: number };

function repairDimProp(value: number, paired?: number): number {
  return Math.max(1, plannerCanvasUnits(value, paired));
}

function repairPoint(point: Point2D): Point2D {
  return {
    x: point.x === 0 ? 0 : repairDimProp(point.x, point.y),
    y: point.y === 0 ? 0 : repairDimProp(point.y, point.x),
  };
}

function repairDimProps(props: DimProps): Partial<DimProps> | null {
  const widthMm = typeof props.widthMm === "number" ? props.widthMm : undefined;
  const heightMm = typeof props.heightMm === "number" ? props.heightMm : undefined;
  const depthMm = typeof props.depthMm === "number" ? props.depthMm : undefined;

  if (widthMm === undefined && heightMm === undefined && depthMm === undefined) {
    return null;
  }

  const nextWidth = widthMm !== undefined ? repairDimProp(widthMm, heightMm) : undefined;
  const nextHeight = heightMm !== undefined ? repairDimProp(heightMm, widthMm) : undefined;
  const depthPair = nextHeight ?? heightMm ?? nextWidth ?? widthMm;
  let nextDepth =
    depthMm !== undefined ? repairDimProp(depthMm, depthPair) : undefined;

  if (
    depthMm !== undefined
    && nextDepth === depthMm
    && nextHeight !== undefined
    && heightMm !== undefined
    && nextHeight !== heightMm
    && depthMm === heightMm
  ) {
    nextDepth = nextHeight;
  } else if (
    depthMm !== undefined
    && nextDepth === depthMm
    && nextWidth !== undefined
    && widthMm !== undefined
    && nextWidth !== widthMm
    && depthMm === widthMm
  ) {
    nextDepth = nextWidth;
  }

  if (
    nextWidth === widthMm
    && nextHeight === heightMm
    && nextDepth === depthMm
  ) {
    return null;
  }

  return {
    ...(nextWidth !== undefined ? { widthMm: nextWidth } : {}),
    ...(nextHeight !== undefined ? { heightMm: nextHeight } : {}),
    ...(nextDepth !== undefined ? { depthMm: nextDepth } : {}),
  };
}

function repairPoints(points: Point2D[]): Point2D[] | null {
  if (points.length === 0) return null;
  const next = points.map(repairPoint);
  const changed = next.some((point, index) => {
    const prev = points[index];
    return point.x !== prev.x || point.y !== prev.y;
  });
  return changed ? next : null;
}

/**
 * Persist canvas-cm dimensions after load so legacy autosave (cm × 10) does not
 * drift on the next save/export. Read-time repair in catalogBlockBridge is not enough.
 */
export function repairPlannerShapeUnits(editor: Editor): number {
  const updates: Array<{ id: TLShapeId; type: string; props: Record<string, unknown> }> = [];

  for (const shape of editor.getCurrentPageShapes()) {
    const props = shape.props as Record<string, unknown>;

    if (
      shape.type === "planner-furniture"
      || shape.type === "planner-room"
      || shape.type === "planner-zone"
    ) {
      const dimPatch = repairDimProps(props as DimProps);
      const points = Array.isArray(props.points) ? (props.points as Point2D[]) : [];
      const pointsPatch = repairPoints(points);
      if (!dimPatch && !pointsPatch) continue;

      updates.push({
        id: shape.id,
        type: shape.type,
        props: {
          ...(dimPatch ?? {}),
          ...(pointsPatch ? { points: pointsPatch } : {}),
        },
      });
      continue;
    }

    if (shape.type === "planner-wall" || shape.type === "planner-measurement") {
      const thickness =
        typeof props.thickness === "number"
          ? repairDimProp(props.thickness)
          : undefined;
      if (thickness !== undefined && thickness !== props.thickness) {
        updates.push({
          id: shape.id,
          type: shape.type,
          props: { thickness },
        });
      }
    }
  }

  if (updates.length > 0) {
    editor.updateShapes(updates as Parameters<Editor["updateShapes"]>[0]);
  }

  return updates.length;
}