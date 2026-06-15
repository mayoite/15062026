import { describe, expect, it } from "vitest";

describe("tldraw side-effect modules", () => {
  it("shapeTypeRegistration augments tlschema without exports", async () => {
    await import("@/features/planner/tldraw/shapes/shapeTypeRegistration");
    expect(true).toBe(true);
  });

  it("tools/index re-exports planner tools", async () => {
    const tools = await import("@/features/planner/tldraw/tools/index");
    expect(tools.PlannerWallTool).toBeDefined();
    expect(tools.checkClearanceViolations).toBeTypeOf("function");
  });
});