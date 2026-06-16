import { describe, expect, it } from "vitest";

import {
  PLANNER_CHROME_DOCK_DEFAULTS,
  snapPlannerChromePlacement,
} from "@/features/planner/editor/plannerChromeDock";

const LAYER = { left: 100, top: 50, width: 800, height: 600 };

describe("snapPlannerChromePlacement", () => {
  it("snaps near the left edge", () => {
    const placement = snapPlannerChromePlacement(130, 350, LAYER);
    expect(placement.edge).toBe("left");
    expect(placement.offset).toBeGreaterThan(0.4);
    expect(placement.offset).toBeLessThan(0.6);
  });

  it("snaps near the top edge", () => {
    const placement = snapPlannerChromePlacement(500, 80, LAYER);
    expect(placement.edge).toBe("top");
    expect(placement.offset).toBeCloseTo(0.5, 1);
  });

  it("keeps free placement in the canvas center", () => {
    const placement = snapPlannerChromePlacement(500, 350, LAYER);
    expect(placement.edge).toBe("free");
    expect(placement.x).toBeCloseTo(0.5, 1);
    expect(placement.y).toBeCloseTo(0.5, 1);
  });
});

describe("PLANNER_CHROME_DOCK_DEFAULTS", () => {
  it("anchors tools on the left and steps on top", () => {
    expect(PLANNER_CHROME_DOCK_DEFAULTS.tools.edge).toBe("left");
    expect(PLANNER_CHROME_DOCK_DEFAULTS.steps.edge).toBe("top");
  });
});