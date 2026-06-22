import { describe, expect, it } from "vitest";

import { TOOL_GROUPS } from "@/features/planner/editor/PlannerToolRail";

describe("PlannerToolRail TOOL_GROUPS", () => {
  const allTools = TOOL_GROUPS.flatMap((group) => group.tools);

  it("exposes three labelled groups covering the full ten-tool rail", () => {
    expect(TOOL_GROUPS).toHaveLength(3);
    expect(allTools).toHaveLength(10);
    for (const group of TOOL_GROUPS) {
      expect(group.label.length).toBeGreaterThan(0);
      expect(group.tools.length).toBeGreaterThan(0);
    }
  });

  it("keeps rail group labels short enough for the 3rem rail", () => {
    for (const group of TOOL_GROUPS) {
      expect(group.label.length).toBeLessThanOrEqual(6);
    }
  });

  it("has unique tool ids", () => {
    const ids = allTools.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique keyboard shortcuts where defined", () => {
    const shortcuts = allTools
      .map((tool) => tool.shortcut)
      .filter((shortcut): shortcut is string => Boolean(shortcut));
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
  });

  it("gives every tool a label and a usage hint for tooltips", () => {
    for (const tool of allTools) {
      expect(tool.label.length).toBeGreaterThan(0);
      expect(tool.hint.length).toBeGreaterThan(10);
    }
  });

  it("maps door and window to the shared door-window canvas tool", () => {
    const door = allTools.find((tool) => tool.id === "door");
    const window = allTools.find((tool) => tool.id === "window");
    expect(door?.toolId).toBe("planner-door-window");
    expect(window?.toolId).toBe("planner-door-window");
    expect(door?.plannerTool).toBe("door");
    expect(window?.plannerTool).toBe("window");
  });
});

