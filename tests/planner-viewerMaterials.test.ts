import { describe, expect, it } from "vitest";

import {
  FIXTURE_FINISHES,
  FOCSS_3D_COLORS,
  FURNITURE_FINISHES,
  getSharedMaterial,
  getTintedMaterial,
  normalizeColor,
  resolveFurnitureKind,
  type FurnitureKind,
} from "@/features/planner/viewer/viewerMaterials";
import {
  boundsCenter,
  boundsExtent,
  computeSceneBounds,
  frameToContent,
} from "@/features/planner/viewer/viewerFraming";
import type { PlannerViewerShape } from "@/features/planner/viewer/PlannerViewer";

describe("resolveFurnitureKind", () => {
  it("maps catalog desk names to desk", () => {
    expect(
      resolveFurnitureKind(
        "Table Top: 25mm thick Pre laminate particle board with 2mm PV — 1 seater - NS (1200mm)",
        "desks",
      ),
    ).toBe("desk");
  });

  it("does not treat non-sharing (NS) items as benches", () => {
    expect(resolveFurnitureKind("4 seater - NS (1200mm)", "desks")).toBe("desk");
  });

  it("detects sharing benches from the SH marker", () => {
    expect(resolveFurnitureKind("4 seater - SH (1400mm)", "desks")).toBe("bench");
  });

  it("detects sharing benches from a deep, double-sided footprint", () => {
    expect(resolveFurnitureKind("6 seater workstation", "desks", 3.6, 1.4)).toBe("bench");
  });

  it("maps chairs, storage, screens and meeting rooms by label", () => {
    expect(resolveFurnitureKind("Operator Chair")).toBe("chair");
    expect(resolveFurnitureKind("Mobile Pedestal")).toBe("storage");
    expect(resolveFurnitureKind("Workstation — Main screen (1200mm desk)", "equipment")).toBe("screen");
    expect(resolveFurnitureKind("Meeting Room (8p)")).toBe("meeting");
  });

  it("falls back to catalog category, then generic", () => {
    expect(resolveFurnitureKind("Unnamed item", "storage")).toBe("storage");
    expect(resolveFurnitureKind("Name plate", "equipment")).toBe("equipment");
    expect(resolveFurnitureKind(undefined)).toBe("generic");
  });
});

describe("FURNITURE_FINISHES", () => {
  const kinds: FurnitureKind[] = [
    "desk", "bench", "chair", "meeting", "storage", "screen", "equipment", "generic",
  ];

  it("defines a primary and secondary finish for every kind", () => {
    for (const kind of kinds) {
      const pair = FURNITURE_FINISHES[kind];
      expect(pair.primary.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(pair.secondary.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("uses FOCSS tokens for the flagship finishes", () => {
    expect(FURNITURE_FINISHES.desk.primary.color).toBe(FOCSS_3D_COLORS.ecru300);
    expect(FURNITURE_FINISHES.chair.primary.color).toBe(FOCSS_3D_COLORS.darkMidnightBlue350);
    expect(FURNITURE_FINISHES.storage.primary.color).toBe(FOCSS_3D_COLORS.bronze700);
    expect(FIXTURE_FINISHES.floor.color).toBe(FOCSS_3D_COLORS.ecru100);
  });

  it("differentiates fabric from metal via roughness/metalness", () => {
    expect(FURNITURE_FINISHES.chair.primary.roughness).toBeGreaterThan(0.7);
    expect(FURNITURE_FINISHES.chair.primary.metalness).toBe(0);
    expect(FURNITURE_FINISHES.storage.primary.metalness).toBeGreaterThan(0.2);
  });
});

describe("shared material cache", () => {
  it("returns the same material instance for the same finish", () => {
    const finish = { color: "#DED2B6", roughness: 0.45, metalness: 0.05 };
    expect(getSharedMaterial(finish)).toBe(getSharedMaterial({ ...finish }));
  });

  it("applies finish color and PBR params", () => {
    const material = getSharedMaterial({ color: "#42494E", roughness: 0.35, metalness: 0.65 });
    expect(material.color.getHexString()).toBe("42494e");
    expect(material.roughness).toBe(0.35);
    expect(material.metalness).toBe(0.65);
    expect(material.transparent).toBe(false);
  });

  it("creates transparent, non-depth-writing materials for opacity < 1", () => {
    const material = getSharedMaterial({ color: "#9BBBDA", roughness: 0.12, metalness: 0.1, opacity: 0.45 });
    expect(material.transparent).toBe(true);
    expect(material.opacity).toBe(0.45);
    expect(material.depthWrite).toBe(false);
  });

  it("tints with a user override but rejects CSS var() strings", () => {
    const finish = { color: "#DED2B6", roughness: 0.45, metalness: 0.05 };
    expect(getTintedMaterial(finish, "#FF0000").color.getHexString()).toBe("ff0000");
    expect(getTintedMaterial(finish, "var(--color-accent)")).toBe(getSharedMaterial(finish));
    expect(getTintedMaterial(finish, "#FF0000")).toBe(getTintedMaterial(finish, "#FF0000"));
  });
});

describe("normalizeColor", () => {
  it("passes through concrete colors and falls back otherwise", () => {
    expect(normalizeColor("#123456", "#abcdef")).toBe("#123456");
    expect(normalizeColor("var(--x)", "#abcdef")).toBe("#abcdef");
    expect(normalizeColor(undefined, "#abcdef")).toBe("#abcdef");
  });
});

function shape(partial: Partial<PlannerViewerShape>): PlannerViewerShape {
  return {
    id: "s1",
    type: "planner-furniture",
    x: 0,
    y: 0,
    rotation: 0,
    width: 100,
    height: 100,
    ...partial,
  };
}

describe("scene bounds + framing", () => {
  it("returns default bounds when empty", () => {
    const bounds = computeSceneBounds([]);
    expect(bounds.hasShapes).toBe(false);
    expect(frameToContent([])).toEqual({ position: [0, 10, 10], target: [0, 0, 0] });
  });

  it("includes wall segments and furniture footprints", () => {
    const bounds = computeSceneBounds([
      shape({ id: "f1", x: 100, y: 200, width: 100, height: 50 }),
      shape({
        id: "w1",
        type: "planner-wall",
        wall: { startX: -300, startY: 0, endX: 500, endY: 0, thickness: 10 },
      }),
    ]);
    expect(bounds).toMatchObject({ minX: -300, minZ: 0, maxX: 500, maxZ: 250, hasShapes: true });
  });

  it("frames the content centre from above and to the side", () => {
    const shapes = [shape({ x: 0, y: 0, width: 1000, height: 1000 })];
    const bounds = computeSceneBounds(shapes);
    expect(boundsCenter(bounds)).toEqual({ cx: 5, cz: 5 });
    expect(boundsExtent(bounds)).toBe(10);

    const framing = frameToContent(shapes);
    expect(framing.target).toEqual([5, 0, 5]);
    expect(framing.position[1]).toBeGreaterThan(0);
    expect(framing.position[0]).toBeGreaterThan(5);
  });
});
