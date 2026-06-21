import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlannerLeftPanel } from "@/features/planner/editor/PlannerLeftPanel";

vi.mock("@/features/planner/catalog/CatalogPanel", () => ({
  CatalogPanel: () => <div>Browse Oando SVG symbols — click or drag desks, seating, and storage onto the canvas.</div>,
}));

vi.mock("@/features/planner/ai/AIAssistDrawer", () => ({
  AIAssistDrawer: () => <div>AI assist drawer</div>,
}));

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
    expect(screen.getByText(/Browse Oando SVG symbols/i)).toBeInTheDocument();
    // Switch to AI Assist tab
    fireEvent.click(screen.getByRole("tab", { name: /AI Assist/i }));
    expect(screen.getByText("AI assist drawer")).toBeInTheDocument();
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
  });
});
