import { describe, expect, it } from "vitest";

import { TOOL_GROUPS } from "@/features/planner/editor/PlannerToolRail";
import { isPlannerToolVisible } from "@/features/planner/editor/plannerToolVisibility";

function toolById(id: string) {
  for (const group of TOOL_GROUPS) {
    const match = group.tools.find((tool) => tool.id === id);
    if (match) return match;
  }
  throw new Error(`Missing tool: ${id}`);
}

describe("isPlannerToolVisible", () => {
  it("shows furniture in balanced and all modes on every step", () => {
    const furniture = toolById("furniture");
    expect(isPlannerToolVisible("draw", furniture, "balanced")).toBe(true);
    expect(isPlannerToolVisible("place", furniture, "balanced")).toBe(true);
    expect(isPlannerToolVisible("review", furniture, "all")).toBe(true);
  });

  it("hides non-step tools in step-focused draw mode", () => {
    const furniture = toolById("furniture");
    expect(isPlannerToolVisible("draw", furniture, "step")).toBe(false);
    expect(isPlannerToolVisible("place", furniture, "step")).toBe(true);
  });

  it("keeps navigation tools visible in every mode", () => {
    const select = toolById("select");
    const pan = toolById("hand");
    for (const step of ["draw", "place", "review"] as const) {
      expect(isPlannerToolVisible(step, select, "step")).toBe(true);
      expect(isPlannerToolVisible(step, pan, "step")).toBe(true);
    }
  });

  it("shows every tool in all mode", () => {
    const measure = toolById("measure");
    expect(isPlannerToolVisible("draw", measure, "all")).toBe(true);
    expect(isPlannerToolVisible("review", toolById("wall"), "all")).toBe(true);
  });
});