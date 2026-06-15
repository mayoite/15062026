/**
 * Canonical Tldraw registration for the unified workspace planner.
 */
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

export const PLANNER_TLDRAW_TOOLS = [
  PlannerWallTool,
  PlannerRoomTool,
  PlannerFurnitureTool,
  PlannerDoorWindowTool,
  PlannerMeasurementTool,
  PlannerZoneTool,
];
