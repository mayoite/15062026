"use client";

import { PlannerToolRail, type PlannerToolId } from "@/features/planner/editor/PlannerToolRail";
import type { PlannerStep } from "@/features/planner/editor/plannerStep";
import type { PlannerToolVisibilityMode } from "@/features/planner/editor/plannerToolVisibility";
import type { PlannerTooltipSide } from "@/features/planner/ui/PlannerTooltip";

type PlannerStoreTool =
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

interface ToolsChromeProps {
  activeTool: PlannerToolId;
  activePlannerTool: PlannerStoreTool;
  step: PlannerStep;
  visibilityMode: PlannerToolVisibilityMode;
  tooltipSide: PlannerTooltipSide;
  onSelect: (tool: PlannerToolId, plannerTool: PlannerStoreTool) => void;
}

export function ToolsChrome({
  activeTool,
  activePlannerTool,
  step,
  visibilityMode,
  tooltipSide,
  onSelect,
}: ToolsChromeProps) {
  return (
    <PlannerToolRail
      activeTool={activeTool}
      activePlannerTool={activePlannerTool}
      step={step}
      visibilityMode={visibilityMode}
      tooltipSide={tooltipSide}
      onSelect={onSelect}
    />
  );
}
