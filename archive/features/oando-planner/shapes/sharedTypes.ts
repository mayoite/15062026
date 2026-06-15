/**
 * Shared Type Definitions for OOFPL Planner Shapes
 * 
 * Common types and enums used across all planner shape definitions.
 */

// Material types for walls
export type WallMaterial = "drywall" | "brick" | "glass" | "concrete" | "wood";

// Door types
export type DoorType = "single" | "double" | "sliding" | "folding";

// Door swing directions
export type DoorSwingDirection = "left" | "right" | "both";

// Window types
export type WindowType = "single" | "double" | "sliding" | "fixed" | "awning";

// Room types
export type RoomType = 
  | "office" 
  | "meeting" 
  | "conference" 
  | "cafeteria" 
  | "lobby" 
  | "restroom" 
  | "utility" 
  | "storage" 
  | "custom";

// Floor material types
export type FloorMaterial = 
  | "carpet" 
  | "hardwood" 
  | "tile" 
  | "vinyl" 
  | "concrete" 
  | "custom";

// Furniture categories
export type FurnitureCategory = 
  | "workstation" 
  | "seating" 
  | "table" 
  | "storage" 
  | "softSeating" 
  | "accessory" 
  | "partition" 
  | "custom";

// Zone types
export type ZoneType = 
  | "quiet" 
  | "collaborative" 
  | "focus" 
  | "social" 
  | "custom";

// Measurement units
export type MeasurementUnit = "mm" | "cm" | "m" | "ft" | "in" | "ft-in";

// Measurement orientation
export type MeasurementOrientation = "horizontal" | "vertical" | "diagonal";

// Common shape props
export interface BasePlannerShapeProps {
  id: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  isLocked: boolean;
}

// Dimension props (mm-native)
export interface DimensionProps {
  widthMm: number;
  heightMm: number;
  depthMm?: number;
}

// Position props
export interface PositionProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Catalog binding props
export interface CatalogBindingProps {
  catalogId: string;
  productId?: string;
  productSlug?: string;
  sku?: string;
}

// Label props
export interface LabelProps {
  label: string;
  showLabel: boolean;
}

// Style props
export interface StyleProps {
  color: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

// Validation helpers
export const WALL_MATERIALS: WallMaterial[] = ["drywall", "brick", "glass", "concrete", "wood"];
export const DOOR_TYPES: DoorType[] = ["single", "double", "sliding", "folding"];
export const DOOR_SWING_DIRECTIONS: DoorSwingDirection[] = ["left", "right", "both"];
export const WINDOW_TYPES: WindowType[] = ["single", "double", "sliding", "fixed", "awning"];
export const ROOM_TYPES: RoomType[] = ["office", "meeting", "conference", "cafeteria", "lobby", "restroom", "utility", "storage", "custom"];
export const FLOOR_MATERIALS: FloorMaterial[] = ["carpet", "hardwood", "tile", "vinyl", "concrete", "custom"];
export const FURNITURE_CATEGORIES: FurnitureCategory[] = ["workstation", "seating", "table", "storage", "softSeating", "accessory", "partition", "custom"];
export const ZONE_TYPES: ZoneType[] = ["quiet", "collaborative", "focus", "social", "custom"];
export const MEASUREMENT_UNITS: MeasurementUnit[] = ["mm", "cm", "m", "ft", "in", "ft-in"];
export const MEASUREMENT_ORIENTATIONS: MeasurementOrientation[] = ["horizontal", "vertical", "diagonal"];