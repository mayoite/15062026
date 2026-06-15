/**
 * Unit Preference Helper
 *
 * Provides user unit preference management with localStorage persistence
 * and conversion utilities. All internal measurements are stored in mm
 * (canonical unit) and converted to the user's preferred unit for display.
 *
 * @see design.md - lib/units.ts specification
 * @validates REQ-25 (Unit preference)
 */

// Supported display units
export type Unit = "mm" | "cm" | "m" | "inch" | "ft";

// localStorage key for unit preference
const STORAGE_KEY = "planner.unit";

// Default unit when no preference is set
const DEFAULT_UNIT: Unit = "cm";

// Valid units for validation
const VALID_UNITS: readonly Unit[] = ["mm", "cm", "m", "inch", "ft"] as const;

/**
 * Conversion factors from each unit to mm (canonical unit)
 */
export const FACTORS: Record<Unit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  inch: 25.4,
  ft: 304.8,
};

/**
 * Convert a value from mm to the specified unit
 * @param valueMm - Value in millimeters
 * @param unit - Target unit
 * @returns Value in the target unit
 */
export function fromMm(valueMm: number, unit: Unit): number {
  return valueMm / FACTORS[unit];
}

/**
 * Convert a value from the specified unit to mm
 * @param value - Value in the source unit
 * @param unit - Source unit
 * @returns Value in millimeters
 */
export function toMm(value: number, unit: Unit): number {
  return value * FACTORS[unit];
}

/**
 * Format a measurement value for display with unit suffix
 * @param mm - Value in millimeters
 * @param unit - Display unit
 * @returns Formatted string with unit suffix (e.g., "150 mm", "15.00 cm")
 */
export function formatMeasurement(mm: number, unit: Unit): string {
  const converted = fromMm(mm, unit);

  // Use 0 decimal places for mm, 2 for others
  const precision = unit === "mm" ? 0 : 2;
  const formatted = converted.toFixed(precision);

  // Unit suffixes
  const suffixes: Record<Unit, string> = {
    mm: "mm",
    cm: "cm",
    m: "m",
    inch: "in",
    ft: "ft",
  };

  return `${formatted} ${suffixes[unit]}`;
}

/**
 * Validate that a value is a valid Unit
 * @param value - Value to validate
 * @returns True if value is a valid Unit
 */
function isValidUnit(value: unknown): value is Unit {
  return typeof value === "string" && VALID_UNITS.includes(value as Unit);
}

/**
 * Get the user's preferred unit from localStorage
 * @returns The user's preferred unit, or "cm" if not set or invalid
 */
export function getUserUnit(): Unit {
  if (typeof window === "undefined") {
    return DEFAULT_UNIT;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidUnit(stored)) {
      return stored;
    }
  } catch {
    // localStorage may be unavailable (e.g., private browsing)
  }

  return DEFAULT_UNIT;
}

/**
 * Set the user's preferred unit in localStorage
 * @param unit - The unit to set as preference
 * @throws Error if unit is not a valid Unit value
 */
export function setUserUnit(unit: Unit): void {
  if (!isValidUnit(unit)) {
    throw new Error(
      `Invalid unit: ${unit}. Must be one of: ${VALID_UNITS.join(", ")}`
    );
  }

  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, unit);
  } catch {
    // localStorage may be unavailable or full
    console.warn("Failed to save unit preference to localStorage");
  }
}

/**
 * Convert between any two units
 * @param value - Value in the source unit
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Value in the target unit
 */
export function convert(value: number, fromUnit: Unit, toUnit: Unit): number {
  if (fromUnit === toUnit) {
    return value;
  }
  const mm = toMm(value, fromUnit);
  return fromMm(mm, toUnit);
}

/**
 * Get all available units
 * @returns Array of valid unit values
 */
export function getAvailableUnits(): readonly Unit[] {
  return VALID_UNITS;
}

/**
 * Get a human-readable label for a unit
 * @param unit - The unit
 * @returns Human-readable label
 */
export function getUnitLabel(unit: Unit): string {
  const labels: Record<Unit, string> = {
    mm: "Millimeters (mm)",
    cm: "Centimeters (cm)",
    m: "Meters (m)",
    inch: "Inches (in)",
    ft: "Feet (ft)",
  };
  return labels[unit];
}

/**
 * Get a short label for a unit (for compact displays)
 * @param unit - The unit
 * @returns Short label
 */
export function getUnitShortLabel(unit: Unit): string {
  const labels: Record<Unit, string> = {
    mm: "mm",
    cm: "cm",
    m: "m",
    inch: "in",
    ft: "ft",
  };
  return labels[unit];
}
