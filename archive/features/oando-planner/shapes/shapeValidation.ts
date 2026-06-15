/**
 * Shape Validation System for OOFPL Planner
 * 
 * Provides runtime validation using Zod schemas for all planner shapes.
 * Integrates with tldraw v5's validation system for type-safe shape props.
 */

import { z } from "zod";

// Base shape schema
const BasePlannerShapeSchema = z.object({
  id: z.string().uuid(),
  x: z.number(),
  y: z.number(),
  rotation: z.number(),
  opacity: z.number().min(0).max(1),
  isLocked: z.boolean(),
});

// Dimension schema (mm-native)
const DimensionSchema = z.object({
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  depthMm: z.number().positive().optional(),
});

// Position schema
const PositionSchema = z.object({
  startX: z.number(),
  startY: z.number(),
  endX: z.number(),
  endY: z.number(),
});

// Catalog binding schema
const CatalogBindingSchema = z.object({
  catalogId: z.string(),
  productSlug: z.string().optional(),
  sku: z.string().optional(),
});

// Label schema
const LabelSchema = z.object({
  label: z.string(),
  showLabel: z.boolean(),
});

// Style schema
const StyleSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  fillColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  strokeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  strokeWidth: z.number().min(0).optional(),
});

// Wall shape schema
export const WallShapeSchema = BasePlannerShapeSchema
  .extend({
    type: z.literal("planner-wall"),
    thickness: z.number().positive(),
    lengthMm: z.number().positive(),
    material: z.enum(["drywall", "brick", "glass", "concrete", "wood"]),
    isLoadBearing: z.boolean(),
    isExterior: z.boolean(),
    hasJunctionStart: z.boolean(),
    hasJunctionEnd: z.boolean(),
    junctionTypeStart: z.enum(["T", "L", "cross"]).optional(),
    junctionTypeEnd: z.enum(["T", "L", "cross"]).optional(),
    showDimensions: z.boolean(),
    showMaterial: z.boolean(),
  })
  .merge(PositionSchema)
  .merge(StyleSchema);

// Room shape schema
export const RoomShapeSchema = BasePlannerShapeSchema
  .extend({
    type: z.literal("planner-room"),
    roomType: z.enum(["office", "meeting", "conference", "cafeteria", "lobby", "restroom", "utility", "storage", "custom"]),
    floorMaterial: z.enum(["carpet", "hardwood", "tile", "vinyl", "concrete", "custom"]),
    areaMm2: z.number().positive(),
    perimeterMm: z.number().positive(),
    capacity: z.number().int().nonnegative().optional(),
    label: z.string(),
    showLabel: z.boolean(),
    showArea: z.boolean(),
    showCapacity: z.boolean(),
  })
  .merge(DimensionSchema)
  .merge(StyleSchema);

// Furniture shape schema
export const FurnitureShapeSchema = BasePlannerShapeSchema
  .extend({
    type: z.literal("planner-furniture"),
    category: z.enum(["workstation", "seating", "table", "storage", "softSeating", "accessory", "partition", "custom"]),
    label: z.string(),
    showLabel: z.boolean(),
    isRotatable: z.boolean(),
    isResizable: z.boolean(),
  })
  .merge(DimensionSchema)
  .merge(CatalogBindingSchema)
  .merge(LabelSchema)
  .merge(StyleSchema);

// Door shape schema
export const DoorShapeSchema = BasePlannerShapeSchema
  .extend({
    type: z.literal("planner-door"),
    doorType: z.enum(["single", "double", "sliding", "folding"]),
    swingDirection: z.enum(["left", "right", "both"]),
    widthMm: z.number().positive(),
    heightMm: z.number().positive(),
    isOpen: z.boolean(),
    swingAngle: z.number().min(0).max(180).optional(),
    showSwingArc: z.boolean(),
    label: z.string().optional(),
  })
  .merge(PositionSchema)
  .merge(StyleSchema);

// Window shape schema
export const WindowShapeSchema = BasePlannerShapeSchema
  .extend({
    type: z.literal("planner-window"),
    windowType: z.enum(["single", "double", "sliding", "fixed", "awning"]),
    widthMm: z.number().positive(),
    heightMm: z.number().positive(),
    sillHeightMm: z.number().nonnegative(),
    isOperable: z.boolean(),
    showSillHeight: z.boolean(),
    label: z.string().optional(),
  })
  .merge(PositionSchema)
  .merge(StyleSchema);

// Zone shape schema
export const ZoneShapeSchema = BasePlannerShapeSchema
  .extend({
    type: z.literal("planner-zone"),
    zoneType: z.enum(["quiet", "collaborative", "focus", "social", "custom"]),
    label: z.string(),
    showLabel: z.boolean(),
    areaMm2: z.number().positive().optional(),
    maxOccupancy: z.number().int().nonnegative().optional(),
    requiredClearanceMm: z.number().nonnegative().optional(),
  })
  .merge(DimensionSchema)
  .merge(LabelSchema)
  .merge(StyleSchema);

// Measurement shape schema
export const MeasurementShapeSchema = BasePlannerShapeSchema
  .extend({
    type: z.literal("planner-measurement"),
    unit: z.enum(["mm", "cm", "m", "ft", "in", "ft-in"]),
    orientation: z.enum(["horizontal", "vertical", "diagonal"]),
    value: z.number(),
    precision: z.number().int().min(0).max(4),
    showUnit: z.boolean(),
    showTicks: z.boolean(),
    label: z.string().optional(),
  })
  .merge(PositionSchema)
  .merge(StyleSchema);

// Union of all shape schemas
export const PlannerShapeSchema = z.discriminatedUnion("type", [
  WallShapeSchema,
  RoomShapeSchema,
  FurnitureShapeSchema,
  DoorShapeSchema,
  WindowShapeSchema,
  ZoneShapeSchema,
  MeasurementShapeSchema,
]);

// Type inference from schemas
export type ValidatedWallShape = z.infer<typeof WallShapeSchema>;
export type ValidatedRoomShape = z.infer<typeof RoomShapeSchema>;
export type ValidatedFurnitureShape = z.infer<typeof FurnitureShapeSchema>;
export type ValidatedDoorShape = z.infer<typeof DoorShapeSchema>;
export type ValidatedWindowShape = z.infer<typeof WindowShapeSchema>;
export type ValidatedZoneShape = z.infer<typeof ZoneShapeSchema>;
export type ValidatedMeasurementShape = z.infer<typeof MeasurementShapeSchema>;
export type ValidatedPlannerShape = z.infer<typeof PlannerShapeSchema>;

// Validation functions
export function validateWallShape(data: unknown): ValidatedWallShape {
  return WallShapeSchema.parse(data);
}

export function validateRoomShape(data: unknown): ValidatedRoomShape {
  return RoomShapeSchema.parse(data);
}

export function validateFurnitureShape(data: unknown): ValidatedFurnitureShape {
  return FurnitureShapeSchema.parse(data);
}

export function validateDoorShape(data: unknown): ValidatedDoorShape {
  return DoorShapeSchema.parse(data);
}

export function validateWindowShape(data: unknown): ValidatedWindowShape {
  return WindowShapeSchema.parse(data);
}

export function validateZoneShape(data: unknown): ValidatedZoneShape {
  return ZoneShapeSchema.parse(data);
}

export function validateMeasurementShape(data: unknown): ValidatedMeasurementShape {
  return MeasurementShapeSchema.parse(data);
}

export function validatePlannerShape(data: unknown): ValidatedPlannerShape {
  return PlannerShapeSchema.parse(data);
}

// Safe validation functions (return null instead of throwing)
export function safeValidateWallShape(data: unknown): ValidatedWallShape | null {
  const result = WallShapeSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function safeValidateRoomShape(data: unknown): ValidatedRoomShape | null {
  const result = RoomShapeSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function safeValidateFurnitureShape(data: unknown): ValidatedFurnitureShape | null {
  const result = FurnitureShapeSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function safeValidateDoorShape(data: unknown): ValidatedDoorShape | null {
  const result = DoorShapeSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function safeValidateWindowShape(data: unknown): ValidatedWindowShape | null {
  const result = WindowShapeSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function safeValidateZoneShape(data: unknown): ValidatedZoneShape | null {
  const result = ZoneShapeSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function safeValidateMeasurementShape(data: unknown): ValidatedMeasurementShape | null {
  const result = MeasurementShapeSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function safeValidatePlannerShape(data: unknown): ValidatedPlannerShape | null {
  const result = PlannerShapeSchema.safeParse(data);
  return result.success ? result.data : null;
}

// Error type for validation errors
export interface ShapeValidationError {
  shapeType: string;
  field: string;
  message: string;
  originalValue: unknown;
}

export function getValidationErrors(data: unknown): ShapeValidationError[] {
  const result = PlannerShapeSchema.safeParse(data);
  if (result.success) return [];

  const errors: ShapeValidationError[] = [];
  result.error.issues.forEach((error) => {
    errors.push({
      shapeType: typeof data === 'object' && data !== null && 'type' in data ? String(data.type) : 'unknown',
      field: error.path.join('.'),
      message: error.message,
      originalValue: error,
    });
  });
  return errors;
}
