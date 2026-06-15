/**
 * Buddy Planner - Compliance Engine
 *
 * Rule-based checks for workspace planning:
 * - ADA aisle width (min 900mm between obstacles)
 * - Ergonomic spacing (desk-to-wall, desk-to-desk)
 * - Zone capacity limits
 * - Space utilization warnings
 */

export type ComplianceLevel = "pass" | "warn" | "fail";

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: "accessibility" | "ergonomics" | "capacity" | "safety";
}

export interface ComplianceResult {
  rule: ComplianceRule;
  level: ComplianceLevel;
  message: string;
  affectedShapeIds: string[];
  measurement?: number;
  threshold?: number;
}

export interface ShapeBounds {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface ZoneData {
  id: string;
  area: number;
  capacity: number;
  currentOccupancy: number;
}

// ─── Rules ──────────────────────────────────────────────────────────────────

const RULES: ComplianceRule[] = [
  {
    id: "ada-aisle-width",
    name: "ADA Aisle Width",
    description: "Pathways between obstacles must be at least 900mm wide",
    category: "accessibility",
  },
  {
    id: "desk-to-wall-min",
    name: "Desk-to-Wall Clearance",
    description: "Minimum 600mm between desk edge and wall",
    category: "ergonomics",
  },
  {
    id: "desk-to-desk-min",
    name: "Desk-to-Desk Spacing",
    description: "Minimum 1200mm between facing desks for chair clearance",
    category: "ergonomics",
  },
  {
    id: "zone-over-capacity",
    name: "Zone Over-Capacity",
    description: "Zone should not exceed 80% capacity",
    category: "capacity",
  },
  {
    id: "space-utilization",
    name: "Space Utilization",
    description: "Room over 70% furniture-to-floor ratio is too dense",
    category: "capacity",
  },
  {
    id: "fire-exit-clearance",
    name: "Fire Exit Clearance",
    description: "Minimum 1200mm clear path to exits",
    category: "safety",
  },
];

// ─── Check Functions ────────────────────────────────────────────────────────

/**
 * Check AABB overlap distance between two shapes.
 * Returns the gap in mm (negative = overlap).
 */
function getMinGap(a: ShapeBounds, b: ShapeBounds): number {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  const gapX = Math.max(b.x - aRight, a.x - bRight);
  const gapY = Math.max(b.y - aBottom, a.y - bBottom);

  // If they overlap on both axes, gap is negative
  if (gapX < 0 && gapY < 0) return Math.max(gapX, gapY);

  // Otherwise, gap is the maximum of the separations
  return Math.max(gapX, gapY);
}

/**
 * Check minimum aisle width between all shape pairs.
 */
function checkAisleWidth(shapes: ShapeBounds[]): ComplianceResult[] {
  const results: ComplianceResult[] = [];
  const rule = RULES.find((r) => r.id === "ada-aisle-width");
  if (!rule) return results;
  const threshold = 900; // mm (actually using px as proxy at 1px = 10mm)
  const thresholdPx = threshold / 10;

  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const gap = getMinGap(shapes[i], shapes[j]);
      if (gap > 0 && gap < thresholdPx) {
        results.push({
          rule,
          level: gap < thresholdPx * 0.5 ? "fail" : "warn",
          message: `Aisle between elements is ${Math.round(gap * 10)}mm (min ${threshold}mm)`,
          affectedShapeIds: [shapes[i].id, shapes[j].id],
          measurement: Math.round(gap * 10),
          threshold,
        });
      }
    }
  }

  return results;
}

/**
 * Check desk-to-desk spacing.
 */
function checkDeskSpacing(shapes: ShapeBounds[]): ComplianceResult[] {
  const results: ComplianceResult[] = [];
  const rule = RULES.find((r) => r.id === "desk-to-desk-min");
  if (!rule) return results;
  const threshold = 1200; // mm
  const thresholdPx = threshold / 10;

  const desks = shapes.filter((s) => s.type.includes("desk") || s.type.includes("bench"));

  for (let i = 0; i < desks.length; i++) {
    for (let j = i + 1; j < desks.length; j++) {
      const gap = getMinGap(desks[i], desks[j]);
      if (gap > 0 && gap < thresholdPx) {
        results.push({
          rule,
          level: "warn",
          message: `Desk spacing is ${Math.round(gap * 10)}mm (recommended ${threshold}mm)`,
          affectedShapeIds: [desks[i].id, desks[j].id],
          measurement: Math.round(gap * 10),
          threshold,
        });
      }
    }
  }

  return results;
}

/**
 * Check zone capacity limits.
 */
function checkZoneCapacity(zones: ZoneData[]): ComplianceResult[] {
  const results: ComplianceResult[] = [];
  const rule = RULES.find((r) => r.id === "zone-over-capacity");
  if (!rule) return results;

  for (const zone of zones) {
    if (zone.capacity <= 0) continue;
    const ratio = zone.currentOccupancy / zone.capacity;
    if (ratio > 0.8) {
      results.push({
        rule,
        level: ratio > 1.0 ? "fail" : "warn",
        message: `Zone at ${Math.round(ratio * 100)}% capacity (max recommended 80%)`,
        affectedShapeIds: [zone.id],
        measurement: Math.round(ratio * 100),
        threshold: 80,
      });
    }
  }

  return results;
}

/**
 * Check space utilization (furniture area / room area).
 */
function checkSpaceUtilization(
  furnitureShapes: ShapeBounds[],
  roomArea: number,
): ComplianceResult[] {
  const results: ComplianceResult[] = [];
  const rule = RULES.find((r) => r.id === "space-utilization");
  if (!rule) return results;

  if (roomArea <= 0) return results;

  const furnitureArea = furnitureShapes.reduce((sum, s) => sum + s.width * s.height, 0);
  const ratio = furnitureArea / roomArea;

  if (ratio > 0.7) {
    results.push({
      rule,
      level: ratio > 0.85 ? "fail" : "warn",
      message: `Space ${Math.round(ratio * 100)}% utilized (max recommended 70%)`,
      affectedShapeIds: furnitureShapes.map((s) => s.id),
      measurement: Math.round(ratio * 100),
      threshold: 70,
    });
  }

  return results;
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

export interface ComplianceCheckInput {
  shapes: ShapeBounds[];
  zones: ZoneData[];
  roomArea: number;
}

/**
 * Run all compliance checks and return results.
 */
export function runComplianceChecks(input: ComplianceCheckInput): ComplianceResult[] {
  const { shapes, zones, roomArea } = input;
  const results: ComplianceResult[] = [];

  results.push(...checkAisleWidth(shapes));
  results.push(...checkDeskSpacing(shapes));
  results.push(...checkZoneCapacity(zones));
  results.push(...checkSpaceUtilization(
    shapes.filter((s) => !s.type.includes("wall") && !s.type.includes("zone")),
    roomArea,
  ));

  return results;
}

/**
 * Get a summary of compliance results.
 */
export function getComplianceSummary(results: ComplianceResult[]) {
  return {
    total: results.length,
    pass: results.filter((r) => r.level === "pass").length,
    warn: results.filter((r) => r.level === "warn").length,
    fail: results.filter((r) => r.level === "fail").length,
    isCompliant: results.every((r) => r.level !== "fail"),
  };
}

export { RULES as COMPLIANCE_RULES };
