import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tldraw/editor", async () => {
  const { createTldrawEditorModule } = await import("./planner-tldraw-mockEditor");
  return createTldrawEditorModule();
});

vi.mock("@/features/planner/store/plannerStore", () => {
  const state = { activeCatalogId: null as string | null, tool: "door" as string };
  return {
    usePlannerStore: {
      getState: () => ({
        activeCatalogId: state.activeCatalogId,
        tool: state.tool,
        setActiveCatalogId: (id: string | null) => {
          state.activeCatalogId = id;
        },
      }),
    },
    __plannerStoreState: state,
  };
});

import { PlannerMeasurementTool } from "@/features/planner/tldraw/tools/PlannerMeasurementTool";
import { PlannerRoomTool } from "@/features/planner/tldraw/tools/PlannerRoomTool";
import { PlannerFurnitureTool } from "@/features/planner/tldraw/tools/PlannerFurnitureTool";
import { PlannerZoneTool } from "@/features/planner/tldraw/tools/PlannerZoneTool";
import { PlannerDoorWindowTool } from "@/features/planner/tldraw/tools/PlannerDoorWindowTool";
import { createMockEditor, makePlannerWallShape } from "./planner-tldraw-mockEditor";

describe("Planner StateNode tools", () => {
  let editor: ReturnType<typeof createMockEditor>;

  beforeEach(() => {
    editor = createMockEditor({
      shapes: [
        makePlannerWallShape("w1", 0, 0, 200, 0),
        makePlannerWallShape("w2", 200, 0, 0, 150),
        makePlannerWallShape("w3", 200, 150, -200, 0),
        makePlannerWallShape("w4", 0, 150, 0, -150),
      ],
    });
  });

  it("PlannerRoomTool auto-detects room and switches to select", () => {
    const tool = new PlannerRoomTool({ editor });
    tool.activate();
    tool.onPointerDown({});
    expect(editor.setCurrentTool).toHaveBeenCalledWith("select");
  });

  it("PlannerRoomTool enters drawing when no room detected", () => {
    editor = createMockEditor({ shapes: [makePlannerWallShape("w1", 0, 0, 50, 0)] });
    const tool = new PlannerRoomTool({ editor });
    tool.activate();
    editor._setPagePoint(10, 10);
    tool.onPointerDown({});
    editor._setPagePoint(120, 90);
    tool.onPointerMove();
    tool.onPointerUp();
    expect(editor.createShape).toHaveBeenCalled();
  });

  it("PlannerMeasurementTool draws dimension line", () => {
    const tool = new PlannerMeasurementTool({ editor });
    tool.activate();
    editor._setPagePoint(0, 0);
    tool.onPointerDown({});
    editor._setPagePoint(150, 0);
    tool.onPointerMove();
    tool.onPointerUp();
    expect(editor.createShape).toHaveBeenCalled();
    expect(editor.updateShape).toHaveBeenCalled();
  });

  it("PlannerFurnitureTool places a catalog item and keeps placement armed", async () => {
    const store = await import("@/features/planner/store/plannerStore") as {
      __plannerStoreState: { activeCatalogId: string | null };
    };
    store.__plannerStoreState.activeCatalogId = "ws-linear-120";

    const tool = new PlannerFurnitureTool({ editor });
    tool.activate();
    editor._setPagePoint(40, 40);
    tool.onPointerMove();
    tool.onPointerDown();
    expect(editor.createShape).toHaveBeenCalled();
    expect(editor.setCurrentTool).not.toHaveBeenCalledWith("select");
  });

  it("PlannerZoneTool draws zone polygon", () => {
    const tool = new PlannerZoneTool({ editor });
    tool.activate();
    editor._setPagePoint(0, 0);
    tool.onPointerDown({});
    editor._setPagePoint(100, 0);
    tool.onPointerMove();
    tool.onPointerDown({});
    editor._setPagePoint(100, 80);
    tool.onPointerMove();
    tool.onPointerDown({});
    editor._setPagePoint(0, 80);
    tool.onPointerMove();
    tool.onPointerUp();
    expect(editor.createShape).toHaveBeenCalled();
  });

  it("PlannerDoorWindowTool places door on wall", () => {
    const tool = new PlannerDoorWindowTool({ editor });
    tool.activate();
    editor._setPagePoint(120, 2);
    tool.onPointerDown({});
    expect(editor.createShape).toHaveBeenCalled();
  });

  it("PlannerDoorWindowTool places window and handles placing lifecycle", async () => {
    const store = (await import("@/features/planner/store/plannerStore")) as {
      __plannerStoreState: { tool: string };
    };
    store.__plannerStoreState.tool = "window";

    const tool = new PlannerDoorWindowTool({ editor });
    tool.activate();
    editor._setPagePoint(150, 2);
    tool.onPointerDown({});
    editor._setPagePoint(200, 2);
    tool.onPointerMove();
    tool.onPointerUp();
    expect(editor.createShape).toHaveBeenCalled();

    tool.activate();
    editor._setPagePoint(100, 2);
    tool.onPointerDown({});
    tool.onCancel();
    expect(editor.setCurrentTool).toHaveBeenCalledWith("select");
  });

  it("PlannerDoorWindowTool idle onCancel switches to select", () => {
    const tool = new PlannerDoorWindowTool({ editor });
    tool.activate();
    tool.onCancel();
    expect(editor.setCurrentTool).toHaveBeenCalledWith("select");
  });

  it("PlannerMeasurementTool uses shift orthogonal snap and cancels short measurement", () => {
    const tool = new PlannerMeasurementTool({ editor });
    tool.activate();
    editor._setPagePoint(0, 0);
    tool.onPointerDown({});
    editor._setShiftKey(true);
    editor._setPagePoint(80, 40);
    tool.onPointerMove();
    const updated = editor.updateShape.mock.calls.at(-1)?.[0] as { props: { endY: number } };
    expect(updated.props.endY).toBe(0);

    editor._setPagePoint(2, 1);
    tool.onPointerMove();
    tool.onPointerUp();
    expect(editor.deleteShape).toHaveBeenCalled();

    tool.activate();
    editor._setPagePoint(10, 10);
    tool.onPointerDown({});
    tool.onCancel();
    expect(editor.setCurrentTool).toHaveBeenCalledWith("select");
  });

  it("PlannerRoomTool onCancel switches to select", () => {
    const tool = new PlannerRoomTool({ editor });
    tool.activate();
    tool.onCancel();
    expect(editor.setCurrentTool).toHaveBeenCalledWith("select");
  });

  it("PlannerRoomTool drawing supports negative drag and default click size", () => {
    editor = createMockEditor({ shapes: [makePlannerWallShape("w1", 0, 0, 50, 0)] });
    const tool = new PlannerRoomTool({ editor });
    tool.activate();
    editor._setPagePoint(200, 200);
    tool.onPointerDown({});
    editor._setPagePoint(100, 120);
    tool.onPointerMove();
    tool.onPointerUp();
    expect(editor.updateShape).toHaveBeenCalled();
    expect(editor.setCurrentTool).toHaveBeenCalledWith("select");

    tool.activate();
    editor._setPagePoint(300, 300);
    tool.onPointerDown({});
    tool.onPointerUp();
    expect(editor.updateShape.mock.calls.length).toBeGreaterThan(1);
  });

  it("PlannerRoomTool drawing cancel deletes in-progress room", () => {
    editor = createMockEditor({ shapes: [] });
    const tool = new PlannerRoomTool({ editor });
    tool.activate();
    editor._setPagePoint(50, 50);
    tool.onPointerDown({});
    tool.onCancel();
    expect(editor.deleteShape).toHaveBeenCalled();
  });

  it("PlannerZoneTool deletes truly tiny zones and supports cancel paths", () => {
    const tool = new PlannerZoneTool({ editor });
    tool.activate();
    editor._setPagePoint(0, 0);
    tool.onPointerDown({});
    tool.onPointerUp();
    expect(editor.deleteShape).toHaveBeenCalled();

    tool.activate();
    editor._setPagePoint(10, 10);
    tool.onPointerDown({});
    tool.onCancel();
    expect(editor.setCurrentTool).toHaveBeenCalledWith("select");

    tool.activate();
    tool.onCancel();
    expect(editor.setCurrentTool).toHaveBeenCalledWith("select");
  });

  it("PlannerFurnitureTool falls back to the default catalog item when none is active", async () => {
    const store = (await import("@/features/planner/store/plannerStore")) as {
      __plannerStoreState: { activeCatalogId: string | null };
    };
    store.__plannerStoreState.activeCatalogId = null;

    const tool = new PlannerFurnitureTool({ editor });
    tool.activate();
    editor._setPagePoint(40, 40);
    tool.onPointerDown();
    expect(store.__plannerStoreState.activeCatalogId).toBeTruthy();
    expect(editor.createShape).toHaveBeenCalled();
  });
});
