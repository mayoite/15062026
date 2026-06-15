import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tldraw/editor", async () => {
  const { createTldrawEditorModule } = await import("./planner-tldraw-mockEditor");
  return createTldrawEditorModule();
});

vi.mock("@/features/planner/store/plannerStore", () => ({
  usePlannerStore: { getState: () => ({ snapDistance: 10 }) },
}));

import { Vec } from "@tldraw/editor";
import {
  PlannerWallTool,
  WallDrawingUtils,
} from "@/features/planner/tldraw/tools/WallTool";
import { createMockEditor, makePlannerWallShape } from "./planner-tldraw-mockEditor";

describe("WallDrawingUtils", () => {
  let editor: ReturnType<typeof createMockEditor>;

  beforeEach(() => {
    editor = createMockEditor();
  });

  it("startDrawing enters drawing state", () => {
    const utils = new WallDrawingUtils(editor);
    utils.startDrawing(new Vec(10, 20));
    expect(utils.isCurrentlyDrawing()).toBe(true);
    expect(utils.getState().startPoint).toEqual(new Vec(10, 20));
  });

  it("updateDrawing snaps end point when snapping enabled", () => {
    const utils = new WallDrawingUtils(editor);
    utils.startDrawing(new Vec(0, 0));
    utils.updateDrawing(new Vec(13, 7));
    expect(utils.getState().endPoint!.x).toBe(10);
    expect(utils.getState().endPoint!.y).toBe(10);
  });

  it("finishDrawing creates wall for long enough segment", () => {
    const utils = new WallDrawingUtils(editor);
    utils.startDrawing(new Vec(0, 0));
    utils.updateDrawing(new Vec(200, 0));
    const result = utils.finishDrawing();
    expect(result).not.toBeNull();
    expect(editor.createShape).toHaveBeenCalled();
    expect(utils.isCurrentlyDrawing()).toBe(false);
  });

  it("finishDrawing returns null for very short walls", () => {
    const utils = new WallDrawingUtils(editor);
    utils.startDrawing(new Vec(0, 0));
    utils.updateDrawing(new Vec(2, 0));
    expect(utils.finishDrawing()).toBeNull();
  });

  it("cancelDrawing resets state", () => {
    const utils = new WallDrawingUtils(editor);
    utils.startDrawing(new Vec(0, 0));
    utils.cancelDrawing();
    expect(utils.isCurrentlyDrawing()).toBe(false);
  });

  it("setMaterial updates thickness for material", () => {
    const utils = new WallDrawingUtils(editor);
    utils.setMaterial("glass");
    expect(utils.getState().material).toBe("glass");
    expect(utils.getState().thickness).toBeLessThan(
      new WallDrawingUtils(editor).getState().thickness,
    );
  });

  it("toggleSnapping flips snap flag", () => {
    const utils = new WallDrawingUtils(editor);
    expect(utils.getState().snapEnabled).toBe(true);
    utils.toggleSnapping();
    expect(utils.getState().snapEnabled).toBe(false);
  });
});

describe("PlannerWallTool", () => {
  let editor: ReturnType<typeof createMockEditor>;

  beforeEach(() => {
    editor = createMockEditor({
      shapes: [makePlannerWallShape("existing", 0, 100, 0, 200)],
    });
  });

  it("draws a wall through pointer lifecycle", () => {
    const tool = new PlannerWallTool({ editor });
    tool.activate();
    editor._setPagePoint(50, 50);
    tool.onPointerDown({});
    editor._setPagePoint(250, 50);
    tool.onPointerMove();
    tool.onPointerUp();
    expect(editor.createShape).toHaveBeenCalled();
    expect(editor.updateShape).toHaveBeenCalled();
  });

  it("deletes tiny wall on pointer up", () => {
    const tool = new PlannerWallTool({ editor });
    tool.activate();
    editor._setPagePoint(10, 10);
    tool.onPointerDown({});
    editor._setPagePoint(11, 11);
    tool.onPointerMove();
    tool.onPointerUp();
    expect(editor.deleteShape).toHaveBeenCalled();
  });

  it("cancels drawing and switches to select", () => {
    const tool = new PlannerWallTool({ editor });
    tool.activate();
    editor._setPagePoint(0, 0);
    tool.onPointerDown({});
    tool.onCancel();
    expect(editor.setCurrentTool).toHaveBeenCalledWith("select");
  });

  it("detects wall junctions when snapping to existing endpoints", () => {
    const tool = new PlannerWallTool({ editor });
    tool.activate();
    editor._setPagePoint(0, 100);
    tool.onPointerDown({});
    editor._setPagePoint(200, 100);
    tool.onPointerMove();
    tool.onPointerUp();
    expect(editor.createShape).toHaveBeenCalled();
    const junctionUpdate = editor.updateShape.mock.calls.find(
      (call) => (call[0] as { props?: { hasJunctionStart?: boolean } }).props?.hasJunctionStart !== undefined,
    );
    expect(junctionUpdate).toBeTruthy();
  });

  it("uses angle constraint when shift is held", () => {
    const tool = new PlannerWallTool({ editor });
    tool.activate();
    editor._setPagePoint(0, 0);
    tool.onPointerDown({});
    editor._setShiftKey(true);
    editor._setPagePoint(100, 30);
    tool.onPointerMove();
    const lastUpdate = editor._updated.at(-1) as { props?: { endX: number; endY: number } };
    const angle = Math.atan2(lastUpdate.props!.endY, lastUpdate.props!.endX);
    expect((angle * 180) / Math.PI % 45).toBeCloseTo(0, 5);
  });

  it("detects T-junction when wall ends on another wall interior", () => {
    editor = createMockEditor({
      shapes: [makePlannerWallShape("vertical", 0, 0, 0, 200)],
    });
    const tool = new PlannerWallTool({ editor });
    tool.activate();
    editor._setPagePoint(80, 100);
    tool.onPointerDown({});
    editor._setPagePoint(0, 100);
    tool.onPointerMove();
    tool.onPointerUp();
    const junctionUpdate = editor.updateShape.mock.calls.find(
      (call) => (call[0] as { props?: { junctionTypeEnd?: string } }).props?.junctionTypeEnd === "T",
    );
    expect(junctionUpdate).toBeTruthy();
  });

  it("detects cross junction when endpoint meets interior of another wall", () => {
    editor = createMockEditor({
      shapes: [
        makePlannerWallShape("horizontal", 0, 100, 200, 0),
        makePlannerWallShape("vertical", 0, 0, 0, 300),
      ],
    });
    const tool = new PlannerWallTool({ editor });
    tool.activate();
    editor._setPagePoint(80, 50);
    tool.onPointerDown({});
    editor._setPagePoint(0, 100);
    tool.onPointerMove();
    tool.onPointerUp();
    const junctionUpdate = editor.updateShape.mock.calls.find(
      (call) => (call[0] as { props?: { junctionTypeEnd?: string } }).props?.junctionTypeEnd === "cross",
    );
    expect(junctionUpdate).toBeTruthy();
  });
});