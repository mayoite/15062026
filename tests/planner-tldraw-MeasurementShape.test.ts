import { describe, expect, it } from "vitest";

import {
  calculateLength,
  DEFAULT_MEASUREMENT_PROPS,
  determineOrientation,
  formatMeasurement,
  UNIT_LABELS,
  UNIT_TO_MM,
} from "@/features/planner/tldraw/shapes/MeasurementShape";

describe("MeasurementShape helpers", () => {
  it("DEFAULT_MEASUREMENT_PROPS uses mm unit", () => {
    expect(DEFAULT_MEASUREMENT_PROPS.unit).toBe("mm");
    expect(DEFAULT_MEASUREMENT_PROPS.showArrows).toBe(true);
  });

  it("UNIT_TO_MM and UNIT_LABELS cover all units", () => {
    expect(UNIT_TO_MM.mm).toBe(1);
    expect(UNIT_TO_MM.m).toBe(1000);
    expect(UNIT_LABELS.ft).toBe("'");
  });

  it("formatMeasurement formats metric units", () => {
    expect(formatMeasurement(1500, "m", 2)).toBe("1.50 m");
    expect(formatMeasurement(254, "in", 1)).toContain('"');
  });

  it("formatMeasurement formats ft-in compound unit", () => {
    const formatted = formatMeasurement(3048, "ft-in", 1);
    expect(formatted).toContain("'");
    expect(formatted).toContain('"');
  });

  it("calculateLength returns hypotenuse", () => {
    expect(calculateLength(0, 0, 3, 4)).toBe(5);
  });

  it("determineOrientation classifies line direction", () => {
    expect(determineOrientation(0, 0, 100, 2)).toBe("horizontal");
    expect(determineOrientation(0, 0, 2, 100)).toBe("vertical");
    expect(determineOrientation(0, 0, 50, 50)).toBe("diagonal");
  });
});