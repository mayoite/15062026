import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlannerLeftPanel } from "@/features/planner/editor/PlannerLeftPanel";

describe("PlannerLeftPanel", () => {
  it("switches tabs across the guided planner views", () => {
    render(
      <PlannerLeftPanel
        guestMode={false}
        plannerStep="draw"
        onItemClick={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );

    // Default tab for "draw" step is "library"
    expect(screen.getByPlaceholderText(/Search SKU, name, material/i)).toBeInTheDocument();
    
    // Switch to AI Assist tab
    fireEvent.click(screen.getByRole("tab", { name: /AI Assist/i }));
    expect(screen.getByText(/Use AI for layout ideas, then return to Library to keep editing/i)).toBeInTheDocument();
  });

  it("uses controlled tab state when provided", () => {
    const onTabChange = vi.fn();
    render(
      <PlannerLeftPanel
        guestMode
        activeTab="library"
        onTabChange={onTabChange}
        onItemClick={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );
    
    expect(screen.getByRole("tab", { name: /Library/i })).toHaveAttribute("aria-selected", "true");
  });
});
