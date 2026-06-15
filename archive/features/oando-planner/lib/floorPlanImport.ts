import type { Point } from "../data/plannerStore";

/**
 * Calculates the scale factor for the background image.
 * Given two points selected by the user on the image and the real-world distance in mm,
 * returns the ratio of planner-space pixels to background-image pixels.
 */
export function calculateCalibrationScale(
  p1: Point,
  p2: Point,
  realDistanceMm: number
): number {
  const pixelDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  if (pixelDistance === 0) return 1;

  // In OOFPL, 1px on the canvas represents 10mm (1cm) in the real world.
  // Therefore, the real-world distance in canvas pixels is: realDistanceMm / 10.
  // The scale factor is: target_pixels / image_pixels.
  return (realDistanceMm / 10) / pixelDistance;
}
