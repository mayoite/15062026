import type { PlannerCanvasShape } from "@/features/planner/editor/plannerShapeFactories";
import type { SuggestedLayoutJson } from "./types";

/** Fabric-era stub — AI layout apply disabled until fabric bridge is wired. */
export function buildShapesFromSuggestedLayout(_layout: SuggestedLayoutJson): PlannerCanvasShape[] {
  return [];
}

export function applySuggestedLayout(_editor?: null, _layout?: SuggestedLayoutJson): void {
  // No-op: fabric canvas does not accept tldraw shapes.
}