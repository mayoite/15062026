/**
 * Measurement Shape Type Definition
 * 
 * Represents dimension lines showing distances with unit-aware rendering.
 * Measurements can be horizontal, vertical, or diagonal.
 */

import type { BasePlannerShapeProps, StyleProps, MeasurementUnit, MeasurementOrientation } from "./sharedTypes";

export interface MeasurementShapeProps extends BasePlannerShapeProps, StyleProps {
  type: "planner-measurement";
  
  // Measurement geometry
  startX: number;              // Start point X
  startY: number;              // Start point Y
  endX: number;                // End point X
  endY: number;                // End point Y
  
  // Measurement properties
  lengthMm: number;            // Length in millimeters (canonical unit)
  unit: MeasurementUnit;       // Display unit
  orientation: MeasurementOrientation; // Horizontal, vertical, or diagonal
  
  // Offset from measured object
  offset: number;              // Distance offset from measured line
  
  // Text properties
  showValue: boolean;          // Whether to show the measurement value
  showUnit: boolean;           // Whether to show the unit label
  precision: number;           // Decimal places for display
  
  // Arrow properties
  showArrows: boolean;         // Whether to show arrows at ends
  arrowSize: number;           // Arrow size
  arrowStyle: "filled" | "open"; // Arrow style
  
  // Extension lines
  showExtensionLines: boolean; // Whether to show extension lines
  extensionLength: number;     // Length of extension lines
  
  // Reference (what this measures)
  referenceIds: string[];      // IDs of shapes this measurement references
  referenceType: "wall" | "room" | "furniture" | "custom"; // Type of reference
  
  // Rendering
  textColor: string;           // Text color
  lineColor: string;           // Line color
  fontSize: number;            // Font size for measurement text
}

export type PlannerMeasurementShape = MeasurementShapeProps;

// Default measurement properties
export const DEFAULT_MEASUREMENT_PROPS: Partial<MeasurementShapeProps> = {
  lengthMm: 0,
  unit: "mm",
  orientation: "horizontal",
  offset: 20,
  showValue: true,
  showUnit: true,
  precision: 0,
  showArrows: true,
  arrowSize: 10,
  arrowStyle: "filled",
  showExtensionLines: true,
  extensionLength: 20,
  referenceIds: [],
  referenceType: "custom",
  opacity: 1,
  isLocked: false,
  rotation: 0,
  color: "var(--color-danger)",
  textColor: "var(--border-soft)",
  lineColor: "var(--color-danger)",
  strokeWidth: 1,
  fontSize: 12,
};

// Unit conversion factors (to mm)
export const UNIT_TO_MM: Record<MeasurementUnit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
  "ft-in": 304.8, // Special case handled separately
};

// Unit display labels
export const UNIT_LABELS: Record<MeasurementUnit, string> = {
  mm: "mm",
  cm: "cm",
  m: "m",
  in: "\"",
  ft: "'",
  "ft-in": "'\"",
};

// Format measurement value for display
export function formatMeasurement(lengthMm: number, unit: MeasurementUnit, precision: number = 0): string {
  const value = lengthMm / UNIT_TO_MM[unit];
  
  if (unit === "ft-in") {
    const feet = Math.floor(value / 12);
    const inches = Math.round((value % 12) * precision) / precision;
    return `${feet}' ${inches}"`;
  }
  
  return `${value.toFixed(precision)} ${UNIT_LABELS[unit]}`;
}

// Calculate length from two points
export function calculateLength(startX: number, startY: number, endX: number, endY: number): number {
  return Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
}

// Determine orientation from points
export function determineOrientation(startX: number, startY: number, endX: number, endY: number): MeasurementOrientation {
  const dx = Math.abs(endX - startX);
  const dy = Math.abs(endY - startY);
  
  if (dx > dy * 2) return "horizontal";
  if (dy > dx * 2) return "vertical";
  return "diagonal";
}