import { describe, expect, it } from "vitest";

import { buildBlock2D, blockToSvg, meetingFlipTopBoxCount } from "@/lib/catalog/blocks2d";
import type { Product } from "@/lib/catalog/types";

function baseProduct(overrides: Partial<Product> & Pick<Product, "category_id" | "name">): Product {
  return {
    id: "test-product",
    series: "test",
    slug: "test-product",
    images: [],
    specs: { dimensions: "1200×600mm", materials: [], features: [] },
    series_id: "test",
    series_name: "Test",
    created_at: "",
    sizingType: "fixed",
    defaultFootprint: { L: 1200, D: 600, H: 750 },
    ...overrides,
  };
}

const CATEGORY_FIXTURES: Array<{ label: string; product: Product }> = [
  {
    label: "workstation",
    product: baseProduct({
      name: "4 Seater Desk",
      category_id: "desks",
      sizingType: "parametric",
      workstation: {
        shape: "straight",
        system: "partition",
        wireManagement: [],
        sharing: "sharing",
        seaterOptions: [4],
        lengthOptions: [1200],
        depthOptions: [1200],
        heightMm: 750,
      },
    }),
  },
  {
    label: "storage",
    product: baseProduct({ name: "Pedestal", category_id: "storage", defaultFootprint: { L: 400, D: 500, H: 750 } }),
  },
  {
    label: "table",
    product: baseProduct({ name: "Meeting Table (8 pax)", category_id: "tables", defaultFootprint: { L: 2400, D: 1200, H: 750 } }),
  },
  {
    label: "cabin-table",
    product: baseProduct({
      name: "Cabin Table",
      slug: "oando-cabin-table",
      category_id: "tables",
      defaultFootprint: { L: 1800, D: 750, H: 750 },
    }),
  },
  {
    label: "seating",
    product: baseProduct({ name: "Task Chair", category_id: "seating", defaultFootprint: { L: 600, D: 600, H: 750 } }),
  },
  {
    label: "sofa",
    product: baseProduct({ name: "Lounge Sofa", category_id: "sofas", defaultFootprint: { L: 1800, D: 900, H: 750 } }),
  },
];

describe("buildBlock2D", () => {
  it.each(CATEGORY_FIXTURES)("produces mm-accurate SVG primitives for $label", ({ product }) => {
    const block = buildBlock2D(product, product.workstation ? { selection: { seaters: 4, length: 1200, depth: 1200 } } : undefined);
    expect(block).not.toBeNull();
    expect(block!.footprint.L).toBeGreaterThan(0);
    expect(block!.footprint.D).toBeGreaterThan(0);
    expect(block!.prims.length).toBeGreaterThan(0);

    const svg = blockToSvg(block!);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).not.toMatch(/\.png|\.jpe?g/i);
    expect(svg).not.toContain('fill="var(');
    if (product.category_id === "desks") {
      expect(svg).toContain("<linearGradient");
      expect(svg).toMatch(/#ebe2d2|#e8dcc8|#e6d3ba/);
    }
  });

  it("doubles occupancy for sharing: 4800 mm 4-bay SH = 8 chairs face-to-face", () => {
    const product = baseProduct({
      name: "4 Bay Sharing Bench",
      category_id: "desks",
      sizingType: "parametric",
      workstation: {
        shape: "straight",
        system: "partition",
        wireManagement: [],
        sharing: "sharing",
        seaterOptions: [4],
        lengthOptions: [1200],
        depthOptions: [1200],
        heightMm: 750,
      },
    });
    const block = buildBlock2D(product, { selection: { seaters: 4, length: 1200, depth: 1200 } });
    expect(block).not.toBeNull();
    expect(block!.footprint.L).toBe(4800);
    expect(block!.footprint.D).toBe(1200);
    expect(block!.label).toContain("8-seat sharing");

    const seats = block!.prims.filter((p) => p.kind === "rect" && p.radius === 72);
    expect(seats).toHaveLength(8);
    expect(seats.filter((p) => (p.y ?? 0) < 0)).toHaveLength(4);
    expect(seats.filter((p) => (p.y ?? 0) > block!.footprint.D)).toHaveLength(4);
  });

  it("uses bays x module length for 8-bay sharing (9600x1200, 16 chairs)", () => {
    const product = baseProduct({
      name: "8 Bay Sharing Bench",
      category_id: "desks",
      sizingType: "parametric",
      workstation: {
        shape: "straight",
        system: "partition",
        wireManagement: [],
        sharing: "sharing",
        seaterOptions: [8],
        lengthOptions: [1200],
        depthOptions: [1200],
        heightMm: 750,
      },
    });
    const block = buildBlock2D(product, { selection: { seaters: 8, length: 1200, depth: 1200 } });
    expect(block).not.toBeNull();
    expect(block!.footprint.L).toBe(9600);
    expect(block!.footprint.D).toBe(1200);
    expect(block!.label).toContain("16-seat sharing");

    const seats = block!.prims.filter((p) => p.kind === "rect" && p.radius === 72);
    expect(seats).toHaveLength(16);
  });

  it("places exactly seaters chairs on one side for non-sharing (NS) workstations", () => {
    const product = baseProduct({
      name: "4 Seater Desk",
      category_id: "desks",
      sizingType: "parametric",
      workstation: {
        shape: "straight",
        system: "partition",
        wireManagement: [],
        sharing: "non-sharing",
        seaterOptions: [4],
        lengthOptions: [1200],
        depthOptions: [600],
        heightMm: 750,
      },
    });
    const block = buildBlock2D(product, { selection: { seaters: 4, length: 1200, depth: 600 } });
    expect(block).not.toBeNull();
    expect(block!.footprint.L).toBe(4800);

    const seats = block!.prims.filter((p) => p.kind === "rect" && p.radius === 72);
    expect(seats).toHaveLength(4);
    expect(seats.filter((p) => (p.y ?? 0) < 0)).toHaveLength(0);
    expect(seats.filter((p) => (p.y ?? 0) > block!.footprint.D)).toHaveLength(4);
  });

  it("renders cabin tables with a single primary seat and desk accessories", () => {
    const product = baseProduct({
      name: "Cabin Table",
      slug: "oando-cabin-table",
      category_id: "tables",
      defaultFootprint: { L: 1800, D: 750, H: 750 },
    });
    const block = buildBlock2D(product);
    expect(block).not.toBeNull();
    const chairs = block!.prims.filter((p) => p.kind === "rect" && p.radius === 72);
    expect(chairs.length).toBeGreaterThanOrEqual(1);
    expect(chairs.length).toBeLessThanOrEqual(2);
    expect(block!.prims.some((p) => p.kind === "circle")).toBe(true);
  });

  it("counts meeting-table flip-top boxes: 2 from 1800–2400, +1 per 1200 beyond", () => {
    expect(meetingFlipTopBoxCount(1799)).toBe(0);
    expect(meetingFlipTopBoxCount(1800)).toBe(2);
    expect(meetingFlipTopBoxCount(2400)).toBe(2);
    expect(meetingFlipTopBoxCount(3000)).toBe(3);
    expect(meetingFlipTopBoxCount(3600)).toBe(3);
    expect(meetingFlipTopBoxCount(4800)).toBe(4);
  });

  it("renders meeting tables with flip-top modules and conference chairs", () => {
    const product = baseProduct({
      name: "Meeting / Conference Table 2400 × 1200 (8 pax)",
      category_id: "tables",
      defaultFootprint: { L: 2400, D: 1200, H: 750 },
    });
    const block = buildBlock2D(product);
    expect(block).not.toBeNull();
    const svg = blockToSvg(block!);
    expect(svg).toContain("<linearGradient");
    expect(block!.prims.filter((p) => p.kind === "rect" && p.radius === 64).length).toBe(8);
    expect(block!.prims.filter((p) => p.kind === "rect" && p.fill === "#d6d3d1").length).toBe(2);
  });

  it("renders round tables when footprint is square and compact", () => {
    const product = baseProduct({
      name: "Cafe Table",
      category_id: "tables",
      defaultFootprint: { L: 900, D: 900, H: 750 },
    });
    const block = buildBlock2D(product);
    expect(block).not.toBeNull();
    expect(block!.prims.some((p) => p.kind === "circle")).toBe(true);
  });
});

