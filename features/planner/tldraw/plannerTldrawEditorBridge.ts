import type { Editor } from "tldraw";

let plannerTldrawEditor: Editor | null = null;

/** Register the live workspace tldraw editor for store/tool bridges. */
export function registerPlannerTldrawEditor(editor: Editor): void {
  plannerTldrawEditor = editor;
}

/** Clear the editor reference on unmount. */
export function unregisterPlannerTldrawEditor(editor?: Editor | null): void {
  if (!editor || plannerTldrawEditor === editor) {
    plannerTldrawEditor = null;
  }
}

/** Returns the active planner workspace editor, if mounted. */
export function getPlannerTldrawEditor(): Editor | null {
  return plannerTldrawEditor;
}