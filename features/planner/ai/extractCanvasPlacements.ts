import type { CanvasPlacementSummary } from "./types";

/** Fabric-era stub — placements come from fabric canvas, not tldraw shapes. */
export function extractCanvasPlacements(_editor?: null): CanvasPlacementSummary[] {
  return [];
}