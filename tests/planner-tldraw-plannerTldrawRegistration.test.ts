import { describe, expect, it } from "vitest";

import { defaultTools } from "tldraw";

import {
  PLANNER_TLDRAW_CUSTOM_TOOLS,
  PLANNER_TLDRAW_NATIVE_TOOLS,
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

  it("includes native tldraw tools before custom planner tools", () => {
    expect(PLANNER_TLDRAW_NATIVE_TOOLS).toEqual([...defaultTools]);
    expect(PLANNER_TLDRAW_CUSTOM_TOOLS).toEqual([
      PlannerWallTool,
      PlannerRoomTool,
      PlannerFurnitureTool,
      PlannerDoorWindowTool,
      PlannerMeasurementTool,
      PlannerZoneTool,
    ]);
    expect(PLANNER_TLDRAW_TOOLS).toEqual([
      ...PLANNER_TLDRAW_NATIVE_TOOLS,
      ...PLANNER_TLDRAW_CUSTOM_TOOLS,
    ]);
  });

  it("registers select, hand, and eraser for the planner tool rail", () => {
    const ids = PLANNER_TLDRAW_TOOLS.map((tool) => tool.id);
    expect(ids).toContain("select");
    expect(ids).toContain("hand");
    expect(ids).toContain("eraser");
  });

  it("each custom tool exposes a stable id", () => {
    expect(PlannerWallTool.id).toBe("planner-wall");
    expect(PlannerRoomTool.id).toBe("planner-room");
    expect(PlannerFurnitureTool.id).toBe("planner-furniture");
    expect(PlannerDoorWindowTool.id).toBe("planner-door-window");
    expect(PlannerMeasurementTool.id).toBe("planner-measurement");
    expect(PlannerZoneTool.id).toBe("planner-zone");
  });
});