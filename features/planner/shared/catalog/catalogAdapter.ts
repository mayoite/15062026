import type { MeshFamily } from "../mesh-contract";
import type { CatalogItem, CatalogItemDimensions } from "./types";

import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";

const PLANNER_CATALOG_JSON_PATH = "/planner-app/data/planner-catalog.v1.json";

function workspaceCatalogFallback(): CatalogItem[] {
  return normalizeCatalogBatch(
    PLANNER_CATALOG_ITEMS.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      width_mm: item.widthMm,
      height_mm: item.heightMm,
      depth_mm: item.depthMm,
      seat_count: item.seatCount,
    })),
  );
}

export async function loadPlannerCatalog(): Promise<CatalogItem[]> {
  const res = await fetch(PLANNER_CATALOG_JSON_PATH);
  if (!res.ok) {
    return workspaceCatalogFallback();
  }
  const json: unknown = await res.json();
  const raw = Array.isArray(json)
    ? json
    : (json as { items?: unknown[] }).items ?? [];
  return normalizeCatalogBatch(raw as RawProduct[]);
}

export type RawProduct = {
  id?: string;
  name?: string;
  category?: string;
  categoryLabel?: string;
  subcategory?: string;
  subcategoryLabel?: string;
  family?: string;
  series?: string;
  variant?: string;
  imageUrl?: string;
  heroImageUrl?: string;
  image_url?: string;
  modelUrl?: string;
  model_url?: string;
  color?: string;
  colour?: string;
  finish?: string;
  finishes?: string[];
  metadata?: {
    color?: string;
    colour?: string;
    colorOptions?: string[];
    material?: string[];
    [k: string]: unknown;
  };
  specs?: {
    dimensions?: string;
    materials?: string[];
    [k: string]: unknown;
  };
  seat_count?: number;
  seatCount?: number;
  width_mm?: number;
  widthMm?: number;
  depth_mm?: number;
  depthMm?: number;
  height_mm?: number;
  heightMm?: number;
  dimensions?: Partial<CatalogItemDimensions>;
};

const FALLBACK_DIMENSIONS: CatalogItemDimensions = {
  widthMm: 600,
  depthMm: 600,
  heightMm: 750,
};

function extractDimensions(raw: RawProduct): CatalogItemDimensions {
  if (raw.dimensions) {
    return {
      widthMm: raw.dimensions.widthMm ?? FALLBACK_DIMENSIONS.widthMm,
      depthMm: raw.dimensions.depthMm ?? FALLBACK_DIMENSIONS.depthMm,
      heightMm: raw.dimensions.heightMm ?? FALLBACK_DIMENSIONS.heightMm,
    };
  }

  const parsedFromSpecs = parseDimensionsFromString(raw.specs?.dimensions);
  if (parsedFromSpecs) {
    return parsedFromSpecs;
  }

  return {
    widthMm: raw.width_mm ?? raw.widthMm ?? FALLBACK_DIMENSIONS.widthMm,
    depthMm: raw.depth_mm ?? raw.depthMm ?? FALLBACK_DIMENSIONS.depthMm,
    heightMm: raw.height_mm ?? raw.heightMm ?? FALLBACK_DIMENSIONS.heightMm,
  };
}

function parseDimensionsFromString(value: string | undefined): CatalogItemDimensions | null {
  if (!value) return null;
  const dims = value.match(/\d+(?:\.\d+)?/g);
  if (!dims || dims.length < 2) return null;

  const width = Number.parseFloat(dims[0]);
  const depth = Number.parseFloat(dims[1]);
  const height = dims.length > 2 ? Number.parseFloat(dims[2]) : FALLBACK_DIMENSIONS.heightMm;
  if (!Number.isFinite(width) || !Number.isFinite(depth) || !Number.isFinite(height)) {
    return null;
  }

  const text = value.toLowerCase();
  const hasCm = /\bcm\b/.test(text);
  const hasMm = /\bmm\b/.test(text);
  const toMm = hasCm ? 10 : hasMm ? 1 : width < 250 && depth < 250 ? 10 : 1;

  const widthMm = Math.max(200, Math.round(width * toMm));
  const depthMm = Math.max(200, Math.round(depth * toMm));
  const heightMm = Math.max(250, Math.round(height * toMm));

  return { widthMm, depthMm, heightMm };
}

function resolveColor(raw: RawProduct): string | undefined {
  const candidate =
    raw.color ??
    raw.colour ??
    raw.metadata?.color ??
    raw.metadata?.colour ??
    raw.metadata?.colorOptions?.[0] ??
    raw.finishes?.[0] ??
    raw.finish;

  if (typeof candidate !== "string") return undefined;
  const value = candidate.trim();
  return value.length > 0 ? value : undefined;
}

const CATEGORY_MESH_TYPE: Record<string, MeshFamily> = {
  tables: "table-rect",
  table: "table-rect",
  desks: "desk-rect",
  desk: "desk-rect",
  seating: "task-chair",
  chairs: "task-chair",
  chair: "task-chair",
  storage: "storage-cabinet",
  cabinets: "storage-cabinet",
  cabinet: "storage-cabinet",
  collaborative: "sofa",
  educational: "table-rect",
  lounge: "lounge-chair",
  sofas: "sofa",
  sofa: "sofa",
};

const FALLBACK_MESH_TYPE: MeshFamily = "utility-box";

function deriveMeshType(raw: RawProduct): MeshFamily {
  const cat = (raw.category ?? raw.categoryLabel ?? "").toLowerCase();
  const fam = (raw.family ?? "").toLowerCase();
  return (
    CATEGORY_MESH_TYPE[cat] ??
    CATEGORY_MESH_TYPE[fam] ??
    FALLBACK_MESH_TYPE
  );
}

export function normalizeCatalogItem(raw: RawProduct): CatalogItem {
  const imageUrl = raw.image_url ?? raw.imageUrl;
  const heroImageUrl = raw.heroImageUrl;
  const thumbnail = heroImageUrl ?? imageUrl;

  return {
    id: raw.id ?? crypto.randomUUID(),
    name: raw.name ?? "Unnamed Item",
    category: (raw.category ?? raw.categoryLabel ?? "uncategorized").toLowerCase(),
    subcategory: (raw.subcategory ?? raw.subcategoryLabel)?.toLowerCase(),
    series: (raw.series ?? raw.family)?.toLowerCase(),
    dimensions: extractDimensions(raw),
    imageUrl,
    thumbnail,
    modelUrl: raw.model_url ?? raw.modelUrl,
    meshType: deriveMeshType(raw),
    color: resolveColor(raw),
    seatCount: raw.seat_count ?? raw.seatCount,
  };
}

export function normalizeCatalogBatch(items: RawProduct[]): CatalogItem[] {
  return items.map(normalizeCatalogItem);
}

export function filterByCategory(
  items: CatalogItem[],
  category: string,
): CatalogItem[] {
  if (category === "all") return items;
  const lower = category.toLowerCase();
  return items.filter((item) => item.category.includes(lower));
}

export function searchCatalog(
  items: CatalogItem[],
  query: string,
): CatalogItem[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return items;
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(lower) ||
      item.category.includes(lower) ||
      item.subcategory?.includes(lower) ||
      item.series?.includes(lower),
  );
}
