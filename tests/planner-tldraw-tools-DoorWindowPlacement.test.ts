import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tldraw/editor", async () => {
  const { createTldrawEditorModule } = await import("./planner-tldraw-mockEditor");
  return createTldrawEditorModule();
});

vi.mock("@/features/planner/store/plannerStore", () => ({
  usePlannerStore: { getState: () => ({ snapDistance: 10 }) },
}));

import { Vec } from "@tldraw/editor";
import { DoorWindowPlacementUtils } from "@/features/planner/tldraw/tools/DoorWindowPlacementTool";
import { createMockEditor, makePlannerWallShape } from "./planner-tldraw-mockEditor";

describe("DoorWindowPlacementUtils", () => {
  let editor: ReturnType<typeof createMockEditor>;

  beforeEach(() => {
    editor = createMockEditor({
      shapes: [makePlannerWallShape("w1", 0, 0, 400, 0)],
    });
  });

  it("getConfigs returns standard door and window presets", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    const configs = utils.getConfigs();
    expect(configs.some((c) => c.type === "door")).toBe(true);
    expect(configs.some((c) => c.type === "window")).toBe(true);
  });

  it("getConfig returns preset by key", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    expect(utils.getConfig("door-single-900")?.widthMm).toBe(900);
    expect(utils.getConfig("missing")).toBeUndefined();
  });

  it("startPlacement snaps door to wall", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    const placement = utils.startPlacement("door-single-900", new Vec(150, 4));
    expect(placement).not.toBeNull();
    expect((placement as { snappedWallId: string | null }).snappedWallId).toBe("w1");
    expect(editor.createShape).toHaveBeenCalled();
    expect(utils.isCurrentlyPlacing()).toBe(true);
  });

  it("startPlacement returns null for unknown config", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    expect(utils.startPlacement("unknown", new Vec(0, 0))).toBeNull();
  });

  it("updatePlacement re-snaps along wall", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    utils.startPlacement("window-single-600", new Vec(100, 3));
    const updated = utils.updatePlacement(new Vec(250, 2));
    expect(updated).not.toBeNull();
    expect(editor.updateShape).toHaveBeenCalled();
  });

  it("updatePlacement clears snap when off wall", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    utils.setOptions({ snapToWalls: true });
    utils.startPlacement("door-single-900", new Vec(100, 0));
    const updated = utils.updatePlacement(new Vec(100, 200)) as {
      snappedWallId: string | null;
      rotation: number;
    };
    expect(updated.snappedWallId).toBeNull();
    expect(updated.rotation).toBe(0);
  });

  it("finishPlacement creates door shape on wall", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    utils.startPlacement("door-single-900", new Vec(120, 2));
    const result = utils.finishPlacement();
    expect(result).not.toBeNull();
    expect(editor.createShape.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(utils.isCurrentlyPlacing()).toBe(false);
  });

  it("finishPlacement creates window shape", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    utils.startPlacement("window-double-1200", new Vec(200, 1));
    utils.finishPlacement();
    const lastCreate = editor._created.at(-1) as { type: string };
    expect(lastCreate.type).toBe("planner-window");
  });

  it("cancelPlacement removes preview", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    utils.startPlacement("door-single-800", new Vec(80, 0));
    utils.cancelPlacement();
    expect(utils.isCurrentlyPlacing()).toBe(false);
    expect(editor.deleteShape).toHaveBeenCalled();
  });

  it("changeDirection updates door swing", () => {
    editor._shapes.push({
      id: "d1",
      type: "planner-door",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: { swingDirection: "left", doorType: "single" },
    } as never);

    const utils = new DoorWindowPlacementUtils(editor);
    utils.changeDirection("d1", "right");
    expect(editor.updateShape).toHaveBeenCalled();
  });

  it("rotateShape and deleteShape work", () => {
    editor._shapes.push({
      id: "d1",
      type: "planner-door",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {},
    } as never);

    const utils = new DoorWindowPlacementUtils(editor);
    utils.rotateShape("d1", 0.5);
    utils.deleteShape("d1");
    expect(editor.updateShape).toHaveBeenCalled();
    expect(editor.deleteShape).toHaveBeenCalledWith("d1");
  });

  it("getDoorWindowShapes and getShapesOnWall filter attachments", () => {
    editor._shapes.push(
      {
        id: "d1",
        type: "planner-door",
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        props: { wallId: "w1" },
      } as never,
      {
        id: "win1",
        type: "planner-window",
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        props: { wallId: "w2" },
      } as never,
    );

    const utils = new DoorWindowPlacementUtils(editor);
    expect(utils.getDoorWindowShapes()).toHaveLength(2);
    expect(utils.getShapesOnWall("w1")).toHaveLength(1);
  });

  it("setOptions disables preview", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    utils.setOptions({ showPreview: false });
    utils.startPlacement("door-single-900", new Vec(50, 0));
    expect(editor.createShape).not.toHaveBeenCalled();
    expect(utils.getCurrentPreview()).not.toBeNull();
  });

  it("finishPlacement off-wall creates unattached opening", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    utils.setOptions({ snapToWalls: false, autoRotate: false });
    utils.startPlacement("door-single-900", new Vec(50, 200));
    const result = utils.finishPlacement() as { snappedWallId: string | null };
    expect(result.snappedWallId).toBeNull();
    expect(utils.getOptions().snapToWalls).toBe(false);
  });

  it("changeDirection and rotateShape no-op for missing or window shapes", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    utils.changeDirection("missing", "right");
    utils.changeDirection("win1", "right");
    utils.rotateShape("missing", 0.5);
    expect(editor.updateShape).not.toHaveBeenCalled();
  });

  it("startPlacement supports sliding door and double door configs", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    const sliding = utils.startPlacement("door-sliding-1000", new Vec(120, 2));
    expect((sliding as { config: { doorType: string } }).config.doorType).toBe("sliding");
    utils.finishPlacement();

    const window = utils.startPlacement("window-sliding-1800", new Vec(180, 1));
    expect((window as { config: { windowType: string } }).config.windowType).toBe("sliding");
    utils.finishPlacement();
    expect(editor.createShape.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("cancelPlacement without preview still clears state", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    utils.setOptions({ showPreview: false });
    utils.startPlacement("window-single-600", new Vec(100, 0));
    utils.cancelPlacement();
    expect(utils.isCurrentlyPlacing()).toBe(false);
  });

  it("finishPlacement creates double door with both swing direction", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    utils.startPlacement("door-double-1200", new Vec(180, 2));
    utils.finishPlacement();
    const created = editor._created.at(-1) as { props: { doorType: string; swingDirection: string } };
    expect(created.props.doorType).toBe("double");
    expect(created.props.swingDirection).toBe("both");
  });

  it("updatePlacement returns null when not placing", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    expect(utils.updatePlacement(new Vec(0, 0))).toBeNull();
  });

  it("finishPlacement returns null when not placing", () => {
    const utils = new DoorWindowPlacementUtils(editor);
    expect(utils.finishPlacement()).toBeNull();
  });

  it("getShapesOnWall ignores shapes without matching wall id", () => {
    editor._shapes.push({
      id: "d-other",
      type: "planner-door",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: { wallId: "other-wall" },
    } as never);
    const utils = new DoorWindowPlacementUtils(editor);
    expect(utils.getShapesOnWall("w1")).toHaveLength(0);
  });

  it("blocks placement when an opening overlaps an existing door on the wall", () => {
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

    const utils = new DoorWindowPlacementUtils(editor);
    const placement = utils.startPlacement("door-single-900", new Vec(120, 2)) as {
      placementBlocked: boolean;
    };
    expect(placement.placementBlocked).toBe(true);
    expect(utils.isPlacementBlocked()).toBe(true);
    expect(utils.finishPlacement()).toBeNull();
  });

  it("startPlacement tolerates degenerate zero-length wall", () => {
    editor = createMockEditor({
      shapes: [makePlannerWallShape("zero", 50, 50, 0, 0)],
    });
    const utils = new DoorWindowPlacementUtils(editor);
    const placement = utils.startPlacement("door-single-900", new Vec(50, 60));
    expect(placement).not.toBeNull();
  });
});