import { describe, expect, it } from "vitest";

import {
  PLANNER_TLDRAW_SHAPE_UTILS,
  PLANNER_TLDRAW_TOOLS,
} from "@/features/planner/tldraw/plannerTldrawRegistration";
import { PLANNER_SHAPE_UTILS } from "@/features/planner/tldraw/shapes";
import {
  PlannerDoorWindowTool,
  PlannerFurnitureTool,
  PlannerMeasurementTool,
  PlannerRoomTool,
  PlannerWallTool,
  PlannerZoneTool,
} from "@/features/planner/tldraw/tools";

describe("plannerTldrawRegistration", () => {
  it("re-exports shape utils from shapes module", () => {
    expect(PLANNER_TLDRAW_SHAPE_UTILS).toBe(PLANNER_SHAPE_UTILS);
    expect(PLANNER_TLDRAW_SHAPE_UTILS.length).toBe(7);
  });

  it("registers all planner tools in canonical order", () => {
    expect(PLANNER_TLDRAW_TOOLS).toEqual([
      PlannerWallTool,
      PlannerRoomTool,
      PlannerFurnitureTool,
      PlannerDoorWindowTool,
      PlannerMeasurementTool,
      PlannerZoneTool,
    ]);
  });

  it("each tool exposes a stable id", () => {
    expect(PlannerWallTool.id).toBe("planner-wall");
    expect(PlannerRoomTool.id).toBe("planner-room");
    expect(PlannerFurnitureTool.id).toBe("planner-furniture");
    expect(PlannerMeasurementTool.id).toBe("planner-measurement");
    expect(PlannerZoneTool.id).toBe("planner-zone");
  });
});