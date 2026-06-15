import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";

import type {
  CanvasFurnitureKind,
  CanvasPlacementSummary,
  CatalogMatchResult,
  CatalogPriceTier,
  CatalogSkuMatch,
} from "./types";

const TIER_ORDER: CatalogPriceTier[] = ["budget", "standard", "premium"];

export function inferCatalogPriceTier(item: CatalogItem): CatalogPriceTier {
  const blob = `${item.name} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
  if (
    blob.includes("executive") ||
    blob.includes("boardroom") ||
    blob.includes("premium") ||
    item.tags.includes("executive")
  ) {
    return "premium";
  }
  if (
    blob.includes("particle board") ||
    blob.includes("pre laminate") ||
    item.widthMm < 100 ||
    item.tags.includes("basic")
  ) {
    return "budget";
  }
  return "standard";
}

function kindCandidates(kind: CanvasFurnitureKind): CatalogItem[] {
  if (kind === "storage") {
    return PLANNER_CATALOG_ITEMS.filter((item) => item.category === "storage");
  }
  if (kind === "chair") {
    return PLANNER_CATALOG_ITEMS.filter(
      (item) =>
        item.category === "equipment" ||
        item.tags.some((tag) => ["chair", "seat", "stool"].includes(tag)),
    );
  }
  return PLANNER_CATALOG_ITEMS.filter(
    (item) =>
      item.category === "desks" ||
      item.shapeType === "planner-desk" ||
      item.shapeType === "planner-bench",
  );
}

function sizeScore(targetW: number, targetH: number, item: CatalogItem): number {
  const widthDelta = Math.abs(item.widthMm - targetW);
  const heightDelta = Math.abs(item.heightMm - targetH);
  return Math.max(0, 100 - (widthDelta + heightDelta) / 20);
}

function scoreCatalogItem(
  placement: CanvasPlacementSummary,
  item: CatalogItem,
): CatalogSkuMatch {
  const tier = inferCatalogPriceTier(item);
  const size = sizeScore(placement.widthMm, placement.heightMm, item);
  const nameMatch = item.name.toLowerCase().includes(placement.label.toLowerCase()) ? 12 : 0;
  const score = size + nameMatch + (item.seatCount && placement.kind === "workstation" ? 8 : 0);

  return {
    tier,
    catalogItemId: item.id,
    name: item.name,
    score,
    reason: `Closest ${tier} match for ${placement.kind} (${item.widthMm}×${item.heightMm} mm)`,
  };
}

export function matchCatalogForPlacement(placement: CanvasPlacementSummary): CatalogMatchResult {
  const candidates = kindCandidates(placement.kind);
  const ranked = candidates
    .map((item) => scoreCatalogItem(placement, item))
    .sort((a, b) => b.score - a.score);

  const byTier: CatalogSkuMatch[] = [];
  for (const tier of TIER_ORDER) {
    const best = ranked.find((match) => match.tier === tier);
    if (best) byTier.push(best);
  }

  return {
    placement,
    matches: byTier.length > 0 ? byTier : ranked.slice(0, 3),
  };
}

export function matchCatalogForPlacements(
  placements: CanvasPlacementSummary[],
): CatalogMatchResult[] {
  return placements.map(matchCatalogForPlacement);
}