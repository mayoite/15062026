/**
 * Wall Shape Type Definition
 * 
 * Represents a wall segment with thickness, material, and endpoints.
 * Walls are the fundamental structural element in office planning.
 */

import type { BasePlannerShapeProps, PositionProps, StyleProps, WallMaterial } from "./sharedTypes";

export interface WallShapeProps extends BasePlannerShapeProps, PositionProps, StyleProps {
  type: "planner-wall";
  
  // Wall properties
  thickness: number;           // Wall thickness in mm (standard: 100mm for drywall, 200mm for brick)
  lengthMm: number;            // Calculated length in mm
  material: WallMaterial;      // Material type affects appearance and properties
  
  // Structural properties
  isLoadBearing: boolean;      // Whether this wall is load-bearing
  isExterior: boolean;         // Whether this is an exterior wall
  
  // Junction information (for T-junctions and L-junctions)
  hasJunctionStart: boolean;   // Whether there's a junction at start point
  hasJunctionEnd: boolean;     // Whether there's a junction at end point
  junctionTypeStart?: "T" | "L" | "cross";  // Type of junction at start
  junctionTypeEnd?: "T" | "L" | "cross";    // Type of junction at end
  
  // Rendering
  showDimensions: boolean;     // Whether to show wall dimensions
  showMaterial: boolean;       // Whether to show material indicator
}

export type PlannerWallShape = WallShapeProps;

// Default wall properties
export const DEFAULT_WALL_PROPS: Partial<WallShapeProps> = {
  thickness: 100,              // Standard drywall thickness
  material: "drywall",
  isLoadBearing: false,
  isExterior: false,
  hasJunctionStart: false,
  hasJunctionEnd: false,
  showDimensions: true,
  showMaterial: false,
  opacity: 1,
  isLocked: false,
  rotation: 0,
  color: "var(--border-soft)",
  strokeWidth: 2,
};

// Standard wall thicknesses (in mm)
export const STANDARD_WALL_THICKNESSES = {
  drywall: 100,
  brick: 200,
  glass: 12,
  concrete: 200,
  wood: 150,
} as const;
