import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlannerHistoryControls } from "@/features/planner/editor/PlannerHistoryControls";

describe("PlannerHistoryControls", () => {
  it("renders disabled undo/redo and clears on confirm", () => {
    const onReset = vi.fn();
    vi.stubGlobal("confirm", vi.fn(() => true));

    render(<PlannerHistoryControls onReset={onReset} />);

    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Clear canvas" }));
    expect(onReset).toHaveBeenCalled();
  });
});
