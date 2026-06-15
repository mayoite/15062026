/** Canvas grid spacing in planner canvas units (1 unit ≈ 1 cm at default calibration). */
export const PLANNER_GRID_MINOR_UNITS = 10;
export const PLANNER_GRID_MAJOR_UNITS = 100;

export function plannerGridScreenSpacing(zoom: number): { minorPx: number; majorPx: number } {
  const z = Math.max(0.05, zoom);
  return {
    minorPx: Math.max(4, PLANNER_GRID_MINOR_UNITS * z),
    majorPx: Math.max(20, PLANNER_GRID_MAJOR_UNITS * z),
  };
}