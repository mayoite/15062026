/**
 * Shape Types Index
 * 
 * Central export point for all planner shape type definitions, validation, and tldraw integration.
 */

// Shared types
export * from "./sharedTypes";

// Individual shape types
export * from "./WallShape";
export * from "./RoomShape";
export * from "./FurnitureShape";
export * from "./DoorShape";
export * from "./WindowShape";
export * from "./ZoneShape";
export * from "./MeasurementShape";

// Validation system
export * from "./shapeValidation";

// tldraw v5 integration
export * from "./tldrawShapeRegistry";

// Shape type registration (import for side effects only)
import "./shapeTypeRegistration";

// Shape type constants
export const PLANNER_SHAPE_TYPES = [
  "planner-wall",
  "planner-room",
  "planner-furniture",
  "planner-door",
  "planner-window",
  "planner-zone",
  "planner-measurement",
] as const;

export type PlannerShapeType = typeof PLANNER_SHAPE_TYPES[number];