import { describe, expect, it } from "vitest";

import { SnapManager, type SnapPoint } from "@/features/planner/lib/snapManager";

describe("planner snap manager", () => {
  it("snaps to the nearest grid intersection when enabled", () => {
    const manager = new SnapManager({ snapThreshold: 20, gridSpacing: 50 });
    const result = manager.findSnap(48, 52);

    expect(result.snapped).toBe(true);
    expect(result.point).toEqual({ x: 50, y: 50 });
  });

  it("returns the original point when snapping is disabled", () => {
    const manager = new SnapManager({ enabled: false });
    const result = manager.findSnap(123, 456);

    expect(result).toEqual({ snapped: false, point: { x: 123, y: 456 }, distance: 0 });
  });

  it("prefers explicit snap points over grid points", () => {
    const manager = new SnapManager({ snapThreshold: 20, snapToGrid: false });
    manager.addSnapPoints([{ x: 100, y: 100, type: "corner", source: "desk-1" }]);

    const result = manager.findSnap(95, 98);
    expect(result.snapped).toBe(true);
    expect(result.snapPoint?.source).toBe("desk-1");
  });

  it("generates snap points from workspace shapes", () => {
    const points = SnapManager.generateWorkspaceSnapPoints({
      walls: [{ id: "wall-1", startX: 0, startY: 0, endX: 200, endY: 0 }],
      rooms: [{ id: "room-1", points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }] }],
      furniture: [{ id: "desk-1", x: 10, y: 10, widthMm: 120, heightMm: 80 }],
      doors: [{ id: "door-1", x: 50, y: 0, widthMm: 90, heightMm: 10 }],
      windows: [{ id: "window-1", x: 150, y: 0, widthMm: 120, heightMm: 10 }],
      zones: [{ id: "zone-1", points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }] }],
      measurements: [{ id: "m-1", startX: 0, startY: 0, endX: 100, endY: 0 }],
    });

    expect(points.some((point) => point.type === "centerline")).toBe(true);
    expect(points.some((point) => point.type === "corner")).toBe(true);
    expect(points.some((point) => point.type === "midpoint")).toBe(true);
    expect(points.some((point) => point.type === "edge")).toBe(true);
  });

  it("respects per-type snap toggles", () => {
    const manager = new SnapManager({
      snapThreshold: 5,
      snapToGrid: false,
      snapToCorners: false,
      snapToWalls: true,
      snapToEdges: false,
      snapToMidpoints: false,
    });
    manager.addSnapPoints([
      { x: 10, y: 10, type: "corner" },
      { x: 20, y: 20, type: "centerline" },
    ]);

    const cornerResult = manager.findSnap(9, 9);
    expect(cornerResult.snapped).toBe(false);

    const wallResult = manager.findSnap(19, 19);
    expect(wallResult.snapped).toBe(true);
    expect(wallResult.snapPoint?.type).toBe("centerline");
  });

  it("skips disabled grid snapping when grid is turned off", () => {
    const manager = new SnapManager({ snapToGrid: true, gridEnabled: false, snapThreshold: 20 });
    expect(manager.findSnap(48, 52).snapped).toBe(false);
  });

  it("snaps to edge and midpoint points and ignores unknown snap types when disabled", () => {
    const manager = new SnapManager({
      snapThreshold: 10,
      snapToGrid: false,
      snapToCorners: false,
      snapToWalls: false,
      snapToEdges: true,
      snapToMidpoints: true,
    });
    manager.addSnapPoints([
      { x: 30, y: 30, type: "edge" },
      { x: 40, y: 40, type: "midpoint" },
      { x: 50, y: 50, type: "custom", source: "fallback" } as SnapPoint,
    ]);

    expect(manager.findSnap(31, 29).snapPoint?.type).toBe("edge");
    expect(manager.findSnap(41, 39).snapPoint?.type).toBe("midpoint");
    expect(manager.findSnap(49, 49).snapped).toBe(true);
  });

  it("misses grid intersections outside the snap threshold", () => {
    const manager = new SnapManager({ snapThreshold: 2, gridSpacing: 50, snapToGrid: true });
    expect(manager.findSnap(40, 40).snapped).toBe(false);
  });

  it("updates options and clears accumulated snap points", () => {
    const manager = new SnapManager();
    manager.addSnapPoints([{ x: 1, y: 1, type: "corner" }]);
    manager.clearSnapPoints();
    manager.setOptions({ snapToGrid: false, enabled: true, snapThreshold: 1 });

    expect(manager.findSnap(1, 1).snapped).toBe(false);
  });
});
