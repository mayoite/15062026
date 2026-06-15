import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tldraw/editor", async () => {
  const { createTldrawEditorModule } = await import("./planner-tldraw-mockEditor");
  return createTldrawEditorModule();
});

import { Vec } from "@tldraw/editor";
import { MeasurementUtils } from "@/features/planner/tldraw/tools/MeasurementTool";
import { createMockEditor, makePlannerWallShape } from "./planner-tldraw-mockEditor";

describe("MeasurementUtils", () => {
  let editor: ReturnType<typeof createMockEditor>;

  beforeEach(() => {
    editor = createMockEditor({
      shapes: [
        makePlannerWallShape("w1", 0, 0, 100, 0),
        {
          id: "f1",
          type: "planner-furniture",
          x: 200,
          y: 200,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          props: { widthMm: 120, depthMm: 60 },
        } as never,
      ],
    });
  });

  it("measureLinear returns distance and angle", () => {
    const utils = new MeasurementUtils(editor);
    const result = utils.measureLinear(new Vec(0, 0), new Vec(100, 0));
    expect(result.distance).toBe(100);
    expect(result.angle).toBeCloseTo(0, 5);
  });

  it("createLinearDimension creates measurement shape", () => {
    const utils = new MeasurementUtils(editor);
    const label = utils.createLinearDimension(new Vec(0, 0), new Vec(100, 0));
    expect(label).toContain("mm");
    expect(editor.createShape).toHaveBeenCalled();
  });

  it("measureAngle normalizes to 0-180 range", () => {
    const utils = new MeasurementUtils(editor);
    const result = utils.measureAngle(new Vec(0, 0), new Vec(100, 0), new Vec(-100, 0));
    expect(result.angle).toBeCloseTo(180, 5);
  });

  it("createAngularDimension creates rays and label", () => {
    const utils = new MeasurementUtils(editor);
    const label = utils.createAngularDimension(new Vec(0, 0), new Vec(50, 0), new Vec(0, 50));
    expect(label).toContain("deg");
    expect(editor.createShape.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("measureArea uses shoelace formula", () => {
    const utils = new MeasurementUtils(editor);
    const result = utils.measureArea([
      new Vec(0, 0),
      new Vec(100, 0),
      new Vec(100, 50),
      new Vec(0, 50),
    ]);
    expect(result.area).toBe(5000);
    expect(result.perimeter).toBe(300);
  });

  it("measureArea returns zero for fewer than 3 points", () => {
    const utils = new MeasurementUtils(editor);
    const result = utils.measureArea([new Vec(0, 0), new Vec(10, 0)]);
    expect(result.area).toBe(0);
  });

  it("createAreaDimension creates zone overlay shape", () => {
    const utils = new MeasurementUtils(editor);
    const label = utils.createAreaDimension([
      new Vec(0, 0),
      new Vec(100, 0),
      new Vec(100, 80),
      new Vec(0, 80),
    ]);
    expect(label).toContain("^2");
    expect(editor.createShape).toHaveBeenCalled();
  });

  it("formatDistance respects unit option", () => {
    const utils = new MeasurementUtils(editor);
    utils.setOptions({ unit: "cm", precision: 0 });
    expect(utils.formatDistance(100)).toBe("1cm");
    utils.setOptions({ unit: "m" });
    expect(utils.formatDistance(100000)).toContain("m");
  });

  it("measureDistanceBetweenShapes returns center distance", () => {
    const utils = new MeasurementUtils(editor);
    const dist = utils.measureDistanceBetweenShapes("w1", "f1");
    expect(dist).toBeGreaterThan(0);
  });

  it("measureRoomFromWalls returns formatted dimensions", () => {
    const utils = new MeasurementUtils(editor);
    const dims = utils.measureRoomFromWalls(["w1"]);
    expect(dims.width).toContain("mm");
    expect(dims.length).toContain("mm");
    expect(dims.area).toContain("^2");
  });

  it("clearMeasurements removes measurement and area zone shapes", () => {
    editor._shapes.push(
      {
        id: "m1",
        type: "planner-measurement",
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        props: {},
      } as never,
      {
        id: "z1",
        type: "planner-zone",
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        props: { label: "500mm^2" },
      } as never,
    );
    const utils = new MeasurementUtils(editor);
    utils.clearMeasurements();
    expect(editor.deleteShape.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("createMeasurementBetweenShapes creates linear dimension", () => {
    const utils = new MeasurementUtils(editor);
    const label = utils.createMeasurementBetweenShapes("w1", "f1");
    expect(label).toContain("mm");
  });

  it("formatDistance and formatArea cover all unit branches", () => {
    const utils = new MeasurementUtils(editor);
    utils.setOptions({ precision: 1 });

    utils.setOptions({ unit: "in" });
    expect(utils.formatDistance(100)).toContain("in");
    utils.setOptions({ unit: "ft" });
    expect(utils.formatDistance(100)).toContain("ft");

    utils.setOptions({ unit: "cm" });
    expect(utils.formatArea(10000)).toContain("cm^2");
    utils.setOptions({ unit: "m" });
    expect(utils.formatArea(100000000)).toContain("m^2");
    utils.setOptions({ unit: "in" });
    expect(utils.formatArea(10000)).toContain("in^2");
    utils.setOptions({ unit: "ft" });
    expect(utils.formatArea(100000000)).toContain("ft^2");
  });

  it("createLinearDimension uses vertical and diagonal orientations", () => {
    const utils = new MeasurementUtils(editor);
    utils.createLinearDimension(new Vec(0, 0), new Vec(0, 80));
    const vertical = editor.createShape.mock.calls.at(-1)?.[0] as { props: { orientation: string } };
    expect(vertical.props.orientation).toBe("vertical");

    utils.createLinearDimension(new Vec(0, 0), new Vec(50, 40));
    const diagonal = editor.createShape.mock.calls.at(-1)?.[0] as { props: { orientation: string } };
    expect(diagonal.props.orientation).toBe("diagonal");
  });

  it("createAngularDimension skips label when showLabels is false", () => {
    const utils = new MeasurementUtils(editor);
    utils.setOptions({ showLabels: false });
    const callsBefore = editor.createShape.mock.calls.length;
    utils.createAngularDimension(new Vec(0, 0), new Vec(50, 0), new Vec(0, 50));
    const textCreates = editor.createShape.mock.calls
      .slice(callsBefore)
      .filter((c) => (c[0] as { type: string }).type === "text");
    expect(textCreates).toHaveLength(0);
  });

  it("measureAngle keeps acute angles without normalizing past 180", () => {
    const utils = new MeasurementUtils(editor);
    const acute = utils.measureAngle(new Vec(0, 0), new Vec(100, 0), new Vec(0, 100));
    expect(acute.angle).toBeCloseTo(90, 5);
  });

  it("createAreaDimension returns early for fewer than three points", () => {
    const utils = new MeasurementUtils(editor);
    const callsBefore = editor.createShape.mock.calls.length;
    utils.createAreaDimension([new Vec(0, 0), new Vec(10, 0)]);
    expect(editor.createShape.mock.calls.length).toBe(callsBefore);
  });

  it("measureDistanceBetweenShapes and createMeasurementBetweenShapes handle missing shapes", () => {
    const utils = new MeasurementUtils(editor);
    expect(utils.measureDistanceBetweenShapes("missing", "f1")).toBe(0);
    expect(utils.createMeasurementBetweenShapes("missing", "f1")).toBe("0");
  });

  it("clearMeasurements deletes zones with ft/cm labels and skips unrelated zones", () => {
    editor._shapes.push(
      {
        id: "z-ft",
        type: "planner-zone",
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        props: { label: "12 ft^2" },
      } as never,
      {
        id: "z-plain",
        type: "planner-zone",
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        props: { label: "Focus Zone" },
      } as never,
    );
    const utils = new MeasurementUtils(editor);
    utils.clearMeasurements();
    expect(editor.deleteShape).toHaveBeenCalledWith("z-ft");
    expect(editor.deleteShape).not.toHaveBeenCalledWith("z-plain");
  });

  it("getOptions returns a copy of current options", () => {
    const utils = new MeasurementUtils(editor);
    utils.setOptions({ unit: "cm" });
    expect(utils.getOptions().unit).toBe("cm");
  });
});