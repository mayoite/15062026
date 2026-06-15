import type { PlannerToolBinding } from "@/features/planner/editor/plannerKeyboardShortcuts";
import type { PlannerStep } from "@/features/planner/editor/plannerStep";

export type PlannerLeftTab = "library" | "blueprint" | "ai-assist";

export function getStepToolBinding(step: PlannerStep): PlannerToolBinding {
  switch (step) {
    case "room":
      return { toolId: "planner-wall", plannerTool: "wall" };
    case "catalog":
      return { toolId: "planner-furniture", plannerTool: "furniture" };
    case "measure":
      return { toolId: "planner-measurement", plannerTool: "measure" };
    case "review":
      return { toolId: "select", plannerTool: "select" };
    default:
      return { toolId: "select", plannerTool: "select" };
  }
}

export function getStepLeftTab(step: PlannerStep): PlannerLeftTab {
  return step === "room" ? "blueprint" : "library";
}
