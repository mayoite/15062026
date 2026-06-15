/**
 * Unit Conversion Utilities
 * 
 * Ensures all planner dimensions are mm-canonical with display-unit derived.
 * This provides a single source of truth for unit conversions in the planner.
 */

export type Unit = "mm" | "cm" | "m" | "ft" | "in" | "ft-in";

export interface ConversionResult {
  value: number;
  unit: Unit;
  formatted: string;
}

export class UnitConversion {
  // Canonical unit: millimeters
  private static readonly CANONICAL_UNIT: Unit = "mm";

  // Conversion factors to mm
  private static readonly TO_MM: Record<Unit, number> = {
    mm: 1,
    cm: 10,
    m: 1000,
    in: 25.4,
    ft: 304.8,
    "ft-in": 304.8, // Special case handled separately
  };

  // Conversion factors from mm
  private static readonly FROM_MM: Record<Unit, number> = {
    mm: 1,
    cm: 0.1,
    m: 0.001,
    in: 0.0393701,
    ft: 0.00328084,
    "ft-in": 0.00328084, // Special case handled separately
  };

  /**
   * Convert any unit to canonical mm
   */
  static toMm(value: number, fromUnit: Unit): number {
    if (fromUnit === "ft-in") {
      // Handle feet-inches separately
      throw new Error("Use toMmFromFtInches for feet-inches conversion");
    }

    return value * this.TO_MM[fromUnit];
  }

  /**
   * Convert canonical mm to any unit
   */
  static fromMm(valueMm: number, toUnit: Unit): number {
    if (toUnit === "ft-in") {
      // Handle feet-inches separately
      throw new Error("Use fromMmToFtInches for feet-inches conversion");
    }

    return valueMm * this.FROM_MM[toUnit];
  }

  /**
   * Convert feet-inches to mm
   */
  static toMmFromFtInches(feet: number, inches: number): number {
    const totalInches = feet * 12 + inches;
    return totalInches * this.TO_MM.in;
  }

  /**
   * Convert mm to feet-inches
   */
  static fromMmToFtInches(valueMm: number): { feet: number; inches: number } {
    const totalInches = valueMm * this.FROM_MM.in;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  }

  /**
   * Convert between any two units
   */
  static convert(value: number, fromUnit: Unit, toUnit: Unit): number {
    // Convert to mm first, then to target unit
    const valueMm = this.toMm(value, fromUnit);
    return this.fromMm(valueMm, toUnit);
  }

  /**
   * Format a value with unit for display
   */
  static format(value: number, unit: Unit, precision: number = 0): string {
    if (unit === "ft-in") {
      const { feet, inches } = this.fromMmToFtInches(value);
      return `${feet}' ${inches}"`;
    }

    const unitSymbols: Record<Unit, string> = {
      mm: "mm",
      cm: "cm",
      m: "m",
      in: "\"",
      ft: "'",
      "ft-in": "'\"",
    };

    return `${value.toFixed(precision)} ${unitSymbols[unit]}`;
  }

  /**
   * Parse a string with unit to mm
   */
  static parseToMm(valueString: string, defaultUnit: Unit = "mm"): number {
    const trimmed = valueString.trim();
    
    // Try to extract unit from string
    const unitMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(mm|cm|m|ft|in|'|")/i);
    
    if (unitMatch) {
      const value = parseFloat(unitMatch[1]);
      const unitStr = unitMatch[2].toLowerCase();
      
      const unitMap: Record<string, Unit> = {
        mm: "mm",
        cm: "cm",
        m: "m",
        ft: "ft",
        in: "in",
        "'": "ft",
        "\"": "in",
      };
      
      const unit = unitMap[unitStr] || defaultUnit;
      return this.toMm(value, unit);
    }
    
    // If no unit found, use default unit
    const value = parseFloat(trimmed);
    if (!isNaN(value)) {
      return this.toMm(value, defaultUnit);
    }
    
    throw new Error(`Could not parse value: ${valueString}`);
  }

  /**
   * Get the canonical unit
   */
  static getCanonicalUnit(): Unit {
    return this.CANONICAL_UNIT;
  }

  /**
   * Check if a unit is the canonical unit
   */
  static isCanonical(unit: Unit): boolean {
    return unit === this.CANONICAL_UNIT;
  }

  /**
   * Round value to nearest grid spacing
   */
  static roundToGrid(valueMm: number, gridSpacingMm: number = 50): number {
    return Math.round(valueMm / gridSpacingMm) * gridSpacingMm;
  }

  /**
   * Snap value to nearest standard size
   */
  static snapToStandard(valueMm: number, category: "wall" | "furniture" | "door" | "window"): number {
    const standardSizes: Record<string, number[]> = {
      wall: [100, 150, 200, 250], // Standard wall thicknesses
      furniture: [600, 800, 1000, 1200, 1400, 1600, 1800, 2000], // Standard furniture widths
      door: [800, 900, 1000, 1200], // Standard door widths
      window: [600, 900, 1200, 1500, 1800], // Standard window widths
    };

    const sizes = standardSizes[category] || standardSizes.furniture;
    
    // Find closest standard size
    let closest = sizes[0];
    let minDiff = Math.abs(valueMm - closest);
    
    for (const size of sizes) {
      const diff = Math.abs(valueMm - size);
      if (diff < minDiff) {
        minDiff = diff;
        closest = size;
      }
    }
    
    return closest;
  }

  /**
   * Calculate area in square meters from mm dimensions
   */
  static calculateAreaSqm(widthMm: number, heightMm: number): number {
    const areaMm2 = widthMm * heightMm;
    return areaMm2 / 1000000; // Convert mm² to m²
  }

  /**
   * Calculate perimeter in meters from mm dimensions
   */
  static calculatePerimeterM(widthMm: number, heightMm: number): number {
    const perimeterMm = 2 * (widthMm + heightMm);
    return perimeterMm / 1000; // Convert mm to m
  }

  /**
   * Validate that a value is in the reasonable range for the given unit
   */
  static validateRange(value: number, unit: Unit, min: number, max: number): boolean {
    const valueMm = this.toMm(value, unit);
    return valueMm >= min && valueMm <= max;
  }

  /**
   * Get display unit based on magnitude (mm for small, cm for medium, m for large)
   */
  static getDisplayUnit(valueMm: number): Unit {
    if (valueMm < 100) {
      return "mm";
    } else if (valueMm < 10000) {
      return "cm";
    } else {
      return "m";
    }
  }

  /**
   * Format value with appropriate unit based on magnitude
   */
  static formatAuto(valueMm: number, precision: number = 0): string {
    const unit = this.getDisplayUnit(valueMm);
    const convertedValue = this.fromMm(valueMm, unit);
    return this.format(convertedValue, unit, precision);
  }
}