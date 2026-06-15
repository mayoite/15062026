import { createShapeId } from "tldraw";
import type { TLShapeId } from "tldraw";

import type {
  FloorMaterial as StoreFloorMaterial,
  ZoneType as StoreZoneType,
} from "../data/plannerStore";
import type {
  FloorMaterial as TldrawFloorMaterial,
  FurnitureCategory,
  ZoneType as TldrawZoneType,
} from "../shapes/sharedTypes";

export type ShapePoint = { x: number; y: number };

export function toShapeId(id: string): TLShapeId {
  return id.startsWith("shape:") ? (id as TLShapeId) : createShapeId(id);
}

export function fromShapeId(id: TLShapeId): string {
  return id.startsWith("shape:") ? id.slice(6) : id;
}

export function mapTldrawFloorMaterialToZustand(material: string): StoreFloorMaterial {
  switch (material) {
    case "hardwood":
      return "wood";
    case "tile":
      return "tile";
    case "concrete":
      return "concrete";
    case "custom":
    case "vinyl":
      return "marble";
    case "carpet":
    default:
      return "default";
  }
}

export function mapZustandFloorMaterialToTldraw(material: StoreFloorMaterial): TldrawFloorMaterial {
  switch (material) {
    case "wood":
      return "hardwood";
    case "tile":
      return "tile";
    case "concrete":
      return "concrete";
    case "marble":
      return "custom";
    case "default":
    default:
      return "carpet";
  }
}

export function mapZustandFurnitureCategoryToTldraw(category: string): FurnitureCategory {
  switch (category) {
    case "desk":
    case "desk-l":
    case "workstation":
      return "workstation";
    case "office-chair":
    case "dining-chair":
    case "seating":
      return "seating";
    case "dining-table-rect":
    case "dining-table-round":
    case "coffee-table":
    case "table":
      return "table";
    case "bookcase":
    case "filing-cabinet":
    case "storage-shelf":
    case "storage":
      return "storage";
    case "sofa":
    case "softSeating":
      return "softSeating";
    case "accessory":
    case "plant-large":
      return "accessory";
    case "partition":
      return "partition";
    case "custom":
    case "counter":
    case "fridge":
    default:
      return "custom";
  }
}

export function mapTldrawZoneTypeToZustand(type: TldrawZoneType): StoreZoneType {
  switch (type) {
    case "focus":
    case "quiet":
      return "Executive";
    case "collaborative":
      return "Open Plan";
    case "social":
      return "Cafeteria";
    case "custom":
    default:
      return "Custom";
  }
}

export function mapZustandZoneTypeToTldraw(type: string): TldrawZoneType {
  switch (type) {
    case "Executive":
      return "focus";
    case "Open Plan":
      return "collaborative";
    case "Meeting":
      return "focus";
    case "Reception":
      return "social";
    case "Cafeteria":
      return "social";
    case "Server Room":
      return "quiet";
    case "Custom":
    default:
      return "custom";
  }
}
