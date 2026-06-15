import { describe, expect, it } from "vitest";

import {
  getValidationErrors,
  safeValidateDoorShape,
  safeValidateFurnitureShape,
  safeValidateMeasurementShape,
  safeValidatePlannerShape,
  safeValidateRoomShape,
  safeValidateWallShape,
  safeValidateWindowShape,
  safeValidateZoneShape,
  validateDoorShape,
  validateFurnitureShape,
  validateMeasurementShape,
  validatePlannerShape,
  validateRoomShape,
  validateWallShape,
  validateWindowShape,
  validateZoneShape,
} from "@/features/planner/tldraw/shapes/shapeValidation";
import {
  validDoorPayload,
  validFurniturePayload,
  validRoomPayload,
  validWallPayload,
  validWindowPayload,
} from "./planner-tldraw-mockEditor";

const validMeasurementPayload = () => ({
  id: "550e8400-e29b-41d4-a716-446655440005",
  type: "planner-measurement" as const,
  x: 0,
  y: 0,
  rotation: 0,
  opacity: 1,
  isLocked: false,
  startX: 0,
  startY: 0,
  endX: 100,
  endY: 0,
  unit: "mm" as const,
  orientation: "horizontal" as const,
  value: 1000,
  precision: 1,
  showUnit: true,
  showTicks: true,
  color: "#336699",
});

const validZonePayload = () => ({
  id: "550e8400-e29b-41d4-a716-446655440006",
  type: "planner-zone" as const,
  x: 0,
  y: 0,
  rotation: 0,
  opacity: 1,
  isLocked: false,
  zoneType: "focus" as const,
  widthMm: 100,
  heightMm: 100,
  label: "Zone",
  showLabel: true,
  color: "#336699",
});

describe("shapeValidation", () => {
  it("safeValidateWallShape accepts valid payload", () => {
    expect(safeValidateWallShape(validWallPayload())).not.toBeNull();
  });

  it("safeValidateWallShape rejects invalid uuid", () => {
    expect(safeValidateWallShape(validWallPayload({ id: "not-uuid" }))).toBeNull();
  });

  it("validateWallShape throws on invalid data", () => {
    expect(() => validateWallShape({ type: "planner-wall" })).toThrow();
  });

  it("safeValidateFurnitureShape accepts valid furniture", () => {
    expect(safeValidateFurnitureShape(validFurniturePayload())).not.toBeNull();
  });

  it("safeValidatePlannerShape discriminates by type", () => {
    expect(safeValidatePlannerShape(validWallPayload())?.type).toBe("planner-wall");
    expect(safeValidatePlannerShape(validFurniturePayload())?.type).toBe("planner-furniture");
    expect(safeValidatePlannerShape({ type: "nope" })).toBeNull();
  });

  it("getValidationErrors returns field messages", () => {
    const errors = getValidationErrors(validWallPayload({ color: "bad" }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBeTruthy();
    expect(errors[0].shapeType).toBe("planner-wall");
  });

  it("getValidationErrors returns empty for valid shape", () => {
    expect(getValidationErrors(validWallPayload())).toHaveLength(0);
  });

  it("validates all shape types via strict validators", () => {
    expect(validateWallShape(validWallPayload()).type).toBe("planner-wall");
    expect(validateRoomShape(validRoomPayload()).type).toBe("planner-room");
    expect(validateFurnitureShape(validFurniturePayload()).type).toBe("planner-furniture");
    expect(validateDoorShape(validDoorPayload()).type).toBe("planner-door");
    expect(validateWindowShape(validWindowPayload()).type).toBe("planner-window");
    expect(validateMeasurementShape(validMeasurementPayload()).type).toBe("planner-measurement");
    expect(validateZoneShape(validZonePayload()).type).toBe("planner-zone");
    expect(validatePlannerShape(validWallPayload()).type).toBe("planner-wall");
  });

  it("safe-validates room, door, window, measurement, and zone", () => {
    expect(safeValidateRoomShape(validRoomPayload())).not.toBeNull();
    expect(safeValidateDoorShape(validDoorPayload())).not.toBeNull();
    expect(safeValidateWindowShape(validWindowPayload())).not.toBeNull();
    expect(safeValidateMeasurementShape(validMeasurementPayload())).not.toBeNull();
    expect(safeValidateZoneShape(validZonePayload())).not.toBeNull();
  });

  it("safe validators return null for invalid payloads", () => {
    expect(safeValidateRoomShape({ type: "planner-room" })).toBeNull();
    expect(safeValidateDoorShape({ type: "planner-door" })).toBeNull();
    expect(safeValidateWindowShape({ type: "planner-window" })).toBeNull();
    expect(safeValidateMeasurementShape({ type: "planner-measurement" })).toBeNull();
    expect(safeValidateZoneShape({ type: "planner-zone" })).toBeNull();
    expect(safeValidateFurnitureShape({ type: "planner-furniture" })).toBeNull();
    expect(safeValidatePlannerShape(null)).toBeNull();
  });

  it("getValidationErrors handles non-object input", () => {
    const errors = getValidationErrors("not-an-object");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].shapeType).toBe("unknown");
  });
});