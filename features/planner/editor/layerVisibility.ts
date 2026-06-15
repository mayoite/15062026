import type { Editor, TLShape } from "tldraw";

import type { PlannerLayerCategory } from "../store/workspaceStore";

type ShapeMeta = TLShape["meta"];

const SHAPE_LAYER: Record<string, PlannerLayerCategory> = {
  "planner-wall": "walls",
  "planner-door": "walls",
  "planner-window": "walls",
  "planner-room": "rooms",
  "planner-zone": "zones",
  "planner-furniture": "furniture",
  "planner-measurement": "measurements",
};

export function isShapeLayerHidden(shape: { type: string; meta?: Record<string, unknown> }): boolean {
  return shape.meta?.layerHidden === true;
}

type LayerShape = {
  isLocked: boolean;
  meta?: ShapeMeta;
};

/**
 * Pure transform for a single shape's lock state + meta when toggling layer
 * visibility. tldraw shape `meta` must be JSON-serializable, so the result
 * never contains `undefined` values — keys are omitted instead of nulled out.
 */
export function nextLayerVisibilityUpdate(
  shape: LayerShape,
  visible: boolean,
): { isLocked: boolean; meta: ShapeMeta } {
  const wasLocked =
    typeof shape.meta?.layerWasLocked === "boolean" ? shape.meta.layerWasLocked : shape.isLocked;

  // Drop the previous restore-marker so it is never re-serialized as `undefined`.
  const { layerWasLocked: _previousLayerWasLocked, ...baseMeta } = shape.meta ?? {};

  if (visible) {
    return { isLocked: wasLocked, meta: { ...baseMeta, layerHidden: false } };
  }

  return {
    isLocked: true,
    meta: { ...baseMeta, layerHidden: true, layerWasLocked: wasLocked },
  };
}

export function applyLayerVisibility(
  editor: Editor,
  layerVisible: Record<PlannerLayerCategory, boolean>,
) {
  editor.run(() => {
    for (const shape of editor.getCurrentPageShapes()) {
      const category = SHAPE_LAYER[shape.type];
      if (!category) continue;

      const { isLocked, meta } = nextLayerVisibilityUpdate(shape, layerVisible[category]);

      editor.updateShape({
        id: shape.id,
        type: shape.type,
        isLocked,
        meta,
      });
    }
  });
}
