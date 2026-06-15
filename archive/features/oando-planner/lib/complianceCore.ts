/**
 * Shared compliance types, defaults, and rule metadata.
 */

// Compliance rule IDs
export type ComplianceRuleId =
  | "min-aisle-width"
  | "fire-exit-clearance"
  | "desk-spacing"
  | "ada-accessibility"
  | "door-clearance"
  | "emergency-path"
  | "ventilation-clearance"
  | "max-occupancy"
  | "furniture-overlap"
  | "wall-clearance";

// Severity levels
export type Severity = "critical" | "warning" | "info";

// Compliance configuration
export interface ComplianceConfig {
  minAisleWidthMm: number;
  preferredAisleWidthMm: number;
  fireExitClearanceMm: number;
  minDeskSpacingMm: number;
  adaClearanceMm: number;
  doorClearanceMm: number;
  maxOccupancySqmPerPerson: number;
  ventilationClearanceMm: number;
  wallClearanceMm: number;
}

// Default configuration
export const DEFAULT_COMPLIANCE_CONFIG: ComplianceConfig = {
  minAisleWidthMm: 900,
  preferredAisleWidthMm: 1200,
  fireExitClearanceMm: 1000,
  minDeskSpacingMm: 1500,
  adaClearanceMm: 900,
  doorClearanceMm: 800,
  maxOccupancySqmPerPerson: 4.6,
  ventilationClearanceMm: 300,
  wallClearanceMm: 100,
};

// Compliance violation
export interface ComplianceViolation {
  ruleId: ComplianceRuleId;
  severity: Severity;
  message: string;
  details: string;
  affectedShapeIds: string[];
  suggestedFix?: string;
  location?: { x: number; y: number };
  standardRef?: string;
}

// Compliance check result
export interface ComplianceCheckResult {
  passed: boolean;
  violations: ComplianceViolation[];
  checkedAt: string;
  totalChecks: number;
  passedChecks: number;
  score: number;
}

export const COMPLIANCE_RULES: Record<
  ComplianceRuleId,
  {
    severity: Severity;
    standard: string;
    threshold: string;
    standardRef?: string;
  }
> = {
  "min-aisle-width": {
    severity: "critical",
    standard: "ADA",
    threshold: "900mm (1200mm preferred)",
    standardRef: "ADA 2010 4.3.3",
  },
  "fire-exit-clearance": {
    severity: "critical",
    standard: "Fire Code",
    threshold: "1000mm clear path",
    standardRef: "IFC 2018 1028.2",
  },
  "desk-spacing": {
    severity: "warning",
    standard: "Ergonomics",
    threshold: "1500mm between workstations",
    standardRef: "BIFMA X5.5",
  },
  "ada-accessibility": {
    severity: "critical",
    standard: "ADA 2010",
    threshold: "900mm wheelchair clearance",
    standardRef: "ADA 2010 4.2.1",
  },
  "door-clearance": {
    severity: "warning",
    standard: "Building Code",
    threshold: "800mm clear zone",
    standardRef: "IBC 2018 1008.1",
  },
  "emergency-path": {
    severity: "critical",
    standard: "Fire Code",
    threshold: "Unobstructed exit path",
    standardRef: "IFC 2018 1028.1",
  },
  "ventilation-clearance": {
    severity: "info",
    standard: "HVAC",
    threshold: "300mm from vents",
  },
  "max-occupancy": {
    severity: "warning",
    standard: "Fire Code",
    threshold: "Based on zone area",
    standardRef: "IFC 2018 1004.5",
  },
  "furniture-overlap": {
    severity: "critical",
    standard: "Layout",
    threshold: "Zero overlap between items",
  },
  "wall-clearance": {
    severity: "info",
    standard: "Layout",
    threshold: "Minimum gap from walls",
  },
};
