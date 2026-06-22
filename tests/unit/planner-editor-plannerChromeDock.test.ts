import { beforeEach, describe, expect, it } from "vitest";

import {
  PLANNER_CHROME_DOCK_DEFAULTS,
  PLANNER_CHROME_DOCK_STORAGE_KEY,
  readPlannerChromeDockPlacement,
  snapPlannerChromePlacement,
  writePlannerChromeDockPlacement,
} from "@/features/planner/editor/plannerChromeDock";
import { PLANNER_CHROME_LAYOUT_STORAGE_KEY } from "@/features/planner/editor/chrome/plannerChromeStorage";

const LAYER = { left: 100, top: 50, width: 800, height: 600 };

beforeEach(() => {
  window.localStorage.clear();
});

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
  it("anchors tools on the left, steps on top, and access near the top left", () => {
    expect(PLANNER_CHROME_DOCK_DEFAULTS.tools.edge).toBe("left");
    expect(PLANNER_CHROME_DOCK_DEFAULTS.steps.edge).toBe("top");
    expect(PLANNER_CHROME_DOCK_DEFAULTS.access.edge).toBe("top");
    expect(PLANNER_CHROME_DOCK_DEFAULTS.access.offset).toBeLessThan(0.2);
  });
});

describe("planner chrome storage", () => {
  it("falls back to defaults for invalid stored placements", () => {
    window.localStorage.setItem(
      PLANNER_CHROME_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        placements: {
          tools: { edge: "void", offset: Number.NaN },
        },
      }),
    );

    expect(readPlannerChromeDockPlacement("tools")).toEqual(PLANNER_CHROME_DOCK_DEFAULTS.tools);
    expect(readPlannerChromeDockPlacement("access")).toEqual(PLANNER_CHROME_DOCK_DEFAULTS.access);
  });

  it("reads legacy v1 storage without breaking v2 defaults", () => {
    window.localStorage.setItem(
      PLANNER_CHROME_DOCK_STORAGE_KEY,
      JSON.stringify({
        tools: { edge: "right", offset: 0.25 },
        steps: { edge: "bottom", offset: 0.75 },
      }),
    );

    expect(readPlannerChromeDockPlacement("tools")).toEqual({ edge: "right", offset: 0.25 });
    expect(readPlannerChromeDockPlacement("steps")).toEqual({ edge: "bottom", offset: 0.75 });
    expect(readPlannerChromeDockPlacement("access")).toEqual(PLANNER_CHROME_DOCK_DEFAULTS.access);
  });

  it("writes placements into the v2 envelope", () => {
    writePlannerChromeDockPlacement("access", { edge: "free", offset: 0.5, x: 0.42, y: 0.38 });

    const raw = window.localStorage.getItem(PLANNER_CHROME_LAYOUT_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toMatchObject({
      version: 2,
      placements: {
        access: { edge: "free", offset: 0.5, x: 0.42, y: 0.38 },
      },
    });
  });
});

