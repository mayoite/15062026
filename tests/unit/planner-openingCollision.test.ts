import { describe, expect, it } from "vitest";

import {
  checkOpeningPlacementOnWall,
  clampOpeningAlong,
  spansOverlap,
} from "@/features/planner/lib/geometry/openingCollision";
import type { OpeningCandidate, WallSegmentSpec } from "@/features/planner/lib/geometry/wallOpenings";

const wall: WallSegmentSpec = {
  id: "w1",
  start: { x: 0, y: 0 },
  end: { x: 400, y: 0 },
  thickness: 10,
};

describe("openingCollision", () => {
  it("detects overlapping opening spans", () => {
    expect(spansOverlap({ start: 80, end: 140 }, { start: 120, end: 180 })).toBe(true);
    expect(spansOverlap({ start: 80, end: 120 }, { start: 140, end: 180 })).toBe(false);
  });

  it("clamps opening centers away from wall ends", () => {
    expect(clampOpeningAlong(400, 20, 90)).toBeGreaterThan(45);
    expect(clampOpeningAlong(400, 380, 90)).toBeLessThan(355);
  });

  it("blocks overlapping openings on the same wall", () => {
    const existing: OpeningCandidate[] = [
      { id: "d1", kind: "door", center: { x: 120, y: 0 }, width: 90 },
    ];
    const check = checkOpeningPlacementOnWall(
      wall,
      { x: 130, y: 0 },
      90,
      existing,
    );
    expect(check.blocked).toBe(true);
    expect(check.reason).toBe("overlap");
  });

  it("allows non-overlapping openings on the same wall", () => {
    const existing: OpeningCandidate[] = [
      { id: "d1", kind: "door", center: { x: 100, y: 0 }, width: 80 },
    ];
    const check = checkOpeningPlacementOnWall(
      wall,
      { x: 260, y: 0 },
      80,
      existing,
    );
    expect(check.blocked).toBe(false);
  });
});
