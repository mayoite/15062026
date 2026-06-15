import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/planner/store/plannerStore", () => ({
  usePlannerStore: { getState: () => ({ snapDistance: 12 }) },
}));

import { snapFurnitureAgainstWall, snapFurnitureAtPoint } from "@/features/planner/tldraw/tools/furnitureWallSnap";
import { createMockEditor, makePlannerWallShape } from "./planner-tldraw-mockEditor";
import type { PlannerFurnitureTLShape } from "@/features/planner/tldraw/shapes/tldrawShapeTypes";

describe("furnitureWallSnap", () => {
  let editor: ReturnType<typeof createMockEditor>;

  beforeEach(() => {
    editor = createMockEditor({
      shapes: [makePlannerWallShape("w1", 0, 0, 400, 0)],
    });
  });

  it("snaps furniture flush to a nearby wall and aligns rotation", () => {
    const shape = {
      id: "f1",
      type: "planner-furniture",
      x: 150,
      y: 12,
      rotation: 0,
      props: {
        widthMm: 120,
        heightMm: 60,
        isAgainstWall: false,
      },
    } as PlannerFurnitureTLShape;

    const snap = snapFurnitureAgainstWall(editor, shape);
    expect(snap).not.toBeNull();
    expect(snap?.snapped).toBe(true);
    expect(snap?.wallId).toBe("w1");
    expect(snap?.rotation).toBeCloseTo(0, 2);
    expect(snap!.y).toBeLessThan(shape.y);
  });

  it("returns null when furniture is far from walls", () => {
    const shape = {
      id: "f2",
      type: "planner-furniture",
      x: 150,
      y: 180,
      rotation: 0,
      props: {
        widthMm: 120,
        heightMm: 60,
        isAgainstWall: false,
      },
    } as PlannerFurnitureTLShape;

    expect(snapFurnitureAgainstWall(editor, shape)).toBeNull();
  });

  it("snapFurnitureAtPoint aligns placement probes to walls", () => {
    const snap = snapFurnitureAtPoint(editor, { x: 150, y: 12 }, { widthMm: 120, heightMm: 60 });
    expect(snap?.snapped).toBe(true);
    expect(snap?.wallId).toBe("w1");
  });
});