import { describe, expect, it } from "vitest";

import { suggestLayoutGridPack } from "@/features/planner/ai/spaceSuggest";

describe("suggestLayoutGridPack", () => {
  it("packs 50 support-office seats with walls and furniture", () => {
    const layout = suggestLayoutGridPack({
      seatCount: 50,
      purpose: "workstations",
      floorAreaSqFt: 2500,
    });

    expect(layout.version).toBe(1);
    expect(layout.source).toBe("grid-pack");
    expect(layout.walls.length).toBeGreaterThanOrEqual(4);
    expect(layout.furniture.length).toBeGreaterThan(0);
    expect(layout.zones.length).toBeGreaterThan(0);
    expect(layout.room.widthMm).toBeGreaterThan(0);
    expect(layout.room.depthMm).toBeGreaterThan(0);
    expect(layout.summary).toContain("50");
  });

  it("does not overshoot the requested seat count with bench packing", () => {
    const layout = suggestLayoutGridPack({
      seatCount: 5,
      purpose: "workstations",
      floorAreaSqFt: 800,
    });

    const benchPieces = layout.furniture.filter((piece) => piece.label.toLowerCase().includes("seater"));
    expect(benchPieces.length).toBe(1);
    expect(layout.summary).toContain("5");
  });

  it("adds a meeting zone for large mixed offices", () => {
    const layout = suggestLayoutGridPack({
      seatCount: 50,
      purpose: "mixed",
      floorAreaSqFt: 3000,
    });

    expect(layout.zones.some((zone) => zone.label.toLowerCase().includes("meeting"))).toBe(true);
  });
});