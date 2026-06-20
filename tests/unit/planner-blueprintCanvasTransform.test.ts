import { describe, expect, it } from "vitest";

import { moveBlueprintFromPageDelta } from "@/features/planner/editor/blueprintCanvasTransform";

describe("moveBlueprintFromPageDelta", () => {
  it("adds a page-space drag delta to the original blueprint position", () => {
    expect(
      moveBlueprintFromPageDelta({ x: 120, y: 80 }, { x: -20, y: 40 }),
    ).toEqual({ x: 100, y: 120 });
  });
});
