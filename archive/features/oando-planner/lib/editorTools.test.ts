jest.mock("tldraw", () => ({
  createShapeId: (id?: string) => (id ?? "shape-id"),
}));

import { createShapeId, type Editor } from "tldraw";

import {
  readPlannerSelectionDimensions,
  updatePlannerSelectionDimensions,
  type PlannerSelectionDimensions,
} from "./editorTools";

type TestShape = {
  id: ReturnType<typeof createShapeId>;
  type: string;
  meta?: unknown;
  props: Record<string, unknown>;
};

function createEditor(shape: TestShape) {
  let currentShape = shape;
  const updateShapes = jest.fn(
    (updates: Array<{ props?: Record<string, unknown> }>) => {
      const nextShape = updates[0];
      currentShape = {
        ...currentShape,
        ...nextShape,
        props: {
          ...currentShape.props,
          ...(nextShape?.props ?? {}),
        },
      };
    },
  );

  const editor = {
    getShape: jest.fn((shapeId) =>
      shapeId === currentShape.id ? currentShape : null,
    ),
    updateShapes,
  } as unknown as Editor;

  return {
    editor,
    updateShapes,
    getShape: () => currentShape,
  };
}

describe("planner editor tools", () => {
  it("ignores multi-point wall chains when reading editable dimensions", () => {
    const roomBoundaryId = createShapeId("room-boundary");
    const { editor } = createEditor({
      id: roomBoundaryId,
      type: "line",
      meta: {
        text: "Focus Room",
        isRoomShell: true,
        structureType: "room-shell",
      },
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

    const didUpdate = updatePlannerSelectionDimensions(
      editor,
      selection as PlannerSelectionDimensions,
      {
        widthMm: 3000,
      },
    );

    expect(didUpdate).toBe(true);
    expect(updateShapes).toHaveBeenCalledTimes(1);
    expect(
      (
        updateShapes.mock.calls[0]?.[0]?.[0] as {
          props: { points: Record<string, { x: number }> };
        }
      ).props.points.a2.x,
    ).toBe(300);
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
});
