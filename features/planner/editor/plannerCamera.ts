import type { Editor } from "tldraw";

/** Default empty floor visible area — millimetres on the plan (≈16m × 12m). */
export const PLANNER_DEFAULT_FLOOR_BOUNDS = {
  x: -800,
  y: -600,
  w: 16_000,
  h: 12_000,
};

const FIT_PADDING = 140;

export function configurePlannerCamera(editor: Editor) {
  try {
    editor.setCameraOptions({ isLocked: false });
  } catch {
    // Camera options vary by tldraw version — non-fatal.
  }
}

/** Zoom out so users see a full floor slab before placing furniture. */
export function setDefaultPlannerCamera(editor: Editor) {
  try {
    editor.zoomToBounds(PLANNER_DEFAULT_FLOOR_BOUNDS, {
      inset: FIT_PADDING,
    });
  } catch {
    editor.setCamera({ x: 7600, y: 5400, z: 0.32 });
  }
}

/** Fit all page content with generous padding (templates, restored plans). */
export function fitPlannerContent(editor: Editor) {
  const shapes = editor.getCurrentPageShapes();
  if (shapes.length === 0) {
    setDefaultPlannerCamera(editor);
    return;
  }

  try {
    editor.zoomToFit();
  } catch {
    setDefaultPlannerCamera(editor);
  }
}
