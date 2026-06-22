import type { CatalogItem } from "./catalogTypes";

/**
 * Merge static workspace catalog with admin-managed items.
 * Managed entries win on id collision; inactive managed ids remove overrides.
 */
export function mergeWorkspaceCatalogItems(
  staticItems: readonly CatalogItem[],
  managedItems: readonly CatalogItem[],
): CatalogItem[] {
  const byId = new Map<string, CatalogItem>();
  for (const item of staticItems) {
    byId.set(item.id, item);
  }
  for (const item of managedItems) {
    byId.set(item.id, item);
  }
  return [...byId.values()];
}
