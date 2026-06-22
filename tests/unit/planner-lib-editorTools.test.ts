import { createShapeId, type Editor } from "@/features/planner/shared/types/legacyEditorStub";
import { describe, expect, it, vi } from "vitest";

import {
  alignPlannerSelection,
  configureBasicShapeTool,
  configureWallTool,
  createPlannerDoorOpening,
  createPlannerWallSegment,
  distributePlannerSelection,
  readPlannerSelectionDimensions,
  resolvePlannerWallJoins,
  updatePlannerSelectionDimensions,
  type PlannerSelectionDimensions,
} from "@/features/planner/lib/editorTools";

type TestShape = {
  id: ReturnType<typeof createShapeId>;
  type: string;
  meta?: unknown;
  props: Record<string, unknown>;
};

function createEditor(shape: TestShape) {
  let currentShape = shape;
  const updateShapes = vi.fn((updates: Array<{ props?: Record<string, unknown> }>) => {
    const nextShape = updates[0];
    currentShape = {
      ...currentShape,
      ...nextShape,
      props: {
        ...currentShape.props,
        ...(nextShape?.props ?? {}),
      },
    };
  });

  const editor = {
    getShape: vi.fn((shapeId) => (shapeId === currentShape.id ? currentShape : null)),
    updateShapes,
  } as unknown as Editor;

  return {
    editor,
    updateShapes,
    getShape: () => currentShape,
  };
}

describe("planner editor tools", () => {
  it("returns null for room dimensions, missing shapes, and invalid selections", () => {
    const roomDimId = createShapeId("room-dim");
    const { editor } = createEditor({
      id: roomDimId,
      type: "line",
      meta: { isRoomDimension: true, text: "Room width" },
      props: {
        points: {
          a1: { id: "a1", index: "a1", x: 0, y: 0 },
          a2: { id: "a2", index: "a2", x: 100, y: 0 },
        },
      },
    });

    expect(readPlannerSelectionDimensions(editor, [roomDimId])).toBeNull();
    expect(readPlannerSelectionDimensions(editor, [])).toBeNull();
    expect(readPlannerSelectionDimensions(editor, [roomDimId, createShapeId("other")])).toBeNull();
  });

  it("ignores multi-point wall chains when reading editable dimensions", () => {
    const roomBoundaryId = createShapeId("room-boundary");
    const { editor } = createEditor({
      id: roomBoundaryId,
      type: "line",
      meta: { text: "Focus Room", isRoomShell: true, structureType: "room-shell" },
      props: {
        points: {
          a1: { id: "a1", index: "a1", x: 0, y: 0 },
          a2: { id: "a2", index: "a2", x: 360, y: 0 },
          a3: { id: "a3", index: "a3", x: 360, y: 300 },
          a4: { id: "a4", index: "a4", x: 0, y: 300 },
          a5: { id: "a5", index: "a5", x: 0, y: 0 },
        },
      },
    });

    expect(readPlannerSelectionDimensions(editor, [roomBoundaryId])).toBeNull();
  });

  it("updates two-point wall lengths in canonical millimeters", () => {
    const wallId = createShapeId("wall-1");
    const { editor, updateShapes } = createEditor({
      id: wallId,
      type: "line",
      meta: { text: "Wall Segment", structureType: "wall-segment" },
      props: {
        points: {
          a1: { id: "a1", index: "a1", x: 0, y: 0 },
          a2: { id: "a2", index: "a2", x: 240, y: 0 },
        },
      },
    });

    const selection = readPlannerSelectionDimensions(editor, [wallId]);

    expect(selection).toEqual({
      shapeId: wallId,
      shapeName: "Wall Segment",
      mode: "line",
      widthMm: 2400,
      heightMm: null,
    } satisfies PlannerSelectionDimensions);

    const didUpdate = updatePlannerSelectionDimensions(editor, selection as PlannerSelectionDimensions, {
      widthMm: 3000,
    });

    expect(didUpdate).toBe(true);
    expect(updateShapes).toHaveBeenCalledTimes(1);
    expect((updateShapes.mock.calls[0]?.[0]?.[0] as { props: { points: Record<string, { x: number }> } }).props.points.a2.x).toBe(300);

    const verticalWallId = createShapeId("wall-vertical");
    const vertical = createEditor({
      id: verticalWallId,
      type: "line",
      meta: { structureType: "wall-segment" },
      props: {
        points: {
          a1: { id: "a1", index: "a1", x: 0, y: 0 },
          a2: { id: "a2", index: "a2", x: 0, y: 200 },
        },
      },
    });
    const verticalSelection = readPlannerSelectionDimensions(vertical.editor, [verticalWallId]);
    updatePlannerSelectionDimensions(vertical.editor, verticalSelection as PlannerSelectionDimensions, { widthMm: 3000 });
    expect(vertical.getShape().props.points.a2.y).toBe(300);
  });

  it("reads and updates geo box dimensions", () => {
    const deskId = createShapeId("desk-2");
    const { editor, updateShapes, getShape } = createEditor({
      id: deskId,
      type: "geo",
      meta: { text: "Storage" },
      props: { w: 120, h: 80 },
    });

    expect(readPlannerSelectionDimensions(editor, [deskId])).toEqual({
      shapeId: deskId,
      shapeName: "Storage",
      mode: "box",
      widthMm: 1200,
      heightMm: 800,
    });

    const didUpdate = updatePlannerSelectionDimensions(
      editor,
      {
        shapeId: deskId,
        shapeName: "Storage",
        mode: "box",
        widthMm: 1200,
        heightMm: 800,
      },
      { heightMm: 900 },
    );

    expect(didUpdate).toBe(true);
    expect(updateShapes).toHaveBeenCalled();
    expect(getShape().props.h).toBe(90);
  });

  it("rejects invalid box dimension updates", () => {
    const deskId = createShapeId("desk-1");
    const { editor, updateShapes, getShape } = createEditor({
      id: deskId,
      type: "geo",
      meta: { text: "Desk" },
      props: {
        w: 120,
        h: 80,
      },
    });

    const didUpdate = updatePlannerSelectionDimensions(
      editor,
      {
        shapeId: deskId,
        shapeName: "Desk",
        mode: "box",
        widthMm: 1200,
        heightMm: 800,
      },
      { widthMm: -10, heightMm: 900 },
    );

    expect(didUpdate).toBe(false);
    expect(updateShapes).not.toHaveBeenCalled();
    expect(getShape().props).toEqual({ w: 120, h: 80 });
  });

  it("configures tools and creates default structural shapes", () => {
    const setCurrentTool = vi.fn();
    const setStyleForNextShapes = vi.fn();
    const createShape = vi.fn();
    const select = vi.fn();
    const editor = {
      setCurrentTool,
      setStyleForNextShapes,
      createShape,
      select,
      getViewportPageBounds: () => ({ center: { x: 400, y: 300 } }),
    } as unknown as Editor;

    configureWallTool(editor);
    configureBasicShapeTool(editor);
    createPlannerWallSegment(editor);
    createPlannerDoorOpening(editor);

    expect(setCurrentTool).toHaveBeenCalledWith("line");
    expect(setCurrentTool).toHaveBeenCalledWith("geo");
    expect(createShape).toHaveBeenCalledTimes(2);
    expect(select).toHaveBeenCalledTimes(2);
  });

  it("snaps wall endpoints and aligns or distributes selections", () => {
    const wallA = createShapeId("wall-a");
    const wallB = createShapeId("wall-b");
    const deskA = createShapeId("desk-a");
    const deskB = createShapeId("desk-b");
    const deskC = createShapeId("desk-c");
    const updateShapes = vi.fn();
    const alignShapes = vi.fn();
    const distributeShapes = vi.fn();

    const shapes = [
      {
        id: wallA,
        type: "line",
        x: 0,
        y: 0,
        meta: { structureType: "wall-segment" },
        props: {
          points: {
            a1: { id: "a1", index: "a1", x: 0, y: 0 },
            a2: { id: "a2", index: "a2", x: 100, y: 0 },
          },
        },
      },
      {
        id: wallB,
        type: "line",
        x: 100,
        y: 0,
        meta: { structureType: "wall-segment" },
        props: {
          points: {
            b1: { id: "b1", index: "b1", x: 0, y: 0 },
            b2: { id: "b2", index: "b2", x: 100, y: 0 },
          },
        },
      },
    ];

    const editor = {
      getCurrentPageShapes: vi.fn(() => shapes),
      updateShapes,
      alignShapes,
      distributeShapes,
    } as unknown as Editor;

    resolvePlannerWallJoins(editor, [wallB]);
    expect(updateShapes).toHaveBeenCalled();

    alignPlannerSelection(editor, [deskA, deskB], "left");
    distributePlannerSelection(editor, [deskA, deskB], "horizontal");
    distributePlannerSelection(editor, [deskA, deskB, deskC], "horizontal");

    expect(alignShapes).toHaveBeenCalledWith([deskA, deskB], "left");
    expect(distributeShapes).toHaveBeenCalledWith([deskA, deskB, deskC], "horizontal");
  });
});

