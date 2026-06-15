import { describe, expect, it } from "vitest";

import {
  isLShapedDesk,
  resolveFurnitureBlockKind,
} from "@/features/planner/tldraw/shapes/shapeUtils/furnitureBlocks2d";
import type { CatalogItem } from "@/features/planner/store/catalogData";

const deskCatalog: CatalogItem = {
  id: "desk-1",
  name: "Desk",
  sku: "SKU",
  category: "desks",
  widthMm: 1200,
  depthMm: 600,
  heightMm: 750,
  iconPath: "/icon.svg",
  priceInr: 0,
  shape: "workstation-linear",
};

describe("furnitureBlocks2d", () => {
  it("resolveFurnitureBlockKind uses catalog category first", () => {
    expect(resolveFurnitureBlockKind({} as never, deskCatalog)).toBe("desk-workstation");
    expect(resolveFurnitureBlockKind({} as never, { ...deskCatalog, category: "seating" })).toBe(
      "seating-chair",
    );
  });

  it("resolveFurnitureBlockKind falls back to furnitureCategory prop", () => {
    expect(
      resolveFurnitureBlockKind({ furnitureCategory: "table", furnitureType: "" } as never),
    ).toBe("table");
    expect(
      resolveFurnitureBlockKind({ furnitureCategory: "storage", furnitureType: "" } as never),
    ).toBe("storage-cabinet");
  });

  it("resolveFurnitureBlockKind infers from furnitureType string", () => {
    expect(resolveFurnitureBlockKind({ furnitureType: "office-chair" } as never)).toBe(
      "seating-chair",
    );
    expect(resolveFurnitureBlockKind({ furnitureType: "filing-cabinet" } as never)).toBe(
      "storage-cabinet",
    );
    expect(resolveFurnitureBlockKind({ furnitureType: "whiteboard" } as never)).toBe(
      "partition-accessory",
    );
  });

  it("isLShapedDesk detects L workstation shapes", () => {
    expect(isLShapedDesk("workstation-l")).toBe(true);
    expect(isLShapedDesk("desk-l")).toBe(true);
    expect(isLShapedDesk("desk")).toBe(false);
  });
});