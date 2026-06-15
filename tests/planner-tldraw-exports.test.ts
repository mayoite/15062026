import { describe, expect, it } from "vitest";

import { PLANNER_SHAPE_UTILS } from "@/features/planner/tldraw/shapes";
import {
  PlannerDoorWindowTool,
  PlannerWallTool,
} from "@/features/planner/tldraw/tools";

describe("tldraw barrel exports", () => {
  it("shapes.ts re-exports shape utils array", () => {
    expect(PLANNER_SHAPE_UTILS.length).toBe(7);
  });

  it("tools.ts re-exports planner tool classes", () => {
    expect(PlannerWallTool.id).toBe("planner-wall");
    expect(PlannerDoorWindowTool).toBeDefined();
  });
});