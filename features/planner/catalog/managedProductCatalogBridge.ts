import type { PlannerManagedProductRow } from "@/features/planner/model";
import type { StandardCatalogItem } from "@/features/planner/admin/adminCatalogClient";
import type { CatalogCategory, CatalogItem } from "./catalogTypes";
import { PlannerCatalogShapeType } from "./shapeTypeRegistry";

function mapAdminCategoryToWorkspace(category: string, subcategory?: string | null): CatalogCategory {
  const blob = `${category} ${subcategory ?? ""}`.toLowerCase();
  if (blob.includes("desk") || blob.includes("workstation") || blob.includes("bench")) return "desks";
  if (blob.includes("room") || blob.includes("booth") || blob.includes("pod") || blob.includes("meeting")) {
    return "rooms";
  }
  if (blob.includes("storage") || blob.includes("locker") || blob.includes("cabinet")) return "storage";
  if (blob.includes("zone")) return "zones";
  if (blob.includes("infra") || blob.includes("wifi") || blob.includes("display")) return "infrastructure";
  return "equipment";
}

function shapeTypeForCategory(category: CatalogCategory, subcategory?: string | null): string {
  const sub = (subcategory ?? "").toLowerCase();
  if (category === "desks") {
    if (sub.includes("bench") || sub.includes("linear")) return PlannerCatalogShapeType.bench;
    return PlannerCatalogShapeType.desk;
  }
  if (category === "rooms") {
    if (sub.includes("phone") || sub.includes("booth")) return PlannerCatalogShapeType.phoneBooth;
    if (sub.includes("conference")) return PlannerCatalogShapeType.conference;
    return PlannerCatalogShapeType.room;
  }
  if (category === "storage") return PlannerCatalogShapeType.storage;
  if (category === "zones") return PlannerCatalogShapeType.zone;
  if (sub.includes("chair") || sub.includes("seat")) return PlannerCatalogShapeType.chair;
  if (sub.includes("table")) return PlannerCatalogShapeType.table;
  return PlannerCatalogShapeType.desk;
}

/** Convert real-world mm to catalog cm fields used by workspace catalog items. */
export function millimetersToCatalogCmFields(widthMm: number, depthMm: number): {
  widthMm: number;
  heightMm: number;
} {
  return {
    widthMm: Math.max(1, Math.round(widthMm / 10)),
    heightMm: Math.max(1, Math.round(depthMm / 10)),
  };
}

function buildCatalogItemFromMm(params: {
  id: string;
  name: string;
  category: CatalogCategory;
  shapeType: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  description: string;
  sku?: string;
  imageUrl?: string;
  tags?: string[];
  seatCount?: number;
}): CatalogItem {
  const footprint = millimetersToCatalogCmFields(params.widthMm, params.depthMm);
  const shortName =
    params.name.length > 30 ? `${params.name.slice(0, 27).trim()}…` : params.name;

  return {
    id: params.id,
    name: params.name,
    shortName,
    sku: params.sku ?? params.id,
    category: params.category,
    shapeType: params.shapeType,
    widthMm: footprint.widthMm,
    heightMm: footprint.heightMm,
    depthMm: Math.max(1, Math.round(params.heightMm / 10)),
    seatCount: params.seatCount,
    description: params.description,
    tags: params.tags ?? ["managed", "admin-catalog"],
    imageUrl: params.imageUrl || undefined,
    material: "Admin catalog",
  };
}

export function managedProductRowToCatalogItem(row: PlannerManagedProductRow): CatalogItem | null {
  if (!row.active) return null;

  const specs = row.specs ?? {};
  const widthMm = Number(specs.widthMm ?? specs.width_mm ?? 0);
  const depthMm = Number(specs.depthMm ?? specs.depth_mm ?? 0);
  const heightMm = Number(specs.heightMm ?? specs.height_mm ?? 750);
  if (!widthMm || !depthMm) return null;

  const category = mapAdminCategoryToWorkspace(row.category, row.series_name);
  const shapeType = shapeTypeForCategory(category, row.series_name);

  return buildCatalogItemFromMm({
    id: row.id,
    name: row.name,
    category,
    shapeType,
    widthMm,
    depthMm,
    heightMm,
    description: row.description || `${row.category_name} · ${row.series_name}`,
    sku: row.slug,
    imageUrl: row.flagship_image || row.images[0],
    tags: ["managed", row.category, row.series_name].filter(Boolean),
  });
}

export function standardCatalogApiItemToCatalogItem(item: StandardCatalogItem): CatalogItem | null {
  if (item.visible === false || item.active === false) return null;

  const widthMm = Number(item.width_mm ?? 0);
  const depthMm = Number(item.depth_mm ?? 0);
  const heightMm = Number(item.height_mm ?? 750);
  if (!widthMm || !depthMm || !item.name) return null;

  const category = mapAdminCategoryToWorkspace(item.category, item.subcategory);
  const shapeType = shapeTypeForCategory(category, item.subcategory);

  return buildCatalogItemFromMm({
    id: item.id,
    name: item.name,
    category,
    shapeType,
    widthMm,
    depthMm,
    heightMm,
    description: item.description ?? "",
    sku: item.id,
    imageUrl: item.image_url ?? undefined,
    tags: ["managed", item.category, item.subcategory ?? ""].filter(Boolean),
  });
}
