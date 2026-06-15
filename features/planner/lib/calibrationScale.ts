import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

/** Default: 1 canvas unit ≈ 1 cm → 10 mm per unit before blueprint calibration. */
export const DEFAULT_MM_PER_CANVAS_UNIT = 10;

export function getMmPerCanvasUnit(mmPerUnit: number | null | undefined): number {
  return mmPerUnit && mmPerUnit > 0 ? mmPerUnit : DEFAULT_MM_PER_CANVAS_UNIT;
}

export function getCalibrationScale(mmPerUnit: number | null | undefined): number {
  return getMmPerCanvasUnit(mmPerUnit) / DEFAULT_MM_PER_CANVAS_UNIT;
}

export function canvasUnitsToMillimeters(
  canvasUnits: number,
  mmPerUnit?: number | null,
): number {
  return Math.round(canvasUnits * getMmPerCanvasUnit(mmPerUnit));
}

export function millimetersToCanvasUnits(
  millimeters: number,
  mmPerUnit?: number | null,
): number {
  return millimeters / getMmPerCanvasUnit(mmPerUnit);
}

export function readMmPerCanvasUnit(): number {
  return getMmPerCanvasUnit(usePlannerWorkspaceStore.getState().blueprint.mmPerUnit);
}

/** Read live calibration from workspace store (non-hook for utilities). */
export function readCalibrationScale(): number {
  return getCalibrationScale(readMmPerCanvasUnit());
}
