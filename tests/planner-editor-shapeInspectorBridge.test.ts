import { describe, expect, it, vi } from "vitest";

vi.mock("@tldraw/editor", async () => {
  const { createTldrawEditorModule } = await import("./planner-tldraw-mockEditor");
  return createTldrawEditorModule();
});

import {
  applyInspectorChanges,
  deleteInspectorShape,
  duplicateInspectorShape,
  shapeToInspectorData,
  syncSelectionFromEditor,
} from "@/features/planner/editor/shapeInspectorBridge";
import { createPlannerEditorMock, makeShape } from "./planner-editor-mockEditor";

describe("shapeInspectorBridge", () => {
  it("maps supported shapes to inspector data", () => {
    const furniture = makeShape("shape:f1", "planner-furniture", {
      productName: "Desk",
      widthMm: 1200,
      heightMm: 600,
      catalogId: "ws-linear-120",
      teamName: "Alpha",
    });
    expect(shapeToInspectorData(furniture)).toMatchObject({
      label: "Desk",
      widthMm: 1200,
      teamName: "Alpha",
    });

    const zone = makeShape("shape:z1", "planner-zone", {
      label: "Focus",
      widthMm: 120,
      heightMm: 80,
      zoneType: "quiet",
    });
    expect(shapeToInspectorData(zone)).toMatchObject({
      type: "zone",
      zoneType: "quiet",
    });

    const wall = makeShape("shape:w1", "planner-wall", {
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      thickness: 10,
      label: "North wall",
    });
    expect(shapeToInspectorData(wall)?.type).toBe("wall");

    const door = makeShape("shape:d1", "planner-door", {
      label: "Entry",
      widthMm: 900,
      heightMm: 40,
    });
    expect(shapeToInspectorData(door)?.label).toBe("Entry");

    expect(shapeToInspectorData(makeShape("shape:x", "planner-measurement"))).toBeNull();
  });

  it("syncs single selection into inspector state", () => {
    const setSelected = vi.fn();
    const shape = makeShape("shape:1", "planner-furniture", {
      productName: "Chair",
      widthMm: 500,
      heightMm: 500,
    });
    const editor = createPlannerEditorMock({
      shapes: [shape],
      selectedIds: ["shape:1" as never],
    });

    syncSelectionFromEditor(editor, setSelected);
    expect(setSelected).toHaveBeenCalledWith(expect.objectContaining({ label: "Chair" }));

    editor.getSelectedShapeIds = vi.fn(() => ["a", "b"] as never);
    syncSelectionFromEditor(editor, setSelected);
    expect(setSelected).toHaveBeenLastCalledWith(null);
  });

  it("applies inspector changes for furniture, room, zone, and wall shapes", () => {
    const furniture = makeShape("shape:f1", "planner-furniture", {
      productName: "Desk",
      widthMm: 1200,
      heightMm: 600,
    });
    const room = makeShape("shape:r1", "planner-room", {
      label: "Office",
      widthMm: 120,
      heightMm: 80,
      points: [],
    });
    const zone = makeShape("shape:z1", "planner-zone", {
      label: "Focus",
      widthMm: 120,
      heightMm: 80,
      points: [],
    });
    const wall = makeShape("shape:w1", "planner-wall", {
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      thickness: 10,
    });

    const editor = createPlannerEditorMock({ shapes: [furniture, room, zone, wall] });

    applyInspectorChanges(editor, "shape:f1", {
      label: "Renamed desk",
      seatCount: 6,
      teamName: "Ops",
      widthMm: 1400,
      heightMm: 700,
      rotation: 1,
      isLocked: true,
    });
    expect(editor.updateShape).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "shape:f1",
        isLocked: true,
        props: expect.objectContaining({
          productName: "Renamed desk",
          seatCount: 6,
          teamName: "Ops",
        }),
      }),
    );

    applyInspectorChanges(editor, "shape:z1", {
      zoneType: "social",
      widthMm: 2000,
      heightMm: 1000,
    });
    expect(editor.updateShape).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "shape:z1",
        props: expect.objectContaining({
          zoneType: "social",
          areaSqm: expect.any(Number),
        }),
      }),
    );

    applyInspectorChanges(editor, "shape:r1", { widthMm: 3000, heightMm: 2000 });
    expect(editor.updateShape).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "shape:r1",
        props: expect.objectContaining({
          perimeterMm: expect.any(Number),
          areaSqm: expect.any(Number),
        }),
      }),
    );

    applyInspectorChanges(editor, "shape:w1", { widthMm: 5000, heightMm: 200 });
    expect(editor.updateShape).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "shape:w1",
        props: expect.objectContaining({
          lengthMm: 5000,
          endX: expect.any(Number),
        }),
      }),
    );

    applyInspectorChanges(editor, "missing", { label: "noop" });
    expect(editor.updateShape).toHaveBeenCalledTimes(4);
  });

  it("deletes and duplicates inspector shapes", () => {
    const shape = makeShape("shape:1", "planner-furniture", { productName: "Desk" });
    const deleteEditor = createPlannerEditorMock({ shapes: [shape] });
    deleteInspectorShape(deleteEditor, "shape:1");
    expect(deleteEditor.deleteShape).toHaveBeenCalledWith("shape:1");

    const duplicateEditor = createPlannerEditorMock({
      shapes: [makeShape("shape:2", "planner-furniture", { productName: "Desk" }, { x: 0, y: 0 })],
    });
    duplicateInspectorShape(duplicateEditor, "shape:2");
    expect(duplicateEditor.createShape).toHaveBeenCalledWith(
      expect.objectContaining({
        x: 40,
        y: 40,
      }),
    );

    duplicateInspectorShape(duplicateEditor, "missing");
    expect(duplicateEditor.createShape).toHaveBeenCalledTimes(1);
  });
});