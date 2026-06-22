/**
 * planner-catalog-blockBridge.test.ts
 * P4-06 — catalog dimension conversion, canonical mapping
 */
import { describe, expect, it } from "vitest";
import {
  plannerCanvasUnits,
  shapePropsToCanvasCm,
  normalizeCatalogMm,
  catalogMmToCanvasCm,
  moduleLengthMmFromItem,
  straightWorkstationFootprintMm,
  resolveCatalogPlacementFootprintMm,
  catalogFootprintToCanvasUnits,
} from "@/features/planner/catalog/catalogBlockBridge";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";

function makeDeskItem(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: "test-desk",
    name: "Test Desk (1200mm)",
    category: "desks",
    shapeType: "planner-bench",
    widthMm: 120,
    heightMm: 60,
    depthMm: 60,
    seatCount: 1,
    description: "",
    tags: ["straight", "non-sharing"],
    ...overrides,
  };
}

// ─── plannerCanvasUnits ───────────────────────────────────────────────────────

describe("plannerCanvasUnits", () => {
  it("returns value unchanged for normal canvas cm range (< 1000)", () => {
    expect(plannerCanvasUnits(120)).toBe(120);
    expect(plannerCanvasUnits(60)).toBe(60);
  });

  it("divides by 10 when value >= 1000 (legacy mm stored in cm field)", () => {
    expect(plannerCanvasUnits(1200)).toBe(120);
    expect(plannerCanvasUnits(1500)).toBe(150);
  });

  it("divides by 10 when paired value >= 1000", () => {
    expect(plannerCanvasUnits(120, 1200)).toBe(12);
  });

  it("clamps to 1 when value <= 0", () => {
    expect(plannerCanvasUnits(0)).toBe(1);
    expect(plannerCanvasUnits(-5)).toBe(1);
  });
});

// ─── shapePropsToCanvasCm ─────────────────────────────────────────────────────

describe("shapePropsToCanvasCm", () => {
  it("passes through normal catalog cm values", () => {
    const result = shapePropsToCanvasCm(120, 60);
    expect(result.widthCm).toBe(120);
    expect(result.depthCm).toBe(60);
  });

  it("auto-repairs legacy mm values (>= 1000)", () => {
    const result = shapePropsToCanvasCm(1200, 600);
    expect(result.widthCm).toBe(120);
    expect(result.depthCm).toBe(60);
  });
});

// ─── normalizeCatalogMm ───────────────────────────────────────────────────────

describe("normalizeCatalogMm", () => {
  it("converts catalog cm to mm (× 10)", () => {
    expect(normalizeCatalogMm(120)).toBe(1200);
    expect(normalizeCatalogMm(60)).toBe(600);
  });

  it("P4-06: widthMm from catalog item / 10 ≈ canvas cm width", () => {
    // catalog stores widthMm = 120 (cm), canvas cm = 120, actual mm = 1200
    const canvasCm = plannerCanvasUnits(120);
    expect(canvasCm).toBe(120); // 120 cm on canvas
    expect(normalizeCatalogMm(canvasCm)).toBe(1200); // 1200 mm real-world
  });
});

// ─── catalogMmToCanvasCm ──────────────────────────────────────────────────────

describe("catalogMmToCanvasCm", () => {
  it("converts real-world mm to canvas cm", () => {
    expect(catalogMmToCanvasCm(1200)).toBe(120);
    expect(catalogMmToCanvasCm(600)).toBe(60);
  });
});

// ─── moduleLengthMmFromItem ───────────────────────────────────────────────────

describe("moduleLengthMmFromItem", () => {
  it("extracts module length from name (1200mm) → 1200", () => {
    const item = makeDeskItem({ name: "Test Desk (1200mm)" });
    expect(moduleLengthMmFromItem(item)).toBe(1200);
  });

  it("extracts 1350mm from name", () => {
    const item = makeDeskItem({ name: "L-Shape Desk (1350mm)" });
    expect(moduleLengthMmFromItem(item)).toBe(1350);
  });

  it("falls back to widthMm/seatCount when no mm in name", () => {
    const item = makeDeskItem({ name: "Generic Desk", widthMm: 240, seatCount: 2 });
    // normalizeCatalogMm(240) = 2400, / 2 = 1200
    expect(moduleLengthMmFromItem(item)).toBe(1200);
  });
});

// ─── straightWorkstationFootprintMm ──────────────────────────────────────────

describe("straightWorkstationFootprintMm", () => {
  it("NS 4-seater 1200mm → L=4800, D=600", () => {
    const item = makeDeskItem({ name: "Desk (1200mm)", seatCount: 4, tags: ["straight", "non-sharing"] });
    const { L, D } = straightWorkstationFootprintMm(item);
    expect(L).toBe(4800);
    expect(D).toBe(600);
  });

  it("SH 2-seater 1200mm → L=2400, D=1200", () => {
    const item = makeDeskItem({ name: "Desk (1200mm)", seatCount: 2, tags: ["straight", "sharing"] });
    const { L, D } = straightWorkstationFootprintMm(item);
    expect(L).toBe(2400);
    expect(D).toBe(1200);
  });

  it("1-seater → L equals one module length", () => {
    const item = makeDeskItem({ name: "Desk (1500mm)", seatCount: 1, tags: ["straight", "non-sharing"] });
    const { L, D } = straightWorkstationFootprintMm(item);
    expect(L).toBe(1500);
    expect(D).toBe(600);
  });
});

// ─── resolveCatalogPlacementFootprintMm ──────────────────────────────────────

describe("resolveCatalogPlacementFootprintMm", () => {
  it("4-seater desk uses bay × module length, not single module", () => {
    const item = makeDeskItem({ name: "Desk (1200mm)", seatCount: 4, tags: ["straight", "non-sharing"] });
    const footprint = resolveCatalogPlacementFootprintMm(item);
    expect(footprint.widthMm).toBe(4800);
    expect(footprint.depthMm).toBe(600);
  });

  it("storage item uses normalized catalog cm fields", () => {
    const item = makeDeskItem({
      category: "storage",
      shapeType: "planner-storage",
      name: "Pedestal",
      widthMm: 40,
      heightMm: 50,
      seatCount: undefined,
    });
    const footprint = resolveCatalogPlacementFootprintMm(item);
    expect(footprint.widthMm).toBe(400);
    expect(footprint.depthMm).toBe(500);
  });
});

describe("catalogFootprintToCanvasUnits", () => {
  it("converts 4800×600 mm to 480×60 canvas units", () => {
    expect(catalogFootprintToCanvasUnits({ widthMm: 4800, depthMm: 600 })).toEqual({
      width: 480,
      depth: 60,
    });
  });
});

