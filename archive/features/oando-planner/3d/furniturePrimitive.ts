import { furnitureCatalog } from "../data/catalogData";
import { getUnifiedCatalog } from "../data/unifiedCatalog";
import type { FurnitureItem } from "../data/plannerStore";

export type FurniturePrimitiveKind =
  | "workstation"
  | "table"
  | "seating"
  | "storage"
  | "partition"
  | "accessory"
  | "softseating"
  | "box";

export interface FurniturePrimitiveSpec {
  kind: FurniturePrimitiveKind;
  heightM: number;
  color?: string;
}

const DEFAULT_HEIGHT_M = 0.75;

function classifyFurniture(raw: string): FurniturePrimitiveKind {
  const value = raw.toLowerCase();
  if (value.includes("workstation") || value.includes("desk")) return "workstation";
  if (value.includes("chair") || value.includes("stool") || value.includes("seating")) return "seating";
  if (value.includes("table")) return "table";
  if (
    value.includes("storage") ||
    value.includes("cabinet") ||
    value.includes("locker") ||
    value.includes("pedestal") ||
    value.includes("credenza") ||
    value.includes("bookshelf")
  ) {
    return "storage";
  }
  if (value.includes("sofa") || value.includes("lounge") || value.includes("ottoman") || value.includes("soft")) {
    return "softseating";
  }
  if (value.includes("partition") || value.includes("screen") || value.includes("divider")) return "partition";
  if (value.includes("whiteboard") || value.includes("planter") || value.includes("lamp") || value.includes("arm")) {
    return "accessory";
  }
  return "box";
}

export function resolveFurniturePrimitive(item: FurnitureItem): FurniturePrimitiveSpec {
  const catalogItem = furnitureCatalog.find((entry) => entry.id === item.catalogId);
  const unifiedItem = getUnifiedCatalog().find((entry) => entry.id === item.catalogId || entry.slug === item.catalogId);
  const kind =
    [
      catalogItem?.shape,
      catalogItem?.category,
      unifiedItem?.normalizedCategory,
      unifiedItem?.category,
      item.shape,
      item.catalogId,
      item.name,
    ]
      .filter((value): value is string => Boolean(value))
      .map(classifyFurniture)
      .find((candidate) => candidate !== "box") ?? "box";

  const catalogHeightM = (catalogItem?.heightMm ?? unifiedItem?.heightMm ?? 0) / 1000;
  const heightM =
    catalogHeightM > 0
      ? catalogHeightM
      : kind === "seating"
        ? 0.85
        : kind === "storage"
          ? 1.6
          : kind === "partition"
            ? 1.45
            : kind === "accessory"
              ? 0.5
              : DEFAULT_HEIGHT_M;

  return {
    kind,
    heightM,
    color: item.color || unifiedItem?.color,
  };
}
