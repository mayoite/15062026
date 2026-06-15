/**
 * Door Shape Type Definition
 * 
 * Represents a door with swing arc, handedness, and wall attachment.
 * Doors snap to wall segments and can be single, double, or sliding.
 */

import type { BasePlannerShapeProps, DimensionProps, StyleProps, DoorType, DoorSwingDirection } from "./sharedTypes";

export interface DoorShapeProps extends BasePlannerShapeProps, DimensionProps, StyleProps {
  type: "planner-door";
  
  // Door properties
  doorType: DoorType;          // Single, double, sliding, or folding
  swingDirection: DoorSwingDirection; // Left, right, or both swing
  swingAngle: number;          // Swing angle in degrees (typically 90)
  
  // Dimensions
  widthMm: number;             // Door width (standard: 900mm)
  thicknessMm: number;         // Door thickness (standard: 40mm)
  
  // Wall attachment
  wallId?: string;             // ID of wall this door is attached to
  wallPosition: number;        // Position along wall (0-1)
  isAttached: boolean;         // Whether door is attached to a wall
  
  // Opening properties
  showSwingArc: boolean;       // Whether to show swing arc visualization
  showDoorPanel: boolean;      // Whether to show door panel
  showFrame: boolean;          // Whether to show door frame
  
  // Double door specific
  isActiveLeaf: "left" | "right" | "both"; // Which leaf is active for double doors
  
  // Rendering
  frameColor: string;          // Door frame color
  panelColor: string;          // Door panel color
}

export type PlannerDoorShape = DoorShapeProps;

// Default door properties
export const DEFAULT_DOOR_PROPS: Partial<DoorShapeProps> = {
  doorType: "single",
  swingDirection: "right",
  swingAngle: 90,
  widthMm: 900,               // Standard door width
  thicknessMm: 40,            // Standard door thickness
  isAttached: false,
  showSwingArc: true,
  showDoorPanel: true,
  showFrame: true,
  isActiveLeaf: "both",
  opacity: 1,
  isLocked: false,
  rotation: 0,
  color: "var(--border-soft)",
  frameColor: "var(--border-soft)",
  panelColor: "var(--border-soft)",
  strokeWidth: 2,
};

// Standard door widths (in mm)
export const STANDARD_DOOR_WIDTHS = [800, 900, 1000, 1200] as const;

// Door type display names
export const DOOR_TYPE_LABELS: Record<DoorType, string> = {
  single: "Single Door",
  double: "Double Door",
  sliding: "Sliding Door",
  folding: "Folding Door",
};

// Swing direction display names
export const SWING_DIRECTION_LABELS: Record<DoorSwingDirection, string> = {
  left: "Left Swing",
  right: "Right Swing",
  both: "Double Swing",
};