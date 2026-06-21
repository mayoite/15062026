import type { PlannerToolBinding } from "@/features/planner/editor/plannerKeyboardShortcuts";
import type { PlannerStep } from "@/features/planner/editor/plannerStep";

export type PlannerLeftTab = "library" | "ai-assist";

export function getStepToolBinding(step: PlannerStep): PlannerToolBinding {
  switch (step) {
    case "draw":
      return { toolId: "planner-wall", plannerTool: "wall" };
    case "place":
      return { toolId: "planner-furniture", plannerTool: "furniture" };
    case "review":
      return { toolId: "planner-measurement", plannerTool: "measure" };
    default:
      return { toolId: "select", plannerTool: "select" };
  }
}

export function getStepLeftTab(step: PlannerStep): PlannerLeftTab {
  switch (step) {
    case "draw":
      return "library";
    case "place":
      return "library";
    case "review":
      return "library";
    default:
      return "library";
  }
}
