import { describe, expect, it, vi } from "vitest";
import type { Editor } from "tldraw";

import { runPlannerComplianceCheck } from "@/features/planner/lib/compliance";

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

function makeShape(id: string, isPlannerItem = true) {
  return { id, meta: { isPlannerItem }, type: "geo" };
}

function makeEditor(boundsById: Record<string, Bounds | null>): Editor {
  return {
    getShapePageBounds: vi.fn((shape: { id: string }) => boundsById[shape.id] ?? null),
  } as unknown as Editor;
}

describe("planner compliance", () => {
  it("ignores non-planner shapes and missing bounds", () => {
    const shapes = [makeShape("wall", false), makeShape("desk-1"), makeShape("desk-2")];
    const editor = makeEditor({ "desk-1": null, "desk-2": { minX: 0, minY: 0, maxX: 100, maxY: 80 } });

    expect(runPlannerComplianceCheck(editor, shapes)).toEqual([]);
  });

  it("reports overlapping workstations as critical warnings", () => {
    const shapes = [makeShape("desk-1"), makeShape("desk-2")];
    const editor = makeEditor({
      "desk-1": { minX: 0, minY: 0, maxX: 100, maxY: 80 },
      "desk-2": { minX: 50, minY: 20, maxX: 150, maxY: 100 },
    });

    expect(runPlannerComplianceCheck(editor, shapes)).toEqual([
      "CRITICAL: 1 workstation(s) are severely overlapping.",
    ]);
  });

  it("reports tight ADA clearances between separated modules", () => {
    const shapes = [makeShape("desk-1"), makeShape("desk-2")];
    const editor = makeEditor({
      "desk-1": { minX: 0, minY: 0, maxX: 100, maxY: 80 },
      "desk-2": { minX: 105, minY: 0, maxX: 205, maxY: 80 },
    });

    expect(runPlannerComplianceCheck(editor, shapes)).toEqual([
      "COMPLIANCE WARNING: 1 module boundary clearances are under the strict 900mm ADA minimum.",
    ]);
  });
});