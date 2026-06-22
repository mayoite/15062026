import { describe, expect, it } from "vitest";

import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import {
  catalogMmToCanvasCm,
  normalizeCatalogMm,
  plannerCanvasUnits,
  resolveCatalogItemBlock2D,
  shapePropsToCanvasCm,
} from "@/features/planner/catalog/catalogBlockBridge";

function catalogItem(id: string): CatalogItem {
  const item = PLANNER_CATALOG_ITEMS.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`missing catalog item: ${id}`);
  }
  return item;
}

function catalogBlock(id: string) {
  const block = resolveCatalogItemBlock2D(catalogItem(id));
  if (!block) {
    throw new Error(`no block for catalog item: ${id}`);
  }
  return block;
}

describe("planner canvas units", () => {
  it("keeps catalog cm on the canvas (120 cm desk)", () => {
    expect(plannerCanvasUnits(120)).toBe(120);
    expect(normalizeCatalogMm(120)).toBe(1200);
  });

  it("keeps large room footprints in cm (600 cm boardroom)", () => {
    expect(plannerCanvasUnits(600)).toBe(600);
    expect(normalizeCatalogMm(600)).toBe(6000);
  });

  it("repairs mistaken ×10 placement values from autosave", () => {
    expect(plannerCanvasUnits(1200)).toBe(120);
    expect(plannerCanvasUnits(2500)).toBe(250);
    expect(plannerCanvasUnits(600, 1200)).toBe(60);
  });

  it("round-trips canvas cm through normalizeCatalogMm and catalogMmToCanvasCm", () => {
    expect(catalogMmToCanvasCm(1200, 600)).toBe(120);
    expect(catalogMmToCanvasCm(6000, 3500)).toBe(600);
    expect(catalogMmToCanvasCm(normalizeCatalogMm(120), normalizeCatalogMm(60))).toBe(120);
  });

  it("shapePropsToCanvasCm repairs legacy ×10 shape props", () => {
    expect(shapePropsToCanvasCm(120, 60)).toEqual({ widthCm: 120, depthCm: 60 });
    expect(shapePropsToCanvasCm(1200, 600)).toEqual({ widthCm: 120, depthCm: 60 });
    expect(shapePropsToCanvasCm(600, 1200)).toEqual({ widthCm: 60, depthCm: 120 });
  });

  it("catalogMmToCanvasCm converts real millimetres to canvas cm", () => {
    expect(catalogMmToCanvasCm(800)).toBe(80);
    expect(catalogMmToCanvasCm(500)).toBe(50);
  });
});

function countSeatChairs(block: NonNullable<ReturnType<typeof resolveCatalogItemBlock2D>>) {
  const seats = block.prims.filter(
    (p) => p.kind === "rect" && (p.radius === 72 || p.radius === 64),
  );
  return {
    total: seats.length,
    north: seats.filter((p) => (p.y ?? 0) < 0).length,
    south: seats.filter((p) => (p.y ?? 0) > block.footprint.D).length,
  };
}

describe("resolveCatalogItemBlock2D workstation seating", () => {
  it("renders eight face-to-face chairs for 4-bay SH at 4800x1200", () => {
    const block = catalogBlock(
      "linear-workstation-partition-system-4-seater-sh-1200mm-6",
    );
    expect(block.footprint.L).toBe(4800);
    expect(block.footprint.D).toBe(1200);
    expect(block.label).toContain("8-seat sharing");

    const chairs = countSeatChairs(block);
    expect(chairs.total).toBe(8);
    expect(chairs.north).toBe(4);
    expect(chairs.south).toBe(4);
  });

  it("maps 8-bay SH to 9600x1200 with sixteen face-to-face chairs", () => {
    const block = catalogBlock(
      "linear-workstation-partition-system-8-seater-sh-1200mm-8",
    );
    expect(block.footprint.L).toBe(9600);
    expect(block.footprint.D).toBe(1200);
    expect(block.label).toContain("16-seat sharing");

    const chairs = countSeatChairs(block);
    expect(chairs.total).toBe(16);
    expect(chairs.north).toBe(8);
    expect(chairs.south).toBe(8);
  });

  it("renders table and eight chairs for meeting room (8p)", () => {
    const block = catalogBlock("room-meeting-8");
    expect(block.footprint.L).toBe(3500);
    expect(block.footprint.D).toBe(2800);

    const chairs = countSeatChairs(block);
    expect(chairs.total).toBeGreaterThanOrEqual(8);
    expect(block.prims.length).toBeGreaterThan(10);
  });

  it("renders a solo desk for phone booth and focus pod rooms", () => {
    for (const id of ["booth-phone-1", "booth-focus-1"] as const) {
      const block = catalogBlock(id);
      const chairs = countSeatChairs(block);
      expect(chairs.total).toBe(1);
    }
  });

  it("renders four one-sided chairs for 4-seater NS partition bench", () => {
    const block = catalogBlock(
      "linear-workstation-partition-system-4-seater-ns-1200mm-3",
    );
    expect(block.footprint.L).toBe(4800);
    expect(block.footprint.D).toBe(600);

    const chairs = countSeatChairs(block);
    expect(chairs.total).toBe(4);
    expect(chairs.north).toBe(0);
    expect(chairs.south).toBe(4);
  });
});

