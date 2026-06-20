import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlannerStatusBar } from "@/features/planner/editor/PlannerStatusBar";

describe("PlannerStatusBar", () => {
  it("renders metrics and selection status", () => {
    render(
      <PlannerStatusBar
        metrics={{
          shapeCount: 4,
          roomAreaSqm: 12.4,
          zoneAreaSqm: 0,
          totalFloorAreaSqm: 12.4,
          wallCount: 2,
          furnitureCount: 1,
          calibrated: true,
        }}
        selectionStatus="Desk · 1200×600 mm · 0°"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("4 objects");
    expect(screen.getByRole("status")).toHaveTextContent("2 walls");
    expect(screen.getByRole("status")).toHaveTextContent("Rooms 12 m²");
    expect(screen.getByRole("status")).toHaveTextContent("(calibrated)");
    expect(screen.getByText(/Desk/)).toBeInTheDocument();
  });

  it("shows dash for empty areas", () => {
    render(
      <PlannerStatusBar
        metrics={{
          shapeCount: 0,
          roomAreaSqm: 0,
          zoneAreaSqm: 0,
          totalFloorAreaSqm: 0,
          wallCount: 0,
          furnitureCount: 0,
          calibrated: false,
        }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Rooms —");
  });
});