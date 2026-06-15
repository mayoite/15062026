import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlannerStepBar } from "@/features/planner/editor/PlannerStepBar";

describe("PlannerStepBar", () => {
  it("renders workflow steps and handles enabled clicks", () => {
    const onChange = vi.fn();
    render(
      <PlannerStepBar
        current="catalog"
        disabledSteps={{ measure: true }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Planner workflow" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Space" }));
    expect(onChange).toHaveBeenCalledWith("room");

    fireEvent.click(screen.getByRole("button", { name: "Measure" }));
    expect(onChange).not.toHaveBeenCalledWith("measure");
  });

  it("hides labels in compact mode", () => {
    render(<PlannerStepBar current="room" onChange={vi.fn()} compact />);
    expect(screen.queryByText("Space")).not.toBeInTheDocument();
  });
});