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

  it("shows a first-load intro with jump hint", () => {
    render(<PlannerStepBar current="draw" onChange={vi.fn()} showIntro />);

    expect(screen.getByText("Welcome to your planner")).toBeInTheDocument();
    expect(
      screen.getByText(/Three quick stages: map your space/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Draw, Place, Review workflow")).toBeInTheDocument();
    expect(screen.getByText("Jump to any step")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You are not locked into order. Click any step below to jump ahead or revisit an earlier stage.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Jump to Place/i })).toBeInTheDocument();
  });
});
