import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CatalogPanel } from "../../features/planner/ui/CatalogPanel";
import type { CatalogProduct, PlannerStep, RoomPreset } from "../../features/planner/shared/types/planner";

describe("CatalogPanel", () => {
  const defaultProps = {
    products: [] as CatalogProduct[],
    currentStep: "room" as PlannerStep,
    canPlaceFurniture: true,
    roomPresets: [{ id: "1", name: "Preset 1", widthMm: 3000, heightMm: 4000 }] as RoomPreset[],
    unitSystem: "metric" as const,
    onApplyRoomPreset: vi.fn(),
    onActivateWallTool: vi.fn(),
    onActivateBasicShapeTool: vi.fn(),
    onAddWallSegment: vi.fn(),
    onAddDoorOpening: vi.fn(),
    onResolveWallJoins: vi.fn(),
    onDropFurniture: vi.fn(),
    onClose: vi.fn(),
    pinned: false,
    onTogglePin: vi.fn(),
  };

  it("renders Room Builder view correctly", () => {
    render(<CatalogPanel {...defaultProps} />);
    expect(screen.getByText("Room Builder")).toBeInTheDocument();
    expect(screen.getByText("Preset 1")).toBeInTheDocument();
    expect(screen.getByText("Wall Chain")).toBeInTheDocument();
  });

  it("renders Catalog view and handles categories", () => {
    render(
      <CatalogPanel
        {...defaultProps}
        currentStep={"furnish" as PlannerStep}
        products={[
          { name: "Desk 1", category: "Workstation", seriesName: "Series A" },
          { name: "Chair 1", category: "Seating", seriesName: "Series B" },
        ] as unknown as CatalogProduct[]}
      />
    );
    expect(screen.getByText("Catalog")).toBeInTheDocument();
    expect(screen.getByText("Desk 1")).toBeInTheDocument();
    
    // Switch category
    fireEvent.click(screen.getByText("Seating"));
    expect(screen.getByText("Chair 1")).toBeInTheDocument();
    expect(screen.queryByText("Desk 1")).not.toBeInTheDocument();
  });

  it("handles search", () => {
    render(
      <CatalogPanel
        {...defaultProps}
        currentStep={"furnish" as PlannerStep}
        products={[
          { name: "Alpha Desk", category: "Workstation" },
          { name: "Beta Desk", category: "Workstation" },
        ] as unknown as CatalogProduct[]}
      />
    );
    const searchInput = screen.getByPlaceholderText("Search products…");
    fireEvent.change(searchInput, { target: { value: "Alpha" } });
    expect(screen.getByText("Alpha Desk")).toBeInTheDocument();
    expect(screen.queryByText("Beta Desk")).not.toBeInTheDocument();
  });
  
  it("handles interactions", () => {
    render(<CatalogPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Wall Chain"));
    expect(defaultProps.onActivateWallTool).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Preset 1"));
    expect(defaultProps.onApplyRoomPreset).toHaveBeenCalled();
  });
});
