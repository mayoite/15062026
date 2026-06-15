import { describe, expect, it } from "vitest";
import { createShapeId } from "tldraw";

import { repairPlannerShapeUnits } from "@/features/planner/editor/repairPlannerShapeUnits";

describe("repairPlannerShapeUnits", () => {
  it("normalizes legacy cm×10 furniture props on load", () => {
    const updates: Array<{ id: string; props: Record<string, unknown> }> = [];
    const shapeId = createShapeId("desk");

    const editor = {
      getCurrentPageShapes: () => [
        {
          id: shapeId,
          type: "planner-furniture",
          props: { widthMm: 1200, heightMm: 600, depthMm: 600 },
        },
      ],
      updateShapes: (batch: typeof updates) => {
        updates.push(...batch);
      },
    };

    const repaired = repairPlannerShapeUnits(editor as never);
    expect(repaired).toBe(1);
    expect(updates[0]?.props).toEqual({
      widthMm: 120,
      heightMm: 60,
      depthMm: 60,
    });
  });

  it("skips shapes that are already in canvas cm", () => {
    const editor = {
      getCurrentPageShapes: () => [
        {
          id: createShapeId("desk"),
          type: "planner-furniture",
          props: { widthMm: 120, heightMm: 60, depthMm: 60 },
        },
      ],
      updateShapes: () => {
        throw new Error("should not update");
      },
    };

    expect(repairPlannerShapeUnits(editor as never)).toBe(0);
  });
});