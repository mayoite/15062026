import {
  PLANNER_MM_PER_CANVAS_UNIT,
  canvasUnitsToMillimeters as boundsCanvasUnitsToMillimeters,
  millimetersToCanvasUnits as boundsMillimetersToCanvasUnits,
} from "./canvasBounds";

export { PLANNER_MM_PER_CANVAS_UNIT };

/** The canonical scale is 10 mm per fabric unit. */
export function canvasUnitsToMillimeters(units: number): number {
  return boundsCanvasUnitsToMillimeters(units);
}

export function millimetersToCanvasUnits(mm: number): number {
  return boundsMillimetersToCanvasUnits(mm);
}
