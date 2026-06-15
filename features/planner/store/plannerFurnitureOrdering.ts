import type { FurnitureItem } from "./plannerStore";

export function buildFurnitureBatch(
  existingFurniture: FurnitureItem[],
  items: Omit<FurnitureItem, "id" | "zIndex">[],
  generateId: () => string
): FurnitureItem[] {
  let maxZ = existingFurniture.reduce((max, item) => Math.max(max, item.zIndex || 0), 0);
  return items.map((item) => {
    maxZ += 1;
    return { ...item, id: generateId(), zIndex: maxZ };
  });
}

export function bringFurnitureItemToFront(furniture: FurnitureItem[], id: string): FurnitureItem[] {
  const maxZ = furniture.reduce((max, item) => Math.max(max, item.zIndex || 0), 0);
  return furniture.map((item) => (item.id === id ? { ...item, zIndex: maxZ + 1 } : item));
}

export function sendFurnitureItemToBack(furniture: FurnitureItem[], id: string): FurnitureItem[] {
  const minZ = furniture.reduce((min, item) => Math.min(min, item.zIndex || 0), 0);
  return furniture.map((item) => (item.id === id ? { ...item, zIndex: minZ - 1 } : item));
}
