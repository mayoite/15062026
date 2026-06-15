/**
 * Parametric Building Blocks (P1)
 *
 * Dimensioned worktops, benches, storage runs, partitions, and modular
 * workstation assemblies with configurable widths/depths clamped to
 * sensible min/max ranges.
 */

import type { CatalogItem, FurnitureCategory, FurnitureShape } from "../store/catalogData";

// --- Types ---

export type ParametricBlockType =
  | "worktop"
  | "bench"
  | "storage-run"
  | "partition"
  | "workstation-assembly";

export interface ParametricBlockDef {
  type: ParametricBlockType;
  defaultWidthMm: number;
  defaultDepthMm: number;
  minWidthMm: number;
  maxWidthMm: number;
  resizable: boolean;
  segments?: number;
}

// --- Default block definitions ---

export const PARAMETRIC_BLOCKS: ParametricBlockDef[] = [
  {
    type: "worktop",
    defaultWidthMm: 1200,
    defaultDepthMm: 600,
    minWidthMm: 600,
    maxWidthMm: 3000,
    resizable: true,
  },
  {
    type: "bench",
    defaultWidthMm: 2400,
    defaultDepthMm: 700,
    minWidthMm: 1200,
    maxWidthMm: 6000,
    resizable: true,
    segments: 2,
  },
  {
    type: "storage-run",
    defaultWidthMm: 1600,
    defaultDepthMm: 450,
    minWidthMm: 400,
    maxWidthMm: 4800,
    resizable: true,
    segments: 4,
  },
  {
    type: "partition",
    defaultWidthMm: 1200,
    defaultDepthMm: 60,
    minWidthMm: 600,
    maxWidthMm: 3600,
    resizable: true,
  },
  {
    type: "workstation-assembly",
    defaultWidthMm: 4800,
    defaultDepthMm: 1400,
    minWidthMm: 2400,
    maxWidthMm: 9600,
    resizable: true,
    segments: 4,
  },
];

// --- Helpers ---

const TYPE_TO_CATEGORY: Record<ParametricBlockType, FurnitureCategory> = {
  worktop: "desks",
  bench: "desks",
  "storage-run": "storage",
  partition: "misc",
  "workstation-assembly": "desks",
};

const TYPE_TO_SHAPE: Record<ParametricBlockType, FurnitureShape> = {
  worktop: "workstation-linear",
  bench: "workstation-bench",
  "storage-run": "storage-wall",
  partition: "partition-screen",
  "workstation-assembly": "workstation-cluster",
};

const TYPE_TO_HEIGHT: Record<ParametricBlockType, number> = {
  worktop: 750,
  bench: 750,
  "storage-run": 1100,
  partition: 1400,
  "workstation-assembly": 750,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// --- Public API ---

/**
 * Generate a catalog-compatible item from a parametric block definition
 * with custom dimensions (clamped to the block's min/max range).
 */
export function createParametricBlock(
  def: ParametricBlockDef,
  widthMm: number,
  depthMm?: number,
): CatalogItem {
  const finalWidth = clamp(widthMm, def.minWidthMm, def.maxWidthMm);
  const finalDepth = depthMm ?? def.defaultDepthMm;

  return {
    id: `parametric-${def.type}-${finalWidth}x${finalDepth}`,
    name: `${def.type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} ${finalWidth}`,
    sku: `OOFPL-PRM-${def.type.toUpperCase().replace(/-/g, "")}-${finalWidth}`,
    category: TYPE_TO_CATEGORY[def.type],
    widthMm: finalWidth,
    depthMm: finalDepth,
    heightMm: TYPE_TO_HEIGHT[def.type],
    iconPath: `/furniture-icons/parametric/${def.type}.svg`,
    priceInr: 0,
    shape: TYPE_TO_SHAPE[def.type],
  };
}

/**
 * Calculate how many equal-width storage units fit within a total run width.
 * Returns the integer number of units (floor division).
 */
export function subdivideStorageRun(totalWidthMm: number, unitWidthMm: number): number {
  if (unitWidthMm <= 0 || totalWidthMm <= 0) return 0;
  return Math.floor(totalWidthMm / unitWidthMm);
}
