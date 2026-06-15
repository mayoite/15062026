import { describe, expect, it } from "vitest";

import { fitCanvasLabel } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerFurnitureShapeUtil";

describe("fitCanvasLabel", () => {
  it("returns short labels unchanged", () => {
    expect(fitCanvasLabel("Desk", 120, 9.6)).toBe("Desk");
  });

  it("truncates long catalog names with an ellipsis to fit the footprint", () => {
    const longName =
      "Table Top: 25mm thick Pre laminate particle board with 2mm PV — 2 seater - NS (1200mm)";
    const result = fitCanvasLabel(longName, 120, 9.6);

    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThan(longName.length);
    // ~120 / (9.6 * 0.6) => ~20 chars (incl. ellipsis), never the full string.
    expect(result.length).toBeLessThanOrEqual(21);
    expect(longName.startsWith(result.slice(0, -1).trimEnd())).toBe(true);
  });

  it("shows more characters for wider footprints", () => {
    const longName = "Conference Table Extra Wide Boardroom Edition";
    const narrow = fitCanvasLabel(longName, 120, 9.6);
    const wide = fitCanvasLabel(longName, 600, 9.6);

    expect(wide.length).toBeGreaterThan(narrow.length);
  });

  it("keeps at least a few characters for very small items", () => {
    const result = fitCanvasLabel("Storage Cabinet Tall", 10, 12);
    // Floor is 6 chars + ellipsis.
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(6);
  });

  it("returns an empty string for blank labels", () => {
    expect(fitCanvasLabel("   ", 120, 9.6)).toBe("");
    expect(fitCanvasLabel("", 120, 9.6)).toBe("");
  });
});
