import type { PlannerFurnitureTLShape } from "../tldrawShapeTypes";

/** Map catalog / legacy store categories to tldraw furniture shape categories. */
export function catalogCategoryToFurnitureCategory(
  category: string,
): PlannerFurnitureTLShape["props"]["furnitureCategory"] {
  switch (category) {
    case "storage":
      return "storage";
    case "equipment":
    case "misc":
    case "infrastructure":
    case "accessories":
      return "accessory";
    case "seating":
      return "seating";
    case "soft-seating":
    case "softSeating":
      return "softSeating";
    case "tables":
    case "rooms":
      return "table";
    case "zones":
      return "partition";
    case "desks":
    case "education":
    default:
      return "workstation";
  }
}