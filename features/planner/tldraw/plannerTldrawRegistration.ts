/**
 * Canonical Tldraw registration for the unified workspace planner.
 *
 * Passing `tools` to <Tldraw /> replaces the built-in set — native select/hand/eraser
 * must be merged explicitly alongside planner custom tools.
 */
import { defaultTools } from "tldraw";
import { PLANNER_SHAPE_UTILS } from "./shapes";
import {
  PlannerDoorWindowTool,
  PlannerFurnitureTool,
  PlannerMeasurementTool,
  PlannerRoomTool,
  PlannerWallTool,
  PlannerZoneTool,
} from "./tools";

export const PLANNER_TLDRAW_SHAPE_UTILS = PLANNER_SHAPE_UTILS;

/** Native tldraw navigation tools used by the planner rail (select, hand, eraser, …). */
export const PLANNER_TLDRAW_NATIVE_TOOLS = [...defaultTools];

export const PLANNER_TLDRAW_CUSTOM_TOOLS = [
  PlannerWallTool,
  PlannerRoomTool,
  PlannerFurnitureTool,
  PlannerDoorWindowTool,
  PlannerMeasurementTool,
  PlannerZoneTool,
] as const;

export const PLANNER_TLDRAW_TOOLS = [
  ...PLANNER_TLDRAW_NATIVE_TOOLS,
  ...PLANNER_TLDRAW_CUSTOM_TOOLS,
];
