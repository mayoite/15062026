/**
 * Room Shape Type Definition
 * 
 * Represents an enclosed room polygon with area calculations,
 * floor materials, and labeling.
 */

import type { BasePlannerShapeProps, LabelProps, StyleProps, RoomType, FloorMaterial } from "./sharedTypes";

export interface RoomShapeProps extends BasePlannerShapeProps, LabelProps, StyleProps {
  type: "planner-room";
  
  // Room geometry (polygon points)
  points: Array<{ x: number; y: number }>;
  
  // Room properties
  roomType: RoomType;          // Type of room
  areaSqm: number;             // Calculated area in square meters
  perimeterMm: number;         // Calculated perimeter in mm
  
  // Floor properties
  floorMaterial: FloorMaterial; // Floor material type
  floorColor?: string;         // Custom floor color override
  
  // Room dimensions
  widthMm: number;             // Bounding box width
  heightMm: number;            // Bounding box height
  
  // Rendering
  showArea: boolean;           // Whether to show area label
  showPerimeter: boolean;      // Whether to show perimeter label
  fillOpacity: number;         // Fill transparency (0-1)
}

export type PlannerRoomShape = RoomShapeProps;

// Default room properties
export const DEFAULT_ROOM_PROPS: Partial<RoomShapeProps> = {
  roomType: "office",
  floorMaterial: "carpet",
  areaSqm: 0,
  perimeterMm: 0,
  widthMm: 0,
  heightMm: 0,
  showArea: true,
  showPerimeter: false,
  fillOpacity: 0.3,
  showLabel: true,
  opacity: 1,
  isLocked: false,
  rotation: 0,
  color: "var(--border-soft)",
  fillColor: "var(--surface-panel)",
  strokeWidth: 2,
};

// Room type display names
export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  office: "Office",
  meeting: "Meeting Room",
  conference: "Conference Room",
  cafeteria: "Cafeteria",
  lobby: "Lobby",
  restroom: "Restroom",
  utility: "Utility",
  storage: "Storage",
  custom: "Custom Room",
};

// Floor material display names
export const FLOOR_MATERIAL_LABELS: Record<FloorMaterial, string> = {
  carpet: "Carpet",
  hardwood: "Hardwood",
  tile: "Tile",
  vinyl: "Vinyl",
  concrete: "Concrete",
  custom: "Custom",
};