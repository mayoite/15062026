import type { FurnitureItem } from "./plannerStore";

export function toggleSelectedIdInList(selectedIds: string[], id: string): string[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((item) => item !== id)
    : [...selectedIds, id];
}

export function applyFurnitureBatchUpdates(
  furniture: FurnitureItem[],
  updates: { id: string; changes: Partial<FurnitureItem> }[]
): FurnitureItem[] {
  return furniture.map((item) => {
    const update = updates.find((candidate) => candidate.id === item.id);
    return update ? { ...item, ...update.changes } : item;
  });
}
