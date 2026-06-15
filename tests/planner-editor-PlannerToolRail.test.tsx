import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlannerToolRail } from "@/features/planner/editor/PlannerToolRail";

describe("PlannerToolRail", () => {
  it("renders tool groups and selects tools", () => {
    const onSelect = vi.fn();
    render(
      <PlannerToolRail
        activeTool="select"
        activePlannerTool="select"
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Wall" }));
    expect(onSelect).toHaveBeenCalledWith("planner-wall", "wall");
  });

  it("disambiguates door and window shared tool id", () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <PlannerToolRail
        activeTool="planner-door-window"
        activePlannerTool="door"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole("button", { name: "Door" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Window" })).toHaveAttribute("aria-pressed", "false");

    rerender(
      <PlannerToolRail
        activeTool="planner-door-window"
        activePlannerTool="window"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole("button", { name: "Window" })).toHaveAttribute("aria-pressed", "true");
  });
});