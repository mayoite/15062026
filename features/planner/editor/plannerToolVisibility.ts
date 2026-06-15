import type { PlannerStep } from "@/features/planner/editor/plannerStep";
import type { ToolDef } from "@/features/planner/editor/PlannerToolRail";

export type PlannerToolVisibilityMode = "balanced" | "step" | "all";

export const PLANNER_TOOL_VISIBILITY_MODES: PlannerToolVisibilityMode[] = [
  "balanced",
  "step",
  "all",
];

export const PLANNER_TOOL_VISIBILITY_LABELS: Record<PlannerToolVisibilityMode, string> = {
  balanced: "Balanced",
  step: "Step-focused",
  all: "All tools",
};

const NAVIGATE_TOOLS = new Set<ToolDef["plannerTool"]>(["select", "pan"]);

const BALANCED_BY_STEP: Record<PlannerStep, Set<ToolDef["plannerTool"]>> = {
  draw: new Set(["wall", "room", "zone", "measure"]),
  place: new Set(["furniture", "door", "window", "wall", "zone"]),
  review: new Set(["measure", "furniture", "zone", "wall"]),
};

const STEP_FOCUSED_BY_STEP: Record<PlannerStep, Set<ToolDef["plannerTool"]>> = {
  draw: new Set(["wall", "room", "zone"]),
  place: new Set(["furniture", "door", "window", "wall"]),
  review: new Set(["measure"]),
};

export function isPlannerToolVisible(
  step: PlannerStep,
  tool: ToolDef,
  mode: PlannerToolVisibilityMode = "balanced",
): boolean {
  if (mode === "all") return true;
  if (NAVIGATE_TOOLS.has(tool.plannerTool)) return true;

  const allowed =
    mode === "step" ? STEP_FOCUSED_BY_STEP[step] : BALANCED_BY_STEP[step];
  return allowed?.has(tool.plannerTool) ?? true;
}

const STORAGE_KEY = "planner-tool-visibility-mode";

export function readPlannerToolVisibilityMode(): PlannerToolVisibilityMode {
  if (typeof window === "undefined") return "balanced";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "balanced" || stored === "step" || stored === "all") return stored;
  return "balanced";
}

export function writePlannerToolVisibilityMode(mode: PlannerToolVisibilityMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, mode);
}

export function isPlannerDevToolsEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}