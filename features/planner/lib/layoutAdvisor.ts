/**
 * Rule-based Layout Advisor
 *
 * Constraint-based layout evaluation inspired by 3D room/furniture algorithms.
 * Pure geometry - no AI/LLM dependency.
 */

// --- Types ---

export interface Point2D {
  xMm: number;
  yMm: number;
}

export interface FurnitureItem {
  id: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  depthMm: number;
  rotationDeg: number;
}

export interface Wall {
  id: string;
  x1Mm: number;
  y1Mm: number;
  x2Mm: number;
  y2Mm: number;
  thicknessMm: number;
}

export interface Room {
  id: string;
  /** Polygon vertices in mm */
  vertices: Point2D[];
  areaSqMm: number;
}

export interface DoorItem {
  id: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  swingRadiusMm: number;
}

// --- Constraints ---

export interface LayoutConstraint {
  type: "min-clearance" | "max-density" | "desk-spacing" | "door-clearance" | "window-access";
  minMm: number;
  description: string;
}

export const DEFAULT_CONSTRAINTS: LayoutConstraint[] = [
  {
    type: "min-clearance",
    minMm: 900,
    description: "ADA minimum aisle clearance between furniture (900mm)",
  },
  {
    type: "max-density",
    minMm: 10_000_000, // 10 sqm expressed as sq-mm
    description: "Maximum density: at least 10 sqm per person",
  },
  {
    type: "desk-spacing",
    minMm: 1200,
    description: "Minimum 1200mm between facing desks",
  },
  {
    type: "door-clearance",
    minMm: 1000,
    description: "1000mm radius kept clear around doors",
  },
  {
    type: "window-access",
    minMm: 600,
    description: "600mm clearance from window walls",
  },
];

// --- Evaluation result types ---

export interface LayoutViolation {
  constraint: LayoutConstraint;
  itemIds: string[];
  message: string;
  severity: "warning" | "error";
}

export interface LayoutEvaluation {
  score: number; // 0-100
  violations: LayoutViolation[];
  suggestions: string[];
}

// --- Geometry helpers ---

interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function furnitureToAABB(item: FurnitureItem): AABB {
  const rad = (item.rotationDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = item.widthMm * cos + item.depthMm * sin;
  const d = item.widthMm * sin + item.depthMm * cos;
  return {
    minX: item.xMm - w / 2,
    minY: item.yMm - d / 2,
    maxX: item.xMm + w / 2,
    maxY: item.yMm + d / 2,
  };
}

function aabbDistance(a: AABB, b: AABB): number {
  const gapX = Math.max(0, Math.max(b.minX - a.maxX, a.minX - b.maxX));
  const gapY = Math.max(0, Math.max(b.minY - a.maxY, a.minY - b.maxY));
  return Math.sqrt(gapX * gapX + gapY * gapY);
}

function pointToSegmentDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

function aabbToWallDistance(aabb: AABB, wall: Wall): number {
  const points: [number, number][] = [
    [aabb.minX, aabb.minY],
    [aabb.maxX, aabb.minY],
    [aabb.minX, aabb.maxY],
    [aabb.maxX, aabb.maxY],
    [(aabb.minX + aabb.maxX) / 2, aabb.minY],
    [(aabb.minX + aabb.maxX) / 2, aabb.maxY],
    [aabb.minX, (aabb.minY + aabb.maxY) / 2],
    [aabb.maxX, (aabb.minY + aabb.maxY) / 2],
  ];
  let minDist = Infinity;
  for (const [cx, cy] of points) {
    const d = pointToSegmentDistance(cx, cy, wall.x1Mm, wall.y1Mm, wall.x2Mm, wall.y2Mm);
    if (d < minDist) minDist = d;
  }
  return Math.max(0, minDist - wall.thicknessMm / 2);
}

// --- Core evaluation ---

export function evaluateLayout(
  furniture: FurnitureItem[],
  walls: Wall[],
  rooms: Room[],
  doors: DoorItem[],
  constraints: LayoutConstraint[] = DEFAULT_CONSTRAINTS,
): LayoutEvaluation {
  const violations: LayoutViolation[] = [];
  const suggestions: string[] = [];

  const constraintMap = new Map<string, LayoutConstraint>();
  for (const c of constraints) constraintMap.set(c.type, c);

  const aabbs = furniture.map(furnitureToAABB);

  // 1. Min-clearance between furniture pairs
  const minClearance = constraintMap.get("min-clearance");
  if (minClearance) {
    for (let i = 0; i < furniture.length; i++) {
      for (let j = i + 1; j < furniture.length; j++) {
        const dist = aabbDistance(aabbs[i], aabbs[j]);
        if (dist < minClearance.minMm && dist >= 0) {
          violations.push({
            constraint: minClearance,
            itemIds: [furniture[i].id, furniture[j].id],
            message: `Clearance between "${furniture[i].id}" and "${furniture[j].id}" is ${Math.round(dist)}mm (min ${minClearance.minMm}mm)`,
            severity: dist < minClearance.minMm * 0.5 ? "error" : "warning",
          });
        }
      }
    }
  }

  // 2. Max-density (area per person)
  const maxDensity = constraintMap.get("max-density");
  if (maxDensity && rooms.length > 0) {
    const totalArea = rooms.reduce((sum, r) => sum + r.areaSqMm, 0);
    const personCount = furniture.length;
    if (personCount > 0) {
      const areaPerPerson = totalArea / personCount;
      if (areaPerPerson < maxDensity.minMm) {
        violations.push({
          constraint: maxDensity,
          itemIds: rooms.map((r) => r.id),
          message: `Density too high: ${Math.round(areaPerPerson / 1_000_000)} sqm/person (min 10 sqm)`,
          severity: areaPerPerson < maxDensity.minMm * 0.7 ? "error" : "warning",
        });
        suggestions.push("Consider removing furniture or using a larger room to meet density requirements.");
      }
    }
  }

  // 3. Desk-spacing (higher threshold for facing desks)
  const deskSpacing = constraintMap.get("desk-spacing");
  if (deskSpacing) {
    for (let i = 0; i < furniture.length; i++) {
      for (let j = i + 1; j < furniture.length; j++) {
        const dist = aabbDistance(aabbs[i], aabbs[j]);
        if (dist > 0 && dist < deskSpacing.minMm) {
          const alreadyCaptured = minClearance && dist < minClearance.minMm;
          if (!alreadyCaptured) {
            violations.push({
              constraint: deskSpacing,
              itemIds: [furniture[i].id, furniture[j].id],
              message: `Desk spacing between "${furniture[i].id}" and "${furniture[j].id}" is ${Math.round(dist)}mm (min ${deskSpacing.minMm}mm)`,
              severity: "warning",
            });
          }
        }
      }
    }
  }

  // 4. Door-clearance
  const doorClearance = constraintMap.get("door-clearance");
  if (doorClearance) {
    for (const door of doors) {
      for (let i = 0; i < furniture.length; i++) {
        const nearestX = Math.max(aabbs[i].minX, Math.min(door.xMm, aabbs[i].maxX));
        const nearestY = Math.max(aabbs[i].minY, Math.min(door.yMm, aabbs[i].maxY));
        const dist = Math.sqrt((door.xMm - nearestX) ** 2 + (door.yMm - nearestY) ** 2);
        if (dist < doorClearance.minMm) {
          violations.push({
            constraint: doorClearance,
            itemIds: [furniture[i].id, door.id],
            message: `"${furniture[i].id}" is ${Math.round(dist)}mm from door "${door.id}" (min ${doorClearance.minMm}mm)`,
            severity: dist < doorClearance.minMm * 0.5 ? "error" : "warning",
          });
        }
      }
    }
  }

  // 5. Window-access (furniture distance from walls)
  const windowAccess = constraintMap.get("window-access");
  if (windowAccess) {
    for (let i = 0; i < furniture.length; i++) {
      for (const wall of walls) {
        const dist = aabbToWallDistance(aabbs[i], wall);
        if (dist < windowAccess.minMm) {
          violations.push({
            constraint: windowAccess,
            itemIds: [furniture[i].id, wall.id],
            message: `"${furniture[i].id}" is ${Math.round(dist)}mm from wall "${wall.id}" (min ${windowAccess.minMm}mm window access)`,
            severity: "warning",
          });
        }
      }
    }
  }

  // Suggestions based on violations
  if (violations.some((v) => v.constraint.type === "min-clearance")) {
    suggestions.push("Increase spacing between items to maintain ADA-compliant aisles.");
  }
  if (violations.some((v) => v.constraint.type === "door-clearance")) {
    suggestions.push("Move furniture away from door swing areas.");
  }
  if (violations.some((v) => v.constraint.type === "window-access")) {
    suggestions.push("Ensure furniture does not block window access.");
  }

  // Score: start at 100, deduct per violation
  const errorCount = violations.filter((v) => v.severity === "error").length;
  const warningCount = violations.filter((v) => v.severity === "warning").length;
  const score = Math.max(0, Math.min(100, 100 - errorCount * 15 - warningCount * 5));

  return { score, violations, suggestions };
}

// --- Placement suggestion ---

export function suggestPlacementZone(
  room: Room,
  existingFurniture: FurnitureItem[],
  itemWidth: number,
  itemDepth: number,
  gridStepMm: number = 300,
): Point2D[] {
  // Compute room bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const v of room.vertices) {
    if (v.xMm < minX) minX = v.xMm;
    if (v.yMm < minY) minY = v.yMm;
    if (v.xMm > maxX) maxX = v.xMm;
    if (v.yMm > maxY) maxY = v.yMm;
  }

  const MIN_CLEARANCE = 900; // ADA aisle
  const candidates: Point2D[] = [];
  const existingAABBs = existingFurniture.map(furnitureToAABB);

  for (let x = minX + itemWidth / 2 + MIN_CLEARANCE; x <= maxX - itemWidth / 2 - MIN_CLEARANCE; x += gridStepMm) {
    for (let y = minY + itemDepth / 2 + MIN_CLEARANCE; y <= maxY - itemDepth / 2 - MIN_CLEARANCE; y += gridStepMm) {
      const candidateAABB: AABB = {
        minX: x - itemWidth / 2,
        minY: y - itemDepth / 2,
        maxX: x + itemWidth / 2,
        maxY: y + itemDepth / 2,
      };

      let valid = true;
      for (const existing of existingAABBs) {
        if (aabbDistance(candidateAABB, existing) < MIN_CLEARANCE) {
          valid = false;
          break;
        }
      }

      if (valid && isPointInPolygon({ xMm: x, yMm: y }, room.vertices)) {
        candidates.push({ xMm: x, yMm: y });
      }
    }
  }

  return candidates;
}

/** Ray-casting point-in-polygon test. */
function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].xMm, yi = polygon[i].yMm;
    const xj = polygon[j].xMm, yj = polygon[j].yMm;
    const intersect =
      yi > point.yMm !== yj > point.yMm &&
      point.xMm < ((xj - xi) * (point.yMm - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
