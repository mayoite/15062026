import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlannerLeftPanel } from "@/features/planner/editor/PlannerLeftPanel";

vi.mock("@/features/planner/catalog/CatalogSidebar", () => ({
  CatalogSidebar: () => <div>Catalog sidebar</div>,
}));

vi.mock("@/features/planner/catalog/RoomPresetsPanel", () => ({
  RoomPresetsPanel: ({ onApply }: { onApply: () => void }) => (
    <button type="button" onClick={onApply}>
      Apply preset
    </button>
  ),
}));

vi.mock("@/features/planner/editor/BlueprintPanel", () => ({
  BlueprintPanel: () => <div>Blueprint panel</div>,
}));

vi.mock("@/features/planner/ai/AIAssistDrawer", () => ({
  AIAssistDrawer: () => <div>AI assist drawer</div>,
}));

describe("PlannerLeftPanel", () => {
  it("switches tabs and shows room presets on room step", () => {
    const onApplyRoomPreset = vi.fn();
    render(
      <PlannerLeftPanel
        guestMode={false}
        plannerStep="room"
        onItemClick={vi.fn()}
        onDragStart={vi.fn()}
        onApplyRoomPreset={onApplyRoomPreset}
      />,
    );

    expect(screen.getByText("Apply preset")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Blueprint/i }));
    expect(screen.getByText("Blueprint panel")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /AI Assist/i }));
    expect(screen.getByText("AI assist drawer")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Apply preset" }));
    expect(onApplyRoomPreset).toHaveBeenCalled();
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
    fireEvent.click(screen.getByRole("tab", { name: /Blueprint/i }));
    expect(onTabChange).toHaveBeenCalledWith("blueprint");
  });
});