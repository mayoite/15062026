import { describe, expect, it } from "vitest";

import { getBlueprintScreenFrame } from "@/features/planner/editor/blueprintCanvasTransform";

describe("getBlueprintScreenFrame", () => {
  it("computes a scaled screen-space frame and center point", () => {
    expect(
      getBlueprintScreenFrame({
        pageTopLeft: { x: 100, y: 50 },
        widthPx: 400,
        heightPx: 200,
        scale: 0.5,
      }),
    ).toEqual({
      left: 100,
      top: 50,
      width: 200,
      height: 100,
      centerX: 200,
      centerY: 100,
    });
  });
});
