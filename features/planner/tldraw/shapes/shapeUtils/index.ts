/**
 * ShapeUtil Exports - tldraw v5 Shape Utilities for OOFPL Planner
 *
 * Exports all 7 custom shape utilities for rendering and interaction on tldraw canvas.
 */

import { PlannerDoorShapeUtil } from "./PlannerDoorShapeUtil";
import { PlannerFurnitureShapeUtil } from "./PlannerFurnitureShapeUtil";
import { PlannerMeasurementShapeUtil } from "./PlannerMeasurementShapeUtil";
import { PlannerRoomShapeUtil } from "./PlannerRoomShapeUtil";
import { PlannerWallShapeUtil } from "./PlannerWallShapeUtil";
import { PlannerWindowShapeUtil } from "./PlannerWindowShapeUtil";
import { PlannerZoneShapeUtil } from "./PlannerZoneShapeUtil";

export {
  PlannerDoorShapeUtil, PlannerFurnitureShapeUtil, PlannerMeasurementShapeUtil, PlannerRoomShapeUtil, PlannerWallShapeUtil, PlannerWindowShapeUtil,
  PlannerZoneShapeUtil
};

/**
 * Array of all ShapeUtil classes for tldraw editor registration
 */
export const ALL_SHAPE_UTILS = [
  PlannerWallShapeUtil,
  PlannerRoomShapeUtil,
  PlannerFurnitureShapeUtil,
  PlannerDoorShapeUtil,
  PlannerWindowShapeUtil,
  PlannerZoneShapeUtil,
  PlannerMeasurementShapeUtil,
];
