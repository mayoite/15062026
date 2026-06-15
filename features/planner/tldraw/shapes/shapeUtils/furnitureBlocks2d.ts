import type { CatalogItem, FurnitureShape as CatalogFurnitureShape } from "@/features/planner/store/catalogData";
import type { PlannerFurnitureTLShape } from "../tldrawShapeTypes";

export type FurnitureBlockKind =
  | "desk-workstation"
  | "seating-chair"
  | "table"
  | "storage-cabinet"
  | "soft-seating-sofa"
  | "partition-accessory";

type FurnitureProps = PlannerFurnitureTLShape["props"];

export function resolveFurnitureBlockKind(
  props: FurnitureProps,
  catalogItem?: CatalogItem
): FurnitureBlockKind {
  const fromCatalog = catalogItem?.category;
  if (fromCatalog === "desks") return "desk-workstation";
  if (fromCatalog === "seating") return "seating-chair";
  if (fromCatalog === "tables") return "table";
  if (fromCatalog === "storage") return "storage-cabinet";
  if (fromCatalog === "soft-seating") return "soft-seating-sofa";
  if (fromCatalog === "misc") return "partition-accessory";

  const furnitureCategory = props.furnitureCategory;
  if (furnitureCategory === "workstation") return "desk-workstation";
  if (furnitureCategory === "seating") return "seating-chair";
  if (furnitureCategory === "table") return "table";
  if (furnitureCategory === "storage") return "storage-cabinet";
  if (furnitureCategory === "softSeating") return "soft-seating-sofa";
  if (furnitureCategory === "partition" || furnitureCategory === "accessory") return "partition-accessory";

  const shape = (catalogItem?.shape ?? props.furnitureType ?? "").toLowerCase();
  if (shape.includes("desk") || shape.includes("workstation")) return "desk-workstation";
  if (shape.includes("chair") || shape.includes("stool")) return "seating-chair";
  if (shape.includes("table")) return "table";
  if (shape.includes("cabinet") || shape.includes("locker") || shape.includes("storage")) return "storage-cabinet";
  if (shape.includes("sofa") || shape.includes("lounge") || shape.includes("ottoman")) return "soft-seating-sofa";
  return "partition-accessory";
}

export function isLShapedDesk(shape?: CatalogFurnitureShape | string): boolean {
  const normalized = (shape ?? "").toLowerCase();
  return normalized === "workstation-l" || normalized === "desk-l";
}

