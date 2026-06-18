import { getPlannerFabricRuntime } from "@/features/planner/canvas-fabric";
import type { PlannerLayerCategory } from "@/features/planner/store/workspaceStore";

export function isShapeLayerHidden(_shape: unknown): boolean {
  return false;
}

export function applyLayerVisibility(
  _editor: null,
  layerVisible: Record<PlannerLayerCategory, boolean>,
): void {
  getPlannerFabricRuntime()?.setLayerVisibility(layerVisible);
}
