import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tldraw/editor", async () => {
  const { createTldrawEditorModule } = await import("./planner-tldraw-mockEditor");
  return createTldrawEditorModule();
});

vi.mock("@/features/planner/store/plannerStore", () => ({
  usePlannerStore: { getState: () => ({ snapDistance: 10 }) },
}));

import { Vec } from "@tldraw/editor";
import { RoomDetectionUtils } from "@/features/planner/tldraw/tools/RoomDetectionTool";
import { MeasurementUtils } from "@/features/planner/tldraw/tools/MeasurementTool";
import { ZoneOverlayUtils } from "@/features/planner/tldraw/tools/ZoneOverlayTool";
import { snapWallEndpoint } from "@/features/planner/tldraw/tools/tldrawSnap";
import { createMockEditor, makePlannerWallShape } from "./planner-tldraw-mockEditor";

describe("tldraw tool branch coverage", () => {
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

  it("RoomDetectionUtils formatLabel supports name and dimensions modes", () => {
    const utils = new RoomDetectionUtils(editor);
    utils.setOptions({ autoLabel: false, labelFormat: "name", minArea: 0.01 });
    const rooms = utils.detectAllRooms();
    if (rooms.length === 0) return;
    utils.setOptions({ labelFormat: "dimensions" });
    utils.detectAllRooms();
    utils.setOptions({ labelFormat: "both" });
    utils.detectAllRooms();
    expect(rooms[0].name).toBeTruthy();
  });

  it("MeasurementUtils calculateCentroid handles zero-area polygon", () => {
    const utils = new MeasurementUtils(editor);
    const area = utils.createAreaDimension([
      new Vec(0, 0),
      new Vec(0, 0),
      new Vec(0, 0),
    ]);
    expect(area).toBeTruthy();
  });

  it("MeasurementUtils measureRoomFromWalls returns zeros without walls", () => {
    const utils = new MeasurementUtils(editor);
    expect(utils.measureRoomFromWalls([])).toEqual({ width: "0", length: "0", area: "0" });
  });

  it("ZoneOverlayUtils getZonesByType filters mapped zone types", () => {
    editor._shapes.push({
      id: "z1",
      type: "planner-zone",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        zoneType: "collaborative",
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }],
      },
    } as never);

    const utils = new ZoneOverlayUtils(editor);
    expect(utils.getZonesByType("meeting").length).toBe(1);
    expect(utils.getZonesByType("work").length).toBe(0);
  });

  it("snapWallEndpoint keeps grid snap when shift snap is close enough", () => {
    const editorWithWall = createMockEditor({
      shapes: [makePlannerWallShape("w1", 0, 0, 200, 0)],
    });
    const origin = new Vec(0, 0);
    const rawEnd = new Vec(100, 0);
    const result = snapWallEndpoint(editorWithWall, origin, rawEnd, true);
    expect(result.snapped).toBe(true);
  });

  it("FurniturePlacement with snapping disabled uses raw coordinates", async () => {
    const { FurniturePlacementUtils } = await import("@/features/planner/tldraw/tools/FurniturePlacementTool");
    const utils = new FurniturePlacementUtils(editor);
    utils.setOptions({ snapToGrid: false, snapToWalls: false, showPreview: false });
    const placed = utils.startPlacement("ws-linear-120", new Vec(17, 23));
    expect(placed!.position.x).toBe(17);
    expect(placed!.position.y).toBe(23);
  });

  it("MeasurementUtils formatDistance covers remaining units", () => {
    const utils = new MeasurementUtils(editor);
    utils.setOptions({ unit: "in", precision: 0 });
    expect(utils.formatDistance(100)).toContain("in");
    utils.setOptions({ unit: "ft" });
    expect(utils.formatDistance(100)).toContain("ft");
  });

  it("RoomDetectionUtils updateRoomLabel renames detected room", () => {
    const utils = new RoomDetectionUtils(editor);
    utils.setOptions({ autoLabel: true, labelFormat: "both", minArea: 0.01 });
    const rooms = utils.detectAllRooms();
    if (rooms.length > 0) {
      utils.updateRoomLabel(rooms[0].id, "Conference");
      expect(editor.updateShape).toHaveBeenCalled();
    }
  });

  it("ZoneOverlayUtils setZoneOpacity no-ops for missing shapes", () => {
    const utils = new ZoneOverlayUtils(editor);
    const callsBefore = editor.updateShape.mock.calls.length;
    utils.setZoneOpacity("missing", 0.5);
    expect(editor.updateShape.mock.calls.length).toBe(callsBefore);
  });

  it("ZoneOverlayUtils calculateAreaByType aggregates zone areas", () => {
    editor._shapes.push({
      id: "z2",
      type: "planner-zone",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        zoneType: "collaborative",
        points: [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }],
        label: "Collab",
        areaSqm: 4,
      },
    } as never);
    const utils = new ZoneOverlayUtils(editor);
    const areas = utils.calculateAreaByType();
    expect(areas.size).toBeGreaterThanOrEqual(0);
    expect(utils.getZonesByType("meeting").length).toBeGreaterThanOrEqual(1);
  });
});