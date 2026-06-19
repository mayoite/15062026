"use client";

import {
  DefaultColorStyle,
  DefaultDashStyle,
  DefaultFillStyle,
  DefaultSizeStyle,
  GeoShapeGeoStyle,
  createShapeId,
  getIndices,
  type Editor,
  type TLLineShape,
} from "@/features/planner/shared/types/legacyEditorStub";

import type { PlannerShapeMeta } from "@/features/planner/shared/types/planner";

const PAGE_UNIT_MM = 10;
const WALL_JOIN_THRESHOLD = 14;
const DEFAULT_WALL_SEGMENT_MM = 2400;
const DEFAULT_DOOR_OPENING_MM = { width: 900, depth: 120 };

type PlannerShape = ReturnType<Editor["getCurrentPageShapes"]>[number];
type PlannerLineShape = TLLineShape;
type PlannerLinePoint = PlannerLineShape["props"]["points"][string];
type PlannerShapeId = ReturnType<Editor["getSelectedShapeIds"]>[number];

export interface PlannerSelectionDimensions {
  shapeId: PlannerShapeId;
  shapeName: string;
  mode: "box" | "line";
  widthMm: number;
  heightMm: number | null;
}

function normalizePositiveMillimeters(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  return rounded > 0 ? rounded : null;
}

function readPlannerShapeMeta(meta: unknown): PlannerShapeMeta {
  return meta && typeof meta === "object" ? (meta as PlannerShapeMeta) : {};
}

function toPageUnits(mm: number) {
  return mm / PAGE_UNIT_MM;
}

function toMillimeters(pageUnits: number) {
  return Math.round(pageUnits * PAGE_UNIT_MM);
}

function getSortedLinePoints(shape: PlannerLineShape): PlannerLinePoint[] {
  return Object.values(shape.props.points)
    .filter((point): point is PlannerLinePoint => {
      return typeof point.id === "string" && typeof point.index === "string" && typeof point.x === "number" && typeof point.y === "number";
    })
    .sort((left, right) => left.index.localeCompare(right.index));
}

function normalizeLinePoints(points: PlannerLinePoint[]) {
  if (points.length < 2) return points;
  const normalized = points.map((point, index) => {
    if (index === 0) return { ...point };
    const previous = points[index - 1];
    const deltaX = point.x - previous.x;
    const deltaY = point.y - previous.y;
    return Math.abs(deltaX) >= Math.abs(deltaY)
      ? { ...point, y: previous.y }
      : { ...point, x: previous.x };
  });
  return normalized;
}

function collectWallEndpoints(editor: Editor, excludeShapeId?: string) {
  return editor
    .getCurrentPageShapes()
    .filter((shape): shape is PlannerLineShape => {
      const meta = readPlannerShapeMeta(shape.meta);
      return shape.type === "line" && !meta.isPlannerItem && !meta.isRoomDimension && shape.id !== excludeShapeId;
    })
    .flatMap((shape) =>
      getSortedLinePoints(shape).map((point) => ({
        x: shape.x + point.x,
        y: shape.y + point.y,
      })),
    );
}

function snapPagePointToEndpoints(point: { x: number; y: number }, endpoints: Array<{ x: number; y: number }>) {
  for (const endpoint of endpoints) {
    if (Math.hypot(endpoint.x - point.x, endpoint.y - point.y) <= WALL_JOIN_THRESHOLD) {
      return endpoint;
    }
  }

  return point;
}

function buildLinePointRecord(points: PlannerLinePoint[]) {
  return Object.fromEntries(points.map((point) => [point.index, point]));
}

export function configureWallTool(editor: Editor) {
  editor.setCurrentTool("line");
  editor.setStyleForNextShapes(DefaultColorStyle, "grey");
  editor.setStyleForNextShapes(DefaultDashStyle, "solid");
  editor.setStyleForNextShapes(DefaultSizeStyle, "m");
}

export function configureBasicShapeTool(editor: Editor) {
  editor.setCurrentTool("geo");
  editor.setStyleForNextShapes(GeoShapeGeoStyle, "rectangle");
  editor.setStyleForNextShapes(DefaultColorStyle, "grey");
  editor.setStyleForNextShapes(DefaultFillStyle, "none");
  editor.setStyleForNextShapes(DefaultDashStyle, "solid");
  editor.setStyleForNextShapes(DefaultSizeStyle, "m");
}

export function createPlannerWallSegment(editor: Editor) {
  const origin = editor.getViewportPageBounds().center;
  const indices = getIndices(2);
  const shapeId = createShapeId();
  editor.createShape({
    id: shapeId,
    type: "line",
    x: origin.x - toPageUnits(DEFAULT_WALL_SEGMENT_MM) / 2,
    y: origin.y,
    props: {
      color: "grey",
      dash: "solid",
      size: "m",
      spline: "line",
      scale: 1,
      points: {
        [indices[0]]: { id: indices[0], index: indices[0], x: 0, y: 0 },
        [indices[1]]: { id: indices[1], index: indices[1], x: toPageUnits(DEFAULT_WALL_SEGMENT_MM), y: 0 },
      },
    },
    meta: { isRoomShell: true, structureType: "wall-segment", text: "Wall Segment" },
  });
  editor.select(shapeId);
}

export function createPlannerDoorOpening(editor: Editor) {
  const origin = editor.getViewportPageBounds().center;
  const width = toPageUnits(DEFAULT_DOOR_OPENING_MM.width);
  const depth = toPageUnits(DEFAULT_DOOR_OPENING_MM.depth);
  const shapeId = createShapeId();
  editor.createShape({
    id: shapeId,
    type: "geo",
    x: origin.x - width / 2,
    y: origin.y - depth / 2,
    props: {
      geo: "rectangle",
      w: width,
      h: depth,
      color: "green",
      fill: "none",
      dash: "dashed",
      size: "m",
    },
    meta: { structureType: "door-opening", text: "Door Opening" },
  });
  editor.select(shapeId);
}

export function resolvePlannerWallJoins(editor: Editor, shapeIds?: PlannerShapeId[]) {
  const targets = editor
    .getCurrentPageShapes()
    .filter((shape): shape is PlannerLineShape => {
      const meta = readPlannerShapeMeta(shape.meta);
      return shape.type === "line" && !meta.isPlannerItem && !meta.isRoomDimension && (!shapeIds || shapeIds.includes(shape.id));
    });

  targets.forEach((shape) => {
    const endpoints = collectWallEndpoints(editor, shape.id);
    const normalizedPoints = normalizeLinePoints(getSortedLinePoints(shape)).map((point) => {
      const snapped = snapPagePointToEndpoints({ x: shape.x + point.x, y: shape.y + point.y }, endpoints);
      return { ...point, x: snapped.x - shape.x, y: snapped.y - shape.y };
    });

    editor.updateShapes([
      {
        id: shape.id,
        type: "line",
        props: {
          ...shape.props,
          points: buildLinePointRecord(normalizedPoints),
        },
      } as PlannerLineShape,
    ]);
  });
}

export function readPlannerSelectionDimensions(
  editor: Editor,
  selectionIds: PlannerShapeId[],
): PlannerSelectionDimensions | null {
  if (selectionIds.length !== 1) return null;
  const shape = editor.getShape(selectionIds[0]);
  if (!shape) return null;

  const meta = readPlannerShapeMeta(shape.meta);
  if (meta.isRoomDimension) return null;

  if (shape.type === "line") {
    const lineShape = shape as PlannerLineShape;
    const points = getSortedLinePoints(lineShape);
    if (points.length !== 2) return null;
    const totalLength = points.slice(1).reduce((total, point, index) => {
      const previous = points[index];
      return total + Math.hypot(point.x - previous.x, point.y - previous.y);
    }, 0);
    const widthMm = normalizePositiveMillimeters(toMillimeters(totalLength));
    if (widthMm === null) return null;
    return {
      shapeId: shape.id,
      shapeName: meta.text || "Wall segment",
      mode: "line",
      widthMm,
      heightMm: null,
    };
  }

  if ("props" in shape && shape.props && typeof shape.props === "object" && "w" in shape.props && "h" in shape.props && typeof shape.props.w === "number" && typeof shape.props.h === "number") {
    const widthMm = normalizePositiveMillimeters(toMillimeters(shape.props.w));
    const heightMm = normalizePositiveMillimeters(toMillimeters(shape.props.h));
    if (widthMm === null || heightMm === null) return null;

    return {
      shapeId: shape.id,
      shapeName: meta.text || (shape.type === "image" ? "Placed item" : "Planner shape"),
      mode: "box",
      widthMm,
      heightMm,
    };
  }

  return null;
}

export function updatePlannerSelectionDimensions(
  editor: Editor,
  selection: PlannerSelectionDimensions,
  next: { widthMm?: number; heightMm?: number | null },
) {
  const shape = editor.getShape(selection.shapeId);
  if (!shape) return false;

  const meta = readPlannerShapeMeta(shape.meta);
  if (meta.isRoomDimension) return false;

  if (selection.mode === "line" && shape.type === "line") {
    const lineShape = shape as PlannerLineShape;
    const points = getSortedLinePoints(lineShape);
    const widthMm = normalizePositiveMillimeters(next.widthMm);
    if (points.length !== 2 || widthMm === null) return false;
    const first = points[0];
    const last = points[points.length - 1];
    const isHorizontal = Math.abs(last.x - first.x) >= Math.abs(last.y - first.y);
    const updatedLast = isHorizontal
      ? { ...last, x: first.x + toPageUnits(widthMm), y: first.y }
      : { ...last, x: first.x, y: first.y + toPageUnits(widthMm) };
    const updatedPoints = [...points.slice(0, -1), updatedLast];

    editor.updateShapes([
      {
        id: shape.id,
        type: "line",
        props: {
          ...shape.props,
          points: buildLinePointRecord(updatedPoints),
        },
      } as PlannerLineShape,
    ]);
    return true;
  }

  if (
    "props" in shape &&
    shape.props &&
    typeof shape.props === "object" &&
    "w" in shape.props &&
    "h" in shape.props &&
    typeof shape.props.w === "number" &&
    typeof shape.props.h === "number"
  ) {
    const currentWidthMm = normalizePositiveMillimeters(toMillimeters(shape.props.w));
    const currentHeightMm = normalizePositiveMillimeters(toMillimeters(shape.props.h));
    if (currentWidthMm === null || currentHeightMm === null) return false;

    const widthMm =
      typeof next.widthMm === "undefined" ? currentWidthMm : normalizePositiveMillimeters(next.widthMm);
    const heightMm =
      typeof next.heightMm === "undefined" || next.heightMm === null
        ? currentHeightMm
        : normalizePositiveMillimeters(next.heightMm);
    if (widthMm === null || heightMm === null) return false;

    editor.updateShapes([
      {
        ...shape,
        props: {
          ...shape.props,
          w: toPageUnits(widthMm),
          h: toPageUnits(heightMm),
        },
      } as PlannerShape,
    ]);
    return true;
  }

  return false;
}

export function alignPlannerSelection(
  editor: Editor,
  selectionIds: PlannerShapeId[],
  operation: Parameters<Editor["alignShapes"]>[1],
) {
  if (selectionIds.length < 2) return;
  editor.alignShapes(selectionIds, operation);
}

export function distributePlannerSelection(
  editor: Editor,
  selectionIds: PlannerShapeId[],
  operation: Parameters<Editor["distributeShapes"]>[1],
) {
  if (selectionIds.length < 3) return;
  editor.distributeShapes(selectionIds, operation);
}
