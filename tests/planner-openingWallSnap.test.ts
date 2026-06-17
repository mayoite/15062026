import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/planner/store/plannerStore", () => ({
  usePlannerStore: { getState: () => ({ snapDistance: 12 }) },
}));

import { resolveOpeningWallSnap } from "@/features/planner/tldraw/tools/openingWallSnap";
import { createMockEditor, makePlannerWallShape } from "./planner-tldraw-mockEditor";
import type { PlannerDoorTLShape, PlannerWindowTLShape } from "@/features/planner/tldraw/shapes/tldrawShapeTypes";

describe("openingWallSnap", () => {
  let editor: ReturnType<typeof createMockEditor>;

  beforeEach(() => {
    editor = createMockEditor({
      shapes: [makePlannerWallShape("w1", 0, 0, 400, 0)],
    });
  });

  it("snaps a door to the wall axis", () => {
    const door = {
      id: "d1",
      type: "planner-door",
      x: 102,
      y: -2,
      rotation: 0,
      props: {
        widthMm: 900,
        thicknessMm: 40,
        wallId: "",
        wallPosition: 0.5,
        isAttached: false,
      },
    } as PlannerDoorTLShape;

    const snap = resolveOpeningWallSnap(editor, door);
    expect(snap?.wallId).toBe("w1");
    expect(snap?.blocked).toBe(false);
  });

  it("flags overlap when another opening occupies the same span", () => {
    editor._shapes.push({
      id: "d-existing",
      type: "planner-door",
      x: 102,
      y: -2,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        widthMm: 900,
        thicknessMm: 40,
        wallId: "w1",
      },
    } as never);

    const door = {
      id: "d-new",
      type: "planner-door",
      x: 110,
      y: -2,
      rotation: 0,
      props: {
        widthMm: 900,
        thicknessMm: 40,
        wallId: "",
        wallPosition: 0.5,
        isAttached: false,
      },
    } as PlannerDoorTLShape;

    const snap = resolveOpeningWallSnap(editor, door);
    expect(snap?.blocked).toBe(true);
    expect(snap?.blockReason).toBe("overlap");
  });

  it("flags overlap when a window lands on an existing door span", () => {
    editor._shapes.push({
      id: "d-existing",
      type: "planner-door",
      x: 102,
      y: -2,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        widthMm: 900,
        thicknessMm: 40,
        wallId: "w1",
      },
    } as never);

    const windowShape = {
      id: "w-new",
      type: "planner-window",
      x: 85,
      y: -5,
      rotation: 0,
      props: {
        widthMm: 1200,
        frameThicknessMm: 50,
        wallId: "",
        wallPosition: 0.5,
        isAttached: false,
      },
    } as PlannerWindowTLShape;

    const snap = resolveOpeningWallSnap(editor, windowShape);
    expect(snap?.blocked).toBe(true);
    expect(snap?.blockReason).toBe("overlap");
  });

  it("ignores the current opening when re-snapping an attached door", () => {
    editor._shapes.push({
      id: "d-existing",
      type: "planner-door",
      x: 102,
      y: -2,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        widthMm: 900,
        thicknessMm: 40,
        wallId: "w1",
        wallPosition: 0.3,
      },
    } as never);

    const movedDoor = {
      id: "d-existing",
      type: "planner-door",
      x: 104,
      y: -2,
      rotation: 0,
      props: {
        widthMm: 900,
        thicknessMm: 40,
        wallId: "w1",
        wallPosition: 0.31,
        isAttached: true,
      },
    } as PlannerDoorTLShape;

    const snap = resolveOpeningWallSnap(editor, movedDoor, "d-existing");
    expect(snap?.wallId).toBe("w1");
    expect(snap?.blocked).toBe(false);
  });
});
