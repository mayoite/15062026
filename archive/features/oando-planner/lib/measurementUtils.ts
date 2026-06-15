"use client";

import type { PlannerUnitSystem } from "../model";

export type MeasurementUnit = "mm" | "ft-in";

const MM_PER_INCH = 25.4;
const INCHES_PER_FOOT = 12;

export function plannerUnitSystemToMeasurementUnit(
  unitSystem: PlannerUnitSystem | null | undefined,
): MeasurementUnit {
  return unitSystem === "imperial" ? "ft-in" : "mm";
}

export function formatMillimeters(mm: number) {
  return `${Math.round(mm).toLocaleString("en-IN")} mm`;
}

export function formatFeetAndInches(mm: number) {
  const totalInches = Math.max(0, Math.round(mm / MM_PER_INCH));
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const inches = totalInches % INCHES_PER_FOOT;
  return `${feet}' ${inches}"`;
}

export function formatLength(mm: number, unitSystem: MeasurementUnit) {
  return unitSystem === "ft-in"
    ? formatFeetAndInches(mm)
    : formatMillimeters(mm);
}

export function formatArea(areaMm2: number, unitSystem: MeasurementUnit) {
  if (unitSystem === "ft-in") {
    return `${(areaMm2 / 92903.04).toFixed(1)} sq ft`;
  }
  return `${(areaMm2 / 1000000).toFixed(1)} m2`;
}
