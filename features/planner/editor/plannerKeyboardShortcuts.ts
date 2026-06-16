import type { PlannerToolId } from "@/features/planner/editor/PlannerToolRail";

export type PlannerKeyboardPlannerTool =
  | "select"
  | "pan"
  | "wall"
  | "room"
  | "door"
  | "window"
  | "furniture"
  | "zone"
  | "measure"
  | "eraser";

export interface PlannerToolBinding {
  toolId: PlannerToolId;
  plannerTool: PlannerKeyboardPlannerTool;
}

export const PLANNER_TOOL_KEY_BINDINGS: Record<string, PlannerToolBinding> = {
  v: { toolId: "select", plannerTool: "select" },
  h: { toolId: "hand", plannerTool: "pan" },
  w: { toolId: "planner-wall", plannerTool: "wall" },
  r: { toolId: "planner-room", plannerTool: "room" },
  d: { toolId: "planner-door-window", plannerTool: "door" },
  f: { toolId: "planner-furniture", plannerTool: "furniture" },
  z: { toolId: "planner-zone", plannerTool: "zone" },
  m: { toolId: "planner-measurement", plannerTool: "measure" },
  x: { toolId: "eraser", plannerTool: "eraser" },
};

export function resolvePlannerToolKey(event: KeyboardEvent): PlannerToolBinding | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null;
  const target = event.target as HTMLElement | null;
  if (!target) return null;

  if (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  ) {
    return null;
  }

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
  if (key === "d" && event.shiftKey) {
    return { toolId: "planner-door-window", plannerTool: "window" };
  }
  if (event.shiftKey) return null;

  return PLANNER_TOOL_KEY_BINDINGS[key] ?? null;
}
