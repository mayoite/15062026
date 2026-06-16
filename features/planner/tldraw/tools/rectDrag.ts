import { Vec } from "@tldraw/editor";

export type NormalizedRectDrag = {
  origin: Vec;
  width: number;
  height: number;
  points: Array<{ x: number; y: number }>;
};

/** Normalize a rectangle drag so up/left directions use a positive local box. */
export function normalizeRectDrag(start: Vec, current: Vec, minSize = 1): NormalizedRectDrag {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const width = Math.max(minSize, Math.abs(dx));
  const height = Math.max(minSize, Math.abs(dy));
  const origin = new Vec(dx < 0 ? current.x : start.x, dy < 0 ? current.y : start.y);

  return {
    origin,
    width,
    height,
    points: [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
  };
}

export function isPlannerCanvasDragToolId(toolId: string): boolean {
  return /\.(drawing|placing)$/.test(toolId);
}