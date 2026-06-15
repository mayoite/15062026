import type { Editor } from "tldraw";

import { setDefaultPlannerCamera } from "@/features/planner/editor/plannerCamera";

/** Remove every shape on the current page and reset the viewport. */
export function resetPlannerCanvas(editor: Editor): void {
  const ids = [...editor.getCurrentPageShapeIds()];
  if (ids.length > 0) {
    editor.deleteShapes(ids);
  }
  editor.selectNone();
  setDefaultPlannerCamera(editor);
  editor.clearHistory();
}

/** Ask before clearing the canvas; returns true when reset ran. */
export function confirmResetPlannerCanvas(editor: Editor): boolean {
  const count = editor.getCurrentPageShapes().length;
  if (count === 0) return false;

  const ok = window.confirm(
    `Clear all ${count} item${count === 1 ? "" : "s"} from the canvas? This cannot be undone.`,
  );
  if (!ok) return false;

  resetPlannerCanvas(editor);
  return true;
}
