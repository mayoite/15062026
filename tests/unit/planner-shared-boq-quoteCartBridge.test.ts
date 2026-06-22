import { describe, expect, it } from "vitest";

import { boqToQuoteCart } from "@/features/planner/shared/boq/quoteCartBridge";
import type { BoqSummary } from "@/features/planner/shared/boq/types";

function makeBoqSummary(overrides: Partial<BoqSummary> = {}): BoqSummary {
  return {
    lineItems: [],
    totalItems: 0,
    generatedAt: "2026-04-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("boqToQuoteCart", () => {
  it("prefixes each item id with 'planner-' followed by a composite group key", () => {
    const boq = makeBoqSummary({
      lineItems: [
        {
          catalogId: "desk-alpha",
          name: "Alpha Desk",
          category: "Desks",
          quantity: 2,
          dimensions: { widthMm: 1400, depthMm: 700, heightMm: 750 },
        },
      ],
    });

    const items = boqToQuoteCart(boq);

    expect(items).toHaveLength(1);
    expect(items[0].id).toMatch(/^planner-identity:/);
    expect(items[0].id).toContain("dimensions:");
    expect(items[0].id).toContain("category:");
  });

  it("maps BoqLineItem fields to QuoteCartItem fields correctly", () => {
    const boq = makeBoqSummary({
      lineItems: [
        {
          catalogId: "chair-beta",
          name: "Beta Chair",
          category: "Seating",
          quantity: 4,
          dimensions: { widthMm: 600, depthMm: 600, heightMm: 900 },
        },
      ],
    });

    const [item] = boqToQuoteCart(boq);

    expect(item.name).toBe("Beta Chair");
    expect(item.qty).toBe(4);
    expect(item.unitPriceInr ?? 0).toBe(0);
    expect(item.lineTotalInr ?? 0).toBe(0);
    expect(item.source).toBe("planner");
    expect(item.plannerFamily).toBe("Seating");
    expect(item.plannerDimensions).toBe("600 × 600 × 900 mm");
  });

  it("produces stable identical group keys for the same catalog item", () => {
    const lineItem = {
      catalogId: "table-delta",
      name: "Delta Table",
      category: "Tables",
      quantity: 3,
      dimensions: { widthMm: 1800, depthMm: 900, heightMm: 750 },
    };

    const boq = makeBoqSummary({ lineItems: [lineItem] });
    const [first] = boqToQuoteCart(boq);
    const [second] = boqToQuoteCart(makeBoqSummary({ lineItems: [{ ...lineItem }] }));

    expect(first.id).toBe(second.id);
  });

  it("produces distinct ids for items with different catalogIds", () => {
    const boq = makeBoqSummary({
      lineItems: [
        {
          catalogId: "item-a",
          name: "Item A",
          category: "Desks",
          quantity: 1,
          dimensions: { widthMm: 1200, depthMm: 600, heightMm: 750 },
        },
        {
          catalogId: "item-b",
          name: "Item B",
          category: "Desks",
          quantity: 1,
          dimensions: { widthMm: 1200, depthMm: 600, heightMm: 750 },
        },
      ],
    });

    const [a, b] = boqToQuoteCart(boq);

    expect(a.id).not.toBe(b.id);
  });
});

