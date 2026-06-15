/**
 * Quote Engine — Generates a quote from BOQ data in either 'request' or 'auto' mode.
 *
 * - 'auto' mode: items with a catalog price > 0 get calculated line totals;
 *   items with price === 0 are flagged as "pricing pending".
 * - 'request' mode: all items are marked as pending (manual pricing by admin).
 */

import type { BOQData } from './export/boqGenerator';

export interface QuoteLineItem {
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  unitPriceInr: number | null; // null = "pricing pending"
  lineTotal: number | null;
}

export interface QuoteResult {
  mode: 'request' | 'auto';
  lineItems: QuoteLineItem[];
  pricedTotal: number; // sum of items with prices
  hasPendingItems: boolean; // true if any items have null price
  pendingCount: number; // how many items lack pricing
  generatedAt: string;
}

/**
 * Generate a quote from BOQ data.
 *
 * In 'auto' mode:
 *  - Items with unitPriceInr > 0 get calculated lineTotal
 *  - Items with unitPriceInr === 0 get flagged as pending (unitPriceInr = null in output)
 *
 * In 'request' mode:
 *  - All items get unitPriceInr = null and lineTotal = null
 *  - pricedTotal = 0
 *  - hasPendingItems = true always
 */
export function generateQuote(boq: BOQData, mode: 'request' | 'auto'): QuoteResult {
  const lineItems: QuoteLineItem[] = [];

  for (const category of boq.categories) {
    for (const item of category.items) {
      if (mode === 'request') {
        lineItems.push({
          productName: item.name,
          sku: item.sku,
          category: item.category,
          quantity: item.quantity,
          widthMm: item.widthMm,
          depthMm: item.depthMm,
          heightMm: item.heightMm,
          unitPriceInr: null,
          lineTotal: null,
        });
      } else {
        // Auto mode: price > 0 means priced, price === 0 means pending
        const hasCatalogPrice = item.unitPriceInr > 0;
        lineItems.push({
          productName: item.name,
          sku: item.sku,
          category: item.category,
          quantity: item.quantity,
          widthMm: item.widthMm,
          depthMm: item.depthMm,
          heightMm: item.heightMm,
          unitPriceInr: hasCatalogPrice ? item.unitPriceInr : null,
          lineTotal: hasCatalogPrice ? item.unitPriceInr * item.quantity : null,
        });
      }
    }
  }

  const pricedItems = lineItems.filter((li) => li.lineTotal !== null);
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pricedTotal = pricedItems.reduce((sum, li) => sum + li.lineTotal!, 0);
  const pendingCount = lineItems.filter((li) => li.unitPriceInr === null).length;

  return {
    mode,
    lineItems,
    pricedTotal,
    hasPendingItems: pendingCount > 0,
    pendingCount,
    generatedAt: new Date().toISOString(),
  };
}
