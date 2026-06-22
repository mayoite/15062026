import {
  getPlannerFabricRuntime,
  getPlannerFabricRuntimeState,
  subscribePlannerFabricRuntimeState,
} from "@/features/planner/canvas-fabric";
import type { InspectorData } from "@/features/planner/editor/inspector/inspectorTypes";
import { PLANNER_MM_PER_CANVAS_UNIT } from "@/features/planner/lib/canvasBounds";

export function shapeToInspectorData(shape: unknown): InspectorData | null {
  if (!shape || typeof shape !== "object") return null;
  const item = shape as Record<string, unknown>;
  const name = String(item.name ?? "").trim();
  if (!name) return null;

  const [type, ...rest] = name.split(":");
  return {
    id: String(item.id ?? name),
    type,
    label: rest.join(":") || type,
    widthMm: Math.round(
      (Number(item.width) || 0) * (Number(item.scaleX) || 1) * PLANNER_MM_PER_CANVAS_UNIT,
    ),
    heightMm: Math.round(
      (Number(item.height) || 0) * (Number(item.scaleY) || 1) * PLANNER_MM_PER_CANVAS_UNIT,
    ),
    rotation: Number(item.angle) || 0,
    isLocked: Boolean(item.lockMovementX) || item.selectable === false,
    color: typeof item.stroke === "string" ? item.stroke : undefined,
  };
}

export function readInspectorSelection(): InspectorData | null {
  const selections = getPlannerFabricRuntimeState().selections;
  return shapeToInspectorData(selections[0] ?? null);
}

export function syncSelectionFromEditor(
  _editor: null,
  onChange: (data: InspectorData | null) => void,
): () => void {
  onChange(readInspectorSelection());
  return subscribePlannerFabricRuntimeState(() => onChange(readInspectorSelection()));
}

export function applyInspectorChanges(
  _editor: null,
  _shapeId: string,
  changes: Partial<InspectorData>,
): void {
  const runtime = getPlannerFabricRuntime();
  if (!runtime) return;

  const selected = getPlannerFabricRuntimeState().selections[0];
  const current = shapeToInspectorData(selected);
  if (!current) return;

  const widthMm = changes.widthMm ?? current.widthMm;
  const heightMm = changes.heightMm ?? current.heightMm;
  if (widthMm > 0 && heightMm > 0) {
    runtime.resizeObject(current.id, widthMm, heightMm);
  }
}

export function deleteInspectorShape(_editor: null, _shapeId: string): void {
  // Delete action not wired from inspector yet.
}

export function duplicateInspectorShape(_editor: null, _shapeId: string): void {
  // Duplicate action not wired from inspector yet.
}
