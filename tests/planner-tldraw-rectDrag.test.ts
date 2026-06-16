import { Vec } from "@tldraw/editor";
import { describe, expect, it } from "vitest";

import {
  isPlannerCanvasDragToolId,
  normalizeRectDrag,
} from "@/features/planner/tldraw/tools/rectDrag";

describe("normalizeRectDrag", () => {
  it("keeps the anchor at the start point for down/right drags", () => {
    const rect = normalizeRectDrag(new Vec(100, 100), new Vec(180, 150));
    expect(rect.origin).toEqual(new Vec(100, 100));
    expect(rect.width).toBe(80);
    expect(rect.height).toBe(50);
    expect(rect.points).toEqual([
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 50 },
      { x: 0, y: 50 },
    ]);
  });

  it("moves the anchor when dragging up or left", () => {
    const rect = normalizeRectDrag(new Vec(200, 200), new Vec(120, 140));
    expect(rect.origin).toEqual(new Vec(120, 140));
    expect(rect.width).toBe(80);
    expect(rect.height).toBe(60);
    expect(rect.points.every((point) => point.x >= 0 && point.y >= 0)).toBe(true);
  });
});

describe("isPlannerCanvasDragToolId", () => {
  it("detects active draw states", () => {
    expect(isPlannerCanvasDragToolId("planner-wall.drawing")).toBe(true);
    expect(isPlannerCanvasDragToolId("planner-door-window.placing")).toBe(true);
    expect(isPlannerCanvasDragToolId("planner-wall")).toBe(false);
    expect(isPlannerCanvasDragToolId("select")).toBe(false);
  });
});