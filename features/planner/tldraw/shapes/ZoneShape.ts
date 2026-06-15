/**
 * Zone Shape Type Definition
 * 
 * Represents a zoning area with capacity logic and visual treatments.
 * Zones are used for space planning and capacity calculations.
 */

import type { BasePlannerShapeProps, LabelProps, StyleProps, ZoneType } from "./sharedTypes";

export interface ZoneShapeProps extends BasePlannerShapeProps, LabelProps, StyleProps {
  type: "planner-zone";
  
  // Zone geometry (polygon points)
  points: Array<{ x: number; y: number }>;
  
  // Zone properties
  zoneType: ZoneType;          // Type of zone
  areaSqm: number;             // Calculated area in square meters
  capacity: number;            // Maximum capacity (people)
  currentOccupancy: number;    // Current occupancy
  
  // Zone dimensions
  widthMm: number;             // Bounding box width
  heightMm: number;            // Bounding box height
  
  // Capacity settings
  areaPerPerson: number;       // Required area per person in sqm
  maxCapacity: number;         // Hard maximum capacity
  
  // Visual treatments
  showBoundary: boolean;       // Whether to show zone boundary
  showFill: boolean;           // Whether to show zone fill
  showCapacity: boolean;       // Whether to show capacity info
  showOccupancy: boolean;      // Whether to show occupancy indicator
  
  // Rendering
  fillPattern: "solid" | "hatch" | "dots" | "crosshatch"; // Fill pattern
  dashArray?: number[];        // Dash pattern for boundary
  
  // Color scheme
  zoneColor: string;           // Primary zone color
  fillColor: string;           // Fill color (with transparency)
}

export type PlannerZoneShape = ZoneShapeProps;

// Default zone properties
export const DEFAULT_ZONE_PROPS: Partial<ZoneShapeProps> = {
  zoneType: "focus",
  areaSqm: 0,
  capacity: 0,
  currentOccupancy: 0,
  widthMm: 0,
  heightMm: 0,
  areaPerPerson: 10,           // Standard: 10 sqm per person
  maxCapacity: 0,
  showBoundary: true,
  showFill: true,
  showCapacity: true,
  showOccupancy: false,
  fillPattern: "solid",
  showLabel: true,
  opacity: 1,
  isLocked: false,
  rotation: 0,
  color: "var(--color-success)",
  fillColor: "var(--surface-glass)",
  strokeWidth: 2,
};

// Zone type display names
export const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  quiet: "Quiet Zone",
  collaborative: "Collaborative Zone",
  focus: "Focus Zone",
  social: "Social Zone",
  custom: "Custom Zone",
};

// Zone type color schemes
export const ZONE_TYPE_COLORS: Record<ZoneType, { color: string; fillColor: string }> = {
  quiet: { color: "var(--border-soft)", fillColor: "var(--surface-glass)" },
  collaborative: { color: "var(--color-warning)", fillColor: "var(--surface-glass)" },
  focus: { color: "var(--color-success)", fillColor: "var(--surface-glass)" },
  social: { color: "var(--color-danger)", fillColor: "var(--surface-glass)" },
  custom: { color: "var(--border-soft)", fillColor: "var(--surface-glass)" },
};

// Standard area per person by zone type (sqm)
export const AREA_PER_PERSON_BY_ZONE: Record<ZoneType, number> = {
  quiet: 12,      // More space for quiet work
  collaborative: 8, // Less space for collaborative areas
  focus: 10,      // Standard focus space
  social: 6,      // Less space for social areas
  custom: 10,     // Default for custom
};