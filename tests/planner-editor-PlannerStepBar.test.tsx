import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlannerStepBar } from "@/features/planner/editor/PlannerStepBar";

describe("PlannerStepBar", () => {
  it("renders workflow steps and handles enabled clicks", () => {
    const onChange = vi.fn();
    render(
      <PlannerStepBar
        current="place"
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Planner workflow" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Draw/i }));
    expect(onChange).toHaveBeenCalledWith("draw");

    fireEvent.click(screen.getByRole("button", { name: /Review/i }));
    expect(onChange).toHaveBeenCalledWith("review");
  });

  it("hides labels in compact mode", () => {
    render(<PlannerStepBar current="draw" onChange={vi.fn()} compact />);
    expect(screen.queryByText("Draw")).not.toBeInTheDocument();
  });
});
