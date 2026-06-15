/**
 * Clearance & Collision Checker for OOFPL Planner
 *
 * Provides:
 * 1. Existing ADA aisle-width checks (Editor-based)
 * 2. Pure-geometry overlap detection (AABB intersection)
 * 3. Wall-to-furniture minimum clearance (100mm default)
 * 4. Unified validatePlacement() integration point
 *
 * Does NOT use a physics engine; relies on 2D axis-aligned bounding boxes.
 */

import type { Editor, TLShape } from '@tldraw/editor';
import { Box, Vec } from '@tldraw/editor';
import type { PlannerFurnitureTLShape, PlannerWallTLShape } from '../shapes/tldrawShapeTypes';

/** ADA minimum aisle width in millimetres. */
export const ADA_MIN_AISLE_WIDTH_MM = 900;
/** ADA wheelchair turning radius in millimetres. */
export const ADA_WHEELCHAIR_TURNING_MM = 1500;
/** Minimum clearance between furniture and wall face in millimetres. */
export const MIN_WALL_CLEARANCE_MM = 100;

export interface ClearanceViolation {
  id: string;
  type: "aisle-too-narrow" | "blocked-path" | "insufficient-clearance";
  message: string;
  measuredMm: number;
  requiredMm: number;
  shapeIds: string[];
  location: { x: number; y: number };
  severity: "error" | "warning";
}

export interface OverlapViolation {
  indexA: number;
  indexB: number;
  message: string;
}

export interface WallClearanceViolation {
  furnitureIndex: number;
  wallIndex: number;
  distanceMm: number;
  requiredMm: number;
  message: string;
}

export type Violation = OverlapViolation | WallClearanceViolation | ClearanceViolation;

export interface PlacementValidation {
  valid: boolean;
  warnings: string[];
  violations: Violation[];
}

/** Minimal rectangle descriptor for pure-geometry checks. */
export interface RectItem {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

/** Minimal wall descriptor for pure-geometry checks. */
export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
}

export interface ClearanceCheckOptions {
  minAisleWidthMm: number;
  warningFactor: number;
  checkWallClearance: boolean;
  checkFurnitureClearance: boolean;
  canvasUnitsPerMm: number;
}
const DEFAULT_OPTIONS: ClearanceCheckOptions = {
  minAisleWidthMm: ADA_MIN_AISLE_WIDTH_MM,
  warningFactor: 1.2,
  checkWallClearance: true,
  checkFurnitureClearance: true,
  canvasUnitsPerMm: 0.1,
};

function getFurnitureBounds(shape: TLShape): Box {
  const props = (shape as PlannerFurnitureTLShape).props;
  const w = props.widthMm ?? 100;
  const h = props.depthMm ?? 100;
  return new Box(shape.x, shape.y, w, h);
}

function getWallBounds(shape: TLShape): Box {
  const wall = shape as PlannerWallTLShape;
  const sx = wall.x + (wall.props.startX ?? 0);
  const sy = wall.y + (wall.props.startY ?? 0);
  const ex = wall.x + (wall.props.endX ?? 0);
  const ey = wall.y + (wall.props.endY ?? 0);
  const minX = Math.min(sx, ex);
  const minY = Math.min(sy, ey);
  const maxX = Math.max(sx, ex);
  const maxY = Math.max(sy, ey);
  const thickness = wall.props.thickness ?? 10;
  return new Box(minX, minY, Math.max(maxX - minX, thickness), Math.max(maxY - minY, thickness));
}
function minDistanceBetweenBoxes(a: Box, b: Box): { distance: number; midpoint: Vec } {
  const gapX = Math.max(0, Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width)));
  const gapY = Math.max(0, Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height)));
  const distance = Math.sqrt(gapX * gapX + gapY * gapY);
  const midX = (a.x + a.width / 2 + b.x + b.width / 2) / 2;
  const midY = (a.y + a.height / 2 + b.y + b.height / 2) / 2;
  return { distance, midpoint: new Vec(midX, midY) };
}

/**
 * Get the axis-aligned bounding box for a potentially rotated rectangle.
 */
function getAABB(item: RectItem): { x: number; y: number; width: number; height: number } {
  const rotation = item.rotation ?? 0;
  if (rotation === 0) {
    return { x: item.x, y: item.y, width: item.width, height: item.height };
  }
  const cx = item.x + item.width / 2;
  const cy = item.y + item.height / 2;
  const cos = Math.abs(Math.cos(rotation));
  const sin = Math.abs(Math.sin(rotation));
  const newW = item.width * cos + item.height * sin;
  const newH = item.width * sin + item.height * cos;
  return { x: cx - newW / 2, y: cy - newH / 2, width: newW, height: newH };
}
/** Convert a Wall descriptor to an AABB rect. */
function wallToRect(wall: Wall): { x: number; y: number; width: number; height: number } {
  const minX = Math.min(wall.x1, wall.x2);
  const minY = Math.min(wall.y1, wall.y2);
  const maxX = Math.max(wall.x1, wall.x2);
  const maxY = Math.max(wall.y1, wall.y2);
  const w = Math.max(maxX - minX, wall.thickness);
  const h = Math.max(maxY - minY, wall.thickness);
  return { x: minX, y: minY, width: w, height: h };
}

/** Minimum distance between two axis-aligned rectangles (0 if overlapping). */
function rectDistance(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): number {
  const gapX = Math.max(0, Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width)));
  const gapY = Math.max(0, Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height)));
  return Math.sqrt(gapX * gapX + gapY * gapY);
}
// Pure-geometry public API

/**
 * Detect overlapping items using axis-aligned bounding box intersection.
 */
export function checkOverlap(items: RectItem[]): OverlapViolation[] {
  const violations: OverlapViolation[] = [];
  for (let i = 0; i < items.length; i++) {
    const a = getAABB(items[i]);
    for (let j = i + 1; j < items.length; j++) {
      const b = getAABB(items[j]);
      const overlapsX = a.x < b.x + b.width && a.x + a.width > b.x;
      const overlapsY = a.y < b.y + b.height && a.y + a.height > b.y;
      if (overlapsX && overlapsY) {
        violations.push({
          indexA: i,
          indexB: j,
          message: `Item ${i} overlaps with item ${j}`,
        });
      }
    }
  }
  return violations;
}
/**
 * Check that every furniture item maintains at least minClearanceMm distance
 * from every wall face. Default minimum is 100mm.
 */
export function checkWallClearance(
  furniture: RectItem[],
  walls: Wall[],
  minClearanceMm: number = MIN_WALL_CLEARANCE_MM,
): WallClearanceViolation[] {
  const violations: WallClearanceViolation[] = [];
  for (let fi = 0; fi < furniture.length; fi++) {
    const fRect = getAABB(furniture[fi]);
    for (let wi = 0; wi < walls.length; wi++) {
      const wRect = wallToRect(walls[wi]);
      const dist = rectDistance(fRect, wRect);
      if (dist < minClearanceMm) {
        violations.push({
          furnitureIndex: fi,
          wallIndex: wi,
          distanceMm: Math.round(dist),
          requiredMm: minClearanceMm,
          message: `Furniture ${fi} is ${Math.round(dist)}mm from wall ${wi} (minimum ${minClearanceMm}mm)`,
        });
      }
    }
  }
  return violations;
}
/**
 * Unified placement validation entry point.
 * Checks a new item against existing items for overlap, and against walls for
 * minimum clearance.
 */
export function validatePlacement(
  newItem: RectItem,
  existingItems: RectItem[],
  walls: Wall[],
  options: { minWallClearanceMm?: number } = {},
): PlacementValidation {
  const minWallClearanceMm = options.minWallClearanceMm ?? MIN_WALL_CLEARANCE_MM;
  const warnings: string[] = [];
  const violations: Violation[] = [];

  // Check overlap of newItem against each existing item
  const allItems = [...existingItems, newItem];
  const newIndex = allItems.length - 1;
  const overlapViolations = checkOverlap(allItems);
  for (const ov of overlapViolations) {
    if (ov.indexA === newIndex || ov.indexB === newIndex) {
      violations.push(ov);
      warnings.push(ov.message);
    }
  }

  // Check wall clearance for the new item only
  const wallViolations = checkWallClearance([newItem], walls, minWallClearanceMm);
  for (const wv of wallViolations) {
    violations.push(wv);
    warnings.push(wv.message);
  }

  return {
    valid: violations.length === 0,
    warnings,
    violations,
  };
}
// Editor-based checks (existing API)

/**
 * Run clearance checks on the current page and return all violations.
 */
export function checkClearanceViolations(
  editor: Editor,
  options: Partial<ClearanceCheckOptions> = {},
): ClearanceViolation[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const violations: ClearanceViolation[] = [];
  const shapes = editor.getCurrentPageShapes();
  const furnitureShapes = shapes.filter((s) => s.type === "planner-furniture");
  const wallShapes = shapes.filter((s) => s.type === "planner-wall");
  let violationIdx = 0;
  if (opts.checkFurnitureClearance) {
    for (let i = 0; i < furnitureShapes.length; i++) {
      for (let j = i + 1; j < furnitureShapes.length; j++) {
        const boundsA = getFurnitureBounds(furnitureShapes[i]);
        const boundsB = getFurnitureBounds(furnitureShapes[j]);
        const { distance, midpoint } = minDistanceBetweenBoxes(boundsA, boundsB);
        const distanceMm = distance * (1 / opts.canvasUnitsPerMm);
        if (distanceMm > 0 && distanceMm < opts.minAisleWidthMm * opts.warningFactor) {
          const isError = distanceMm < opts.minAisleWidthMm;
          violations.push({
            id: `clearance-ff-${violationIdx++}`,
            type: "aisle-too-narrow",
            message: isError
              ? `Aisle width ${Math.round(distanceMm)}mm is below ADA minimum (${opts.minAisleWidthMm}mm)`
              : `Aisle width ${Math.round(distanceMm)}mm is close to ADA minimum (${opts.minAisleWidthMm}mm)`,
            measuredMm: Math.round(distanceMm),
            requiredMm: opts.minAisleWidthMm,
            shapeIds: [furnitureShapes[i].id, furnitureShapes[j].id],
            location: { x: midpoint.x, y: midpoint.y },
            severity: isError ? "error" : "warning",
          });
        }
      }
    }
  }
  if (opts.checkWallClearance) {
    for (const furniture of furnitureShapes) {
      const furnitureBounds = getFurnitureBounds(furniture);
      for (const wall of wallShapes) {
        const wallBounds = getWallBounds(wall);
        const { distance, midpoint } = minDistanceBetweenBoxes(furnitureBounds, wallBounds);
        const distanceMm = distance * (1 / opts.canvasUnitsPerMm);
        if (distanceMm > 0 && distanceMm < opts.minAisleWidthMm * opts.warningFactor) {
          const isError = distanceMm < opts.minAisleWidthMm;
          violations.push({
            id: `clearance-wf-${violationIdx++}`,
            type: "insufficient-clearance",
            message: isError
              ? `Wall clearance ${Math.round(distanceMm)}mm below ADA minimum (${opts.minAisleWidthMm}mm)`
              : `Wall clearance ${Math.round(distanceMm)}mm close to ADA minimum (${opts.minAisleWidthMm}mm)`,
            measuredMm: Math.round(distanceMm),
            requiredMm: opts.minAisleWidthMm,
            shapeIds: [furniture.id, wall.id],
            location: { x: midpoint.x, y: midpoint.y },
            severity: isError ? "error" : "warning",
          });
        }
      }
    }
  }

  return violations;
}
/**
 * Quick check: returns true if all aisles meet ADA minimum width.
 */
export function meetsAdaClearance(
  editor: Editor,
  options: Partial<ClearanceCheckOptions> = {},
): boolean {
  const violations = checkClearanceViolations(editor, options);
  return violations.filter((v) => v.severity === "error").length === 0;
}

/**
 * Get a summary of clearance status for the status bar.
 */
export function getClearanceSummary(
  editor: Editor,
  options: Partial<ClearanceCheckOptions> = {},
): { errors: number; warnings: number; passed: boolean } {
  const violations = checkClearanceViolations(editor, options);
  const errors = violations.filter((v) => v.severity === "error").length;
  const warnings = violations.filter((v) => v.severity === "warning").length;
  return { errors, warnings, passed: errors === 0 };
}
