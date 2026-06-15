import type { Editor } from "tldraw";

import { isShapeLayerHidden } from "@/features/planner/editor/layerVisibility";
import type { PlanMetrics } from "@/features/planner/editor/planMetrics";

export type PlannerStep = "room" | "catalog" | "measure" | "review";

export const PLANNER_STEPS: PlannerStep[] = ["room", "catalog", "measure", "review"];

export const PLANNER_STEP_LABELS: Record<PlannerStep, string> = {
  room: "Space",
  catalog: "Catalog",
  measure: "Measure",
  review: "Review",
};

export interface PlannerStepGates {
  hasSpaceShell: boolean;
  hasFurniture: boolean;
  hasMeasurement: boolean;
  measurementCount: number;
  canAdvanceFromRoom: boolean;
  canAdvanceFromCatalog: boolean;
  canAdvanceFromMeasure: boolean;
  canOpenExport: boolean;
}

export function countMeasurementShapes(editor: Editor | null): number {
  if (!editor) return 0;

  return editor.getCurrentPageShapes().filter((shape) => {
    if (isShapeLayerHidden(shape)) return false;
    return shape.type === "planner-measurement" || shape.type === "line";
  }).length;
}

export function evaluatePlannerStepGates(
  editor: Editor | null,
  metrics: PlanMetrics,
): PlannerStepGates {
  const measurementCount = countMeasurementShapes(editor);
  const hasSpaceShell =
    metrics.wallCount > 0 || metrics.roomAreaSqm > 0 || metrics.zoneAreaSqm > 0;
  const hasFurniture = metrics.furnitureCount > 0;
  const hasMeasurement = metrics.wallCount > 0 || measurementCount > 0;

  return {
    hasSpaceShell,
    hasFurniture,
    hasMeasurement,
    measurementCount,
    canAdvanceFromRoom: hasSpaceShell,
    canAdvanceFromCatalog: hasFurniture,
    canAdvanceFromMeasure: hasMeasurement,
    canOpenExport: hasFurniture && hasSpaceShell,
  };
}

export function getDisabledPlannerSteps(gates: PlannerStepGates): Partial<Record<PlannerStep, boolean>> {
  return {
    catalog: !gates.hasSpaceShell,
    measure: !gates.hasFurniture,
    review: !gates.hasMeasurement,
  };
}

export function getPlannerStepHint(step: PlannerStep, gates: PlannerStepGates): string {
  switch (step) {
    case "room":
      return gates.hasSpaceShell
        ? "Space shell is set. Continue to place Oando catalog items."
        : "Draw walls or add a room zone to define the space.";
    case "catalog":
      return gates.hasFurniture
        ? "Catalog items placed. Measure spans or continue to review."
        : "Drag workstations and storage from the library onto the canvas.";
    case "measure":
      return gates.hasMeasurement
        ? "Measurements captured. Review the layout and export BOQ."
        : "Use the measure tool or typed wall lengths to confirm dimensions.";
    case "review":
      return gates.canOpenExport
        ? "Plan is ready for branded PDF export and quote handoff."
        : "Add space shell and at least one catalog item before export.";
    default:
      return "";
  }
}

export function getPlannerStepActionLabel(step: PlannerStep): string {
  switch (step) {
    case "room":
      return "Continue to Catalog";
    case "catalog":
      return "Continue to Measure";
    case "measure":
      return "Continue to Review";
    case "review":
      return "Open Export";
    default:
      return "Continue";
  }
}

export function canAdvancePlannerStep(step: PlannerStep, gates: PlannerStepGates): boolean {
  switch (step) {
    case "room":
      return gates.canAdvanceFromRoom;
    case "catalog":
      return gates.canAdvanceFromCatalog;
    case "measure":
      return gates.canAdvanceFromMeasure;
    case "review":
      return gates.canOpenExport;
    default:
      return false;
  }
}

export function nextPlannerStep(step: PlannerStep): PlannerStep | null {
  const index = PLANNER_STEPS.indexOf(step);
  if (index < 0 || index >= PLANNER_STEPS.length - 1) return null;
  return PLANNER_STEPS[index + 1] ?? null;
}
