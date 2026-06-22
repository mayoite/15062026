import { createShapeId, type Editor } from "@/features/planner/shared/types/legacyEditorStub";
import { describe, expect, it, vi } from "vitest";

import {
  deriveViewportState,
  formatArea,
  formatDimensionPair,
  formatFeetAndInches,
  formatLength,
  formatMeasurementInputValue,
  formatMetricFromBounds,
  formatMillimeters,
  getMetricLabelForShape,
  getShapeMeta,
  getStructuralShapes,
  parseMeasurementInput,
  plannerUnitSystemToMeasurementUnit,
} from "@/features/planner/lib/measurements";

describe("planner measurements", () => {
  it("formats imperial values to the nearest inch", () => {
    expect(formatFeetAndInches(2032)).toBe(`6' 8"`);
  });

  it("round-trips displayed imperial values back to canonical millimeters", () => {
    const formatted = formatMeasurementInputValue(2438, "ft-in");

    expect(formatted).toBe(`8' 0"`);
    expect(parseMeasurementInput(formatted, "ft-in")).toBe(2438);
  });

  it("parses imperial inspector inputs in supported formats", () => {
    expect(parseMeasurementInput(`6' 8"`, "ft-in")).toBe(2032);
    expect(parseMeasurementInput("6 8", "ft-in")).toBe(2032);
    expect(parseMeasurementInput('80"', "ft-in")).toBe(2032);
  });

  it("parses metric inspector inputs and rejects invalid measurements", () => {
    expect(parseMeasurementInput("1,200 mm", "mm")).toBe(1200);
    expect(parseMeasurementInput("0", "mm")).toBeNull();
    expect(parseMeasurementInput("-40", "mm")).toBeNull();
    expect(parseMeasurementInput("desk", "ft-in")).toBeNull();
    expect(parseMeasurementInput("", "mm")).toBeNull();
    expect(parseMeasurementInput("5 ft 6 in", "ft-in")).toBe(1676);
  });

  it("formats lengths, areas, and unit-system conversions", () => {
    expect(formatMillimeters(1200)).toBe("1,200 mm");
    expect(formatLength(1200, "mm")).toBe("1,200 mm");
    expect(formatLength(2438, "ft-in")).toBe(`8' 0"`);
    expect(parseMeasurementInput(`5'`, "ft-in")).toBe(1524);
    expect(formatDimensionPair(1200, 800, "mm")).toContain("1,200 mm");
    expect(formatArea(1_000_000, "mm")).toBe("1.0 m2");
    expect(formatArea(92_903.04, "ft-in")).toBe("1.0 sq ft");
    expect(formatMetricFromBounds({ w: 120, h: 80 }, "mm")).toBe("W 1,200 mm x H 800 mm");
    expect(plannerUnitSystemToMeasurementUnit("imperial")).toBe("ft-in");
    expect(plannerUnitSystemToMeasurementUnit("metric")).toBe("mm");
  });

  it("reads shape metadata and structural shapes from the editor", () => {
    const wallId = createShapeId("wall");
    const deskId = createShapeId("desk");
    const editor = {
      getCurrentPageShapes: () => [
        { id: wallId, meta: { structureType: "wall-segment" } },
        { id: deskId, meta: { isPlannerItem: true, text: "Desk" } },
      ],
    } as unknown as Editor;

    expect(getShapeMeta({ text: "Desk" }).text).toBe("Desk");
    expect(getShapeMeta(null)).toEqual({});
    expect(getStructuralShapes(editor).map((shape) => shape.id)).toEqual([wallId]);

    const roomDimensionEditor = {
      getCurrentPageShapes: () => [
        { id: wallId, meta: { structureType: "wall-segment", isRoomDimension: true } },
        { id: deskId, meta: { isPlannerItem: true, text: "Desk" } },
      ],
    } as unknown as Editor;
    expect(getStructuralShapes(roomDimensionEditor)).toEqual([]);
  });

  it("derives viewport metrics and canvas measurement overlays", () => {
    const wallId = createShapeId("wall");
    const deskId = createShapeId("desk");
    const editor = {
      getCamera: () => ({ z: 1.25 }),
      pageToViewport: ({ x, y }: { x: number; y: number }) => ({ x: x / 2, y: y / 2 }),
      getCurrentPageShapes: () => [
        { id: wallId, type: "line", meta: { structureType: "wall-segment" }, props: { points: {} } },
        { id: deskId, type: "geo", meta: { isPlannerItem: true }, props: { w: 120, h: 80 } },
      ],
      getShapePageBounds: (shapeId: string) =>
        shapeId === wallId
          ? { minX: 0, minY: 0, maxX: 600, maxY: 400, w: 600, h: 400 }
          : { minX: 100, minY: 100, maxX: 220, maxY: 180, w: 120, h: 80 },
      getSelectionPageBounds: () => ({ minX: 100, minY: 100, maxX: 220, maxY: 180, w: 120, h: 80 }),
      getShape: (shapeId: string) => (shapeId === deskId ? { id: deskId, type: "geo" } : null),
      canUndo: vi.fn(() => true),
      canRedo: vi.fn(() => false),
    } as unknown as Editor;

    const viewport = deriveViewportState(editor, [deskId], "mm");
    expect(viewport.zoomPercent).toBe(125);
    expect(viewport.hasSelection).toBe(true);
    expect(viewport.canUndo).toBe(true);
    expect(viewport.roomMetrics).toContain("W 6,000 mm");
    expect(viewport.canvasMeasurements.length).toBeGreaterThan(1);
    expect(getMetricLabelForShape(editor, deskId, "mm")).toContain("W 1,200 mm");
  });

  it("labels line selections by span length and handles empty structural shells", () => {
    const wallId = createShapeId("wall-span");
    const editor = {
      getCamera: () => ({ z: 1 }),
      pageToViewport: ({ x, y }: { x: number; y: number }) => ({ x, y }),
      getCurrentPageShapes: () => [
        {
          id: wallId,
          type: "line",
          meta: { structureType: "wall-segment", isRoomDimension: true },
          props: {
            points: {
              a1: { id: "a1", index: "a1", x: 0, y: 0 },
              a2: { id: "a2", index: "a2", x: 240, y: 0 },
            },
          },
        },
      ],
      getShapePageBounds: vi.fn(() => ({ minX: 0, minY: 0, maxX: 240, maxY: 0, w: 240, h: 0 })),
      getSelectionPageBounds: () => ({ minX: 0, minY: 0, maxX: 240, maxY: 0, w: 240, h: 0 }),
      getShape: vi.fn(() => ({
        id: wallId,
        type: "line",
        props: {
          points: {
            a1: { id: "a1", index: "a1", x: 0, y: 0 },
            a2: { id: "a2", index: "a2", x: 240, y: 0 },
          },
        },
      })),
      canUndo: vi.fn(() => false),
      canRedo: vi.fn(() => false),
    } as unknown as Editor;

    expect(getMetricLabelForShape(editor, wallId, "ft-in")).toBe(`Length 7' 10"`);
    expect(deriveViewportState(editor, [wallId], "mm").roomMetrics).toBe("No room shell yet");
    expect(deriveViewportState(editor, [wallId, createShapeId("other")], "mm").selectedMetrics).toContain("W");
  });
});

