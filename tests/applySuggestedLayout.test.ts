import { describe, expect, it } from "vitest";

import { buildShapesFromSuggestedLayout } from "@/features/planner/ai/applySuggestedLayout";
import { suggestLayoutGridPack } from "@/features/planner/ai/spaceSuggest";
import { catalogMmToCanvasCm } from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";

describe("applySuggestedLayout helpers", () => {
  it("converts real-mm room dimensions to canvas units", () => {
    const layout = suggestLayoutGridPack({
      seatCount: 12,
      purpose: "workstations",
      floorAreaSqFt: 1200,
    });

    const shapes = buildShapesFromSuggestedLayout(layout);
    const room = shapes.find((shape) => shape.type === "planner-room");
    expect(room).toBeTruthy();

    const expectedW = catalogMmToCanvasCm(layout.room.widthMm, layout.room.depthMm);
    const props = room?.props as { widthMm?: number };
    expect(props.widthMm).toBe(expectedW);
  });
});