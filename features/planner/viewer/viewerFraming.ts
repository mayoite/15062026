/**
 * Pure scene-bounds and camera-framing helpers for the planner 3D viewer.
 * Canvas units are centimetres (catalog compact dims); world units are metres.
 */

import type { PlannerViewerShape } from "./PlannerViewer";

export const CANVAS_UNITS_TO_M = 0.01;

export interface SceneBounds {
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
  hasShapes: boolean;
}

const EMPTY_BOUNDS: SceneBounds = {
  minX: -1000,
  minZ: -1000,
  maxX: 1000,
  maxZ: 1000,
  hasShapes: false,
};

/** Axis-aligned bounds of all shapes in canvas units (cm). */
export function computeSceneBounds(shapes: PlannerViewerShape[]): SceneBounds {
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  let hasShapes = false;

  for (const shape of shapes) {
    hasShapes = true;
    if (shape.type === "planner-wall" && shape.wall) {
      minX = Math.min(minX, shape.wall.startX, shape.wall.endX);
      minZ = Math.min(minZ, shape.wall.startY, shape.wall.endY);
      maxX = Math.max(maxX, shape.wall.startX, shape.wall.endX);
      maxZ = Math.max(maxZ, shape.wall.startY, shape.wall.endY);
      continue;
    }
    minX = Math.min(minX, shape.x);
    minZ = Math.min(minZ, shape.y);
    maxX = Math.max(maxX, shape.x + shape.width);
    maxZ = Math.max(maxZ, shape.y + shape.height);
  }

  if (!hasShapes) return EMPTY_BOUNDS;
  return { minX, minZ, maxX, maxZ, hasShapes: true };
}

/** Bounds centre in world metres. */
export function boundsCenter(bounds: SceneBounds): { cx: number; cz: number } {
  return {
    cx: ((bounds.minX + bounds.maxX) / 2) * CANVAS_UNITS_TO_M,
    cz: ((bounds.minZ + bounds.maxZ) / 2) * CANVAS_UNITS_TO_M,
  };
}

/** Largest horizontal span in world metres, floored to keep small scenes framed sensibly. */
export function boundsExtent(bounds: SceneBounds, minExtent = 5): number {
  return Math.max(
    (bounds.maxX - bounds.minX) * CANVAS_UNITS_TO_M,
    (bounds.maxZ - bounds.minZ) * CANVAS_UNITS_TO_M,
    minExtent,
  );
}

export interface FrameToContentResult {
  position: [number, number, number];
  target: [number, number, number];
}

/**
 * Computes a camera position and target that frame all provided shapes
 * in the 3D view (45° three-quarter view fitted to the content extent).
 */
export function frameToContent(shapes: PlannerViewerShape[]): FrameToContentResult {
  if (shapes.length === 0) {
    return { position: [0, 10, 10], target: [0, 0, 0] };
  }

  const bounds = computeSceneBounds(shapes);
  const { cx, cz } = boundsCenter(bounds);
  const extent = boundsExtent(bounds);

  const distance = extent * 1.2;
  const height = extent * 0.8;

  return {
    position: [cx + distance * 0.7, height, cz + distance * 0.7],
    target: [cx, 0, cz],
  };
}
