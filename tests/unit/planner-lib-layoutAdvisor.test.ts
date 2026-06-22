import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONSTRAINTS,
  evaluateLayout,
  suggestPlacementZone,
  type DoorItem,
  type FurnitureItem,
  type Room,
  type Wall,
} from "@/features/planner/lib/layoutAdvisor";

const room: Room = {
  id: "room-1",
  vertices: [
    { xMm: 0, yMm: 0 },
    { xMm: 6000, yMm: 0 },
    { xMm: 6000, yMm: 4000 },
    { xMm: 0, yMm: 4000 },
  ],
  areaSqMm: 24_000_000,
};

function desk(id: string, xMm: number, yMm: number): FurnitureItem {
  return {
    id,
    xMm,
    yMm,
    widthMm: 1200,
    depthMm: 600,
    rotationDeg: 0,
  };
}

describe("layout advisor", () => {
  it("returns a perfect score for compliant sparse layouts", () => {
    const result = evaluateLayout(
      [desk("desk-1", 1500, 1500), desk("desk-2", 4500, 1500)],
      [],
      [room],
      [],
    );

    expect(result.score).toBe(100);
    expect(result.violations).toHaveLength(0);
    expect(result.suggestions).toHaveLength(0);
  });

  it("flags clearance, density, door, and wall access violations", () => {
    const walls: Wall[] = [
      { id: "wall-1", x1Mm: 0, y1Mm: 0, x2Mm: 6000, y2Mm: 0, thicknessMm: 120 },
    ];
    const doors: DoorItem[] = [{ id: "door-1", xMm: 3000, yMm: 0, widthMm: 900, swingRadiusMm: 900 }];
    const crowded = Array.from({ length: 12 }, (_, index) => desk(`desk-${index}`, 500 + index * 200, 500));

    const result = evaluateLayout(crowded, walls, [room], doors);

    expect(result.score).toBeLessThan(100);
    expect(result.violations.some((v) => v.constraint.type === "min-clearance")).toBe(true);
    expect(result.violations.some((v) => v.constraint.type === "max-density")).toBe(true);
    expect(result.violations.some((v) => v.constraint.type === "door-clearance")).toBe(true);
    expect(result.violations.some((v) => v.constraint.type === "window-access")).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("marks severe clearance gaps as errors", () => {
    const tightPair = [desk("a", 1000, 1000), desk("b", 1900, 1000)];
    const result = evaluateLayout(tightPair, [], [room], [], DEFAULT_CONSTRAINTS);

    const clearance = result.violations.find((v) => v.constraint.type === "min-clearance");
    expect(clearance?.severity).toBe("error");
    expect(clearance?.itemIds).toEqual(["a", "b"]);
  });

  it("reports desk-spacing warnings when clearance is above ADA but below desk threshold", () => {
    const spacedPair = [desk("a", 1000, 1000), desk("b", 3200, 1000)];
    const result = evaluateLayout(spacedPair, [], [room], [], DEFAULT_CONSTRAINTS);

    expect(result.violations.some((v) => v.constraint.type === "desk-spacing")).toBe(true);
    expect(result.violations.some((v) => v.constraint.type === "min-clearance")).toBe(false);
  });

  it("suggests valid placement zones inside the room polygon", () => {
    const existing = [desk("desk-1", 1500, 1500)];
    const candidates = suggestPlacementZone(room, existing, 1200, 600, 300);

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((point) => point.xMm > 0 && point.yMm > 0)).toBe(true);
  });

  it("handles rotated furniture and zero-length wall segments", () => {
    const rotated = [{ ...desk("rot", 3000, 2000), rotationDeg: 45 }];
    const zeroWall: Wall[] = [
      { id: "point-wall", x1Mm: 100, y1Mm: 100, x2Mm: 100, y2Mm: 100, thicknessMm: 100 },
    ];

    const result = evaluateLayout(rotated, zeroWall, [room], []);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
