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

    fireEvent.click(screen.getByRole("button", { name: "Wall (W)" }));
    expect(onSelect).toHaveBeenCalledWith("planner-wall", "wall");
  });

  it("shows furniture in place step with balanced visibility", () => {
    render(
      <PlannerToolRail
        activeTool="select"
        activePlannerTool="select"
        step="place"
        visibilityMode="balanced"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Furniture (F)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Measure (M)" })).toBeInTheDocument();
  });

  it("hides off-step tools when step-focused visibility is enabled", () => {
    render(
      <PlannerToolRail
        activeTool="select"
        activePlannerTool="select"
        step="draw"
        visibilityMode="step"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Wall (W)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zone (Z)" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Furniture (F)" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Measure (M)" })).not.toBeInTheDocument();
  });

  it("disambiguates door and window shared tool id", () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <PlannerToolRail
        activeTool="planner-door-window"
        activePlannerTool="door"
        step="place"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole("button", { name: "Door (D)" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Window" })).toHaveAttribute("aria-pressed", "false");

    rerender(
      <PlannerToolRail
        activeTool="planner-door-window"
        activePlannerTool="window"
        step="place"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole("button", { name: "Window" })).toHaveAttribute("aria-pressed", "true");
  });
});