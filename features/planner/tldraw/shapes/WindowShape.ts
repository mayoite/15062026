/**
 * Window Shape Type Definition
 * 
 * Represents a window with wall attachment and various types.
 * Windows snap to wall segments and can be single, double, or sliding.
 */

import type { BasePlannerShapeProps, DimensionProps, StyleProps, WindowType } from "./sharedTypes";

export interface WindowShapeProps extends BasePlannerShapeProps, DimensionProps, StyleProps {
  type: "planner-window";
  
  // Window properties
  windowType: WindowType;       // Single, double, sliding, fixed, or awning
  
  // Dimensions
  widthMm: number;             // Window width
  heightMm: number;            // Window height
  sillHeightMm: number;        // Height from floor to window sill
  
  // Wall attachment
  wallId?: string;             // ID of wall this window is attached to
  wallPosition: number;        // Position along wall (0-1)
  isAttached: boolean;         // Whether window is attached to a wall
  
  // Window construction
  hasFrame: boolean;           // Whether window has a frame
  frameThicknessMm: number;    // Frame thickness
  hasSill: boolean;            // Whether window has a sill
  hasMullions: boolean;        // Whether window has mullions (dividers)
  mullionCount: number;        // Number of mullions
  
  // Opening properties (for operable windows)
  isOperable: boolean;         // Whether window can open
  opensDirection: "in" | "out" | "slide"; // Opening direction
  
  // Rendering
  showGlass: boolean;          // Whether to show glass pane
  showFrame: boolean;          // Whether to show frame
  showSill: boolean;           // Whether to show sill
  glassColor: string;          // Glass pane color
  frameColor: string;          // Frame color
}

export type PlannerWindowShape = WindowShapeProps;

// Default window properties
export const DEFAULT_WINDOW_PROPS: Partial<WindowShapeProps> = {
  windowType: "single",
  widthMm: 1200,              // Standard window width
  heightMm: 1000,             // Standard window height
  sillHeightMm: 900,          // Standard sill height
  isAttached: false,
  hasFrame: true,
  frameThicknessMm: 50,
  hasSill: true,
  hasMullions: false,
  mullionCount: 0,
  isOperable: true,
  opensDirection: "out",
  showGlass: true,
  showFrame: true,
  showSill: true,
  color: "var(--border-soft)",
  glassColor: "var(--surface-panel)",
  frameColor: "var(--surface-panel)",
  strokeWidth: 2,
};

// Standard window dimensions (in mm)
export const STANDARD_WINDOW_WIDTHS = [600, 900, 1200, 1500, 1800] as const;
export const STANDARD_WINDOW_HEIGHTS = [600, 800, 1000, 1200, 1500] as const;
export const STANDARD_SILL_HEIGHTS = [600, 750, 900, 1050, 1200] as const;

// Window type display names
export const WINDOW_TYPE_LABELS: Record<WindowType, string> = {
  single: "Single Window",
  double: "Double Window",
  sliding: "Sliding Window",
  fixed: "Fixed Window",
  awning: "Awning Window",
};