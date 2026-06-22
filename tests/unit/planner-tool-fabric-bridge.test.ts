import { describe, expect, it } from "vitest";

import {
  fabricToolToPlannerSelection,
  plannerToolToFabricTool,
  plannerToolToToolId,
} from "@/features/planner/editor/plannerToolFabricBridge";

describe("plannerToolFabricBridge", () => {
  it("maps pan and wall tools to fabric modes", () => {
    expect(plannerToolToFabricTool("pan")).toBe("pan");
    expect(plannerToolToFabricTool("wall")).toBe("wall");
    expect(plannerToolToFabricTool("furniture")).toBe("select");
  });

  it("maps fabric pan back to planner pan", () => {
    expect(fabricToolToPlannerSelection("pan")).toEqual({
      toolId: "hand",
      plannerTool: "pan",
    });
  });

  it("maps planner tools to rail ids", () => {
    expect(plannerToolToToolId("pan")).toBe("hand");
    expect(plannerToolToToolId("wall")).toBe("planner-wall");
  });
});
