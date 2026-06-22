import { describe, expect, it } from "vitest";

import {
  catalogFootprintCanvasCm,
  catalogDropScreenFootprint,
  centeredCatalogDropPagePoint,
} from "@/features/planner/catalog/catalogDrop";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";

const deskItem =
  PLANNER_CATALOG_ITEMS.find((item) => item.category === "desks") ?? PLANNER_CATALOG_ITEMS[0];

function mockEditor(zoom = 1) {
  return {
    screenToPage: ({ x, y }: { x: number; y: number }) => ({ x: x / zoom, y: y / zoom }),
    pageToScreen: ({ x, y }: { x: number; y: number }) => ({ x: x * zoom, y: y * zoom }),
  } as Parameters<typeof centeredCatalogDropPagePoint>[0];
}

describe("catalogDrop helpers", () => {
  it("computes canvas footprints from catalog dimensions", () => {
    const sample: CatalogItem = {
      ...deskItem,
      widthMm: 120,
      heightMm: 60,
    };
    expect(catalogFootprintCanvasCm(sample)).toEqual({ w: 120, h: 60 });
  });

  it("centers drop page coordinates on the cursor", () => {
    const sample: CatalogItem = {
      ...deskItem,
      widthMm: 100,
      heightMm: 40,
    };
    const point = centeredCatalogDropPagePoint(mockEditor(), 200, 100, sample);
    expect(point).toEqual({ x: 150, y: 80 });
  });

  it("scales screen footprint from catalog dimensions", () => {
    const sample: CatalogItem = {
      ...deskItem,
      widthMm: 80,
      heightMm: 40,
    };
    const footprint = catalogDropScreenFootprint(null, sample);
    expect(footprint.w).toBeGreaterThan(0);
    expect(footprint.h).toBeGreaterThan(0);
  });
});
