import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tldraw/editor", async () => {
  const { createTldrawEditorModule } = await import("./planner-tldraw-mockEditor");
  return createTldrawEditorModule();
});

import { Box, Vec } from "@tldraw/editor";
import { ZoneOverlayUtils } from "@/features/planner/tldraw/tools/ZoneOverlayTool";
import { createMockEditor } from "./planner-tldraw-mockEditor";

describe("ZoneOverlayUtils", () => {
  let editor: ReturnType<typeof createMockEditor>;

  beforeEach(() => {
    editor = createMockEditor();
  });

  it("getZoneConfigs returns all predefined configs", () => {
    const utils = new ZoneOverlayUtils(editor);
    const configs = utils.getZoneConfigs();
    expect(configs.length).toBeGreaterThanOrEqual(5);
    expect(configs.some((c) => c.type === "work")).toBe(true);
  });

  it("getZoneConfig falls back to custom for unknown type", () => {
    const utils = new ZoneOverlayUtils(editor);
    const config = utils.getZoneConfig("custom");
    expect(config.name).toBe("Custom Zone");
  });

  it("startZoneDrawing begins polygon capture", () => {
    const utils = new ZoneOverlayUtils(editor);
    const zone = utils.startZoneDrawing("meeting", new Vec(0, 0), "Team area");
    expect(zone.label).toBe("Team area");
    expect(zone.points).toHaveLength(1);
    expect(utils.isCurrentlyDrawing()).toBe(true);
  });

  it("addZonePoint extends polygon and updates area", () => {
    const utils = new ZoneOverlayUtils(editor);
    utils.startZoneDrawing("work", new Vec(0, 0));
    utils.addZonePoint(new Vec(100, 0));
    utils.addZonePoint(new Vec(100, 80));
    const current = utils.getCurrentZone();
    expect(current!.points).toHaveLength(3);
    expect(current!.area).toBeGreaterThan(0);
  });

  it("finishZoneDrawing creates shape for valid polygon", () => {
    const utils = new ZoneOverlayUtils(editor);
    utils.startZoneDrawing("circulation", new Vec(0, 0));
    utils.addZonePoint(new Vec(100, 0));
    utils.addZonePoint(new Vec(100, 60));
    const result = utils.finishZoneDrawing();
    expect(result).not.toBeNull();
    expect(editor.createShape).toHaveBeenCalled();
    expect(utils.isCurrentlyDrawing()).toBe(false);
  });

  it("finishZoneDrawing cancels when fewer than 3 points", () => {
    const utils = new ZoneOverlayUtils(editor);
    utils.startZoneDrawing("storage", new Vec(0, 0));
    utils.addZonePoint(new Vec(50, 0));
    expect(utils.finishZoneDrawing()).toBeNull();
    expect(utils.isCurrentlyDrawing()).toBe(false);
  });

  it("createRectangularZone creates four-point overlay", () => {
    const utils = new ZoneOverlayUtils(editor);
    const zone = utils.createRectangularZone("utility", new Box(0, 0, 200, 100));
    expect(zone.points).toHaveLength(4);
    expect(editor.createShape).toHaveBeenCalled();
  });

  it("createCircularZone approximates a circle", () => {
    const utils = new ZoneOverlayUtils(editor);
    const zone = utils.createCircularZone("meeting", new Vec(50, 50), 40);
    expect(zone.points.length).toBe(32);
    expect(zone.area).toBeCloseTo(Math.PI * 40 * 40, 0);
  });

  it("updateZone and updateZoneLabel mutate planner-zone shapes", () => {
    editor._shapes.push({
      id: "z1",
      type: "planner-zone",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 0.3,
      isLocked: false,
      props: {
        zoneType: "focus",
        zoneColor: "red",
        fillColor: "pink",
        fillPattern: "solid",
        color: "red",
        strokeColor: "red",
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }],
        label: "Old",
      },
    } as never);

    const utils = new ZoneOverlayUtils(editor);
    utils.updateZone("z1", { color: "blue", opacity: 0.5 });
    utils.updateZoneLabel("z1", "New label");
    expect(editor.updateShape).toHaveBeenCalled();
  });

  it("deleteZone and clearAllZones remove shapes", () => {
    editor._shapes.push({
      id: "z1",
      type: "planner-zone",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: { zoneType: "custom", points: [] },
    } as never);

    const utils = new ZoneOverlayUtils(editor);
    utils.deleteZone("z1");
    expect(editor.deleteShape).toHaveBeenCalledWith("z1");

    editor._shapes.push({
      id: "z2",
      type: "planner-zone",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: { zoneType: "custom", points: [] },
    } as never);
    utils.clearAllZones();
    expect(editor.deleteShape).toHaveBeenCalledTimes(2);
  });

  it("calculateAreaByType aggregates zone areas", () => {
    editor._shapes.push({
      id: "z1",
      type: "planner-zone",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        zoneType: "focus",
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
      },
    } as never);

    const utils = new ZoneOverlayUtils(editor);
    const areas = utils.calculateAreaByType();
    expect(areas.get("work")).toBeGreaterThan(0);
  });

  it("createZoneFromSelection builds zone from selected bounds", () => {
    editor.getSelectedShapeIds = vi.fn(() => ["s1"] as never);
    editor._shapes.push({
      id: "s1",
      type: "planner-furniture",
      x: 10,
      y: 20,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {},
    } as never);

    const utils = new ZoneOverlayUtils(editor);
    const zone = utils.createZoneFromSelection("work", "Selection");
    expect(zone).not.toBeNull();
    expect(zone!.label).toBe("Selection");
  });

  it("finishZoneDrawing cancels when fewer than three points", () => {
    const utils = new ZoneOverlayUtils(editor);
    utils.startZoneDrawing("work", new Vec(0, 0));
    utils.addZonePoint(new Vec(50, 0));
    expect(utils.finishZoneDrawing()).toBeNull();
    expect(utils.isCurrentlyDrawing()).toBe(false);
  });

  it("cancelZoneDrawing clears in-progress zone", () => {
    const utils = new ZoneOverlayUtils(editor);
    utils.startZoneDrawing("meeting", new Vec(0, 0));
    utils.cancelZoneDrawing();
    expect(utils.getCurrentZone()).toBeNull();
  });

  it("maps circulation, storage, and utility zone types with fill patterns", () => {
    const utils = new ZoneOverlayUtils(editor);

    utils.startZoneDrawing("circulation", new Vec(0, 0));
    utils.addZonePoint(new Vec(80, 0));
    utils.addZonePoint(new Vec(80, 60));
    utils.finishZoneDrawing();
    const circulationShape = editor._created.at(-1) as { props: { zoneType: string; fillPattern: string } };
    expect(circulationShape.props.zoneType).toBe("social");
    expect(circulationShape.props.fillPattern).toBe("hatch");

    utils.createRectangularZone("storage", new Box(200, 0, 100, 80));
    const storageShape = editor._created.at(-1) as { props: { zoneType: string } };
    expect(storageShape.props.zoneType).toBe("custom");

    utils.createRectangularZone("utility", new Box(350, 0, 100, 80));
    const utilityShape = editor._created.at(-1) as { props: { fillPattern: string } };
    expect(utilityShape.props.fillPattern).toBe("hatch");
  });

  it("updateZone applies dotted fill pattern and createZoneFromSelection rejects empty selection", () => {
    editor._shapes.push({
      id: "z-dots",
      type: "planner-zone",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 0.3,
      isLocked: false,
      props: {
        zoneType: "focus",
        zoneColor: "red",
        fillColor: "pink",
        fillPattern: "solid",
        color: "red",
        strokeColor: "red",
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }],
      },
    } as never);

    const utils = new ZoneOverlayUtils(editor);
    utils.updateZone("z-dots", { pattern: "dotted", color: "blue" });
    const dottedUpdate = editor.updateShape.mock.calls.at(-1)?.[0] as { props: { fillPattern: string } };
    expect(dottedUpdate.props.fillPattern).toBe("dots");

    editor.getSelectedShapeIds = vi.fn(() => [] as never);
    expect(utils.createZoneFromSelection("work")).toBeNull();
  });

  it("addZonePoint returns null when not drawing", () => {
    const utils = new ZoneOverlayUtils(editor);
    expect(utils.addZonePoint(new Vec(0, 0))).toBeNull();
  });

  it("setZoneOpacity and setZoneColor update shape props", () => {
    editor._shapes.push({
      id: "z1",
      type: "planner-zone",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 0.3,
      isLocked: false,
      props: { zoneColor: "red", fillColor: "red", color: "red", strokeColor: "red" },
    } as never);

    const utils = new ZoneOverlayUtils(editor);
    utils.setZoneOpacity("z1", 0.8);
    utils.setZoneColor("z1", "green", "lightgreen");
    expect(editor.updateShape.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});