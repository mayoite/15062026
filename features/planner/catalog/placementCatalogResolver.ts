/**
 * Resolves workspace + legacy catalog entries for furniture placement tools.
 *
 * Workspace catalog dimensions use catalog cm (misnamed `*Mm`); legacy catalog
 * uses real millimetres. Placement utilities expect legacy-compatible values.
 */
import type { CatalogItem as LegacyCatalogItem, FurnitureCategory } from "@/features/planner/store/catalogData";
import { furnitureCatalog } from "@/features/planner/store/catalogData";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import type { CatalogItem as WorkspaceCatalogItem } from "@/features/planner/catalog/catalogTypes";
import {
  catalogShapeTypeToFurnitureType,
  isCatalogShapeType,
  isRoomCatalogShapeType,
  PlannerCatalogShapeType,
} from "@/features/planner/catalog/shapeTypeRegistry";
import {
  normalizeCatalogMm,
  resolveCatalogPlacementFootprintMm,
} from "@/features/planner/catalog/catalogBlockBridge";

export type PlacementCatalogItem = {
  id: string;
  name: string;
  category: FurnitureCategory | string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  shape: string;
  sku: string;
  iconPath: string;
};

function mapWorkspaceCategory(category: WorkspaceCatalogItem["category"]): FurnitureCategory {
  switch (category) {
    case "storage":
      return "storage";
    case "equipment":
      return "misc";
    case "desks":
    default:
      return "desks";
  }
}

function workspaceItemToPlacement(item: WorkspaceCatalogItem): PlacementCatalogItem | null {
  if (
    isRoomCatalogShapeType(item.shapeType)
    || isCatalogShapeType(item.shapeType, PlannerCatalogShapeType.zone)
    || item.category === "infrastructure"
    || item.category === "zones"
    || item.category === "rooms"
  ) {
    return null;
  }

  const footprint = resolveCatalogPlacementFootprintMm(item);
  const widthMm = footprint.widthMm;
  const depthMm = footprint.depthMm;
  const heightMm = item.depthMm > 0 ? normalizeCatalogMm(item.depthMm) : 750;

  return {
    id: item.id,
    name: item.name,
    category: mapWorkspaceCategory(item.category),
    widthMm,
    depthMm,
    heightMm,
    shape: catalogShapeTypeToFurnitureType(item.shapeType),
    sku: item.sku ?? item.id,
    iconPath: item.imageUrl ?? "",
  };
}

function legacyItemToPlacement(item: LegacyCatalogItem): PlacementCatalogItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    widthMm: item.widthMm,
    depthMm: item.depthMm,
    heightMm: item.heightMm,
    shape: item.shape,
    sku: item.sku,
    iconPath: item.iconPath,
  };
}

/** Lookup a catalog item by id from workspace or legacy catalogs. */
export function getPlacementCatalogItem(id: string): PlacementCatalogItem | undefined {
  const legacy = furnitureCatalog.find((item) => item.id === id);
  if (legacy) return legacyItemToPlacement(legacy);

  const workspace = PLANNER_CATALOG_ITEMS.find((item) => item.id === id);
  if (workspace) return workspaceItemToPlacement(workspace) ?? undefined;

  return undefined;
}

/** All placeable furniture catalog entries (workspace wins on id collision). */
export function listPlacementCatalogItems(): PlacementCatalogItem[] {
  const byId = new Map<string, PlacementCatalogItem>();

  for (const item of furnitureCatalog) {
    byId.set(item.id, legacyItemToPlacement(item));
  }

  for (const item of PLANNER_CATALOG_ITEMS) {
    const placement = workspaceItemToPlacement(item);
    if (placement) {
      byId.set(placement.id, placement);
    }
  }

  return [...byId.values()];
}

/** Default catalog id when activating the furniture tool without a selection. */
export function getDefaultPlacementCatalogItemId(): string {
  const workspaceDesk = PLANNER_CATALOG_ITEMS.find(
    (item) => item.category === "desks" && !isRoomCatalogShapeType(item.shapeType),
  );
  if (workspaceDesk) return workspaceDesk.id;

  const legacyDesk = furnitureCatalog.find((item) => item.category === "desks");
  if (legacyDesk) return legacyDesk.id;

  const any = listPlacementCatalogItems()[0];
  return any?.id ?? "";
}

/** True when the catalog item should use click-to-place furniture tooling. */
export function isFurniturePlacementCatalogItem(item: WorkspaceCatalogItem): boolean {
  return workspaceItemToPlacement(item) !== null;
}