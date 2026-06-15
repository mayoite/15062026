import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tldraw/editor", async () => {
  const { createTldrawEditorModule } = await import("./planner-tldraw-mockEditor");
  return createTldrawEditorModule();
});

vi.mock("@/features/planner/store/plannerStore", () => ({
  usePlannerStore: {
    getState: () => ({ snapDistance: 10 }),
  },
}));

import { Vec } from "@tldraw/editor";
import { SnapManager } from "@/features/planner/lib/snapManager";
import {
  collectEditorSnapPoints,
  constrainToAngle,
  getEditorSnapThreshold,
  snapEditorPoint,
  snapEditorPointOrGrid,
  snapOpeningToWall,
  snapWallEndpoint,
} from "@/features/planner/tldraw/tools/tldrawSnap";
import { createMockEditor, makePlannerWallShape } from "./planner-tldraw-mockEditor";

describe("tldrawSnap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getEditorSnapThreshold returns at least 12", () => {
    expect(getEditorSnapThreshold()).toBeGreaterThanOrEqual(12);
  });

  it("collectEditorSnapPoints gathers wall and polygon points", () => {
    const editor = createMockEditor({
      shapes: [
        makePlannerWallShape("w1", 0, 0, 200, 0),
        {
          id: "room:1",
          type: "planner-room",
          x: 10,
          y: 10,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          props: {
            points: [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
              { x: 100, y: 80 },
            ],
          },
        } as never,
        {
          id: "zone:1",
          type: "planner-zone",
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          props: { points: [{ x: 0, y: 0 }, { x: 50, y: 50 }] },
        } as never,
      ],
    });

    const points = collectEditorSnapPoints(editor);
    expect(points.length).toBeGreaterThan(0);
    expect(points.some((p) => p.source === "w1")).toBe(true);
  });

  it("collectEditorSnapPoints excludes a shape by id", () => {
    const editor = createMockEditor({
      shapes: [makePlannerWallShape("w1", 0, 0, 100, 0)],
    });
    const points = collectEditorSnapPoints(editor, "w1");
    expect(points.filter((p) => p.source === "w1")).toHaveLength(0);
  });

  it("snapEditorPoint snaps to grid near origin", () => {
    const editor = createMockEditor();
    const result = snapEditorPoint(editor, new Vec(3, 4));
    expect(result.snapped).toBe(true);
    expect(result.point.x).toBe(0);
    expect(result.point.y).toBe(0);
  });

  it("snapEditorPoint snaps near wall axis", () => {
    const editor = createMockEditor({
      shapes: [makePlannerWallShape("w1", 0, 0, 200, 0)],
    });
    const result = snapEditorPoint(editor, new Vec(100, 5));
    expect(result.snapped).toBe(true);
    expect(result.point.x).toBeCloseTo(100, 0);
    expect(Math.abs(result.point.y)).toBeLessThanOrEqual(10);
  });

  it("snapEditorPointOrGrid returns snapped point", () => {
    const editor = createMockEditor();
    const point = snapEditorPointOrGrid(editor, new Vec(12, 8));
    expect(point).toBeInstanceOf(Vec);
  });

  it("snapOpeningToWall attaches to nearest wall", () => {
    const editor = createMockEditor({
      shapes: [makePlannerWallShape("w1", 0, 0, 400, 0)],
    });
    const result = snapOpeningToWall(editor, new Vec(150, 4));
    expect(result).not.toBeNull();
    expect(result!.wallId).toBe("w1");
    expect(result!.t).toBeGreaterThan(0);
    expect(result!.t).toBeLessThan(1);
  });

  it("snapOpeningToWall returns null when no walls", () => {
    const editor = createMockEditor();
    expect(snapOpeningToWall(editor, new Vec(50, 50))).toBeNull();
  });

  it("snapEditorPoint prefers wall segment over distant grid snap", () => {
    const editor = createMockEditor({
      shapes: [makePlannerWallShape("w1", 0, 0, 200, 0)],
    });
    const result = snapEditorPoint(editor, new Vec(105, 4));
    expect(result.snapped).toBe(true);
    expect(result.kind).toBe("wall-segment");
  });

  it("constrainToAngle snaps to 45-degree increments", () => {
    const origin = new Vec(0, 0);
    const raw = new Vec(100, 30);
    const constrained = constrainToAngle(origin, raw, 45);
    const angleDeg = (Math.atan2(constrained.y, constrained.x) * 180) / Math.PI;
    expect(angleDeg % 45).toBeCloseTo(0, 5);
    expect(constrained.dist(origin)).toBeCloseTo(raw.dist(origin), 5);
  });

  it("constrainToAngle returns point unchanged for tiny moves", () => {
    const origin = new Vec(0, 0);
    const raw = new Vec(0.5, 0.2);
    expect(constrainToAngle(origin, raw)).toEqual(raw);
  });

  it("snapWallEndpoint applies shift-key angle constraint", () => {
    const editor = createMockEditor({
      shapes: [makePlannerWallShape("w1", 500, 500, 700, 500)],
    });
    const origin = new Vec(0, 0);
    const rawEnd = new Vec(100, 40);
    const result = snapWallEndpoint(editor, origin, rawEnd, true);
    expect(result.snapped).toBe(true);
    const angle = Math.atan2(result.point.y - origin.y, result.point.x - origin.x);
    expect((angle * 180) / Math.PI % 45).toBeCloseTo(0, 5);
  });

  it("snapWallEndpoint uses grid snap without shift", () => {
    const editor = createMockEditor();
    const origin = new Vec(0, 0);
    const rawEnd = new Vec(23, 17);
    const result = snapWallEndpoint(editor, origin, rawEnd, false);
    expect(result.snapped).toBe(true);
  });

  it("snapWallEndpoint returns angle-constraint when shift held and nothing snaps", () => {
    const findSnapSpy = vi.spyOn(SnapManager.prototype, "findSnap").mockReturnValue({
      snapped: false,
      point: { x: 0, y: 0 },
      distance: 0,
    });
    const editor = createMockEditor();
    const origin = new Vec(0, 0);
    const rawEnd = new Vec(100, 40);
    const result = snapWallEndpoint(editor, origin, rawEnd, true);
    expect(result.kind).toBe("angle-constraint");
    expect(result.snapped).toBe(true);
    findSnapSpy.mockRestore();
  });

  it("snapWallEndpoint prefers angle-constraint when wall snap is far from shift direction", () => {
    const findSnapSpy = vi.spyOn(SnapManager.prototype, "findSnap").mockReturnValue({
      snapped: true,
      point: { x: 100, y: 0 },
      distance: 5,
    });
    const editor = createMockEditor({
      shapes: [makePlannerWallShape("w1", 0, 0, 500, 0)],
    });
    const origin = new Vec(0, 0);
    const rawEnd = new Vec(55, 50);
    const result = snapWallEndpoint(editor, origin, rawEnd, true);
    expect(result.kind).toBe("angle-constraint");
    findSnapSpy.mockRestore();
  });
});