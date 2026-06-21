// The canonical scale is 10 mm per fabric unit.
export function canvasUnitsToMillimeters(units: number): number {
  return Math.round(units * 10);
}

export function millimetersToCanvasUnits(mm: number): number {
  return Math.round(mm / 10);
}
