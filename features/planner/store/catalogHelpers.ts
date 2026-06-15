import type { CatalogItem, FurnitureCategory } from "./catalogData";

function normalizeCatalogText(value: string): string {
  return value.trim().toLowerCase();
}

function getCatalogSearchHaystack(
  item: CatalogItem,
  categoryLabels: Record<FurnitureCategory, string>
): string[] {
  return [
    item.name,
    item.sku,
    item.category,
    categoryLabels[item.category],
    item.shape,
    `${item.widthMm} ${item.depthMm} ${item.heightMm}`,
    `${item.widthMm}x${item.depthMm}`,
    `${Math.round(item.widthMm / 10)}x${Math.round(item.depthMm / 10)}`,
  ].map(normalizeCatalogText);
}

export function getCatalogItemById(
  catalog: CatalogItem[],
  id: string | null | undefined
): CatalogItem | undefined {
  if (!id) return undefined;
  return catalog.find((item) => item.id === id);
}

export function matchesCatalogSearch(
  item: CatalogItem,
  query: string,
  categoryLabels: Record<FurnitureCategory, string>
): boolean {
  const normalizedQuery = normalizeCatalogText(query);
  if (!normalizedQuery) return true;

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const haystack = getCatalogSearchHaystack(item, categoryLabels);

  return tokens.every((token) => haystack.some((value) => value.includes(token)));
}

export function rankCatalogReplacementOptions(
  catalog: CatalogItem[],
  categoryLabels: Record<FurnitureCategory, string>,
  currentItem: CatalogItem | undefined,
  query = ""
): CatalogItem[] {
  const normalizedQuery = normalizeCatalogText(query);

  return catalog
    .filter((candidate) => candidate.id !== currentItem?.id)
    .filter((candidate) => matchesCatalogSearch(candidate, normalizedQuery, categoryLabels))
    .sort((a, b) => {
      const scoreA = getReplacementScore(a, categoryLabels, currentItem, normalizedQuery);
      const scoreB = getReplacementScore(b, categoryLabels, currentItem, normalizedQuery);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      return a.name.localeCompare(b.name);
    });
}

function getReplacementScore(
  candidate: CatalogItem,
  categoryLabels: Record<FurnitureCategory, string>,
  currentItem: CatalogItem | undefined,
  query: string
): number {
  let score = 0;

  if (currentItem) {
    if (candidate.category === currentItem.category) score += 40;
    if (candidate.shape === currentItem.shape) score += 25;

    const widthDelta = Math.abs(candidate.widthMm - currentItem.widthMm);
    const depthDelta = Math.abs(candidate.depthMm - currentItem.depthMm);
    score -= Math.round((widthDelta + depthDelta) / 100);
  }

  if (query) {
    const normalizedName = normalizeCatalogText(candidate.name);
    const normalizedSku = normalizeCatalogText(candidate.sku);
    const normalizedCategory = normalizeCatalogText(categoryLabels[candidate.category]);

    if (normalizedName.includes(query)) score += 20;
    if (normalizedSku.includes(query)) score += 10;
    if (normalizedCategory.includes(query)) score += 6;
  }

  return score;
}
