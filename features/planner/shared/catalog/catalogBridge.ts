/**
 * Catalog Bridge — Phase 06
 *
 * Maps shared CatalogItem entries to planner-specific element library formats.
 * This allows both planners to consume a single catalog source while rendering
 * it in their own native element shape systems.
 */

import type { CatalogItem } from "./types";

// ─── Buddy Element Library Bridge ───────────────────────────────────────────

/**
 * Minimal shape of a Buddy library item (mirrors buddy-planner's LibraryItem).
 * We intentionally avoid importing from buddy-planner to keep planner-shared
 * independent of any single planner package.
 */
export type BuddyLibraryEntry = {
  type: string;
  label: string;
  category: string;
  shape?: string;
  catalogId: string;
  dimensions: { widthMm: number; depthMm: number; heightMm: number };
  thumbnail?: string;
};

/**
 * Category → Buddy element type mapping.
 * If a shared catalog item's category matches a key, it gets that Buddy type.
 */
const CATEGORY_TO_BUDDY_TYPE: Record<string, string> = {
  tables: "table-rect",
  table: "table-rect",
  desks: "desk",
  desk: "desk",
  seating: "chair",
  chairs: "chair",
  chair: "chair",
  storage: "decor",
  cabinets: "decor",
  collaborative: "sofa",
  sofas: "sofa",
  sofa: "sofa",
  lounge: "decor",
  plants: "plant",
  plant: "plant",
  printers: "printer",
  printer: "printer",
  whiteboards: "whiteboard",
  whiteboard: "whiteboard",
  dividers: "divider",
  divider: "divider",
};

const FALLBACK_BUDDY_TYPE = "custom-shape";

function deriveBuddyType(item: CatalogItem): string {
  const cat = item.category.toLowerCase();
  const sub = item.subcategory?.toLowerCase() ?? "";
  return (
    CATEGORY_TO_BUDDY_TYPE[cat] ??
    CATEGORY_TO_BUDDY_TYPE[sub] ??
    FALLBACK_BUDDY_TYPE
  );
}

function deriveBuddyCategory(item: CatalogItem): string {
  const cat = item.category.toLowerCase();
  if (cat.includes("table")) return "Tables";
  if (cat.includes("desk")) return "Desks";
  if (cat.includes("chair") || cat.includes("seat")) return "Seating";
  if (cat.includes("sofa") || cat.includes("lounge") || cat.includes("collab")) return "Furniture";
  if (cat.includes("storage") || cat.includes("cabinet")) return "Structure";
  if (cat.includes("plant")) return "Furniture";
  return "Other";
}

/**
 * Convert shared catalog items into Buddy-compatible library entries.
 */
export function catalogToBuddyLibrary(items: CatalogItem[]): BuddyLibraryEntry[] {
  return items.map((item) => ({
    type: deriveBuddyType(item),
    label: item.name,
    category: deriveBuddyCategory(item),
    catalogId: item.id,
    dimensions: item.dimensions,
    thumbnail: item.thumbnail ?? item.imageUrl,
  }));
}

// ─── Oando Planner Bridge ───────────────────────────────────────────────────

/**
 * Minimal shape of an Oando catalog furniture entry.
 */
export type OandoCatalogEntry = {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  color?: string;
  thumbnail?: string;
  modelUrl?: string;
  meshType?: string;
};

/**
 * Convert shared catalog items into Oando-compatible furniture entries.
 * Oando uses planner units where 1 unit = 1 cm, so we convert mm → cm.
 */
export function catalogToOandoFurniture(items: CatalogItem[]): OandoCatalogEntry[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    width: Math.round(item.dimensions.widthMm / 10),
    height: Math.round(item.dimensions.depthMm / 10),
    color: item.color,
    thumbnail: item.thumbnail ?? item.imageUrl,
    modelUrl: item.modelUrl,
    meshType: item.meshType,
  }));
}

// ─── Universal search + filter ──────────────────────────────────────────────

export type CatalogFilter = {
  query?: string;
  category?: string;
  maxWidthMm?: number;
  minWidthMm?: number;
};

/**
 * Filter and search catalog items with multiple criteria.
 */
export function filterCatalog(
  items: CatalogItem[],
  filter: CatalogFilter,
): CatalogItem[] {
  let results = items;

  if (filter.category && filter.category !== "all") {
    const lower = filter.category.toLowerCase();
    results = results.filter((item) => item.category.toLowerCase().includes(lower));
  }

  if (filter.query) {
    const q = filter.query.toLowerCase().trim();
    results = results.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.subcategory?.toLowerCase().includes(q) ||
        item.series?.toLowerCase().includes(q),
    );
  }

  if (filter.minWidthMm !== undefined) {
    const min = filter.minWidthMm;
    results = results.filter((item) => item.dimensions.widthMm >= min);
  }

  if (filter.maxWidthMm !== undefined) {
    const max = filter.maxWidthMm;
    results = results.filter((item) => item.dimensions.widthMm <= max);
  }

  return results;
}
