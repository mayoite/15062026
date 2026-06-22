import { beforeEach, describe, expect, it } from "vitest";

import {
  clampDockRatio,
  getDockAxisBounds,
  getPlannerChromePreviewEdge,
  getPlannerChromeTooltipSide,
  normalizePlannerChromePlacement,
  movePlannerChromePlacementWithKeyboard,
  PLANNER_CHROME_DEFAULTS,
  resolvePlannerChromeCollisions,
  snapPlannerChromePlacement,
} from "@/features/planner/editor/chrome/plannerChromeLayout";
import {
  PLANNER_CHROME_LAYOUT_STORAGE_KEY,
  readPlannerChromeDockPlacement,
  resetPlannerChromeLayout,
  writePlannerChromeDockPlacement,
} from "@/features/planner/editor/chrome/plannerChromeStorage";

const LAYER = { left: 100, top: 50, width: 1200, height: 720 };
const TOOLS_SIZE = { width: 68, height: 312 };

beforeEach(() => {
  window.localStorage.clear();
});

describe("planner chrome layout", () => {
  it("clamps ratios and free placements into safe bounds", () => {
    expect(clampDockRatio(-1)).toBe(0.08);
    expect(clampDockRatio(2)).toBe(0.92);

    const normalized = normalizePlannerChromePlacement(
      { edge: "free", offset: 0.2, x: 0.99, y: 0.01 },
      PLANNER_CHROME_DEFAULTS.access,
      {
        layerRect: LAYER,
        widgetSize: { width: 180, height: 56 },
        reservedInsets: { left: 380, right: 340, top: 24, bottom: 24 },
      },
    );

    expect(normalized.edge).toBe("free");
    expect(normalized.x).toBeLessThan(0.8);
    expect(normalized.y).toBeGreaterThan(0.08);
  });

  it("derives edge bounds from layer size and reserved insets", () => {
    const bounds = getDockAxisBounds("top", LAYER, { width: 420, height: 48 }, { left: 380, right: 340 });

    expect(bounds.min).toBeGreaterThan(0.3);
    expect(bounds.max).toBeLessThan(0.8);
    expect(bounds.min).toBeLessThan(bounds.max);
  });

  it("detects preview edge by pointer proximity", () => {
    expect(getPlannerChromePreviewEdge(110, 400, LAYER)).toBe("left");
    expect(getPlannerChromePreviewEdge(1280, 400, LAYER)).toBe("right");
    expect(getPlannerChromePreviewEdge(700, 60, LAYER)).toBe("top");
    expect(getPlannerChromePreviewEdge(700, 760, LAYER)).toBe("bottom");
    expect(getPlannerChromePreviewEdge(700, 400, LAYER)).toBe("free");
  });

  it("snaps by widget center and clamps free placement away from open panels", () => {
    const placement = snapPlannerChromePlacement(680, 360, LAYER, TOOLS_SIZE, undefined, {
      left: 380,
      right: 340,
    });

    expect(placement.edge).toBe("free");
    expect(placement.x).toBeGreaterThan(0.42);
    expect(placement.x).toBeLessThan(0.74);
  });

  it("staggeres widgets on the same edge instead of stacking them", () => {
    const layout = resolvePlannerChromeCollisions(
      {
        tools: { edge: "left", offset: 0.5 },
        steps: { edge: "top", offset: 0.5 },
        access: { edge: "left", offset: 0.5 },
      },
      "access",
      LAYER,
      {
        tools: TOOLS_SIZE,
        access: { width: 180, height: 56 },
      },
    );

    expect(layout.access.edge).toBe("left");
    expect(layout.access.offset).not.toBe(layout.tools.offset);
    expect(Math.abs(layout.access.offset - layout.tools.offset)).toBeGreaterThanOrEqual(0.1);
  });

  it("moves docked widgets with keyboard math and honors bounds", () => {
    const next = movePlannerChromePlacementWithKeyboard(
      { edge: "left", offset: 0.5 },
      "ArrowDown",
      { shiftKey: true, layerRect: LAYER, widgetSize: TOOLS_SIZE },
    );

    expect(next.edge).toBe("left");
    expect(next.offset).toBeGreaterThan(0.5);

    const home = movePlannerChromePlacementWithKeyboard(
      { edge: "top", offset: 0.5 },
      "Home",
      { layerRect: LAYER, widgetSize: { width: 420, height: 48 }, reservedInsets: { left: 380 } },
    );

    expect(home.offset).toBeGreaterThan(0.3);
  });

  it("moves free widgets with keyboard controls and homes/ends them within bounds", () => {
    const next = movePlannerChromePlacementWithKeyboard(
      { edge: "free", offset: 0.5, x: 0.5, y: 0.5 },
      "ArrowLeft",
      {
        shiftKey: true,
        layerRect: LAYER,
        widgetSize: { width: 180, height: 56 },
        reservedInsets: { left: 380, right: 340, top: 24, bottom: 24 },
      },
    );

    expect(next.edge).toBe("free");
    expect(next.x).toBeLessThan(0.5);

    const end = movePlannerChromePlacementWithKeyboard(
      next,
      "End",
      {
        layerRect: LAYER,
        widgetSize: { width: 180, height: 56 },
        reservedInsets: { left: 380, right: 340, top: 24, bottom: 24 },
      },
    );

    expect(end.x).toBeLessThan(0.8);
    expect(end.y).toBeLessThan(0.92);
  });

  it("maps tooltip side from dock edge", () => {
    expect(getPlannerChromeTooltipSide("left")).toBe("right");
    expect(getPlannerChromeTooltipSide("right")).toBe("left");
    expect(getPlannerChromeTooltipSide("bottom")).toBe("top");
    expect(getPlannerChromeTooltipSide("top")).toBe("bottom");
    expect(getPlannerChromeTooltipSide("free")).toBe("bottom");
  });
});

describe("planner chrome storage", () => {
  it("falls back to defaults when storage is malformed", () => {
    window.localStorage.setItem(
      PLANNER_CHROME_LAYOUT_STORAGE_KEY,
      JSON.stringify({ version: 1, placements: { tools: { edge: "free", x: 2, y: -1 } } }),
    );

    expect(readPlannerChromeDockPlacement("tools")).toEqual(PLANNER_CHROME_DEFAULTS.tools);
    expect(readPlannerChromeDockPlacement("access")).toEqual(PLANNER_CHROME_DEFAULTS.access);
  });

  it("reads legacy v1 storage and preserves access fallback", () => {
    window.localStorage.setItem(
      "planner-chrome-dock-v1",
      JSON.stringify({
        tools: { edge: "right", offset: 0.25 },
        steps: { edge: "bottom", offset: 0.75 },
      }),
    );

    expect(readPlannerChromeDockPlacement("tools")).toEqual({ edge: "right", offset: 0.25 });
    expect(readPlannerChromeDockPlacement("steps")).toEqual({ edge: "bottom", offset: 0.75 });
    expect(readPlannerChromeDockPlacement("access")).toEqual(PLANNER_CHROME_DEFAULTS.access);
  });

  it("resets the full v2 envelope back to defaults", () => {
    writePlannerChromeDockPlacement("access", { edge: "free", offset: 0.5, x: 0.42, y: 0.38 });

    expect(window.localStorage.getItem(PLANNER_CHROME_LAYOUT_STORAGE_KEY)).toContain("\"free\"");

    const layout = resetPlannerChromeLayout();
    expect(layout).toEqual(PLANNER_CHROME_DEFAULTS);

    expect(JSON.parse(window.localStorage.getItem(PLANNER_CHROME_LAYOUT_STORAGE_KEY) ?? "{}"))
      .toMatchObject({
        version: 2,
        placements: PLANNER_CHROME_DEFAULTS,
      });
  });

  it("writes a single dock placement into the v2 envelope", () => {
    writePlannerChromeDockPlacement("tools", { edge: "free", offset: 0.5, x: 0.44, y: 0.36 });

    expect(readPlannerChromeDockPlacement("tools")).toEqual({
      edge: "free",
      offset: 0.5,
      x: 0.44,
      y: 0.36,
    });
  });
});

