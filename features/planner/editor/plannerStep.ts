import type { PlanMetrics } from "@/features/planner/editor/planMetrics";
import { getPlannerFabricRuntimeState } from "@/features/planner/canvas-fabric";

export type PlannerStep = "draw" | "place" | "review";
export const PLANNER_STEPS: PlannerStep[] = ["draw", "place", "review"];

export const PLANNER_STEP_LABELS: Record<PlannerStep, string> = {
  draw: "Draw",
  place: "Place",
  review: "Review",
};

export const PLANNER_STEP_DETAILS: Record<PlannerStep, string> = {
  draw: "Walls, rooms",
  place: "Furniture, doors, windows",
  review: "Measurements, properties, export",
};

export interface PlannerStepGates {
  hasSpaceShell: boolean;
  hasFurniture: boolean;
  hasMeasurement: boolean;
  measurementCount: number;
  canOpenExport: boolean;
}

export function countMeasurementShapes(): number {
  try {
    const serializedDraft = getPlannerFabricRuntimeState().serializedDraft;
    if (!serializedDraft) return 0;
    const snapshot = JSON.parse(serializedDraft) as { objects?: Record<string, unknown>[] };
    const objects = snapshot.objects;
    if (!Array.isArray(objects)) return 0;
    return objects.filter((obj) => String(obj.name || "").startsWith("DRAW:measure")).length;
  } catch {
    return 0;
  }
}

export function evaluatePlannerStepGates(
  _editor: null,
  metrics: PlanMetrics,
): PlannerStepGates {
  const measurementCount = countMeasurementShapes();
  const hasSpaceShell =
    metrics.wallCount > 0 || metrics.roomAreaSqm > 0 || metrics.zoneAreaSqm > 0;
  const hasFurniture = metrics.furnitureCount > 0;
  const hasMeasurement = metrics.wallCount > 0 || measurementCount > 0;

  return {
    hasSpaceShell,
    hasFurniture,
    hasMeasurement,
    measurementCount,
    canOpenExport: hasFurniture && hasSpaceShell,
  };
}

export function getDisabledPlannerSteps(gates: PlannerStepGates): Partial<Record<PlannerStep, boolean>> {
  void gates;
  return {};
}

export function getPlannerStepHint(step: PlannerStep, gates: PlannerStepGates): string {
  switch (step) {
    case "draw":
      return gates.hasSpaceShell
        ? "Space shell is ready. Keep refining walls and rooms, or jump to Place to add products."
        : "Start by drawing walls and rooms to define the space.";
    case "place":
      return gates.hasFurniture
        ? "Furniture and openings are in place. Keep arranging, or jump to Review for dimensions and export."
        : "Use the library for furniture, then place doors and windows directly on the canvas.";
    case "review":
      return gates.canOpenExport
        ? "Measurements, properties, and export are ready whenever you are."
        : "Review measurements and properties here. Export unlocks once the space shell and furniture are in place.";
    default:
      return "";
  }
}

export function getPlannerStepActionLabel(step: PlannerStep): string {
  switch (step) {
    case "draw":
      return "Go to Place";
    case "place":
      return "Go to Review";
    case "review":
      return "Open Export";
    default:
      return "Continue";
  }
}

export function canAdvancePlannerStep(step: PlannerStep, gates: PlannerStepGates): boolean {
  switch (step) {
    case "draw":
    case "place":
      return true;
    case "review":
      return gates.canOpenExport;
    default:
      return false;
  }
}

export function previousPlannerStep(step: PlannerStep): PlannerStep | null {
  const index = PLANNER_STEPS.indexOf(step);
  if (index <= 0) return null;
  return PLANNER_STEPS[index - 1] ?? null;
}

export function nextPlannerStep(step: PlannerStep): PlannerStep | null {
  const index = PLANNER_STEPS.indexOf(step);
  if (index < 0 || index >= PLANNER_STEPS.length - 1) return null;
  return PLANNER_STEPS[index + 1] ?? null;
}
