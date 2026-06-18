// @ts-nocheck — legacy tldraw measurements; fabric migration in progress.
"use client";

import { type Editor, type TLLineShape } from "@/features/planner/shared/types/legacyEditorStub";

import type { PlannerShapeMeta } from "@/features/planner/shared/types/planner";
import { canvasUnitsToMillimeters } from "@/features/planner/lib/calibrationScale";
import type { PlannerUnitSystem } from "../model";

export interface CanvasMeasurement {
  id: string;
  caption: string;
  value: string;
  x: number;
  y: number;
  rotateDeg?: number;
  tone?: "room" | "selection";
}

export type MeasurementUnit = "mm" | "ft-in";

type PlannerShape = ReturnType<Editor["getCurrentPageShapes"]>[number];
type PlannerBounds = NonNullable<ReturnType<Editor["getShapePageBounds"]>>;
type PlannerLinePoint = TLLineShape["props"]["points"][string];
type PlannerShapeId = ReturnType<Editor["getSelectedShapeIds"]>[number];

const MM_PER_INCH = 25.4;
const INCHES_PER_FOOT = 12;

export interface PlannerGridState {
  originX: number;
  originY: number;
  zoom: number;
}

export interface DerivedViewportState {
  zoomPercent: number;
  gridState: PlannerGridState;
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
  roomMetrics: string;
  selectedMetrics: string | null;
  canvasMeasurements: CanvasMeasurement[];
}

export const PLANNER_MEASUREMENT_DISPLAY_RULES = {
  mm: {
    label: "mm",
    source: "canonical-mm",
    precision: "whole-mm",
  },
  "ft-in": {
    label: "ft-in",
    source: "canonical-mm",
    precision: "nearest-inch",
  },
} as const;

export function plannerUnitSystemToMeasurementUnit(unitSystem: PlannerUnitSystem | null | undefined): MeasurementUnit {
  return unitSystem === "imperial" ? "ft-in" : "mm";
}

export function formatMillimeters(mm: number) {
  return `${Math.round(mm).toLocaleString("en-IN")} mm`;
}

export function formatFeetAndInches(mm: number) {
  const totalInches = Math.max(0, Math.round(mm / MM_PER_INCH));
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const inches = totalInches % INCHES_PER_FOOT;
  return `${feet}' ${inches}"`;
}

export function formatLength(mm: number, unitSystem: MeasurementUnit) {
  return unitSystem === "ft-in" ? formatFeetAndInches(mm) : formatMillimeters(mm);
}

export function formatMeasurementInputValue(mm: number, unitSystem: MeasurementUnit) {
  return unitSystem === "ft-in" ? formatFeetAndInches(mm) : String(Math.round(mm));
}

function parseMetricMeasurementInput(value: string) {
  const normalized = value.trim().replace(/,/g, "").replace(/\s*mm$/i, "");
  if (normalized.length === 0) return null;

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.round(parsed);
}

function parseFeetAndInchesInput(value: string) {
  const normalized = value.trim().toLowerCase().replace(/′/g, "'").replace(/″/g, '"');
  if (normalized.length === 0) return null;

  const feetAndInchesMatch = normalized.match(
    /^(?:([+-]?\d+(?:\.\d+)?)\s*(?:'|ft|feet))?\s*(?:([+-]?\d+(?:\.\d+)?)\s*(?:"|in|inch|inches))?$/,
  );

  if (feetAndInchesMatch) {
    const feetRaw = feetAndInchesMatch[1];
    const inchesRaw = feetAndInchesMatch[2];
    const feetValue = feetRaw ? Number.parseFloat(feetRaw) : 0;
    const inchesValue = inchesRaw ? Number.parseFloat(inchesRaw) : 0;

    if (
      (feetRaw || inchesRaw) &&
      Number.isFinite(feetValue) &&
      Number.isFinite(inchesValue)
    ) {
      const totalInches = feetValue * INCHES_PER_FOOT + inchesValue;
      return totalInches > 0 ? Math.round(totalInches * MM_PER_INCH) : null;
    }
  }

  const plainPairMatch = normalized.match(/^(\d+)\s+(\d+(?:\.\d+)?)$/);
  if (!plainPairMatch) return null;

  const feetValue = Number.parseFloat(plainPairMatch[1]);
  const inchesValue = Number.parseFloat(plainPairMatch[2]);
  if (!Number.isFinite(feetValue) || !Number.isFinite(inchesValue)) return null;

  const totalInches = feetValue * INCHES_PER_FOOT + inchesValue;
  return totalInches > 0 ? Math.round(totalInches * MM_PER_INCH) : null;
}

export function parseMeasurementInput(value: string, unitSystem: MeasurementUnit) {
  return unitSystem === "ft-in" ? parseFeetAndInchesInput(value) : parseMetricMeasurementInput(value);
}

export function formatMetricFromBounds(bounds: { w: number; h: number }, unitSystem: MeasurementUnit) {
  return `W ${formatLength(canvasUnitsToMillimeters(bounds.w), unitSystem)} x H ${formatLength(canvasUnitsToMillimeters(bounds.h), unitSystem)}`;
}

export function formatDimensionPair(widthMm: number, depthMm: number, unitSystem: MeasurementUnit) {
  return `${formatLength(widthMm, unitSystem)} x ${formatLength(depthMm, unitSystem)}`;
}

export function formatArea(areaMm2: number, unitSystem: MeasurementUnit) {
  if (unitSystem === "ft-in") {
    return `${(areaMm2 / 92903.04).toFixed(1)} sq ft`;
  }

  return `${(areaMm2 / 1000000).toFixed(1)} m2`;
}

export function getShapeMeta(meta: unknown): PlannerShapeMeta {
  return meta && typeof meta === "object" ? (meta as PlannerShapeMeta) : {};
}

export function getStructuralShapes(editor: Editor) {
  return editor
    .getCurrentPageShapes()
    .filter((shape) => {
      const meta = getShapeMeta(shape.meta);
      return !meta.isPlannerItem && !meta.isRoomDimension;
    });
}

function getLinePoints(shape: PlannerShape): PlannerLinePoint[] {
  if (shape.type !== "line") return [];

  return Object.values(shape.props.points)
    .filter((point): point is PlannerLinePoint => {
      return (
        typeof point.id === "string" &&
        typeof point.index === "string" &&
        typeof point.x === "number" &&
        typeof point.y === "number"
      );
    })
    .sort((left, right) => left.index.localeCompare(right.index));
}

function getMergedBounds(boundsList: PlannerBounds[]) {
  if (boundsList.length === 0) return null;

  const minX = Math.min(...boundsList.map((bounds) => bounds.minX));
  const minY = Math.min(...boundsList.map((bounds) => bounds.minY));
  const maxX = Math.max(...boundsList.map((bounds) => bounds.maxX));
  const maxY = Math.max(...boundsList.map((bounds) => bounds.maxY));

  return {
    minX,
    minY,
    maxX,
    maxY,
    w: maxX - minX,
    h: maxY - minY,
  };
}

export function getMetricLabelForShape(editor: Editor, shapeId: PlannerShapeId, unitSystem: MeasurementUnit) {
  const shape = editor.getShape(shapeId);
  const bounds = editor.getShapePageBounds(shapeId);

  if (!shape || !bounds) return null;

  if (shape.type === "line") {
    const points = getLinePoints(shape);

    if (points.length >= 2) {
      const length = points.slice(1).reduce((total, point, index) => {
        const previous = points[index];
        return total + Math.hypot(point.x - previous.x, point.y - previous.y);
      }, 0);

      return `Length ${formatLength(canvasUnitsToMillimeters(length), unitSystem)}`;
    }
  }

  return formatMetricFromBounds(bounds, unitSystem);
}

export function deriveViewportState(
  editor: Editor,
  selectionIds: PlannerShapeId[],
  unitSystem: MeasurementUnit
): DerivedViewportState {
  const camera = editor.getCamera();
  const pageOrigin = editor.pageToViewport({ x: 0, y: 0 });

  const structuralBounds = getStructuralShapes(editor)
    .map((shape) => editor.getShapePageBounds(shape.id))
    .filter((bounds): bounds is PlannerBounds => bounds !== null);
  const mergedStructuralBounds = getMergedBounds(structuralBounds);
  const selectionBounds = selectionIds.length > 0 ? editor.getSelectionPageBounds() : null;
  const selectionLabel =
    selectionIds.length === 1
      ? getMetricLabelForShape(editor, selectionIds[0], unitSystem)
      : selectionBounds
        ? formatMetricFromBounds(selectionBounds, unitSystem)
        : null;
  const selectionShape = selectionIds.length === 1 ? editor.getShape(selectionIds[0]) : null;

  const canvasMeasurements: CanvasMeasurement[] = [];

  if (mergedStructuralBounds) {
    const roomWidthAnchor = editor.pageToViewport({
      x: mergedStructuralBounds.minX + mergedStructuralBounds.w / 2,
      y: mergedStructuralBounds.minY,
    });
    const roomHeightAnchor = editor.pageToViewport({
      x: mergedStructuralBounds.maxX,
      y: mergedStructuralBounds.minY + mergedStructuralBounds.h / 2,
    });

    canvasMeasurements.push({
      id: "room-width",
      caption: "Room width",
      value: formatLength(canvasUnitsToMillimeters(mergedStructuralBounds.w), unitSystem),
      x: Math.round(roomWidthAnchor.x),
      y: Math.max(104, Math.round(roomWidthAnchor.y) - 34),
      tone: "room",
    });
    canvasMeasurements.push({
      id: "room-height",
      caption: "Room depth",
      value: formatLength(canvasUnitsToMillimeters(mergedStructuralBounds.h), unitSystem),
      x: Math.round(roomHeightAnchor.x) + 34,
      y: Math.max(124, Math.round(roomHeightAnchor.y)),
      rotateDeg: 90,
      tone: "room",
    });
  }

  if (selectionBounds && selectionLabel) {
    const selectionAnchor = editor.pageToViewport({
      x: selectionBounds.minX + selectionBounds.w / 2,
      y: selectionBounds.minY,
    });

    canvasMeasurements.push({
      id: "selection-metrics",
      caption: selectionShape?.type === "line" ? "Wall span" : "Selection",
      value: selectionLabel,
      x: Math.round(selectionAnchor.x),
      y: Math.max(104, Math.round(selectionAnchor.y) - 34),
      tone: "selection",
    });
  }

  return {
    zoomPercent: Math.round(camera.z * 100),
    gridState: { originX: pageOrigin.x, originY: pageOrigin.y, zoom: camera.z },
    hasSelection: selectionIds.length > 0,
    canUndo: editor.canUndo(),
    canRedo: editor.canRedo(),
    roomMetrics: mergedStructuralBounds ? formatMetricFromBounds(mergedStructuralBounds, unitSystem) : "No room shell yet",
    selectedMetrics: selectionIds.length > 0 ? selectionLabel ?? null : null,
    canvasMeasurements,
  };
}
