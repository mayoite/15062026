/**
 * Furniture Shape Type Definition
 * 
 * Represents furniture items with catalog binding,
 * per-category rendering, and dimensional properties.
 */

import type { BasePlannerShapeProps, DimensionProps, CatalogBindingProps, StyleProps, FurnitureCategory } from "./sharedTypes";

export interface FurnitureShapeProps extends BasePlannerShapeProps, DimensionProps, CatalogBindingProps, StyleProps {
  type: "planner-furniture";
  
  // Furniture classification
  furnitureCategory: FurnitureCategory; // Category determines rendering style
  furnitureType: string;         // Specific type within category (e.g., "task-chair", "executive-desk")
  
  // Additional dimensions
  height3dMm: number;           // Height for 3D rendering
  
  // Rotation and orientation
  rotation: number;             // Rotation in degrees
  
  // Catalog information
  productName?: string;         // Display name from catalog
  manufacturer?: string;        // Manufacturer name
  imageUrl?: string;            // Product image URL
  
  // Placement properties
  isAgainstWall: boolean;       // Whether furniture should snap to walls
  snapDistance: number;         // Distance from wall for snapping
  
  // Rendering
  showDimensions: boolean;      // Whether to show dimensions
  showLabel: boolean;           // Whether to show label
  renderStyle: "outline" | "filled" | "detailed"; // Rendering detail level
}

export type PlannerFurnitureShape = FurnitureShapeProps;

// Default furniture properties
export const DEFAULT_FURNITURE_PROPS: Partial<FurnitureShapeProps> = {
  furnitureCategory: "workstation",
  furnitureType: "desk",
  widthMm: 1200,
  heightMm: 700,  // 2D height
  depthMm: 600,
  height3dMm: 750,  // 3D height for rendering
  isAgainstWall: false,
  snapDistance: 0,
  showDimensions: false,
  showLabel: true,
  renderStyle: "filled",
  color: "var(--border-soft)",
  strokeWidth: 2,
};

// Furniture category display names
export const FURNITURE_CATEGORY_LABELS: Record<FurnitureCategory, string> = {
  workstation: "Workstations",
  seating: "Seating",
  table: "Tables",
  storage: "Storage",
  softSeating: "Soft Seating",
  accessory: "Accessories",
  partition: "Partitions",
  custom: "Custom",
};

// Common furniture types by category
export const FURNITURE_TYPES: Record<FurnitureCategory, string[]> = {
  workstation: ["desk", "desk-l-shaped", "standing-desk", "bench-desk"],
  seating: ["task-chair", "executive-chair", "visitor-chair", "stool", "sofa"],
  table: ["meeting-table", "conference-table", "cafeteria-table", "dining-table"],
  storage: ["pedestal", "filing-cabinet", "bookshelf", "credenza", "locker"],
  softSeating: ["sofa-2seat", "sofa-3seat", "lounge-chair", "ottoman"],
  accessory: ["lamp", "planter", "bin", "whiteboard"],
  partition: ["screen", "divider", "panel"],
  custom: ["custom"],
};