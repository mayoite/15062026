import { describe, expect, it } from "vitest";

import type { BoqItem } from "@/features/planner/shared/types/planner";

import {
  buildPlannerQuoteCartItems,
  calculatePlannerBoqTotal,
  groupPlannerBoqItems,
} from "@/features/planner/lib/quoteBridge";

describe("planner quote bridge", () => {
  const boqItems: BoqItem[] = [
    {
      id: "shape-1",
      productId: "prod-1",
      productSlug: "alpha-desk",
      plannerSourceSlug: "alpha-desk",
      name: "Alpha Desk",
      category: "Desks",
      price: 0,
      imageUrl: "/desk.png",
      dimensions: "1600 x 800 x 750 mm",
    },
    {
      id: "shape-2",
      productId: "prod-1",
      productSlug: "alpha-desk",
      plannerSourceSlug: "alpha-desk",
      name: "Alpha Desk",
      category: "Desks",
      price: 0,
      imageUrl: "/desk.png",
      dimensions: "1600 x 800 x 750 mm",
    },
    {
      id: "shape-3",
      productId: "prod-2",
      productSlug: "task-chair",
      plannerSourceSlug: "task-chair",
      name: "Task Chair",
      category: "Seating",
      price: 0,
      imageUrl: "/chair.png",
      dimensions: "640 x 640 x 980 mm",
    },
  ];

  it("does not calculate planner BOQ pricing totals", () => {
    expect(calculatePlannerBoqTotal(boqItems)).toBe(0);
    expect(
      calculatePlannerBoqTotal([
        { ...boqItems[0], price: 2500 },
        { ...boqItems[2], price: undefined },
      ]),
    ).toBe(2500);
  });

  it("groups repeated planner items by stable product identity", () => {
    const grouped = groupPlannerBoqItems(boqItems);

    expect(Object.values(grouped)).toEqual([
      expect.objectContaining({
        name: "Alpha Desk",
        qty: 2,
        dimensions: "1600 x 800 x 750 mm",
      }),
      expect.objectContaining({
        name: "Task Chair",
        qty: 1,
        dimensions: "640 x 640 x 980 mm",
      }),
    ]);
  });

  it("keeps the same product separate when category or dimensions diverge", () => {
    const grouped = groupPlannerBoqItems([
      boqItems[0],
      {
        ...boqItems[0],
        id: "shape-4",
        category: "Benching",
      },
      {
        ...boqItems[0],
        id: "shape-5",
        dimensions: "1800 x 800 x 750 mm",
      },
    ]);

    expect(Object.values(grouped)).toEqual([
      expect.objectContaining({ qty: 1, category: "Desks", dimensions: "1600 x 800 x 750 mm" }),
      expect.objectContaining({ qty: 1, category: "Benching", dimensions: "1600 x 800 x 750 mm" }),
      expect.objectContaining({ qty: 1, category: "Desks", dimensions: "1800 x 800 x 750 mm" }),
    ]);
  });

  it("groups items by slug when productId is missing", () => {
    const grouped = groupPlannerBoqItems([
      {
        ...boqItems[0],
        id: "shape-10",
        productId: undefined,
        productSlug: "fallback-desk",
      },
      {
        ...boqItems[0],
        id: "shape-11",
        productId: undefined,
        productSlug: "fallback-desk",
      },
    ]);

    expect(Object.values(grouped)).toEqual([expect.objectContaining({ qty: 2, name: "Alpha Desk" })]);
  });

  it("builds quantity-only quote-cart items with grouped planner dimensions", () => {
    const quoteItems = buildPlannerQuoteCartItems(boqItems);

    expect(new Set(quoteItems.map((item) => item.id)).size).toBe(2);
    expect(quoteItems).toEqual([
      expect.objectContaining({
        name: "Alpha Desk",
        qty: 2,
        image: "/desk.png",
        source: "planner",
        plannerFamily: "Desks",
        plannerDimensions: "1600 x 800 x 750 mm",
      }),
      expect.objectContaining({
        name: "Task Chair",
        qty: 1,
        image: "/chair.png",
        source: "planner",
        plannerFamily: "Seating",
        plannerDimensions: "640 x 640 x 980 mm",
      }),
    ]);

    quoteItems.forEach((item) => {
      expect(item).not.toHaveProperty("price");
    });
  });
});

