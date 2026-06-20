import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlannerMobileDock } from "@/features/planner/editor/PlannerMobileDock";

describe("PlannerMobileDock", () => {
  it("toggles left, canvas, and right panels", () => {
    const onToggleLeft = vi.fn();
    const onToggleRight = vi.fn();
    const onFocusCanvas = vi.fn();

    render(
      <PlannerMobileDock
        leftActive
        rightActive={false}
        onToggleLeft={onToggleLeft}
        onToggleRight={onToggleRight}
        onFocusCanvas={onFocusCanvas}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Element library" }));
    fireEvent.click(screen.getByRole("button", { name: "Canvas" }));
    fireEvent.click(screen.getByRole("button", { name: "Properties and layers" }));

    expect(onToggleLeft).toHaveBeenCalled();
    expect(onFocusCanvas).toHaveBeenCalled();
    expect(onToggleRight).toHaveBeenCalled();
  });
});