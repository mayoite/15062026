import type { FabricDrawTool } from "@/features/planner/canvas-fabric/fabricDrawToolTypes";
import type { PlannerToolId } from "@/features/planner/editor/PlannerToolRail";
import type { Tool } from "@/features/planner/store/plannerTypes";

/** Map workspace tool rail state to Fabric draw-tool mode. */
export function plannerToolToFabricTool(tool: Tool): FabricDrawTool {
  switch (tool) {
    case "pan":
      return "pan";
    case "wall":
      return "wall";
    case "measure":
      return "measure";
    case "eraser":
      return "eraser";
    case "room":
    case "zone":
      return "rectangle";
    default:
      return "select";
  }
}

/** Highlight the correct rail button for the active planner tool. */
export function plannerToolToToolId(tool: Tool): PlannerToolId {
  switch (tool) {
    case "pan":
      return "hand";
    case "wall":
      return "planner-wall";
    case "room":
      return "planner-room";
    case "door":
    case "window":
      return "planner-door-window";
    case "furniture":
      return "planner-furniture";
    case "zone":
      return "planner-zone";
    case "measure":
      return "planner-measurement";
    case "eraser":
      return "eraser";
    default:
      return "select";
  }
}

/** Map Fabric sub-toolbar draw tool back to planner store + rail highlight. */
export function fabricToolToPlannerSelection(
  fabricTool: FabricDrawTool,
): { toolId: PlannerToolId; plannerTool: Tool } {
  switch (fabricTool) {
    case "pan":
      return { toolId: "hand", plannerTool: "pan" };
    case "wall":
      return { toolId: "planner-wall", plannerTool: "wall" };
    case "measure":
      return { toolId: "planner-measurement", plannerTool: "measure" };
    case "eraser":
      return { toolId: "eraser", plannerTool: "eraser" };
    case "rectangle":
      return { toolId: "planner-room", plannerTool: "room" };
    default:
      return { toolId: "select", plannerTool: "select" };
  }
}
