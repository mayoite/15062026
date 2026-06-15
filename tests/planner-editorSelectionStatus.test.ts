import { describe, expect, it } from "vitest";

import { getEditorSelectionStatus } from "@/features/planner/editor/editorSelectionStatus";

describe("getEditorSelectionStatus", () => {
  it("returns null when editor is null", () => {
    expect(getEditorSelectionStatus(null)).toBeNull();
  });

  it("returns null when nothing is selected", () => {
    const editor = {
      getSelectedShapeIds: () => [],
      getShape: () => undefined,
    };
    expect(getEditorSelectionStatus(editor as never)).toBeNull();
  });

  it("formats furniture dimensions and rotation", () => {
    const editor = {
      getSelectedShapeIds: () => ["shape:1"],
      getShape: () => ({
        id: "shape:1",
        type: "planner-furniture",
        rotation: Math.PI / 2,
        props: {
          productName: "Four-seater desk",
          widthMm: 4800,
          heightMm: 1200,
          seatCount: 4,
        },
      }),
    };
    expect(getEditorSelectionStatus(editor as never)).toBe(
      "Four-seater desk · 4800×1200 mm · 90° · 4 seats",
    );
  });

  it("reports multi-select count", () => {
    const editor = {
      getSelectedShapeIds: () => ["a", "b", "c"],
      getShape: () => undefined,
    };
    expect(getEditorSelectionStatus(editor as never)).toBe("3 selected");
  });

  it("formats wall length and room dimensions", () => {
    const wallEditor = {
      getSelectedShapeIds: () => ["shape:wall"],
      getShape: () => ({
        id: "shape:wall",
        type: "planner-wall",
        rotation: 0,
        props: { label: "North", startX: 0, startY: 0, endX: 100, endY: 0 },
      }),
    };
    expect(getEditorSelectionStatus(wallEditor as never)).toContain("mm wall");

    const roomEditor = {
      getSelectedShapeIds: () => ["shape:room"],
      getShape: () => ({
        id: "shape:room",
        type: "planner-room",
        rotation: 0,
        props: { label: "Office", widthMm: 120, heightMm: 80 },
      }),
    };
    expect(getEditorSelectionStatus(roomEditor as never)).toContain("Office");

    const legacyEditor = {
      getSelectedShapeIds: () => ["shape:legacy"],
      getShape: () => ({
        id: "shape:legacy",
        type: "planner-zone",
        rotation: 0,
        props: { w: 120, h: 80 },
      }),
    };
    expect(getEditorSelectionStatus(legacyEditor as never)).toContain("×");
  });
});
