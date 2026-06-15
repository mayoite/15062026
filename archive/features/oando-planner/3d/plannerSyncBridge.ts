import type { Editor } from "tldraw";
import type { Tool } from "../data/plannerTypes";

export const ZUSTAND_TOOL_TO_TLDRAW: Record<Tool, string> = {
  select: "select",
  pan: "hand",
  eraser: "eraser",
  wall: "planner-wall",
  room: "planner-room",
  door: "planner-door-window",
  window: "planner-door-window",
  furniture: "planner-furniture",
  measure: "planner-measurement",
  zone: "planner-zone",
};

export function activatePlannerTool(editor: Editor, zustandTool: string) {
  const tldrawToolId =
    zustandTool in ZUSTAND_TOOL_TO_TLDRAW
      ? ZUSTAND_TOOL_TO_TLDRAW[zustandTool as Tool]
      : "select";
  try {
    if (editor.getCurrentToolId() !== tldrawToolId) {
      editor.setCurrentTool(tldrawToolId);
    }
  } catch {
    // Ignore missing tool registrations in tests or partial mounts.
  }
}

export function syncPlannerGrid(editor: Editor, showGrid: boolean) {
  try {
    editor.updateInstanceState({ isGridMode: showGrid });
  } catch {
    // Ignore if the editor instance is not ready yet.
  }
}
