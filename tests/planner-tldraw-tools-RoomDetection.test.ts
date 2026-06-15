import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tldraw/editor", async () => {
  const { createTldrawEditorModule } = await import("./planner-tldraw-mockEditor");
  return createTldrawEditorModule();
});

import { Box, Vec } from "@tldraw/editor";
import { RoomDetectionUtils } from "@/features/planner/tldraw/tools/RoomDetectionTool";
import { createMockEditor, makePlannerWallShape } from "./planner-tldraw-mockEditor";

/** Closed rectangular room from four walls. */
function rectangularRoomWalls(width = 200, height = 150, ox = 0, oy = 0) {
  return [
    makePlannerWallShape(`w-top-${ox}-${oy}`, ox, oy, width, 0),
    makePlannerWallShape(`w-right-${ox}-${oy}`, ox + width, oy, 0, height),
    makePlannerWallShape(`w-bottom-${ox}-${oy}`, ox + width, oy + height, -width, 0),
    makePlannerWallShape(`w-left-${ox}-${oy}`, ox, oy + height, 0, -height),
  ];
}

describe("RoomDetectionUtils", () => {
  let editor: ReturnType<typeof createMockEditor>;

  beforeEach(() => {
    editor = createMockEditor({ shapes: rectangularRoomWalls() });
  });

  it("detectAllRooms returns empty when fewer than 3 walls", () => {
    editor = createMockEditor({ shapes: [makePlannerWallShape("w1", 0, 0, 100, 0)] });
    const utils = new RoomDetectionUtils(editor);
    expect(utils.detectAllRooms()).toHaveLength(0);
  });

  it("detectAllRooms finds enclosed room and creates label", () => {
    const utils = new RoomDetectionUtils(editor);
    const rooms = utils.detectAllRooms();
    expect(rooms.length).toBeGreaterThanOrEqual(1);
    expect(rooms[0].area).toBeGreaterThan(0);
    expect(rooms[0].name).toBeTruthy();
    expect(editor.createShape).toHaveBeenCalled();
  });

  it("respects minArea option", () => {
    const utils = new RoomDetectionUtils(editor);
    utils.setOptions({ minArea: 9999 });
    expect(utils.detectAllRooms()).toHaveLength(0);
  });

  it("skips duplicate room labels near existing planner-room", () => {
    editor._shapes.push({
      id: "room-existing",
      type: "planner-room",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: { widthMm: 200, heightMm: 150, label: "Existing" },
    } as never);

    const utils = new RoomDetectionUtils(editor);
    const createCallsBefore = editor.createShape.mock.calls.length;
    utils.detectAllRooms();
    // Should not create another room label at same center
    expect(editor.createShape.mock.calls.length).toBe(createCallsBefore);
  });

  it("labelArea creates room shape from bounding box", () => {
    const utils = new RoomDetectionUtils(editor);
    utils.labelArea(new Box(0, 0, 300, 200), "Lobby");
    expect(editor.createShape).toHaveBeenCalled();
    const created = editor._created.at(-1) as { props: { label: string } };
    expect(created.props.label).toBe("Lobby");
  });

  it("updateRoomLabel updates existing room", () => {
    editor._shapes.push({
      id: "room-1",
      type: "planner-room",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: { label: "Old" },
    } as never);

    const utils = new RoomDetectionUtils(editor);
    utils.updateRoomLabel("room-1", "Conference");
    expect(editor.updateShape).toHaveBeenCalledWith(
      expect.objectContaining({ props: { label: "Conference" } }),
    );
  });

  it("getOptions returns copy of options", () => {
    const utils = new RoomDetectionUtils(editor);
    utils.setOptions({ labelFormat: "name", autoLabel: false });
    const opts = utils.getOptions();
    expect(opts.labelFormat).toBe("name");
    expect(opts.autoLabel).toBe(false);
  });

  it("generates room names by area thresholds", () => {
    const utils = new RoomDetectionUtils(editor);
    utils.setOptions({ minArea: 0.01 });
    const rooms = utils.detectAllRooms();
    if (rooms.length > 0) {
      expect(["Closet", "Meeting Room", "Office", "Conference Room", "Lobby", "Cafeteria"]).toContain(
        rooms[0].name,
      );
    }
  });

  it("updateRoomLabel no-ops for missing or non-room shapes", () => {
    const utils = new RoomDetectionUtils(editor);
    const callsBefore = editor.updateShape.mock.calls.length;
    utils.updateRoomLabel("missing", "Name");
    expect(editor.updateShape.mock.calls.length).toBe(callsBefore);
  });

  it("calculateCenterPoint via detected room bounding box", () => {
    const utils = new RoomDetectionUtils(editor);
    const rooms = utils.detectAllRooms();
    if (rooms.length > 0) {
      expect(rooms[0].centerPoint).toBeInstanceOf(Vec);
      expect(rooms[0].boundingBox).toBeInstanceOf(Box);
    }
  });

  it("generateRoomName picks tier labels from area thresholds", () => {
    const cases: Array<{ size: [number, number]; name: string; offset: number }> = [
      { size: [150, 100], name: "Closet", offset: 0 },
      { size: [250, 240], name: "Meeting Room", offset: 400 },
      { size: [350, 290], name: "Office", offset: 800 },
      { size: [450, 400], name: "Conference Room", offset: 1200 },
      { size: [550, 500], name: "Lobby", offset: 1700 },
      { size: [700, 600], name: "Cafeteria", offset: 2400 },
    ];

    for (const { size, name, offset } of cases) {
      const roomEditor = createMockEditor({
        shapes: rectangularRoomWalls(size[0], size[1], offset, 0),
      });
      const utils = new RoomDetectionUtils(roomEditor);
      utils.setOptions({ minArea: 0.01, autoLabel: false });
      const rooms = utils.detectAllRooms();
      expect(rooms[0]?.name).toBe(name);
    }
  });

  it("extractPolygonPoints walks walls connected at either endpoint", () => {
    const walls = [
      makePlannerWallShape("wa", 0, 0, 100, 0),
      makePlannerWallShape("wb", 100, 0, 0, 80),
      makePlannerWallShape("wc", 100, 80, -100, 0),
      makePlannerWallShape("wd", 0, 80, 0, -80),
    ];
    const reversed = createMockEditor({ shapes: walls });
    const utils = new RoomDetectionUtils(reversed);
    utils.setOptions({ minArea: 0.01, autoLabel: false });
    expect(utils.detectAllRooms()[0]?.area).toBeGreaterThan(0);
  });
});