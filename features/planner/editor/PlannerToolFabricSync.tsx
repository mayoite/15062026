"use client";

import { useEffect } from "react";

import { useFloorplan } from "@/features/planner/canvas-fabric";
import { plannerToolToFabricTool } from "@/features/planner/editor/plannerToolFabricBridge";
import { usePlannerStore } from "@/features/planner/store/plannerStore";

/** Push planner store tool selection into Fabric draw mode. */
export function PlannerToolFabricSync() {
  const plannerTool = usePlannerStore((s) => s.tool);
  const { drawTool, setDrawTool } = useFloorplan();

  useEffect(() => {
    const nextFabricTool = plannerToolToFabricTool(plannerTool);
    if (drawTool !== nextFabricTool) {
      setDrawTool(nextFabricTool);
    }
  }, [drawTool, plannerTool, setDrawTool]);

  return null;
}
