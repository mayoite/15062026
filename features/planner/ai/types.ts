import type { PlannerPrimaryPurpose } from "@/features/planner/onboarding/projectSetup";

/** Canvas wall segment in page coordinates (canvas units). */
export type SuggestedLayoutWall = {
  type: "planner-wall";
  x: number;
  y: number;
  endX: number;
  endY: number;
  lengthMm: number;
};

/** Furniture placement referencing a catalog SKU. */
export type SuggestedLayoutFurniture = {
  catalogItemId: string;
  label: string;
  x: number;
  y: number;
  rotation?: number;
};

export type SuggestedLayoutZone = {
  label: string;
  x: number;
  y: number;
  widthMm: number;
  heightMm: number;
  zoneType: "focus" | "collaborative" | "quiet" | "social";
};

/**
 * Structured layout payload consumed by `applySuggestedLayout`.
 *
 * Unit convention:
 * - `room.x` / `room.y`, zone `x`/`y`, furniture `x`/`y`, wall anchors: canvas units
 * - `room.widthMm` / `room.depthMm`, zone `widthMm`/`heightMm`: real millimetres
 */
export type SuggestedLayoutJson = {
  version: 1;
  source: "grid-pack" | "llm";
  summary: string;
  room: {
    label: string;
    x: number;
    y: number;
    /** Real-world width in millimetres. */
    widthMm: number;
    /** Real-world depth in millimetres. */
    depthMm: number;
  };
  walls: SuggestedLayoutWall[];
  zones: SuggestedLayoutZone[];
  furniture: SuggestedLayoutFurniture[];
};

export type SpaceSuggestInput = {
  seatCount: number;
  purpose: PlannerPrimaryPurpose;
  floorAreaSqFt?: number;
};

export type CatalogPriceTier = "budget" | "standard" | "premium";

export type CanvasFurnitureKind = "workstation" | "chair" | "storage";

export type CanvasPlacementSummary = {
  shapeId: string;
  kind: CanvasFurnitureKind;
  label: string;
  widthMm: number;
  heightMm: number;
  catalogItemId?: string;
};

export type CatalogSkuMatch = {
  tier: CatalogPriceTier;
  catalogItemId: string;
  name: string;
  score: number;
  reason: string;
};

export type CatalogMatchResult = {
  placement: CanvasPlacementSummary;
  matches: CatalogSkuMatch[];
};