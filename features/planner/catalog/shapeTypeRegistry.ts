/**
 * Canonical catalog shape types and drag MIME types.
 * Accepts legacy `buddy-*` values when reading; writes `planner-*` only.
 */

export const CATALOG_DRAG_MIME = "application/planner-catalog-item";
export const LEGACY_CATALOG_DRAG_MIME = "application/buddy-catalog-item";

export const PlannerCatalogShapeType = {
  desk: "planner-desk",
  bench: "planner-bench",
  zone: "planner-zone",
  room: "planner-room",
  conference: "planner-conference",
  phoneBooth: "planner-phone-booth",
  chair: "planner-chair",
  table: "planner-table",
  storage: "planner-storage",
} as const;

export type PlannerCatalogShapeTypeValue =
  (typeof PlannerCatalogShapeType)[keyof typeof PlannerCatalogShapeType];

/** Map legacy buddy-* catalog shape types to planner-* equivalents. */
export function normalizeCatalogShapeType(shapeType: string): string {
  if (shapeType.startsWith("buddy-")) {
    return shapeType.replace(/^buddy-/, "planner-");
  }
  return shapeType;
}

/** Strip planner- / buddy- prefix for furnitureType props. */
export function catalogShapeTypeToFurnitureType(shapeType: string): string {
  return normalizeCatalogShapeType(shapeType).replace(/^planner-/, "");
}

export function isCatalogShapeType(shapeType: string, target: string): boolean {
  return normalizeCatalogShapeType(shapeType) === normalizeCatalogShapeType(target);
}

export function isRoomCatalogShapeType(shapeType: string): boolean {
  const normalized = normalizeCatalogShapeType(shapeType);
  return (
    normalized === PlannerCatalogShapeType.room ||
    normalized === PlannerCatalogShapeType.conference ||
    normalized === PlannerCatalogShapeType.phoneBooth
  );
}

export function roomTypeFromCatalogShapeType(shapeType: string): "office" | "conference" | "meeting" {
  const normalized = normalizeCatalogShapeType(shapeType);
  if (normalized === PlannerCatalogShapeType.conference) return "conference";
  if (normalized === PlannerCatalogShapeType.phoneBooth) return "meeting";
  return "office";
}

export function catalogDragMimeTypes(): string[] {
  return [CATALOG_DRAG_MIME, LEGACY_CATALOG_DRAG_MIME];
}

export function writeCatalogDragPayload(dataTransfer: DataTransfer, itemJson: string): void {
  dataTransfer.setData(CATALOG_DRAG_MIME, itemJson);
}

export function readCatalogDragPayload(dataTransfer: DataTransfer): string | null {
  return (
    dataTransfer.getData(CATALOG_DRAG_MIME) ||
    dataTransfer.getData(LEGACY_CATALOG_DRAG_MIME) ||
    null
  );
}

export function acceptsCatalogDrag(dataTransfer: DataTransfer): boolean {
  return catalogDragMimeTypes().some((mime) => dataTransfer.types.includes(mime));
}
