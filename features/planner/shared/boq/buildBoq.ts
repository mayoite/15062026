import type { BoqLineItem, BoqSummary } from "./types"; 
import type { CatalogItem, CatalogItemDimensions } from "../catalog/types"; 
import { normalizeCatalogMm } from "@/features/planner/catalog/catalogBlockBridge";
 
export type PlacedItemLike = { 
  catalogId: string; 
  name: string; 
  category?: string; 
  widthCm?: number; 
  depthCm?: number; 
  heightCm?: number; 
}; 
 
function normalizeTerm(value: string | undefined | null): string { 
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? ""; 
} 
 
function resolveItemDimensions( 
  item: PlacedItemLike, 
  catalogEntry: CatalogItem | undefined, 
): CatalogItemDimensions { 
  if (catalogEntry) return catalogEntry.dimensions; 
  return { 
    widthMm: normalizeCatalogMm(item.widthCm ?? 60, item.depthCm),
    depthMm: normalizeCatalogMm(item.depthCm ?? 60, item.widthCm),
    heightMm: normalizeCatalogMm(item.heightCm ?? 75),
  }; 
} 
 
function buildGroupKey( 
  item: PlacedItemLike, 
  catalogEntry: CatalogItem | undefined, 
): string { 
  const identityKey = normalizeTerm(item.catalogId) || 
    normalizeTerm(item.name).replace(/\s+/g, "-"); 
  const dims = resolveItemDimensions(item, catalogEntry); 
  const dimensionsKey = `${dims.widthMm}x${dims.depthMm}x${dims.heightMm}`; 
  const categoryKey = normalizeTerm( 
    catalogEntry?.category ?? item.category, 
  ); 
 
  return [ 
    `identity:${encodeURIComponent(identityKey)}`, 
    `dimensions:${encodeURIComponent(dimensionsKey)}`, 
    `category:${encodeURIComponent(categoryKey)}`, 
  ].join("|"); 
} 
 
export function buildBoq( 
  placedItems: PlacedItemLike[], 
  catalog: Map<string, CatalogItem>, 
): BoqSummary { 
  const grouped = new Map< 
    string, 
    { item: PlacedItemLike; catalogEntry: CatalogItem | undefined; count: number } 
  >(); 
 
  for (const item of placedItems) { 
    const catalogEntry = catalog.get(item.catalogId); 
    const key = buildGroupKey(item, catalogEntry); 
    const existing = grouped.get(key); 
    if (existing) { 
      existing.count += 1; 
    } else { 
      grouped.set(key, { item, catalogEntry, count: 1 }); 
    } 
  } 
 
  const lineItems: BoqLineItem[] = []; 
 
  for (const [, { item, catalogEntry, count }] of grouped) { 
    const dims = resolveItemDimensions(item, catalogEntry); 
 
    lineItems.push({ 
      catalogId: item.catalogId, 
      name: catalogEntry?.name ?? item.name, 
      sku: catalogEntry?.sku ?? "", 
      category: (catalogEntry?.category ?? item.category ?? "uncategorized").toLowerCase(), 
      quantity: count, 
      unitPriceInr: catalogEntry?.priceInr ?? 0, 
      dimensions: dims, 
    }); 
  } 
 
  lineItems.sort( 
    (a, b) => 
      a.category.localeCompare(b.category) || a.name.localeCompare(b.name), 
  ); 
 
  const totalPriceInr = lineItems.reduce( 
    (sum, li) => sum + li.unitPriceInr * li.quantity, 
    0, 
  ); 
 
  // India GST additive (18% standard rate for furniture per STRATEGIC-GAPS M4/PR3).
  // totalPriceInr preserved as subtotal for compat; grandTotal includes tax for trustworthy INR BOQ.
  const GST_RATE = 0.18;
  const subtotalInr = totalPriceInr;
  const gstAmountInr = Math.round(subtotalInr * GST_RATE);
  const grandTotalInr = subtotalInr + gstAmountInr;

  return {
    lineItems,
    totalItems: placedItems.length,
    totalPriceInr,
    generatedAt: new Date().toISOString(),
    subtotalInr,
    gstRate: GST_RATE,
    gstAmountInr,
    grandTotalInr,
  };
}
