import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InspectorPanel } from "@/features/planner/ui/InspectorPanel";

describe("InspectorPanel", () => {
  it("hides price text and uses BOQ enquiry copy on the review step", () => {
    render(
      <InspectorPanel
        boqItems={[
          {
            id: "desk-1",
            name: "Desk",
            category: "Workstations",
            price: 52000,
            dimensions: "1600 x 800 x 750 mm",
          },
        ]}
        totalBoq={52000}
        currentStep="review"
        canContinueFromRoom
        roomMetrics="5000 x 4000 mm"
        selectedMetrics={null}
        selectionDimensions={null}
        unitSystem="mm"
        onUnitSystemChange={vi.fn()}
        isSnapMode={false}
        onToggleSnap={vi.fn()}
        onUpdateSelectionDimensions={vi.fn()}
        onAdvanceBoqFlow={vi.fn()}
        onClose={vi.fn()}
        pinned={false}
        onTogglePin={vi.fn()}
      />,
    );

    expect(screen.getByText("BOQ Lines")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByRole("button", { name: /open boq enquiry/i })).toBeDefined();
    expect(screen.queryByText(/INR/i)).toBeNull();
  });
});
