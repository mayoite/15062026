import type { BoqLineItem, BoqSummary } from './types';

export type QuoteCartItem = {
  id: string;
  name: string;
  sku: string;
  qty: number;
  unitPriceInr: number;
  lineTotalInr: number;
  image?: string;
  href?: string;
  source?: 'planner' | 'catalog';
  plannerFamily?: string;
  plannerDimensions?: string;
};

export type QuoteSummary = {
  items: QuoteCartItem[];
  totalItems: number;
  totalPriceInr: number;
  generatedAt: string;
};
function normalizePlannerBoqGroupValue(value: string | undefined | null): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function buildBoqLineItemGroupKey(li: BoqLineItem): string {
  const identityKey = normalizePlannerBoqGroupValue(li.catalogId) ||
    normalizePlannerBoqGroupValue(li.name).replace(/\s+/g, '-');
  const dimensionsKey = `${li.dimensions.widthMm}x${li.dimensions.depthMm}x${li.dimensions.heightMm}`;
  const categoryKey = normalizePlannerBoqGroupValue(li.category);

  return [
    `identity:${encodeURIComponent(identityKey)}`,
    `dimensions:${encodeURIComponent(dimensionsKey)}`,
    `category:${encodeURIComponent(categoryKey)}`,
  ].join('|');
}

function formatPlannerDimensions(dims: BoqLineItem['dimensions']): string {
  return `${dims.widthMm} \u00d7 ${dims.depthMm} \u00d7 ${dims.heightMm} mm`;
}
export function boqToQuoteCart(boq: BoqSummary): QuoteCartItem[] {
  return boq.lineItems.map((li) => {
    const groupKey = buildBoqLineItemGroupKey(li);
    return {
      id: `planner-${groupKey}`,
      name: li.name,
      sku: li.sku,
      qty: li.quantity,
      unitPriceInr: li.unitPriceInr ?? 0,
      lineTotalInr: (li.unitPriceInr ?? 0) * li.quantity,
      source: 'planner' as const,
      plannerFamily: li.category,
      plannerDimensions: formatPlannerDimensions(li.dimensions),
    };
  });
}

export function boqToQuoteSummary(boq: BoqSummary): QuoteSummary {
  const items = boqToQuoteCart(boq);
  return {
    items,
    totalItems: boq.totalItems,
    totalPriceInr: boq.totalPriceInr,
    generatedAt: boq.generatedAt,
  };
}