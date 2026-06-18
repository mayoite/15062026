import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlannerWorkflowPanel } from "@/features/planner/editor/PlannerWorkflowPanel";
import { createPlannerEditorMock } from "./planner-editor-mockEditor";

vi.mock("@/features/planner/lib/compliance", () => ({
  runPlannerComplianceCheck: vi.fn(() => [
    "CRITICAL: overlap",
    "COMPLIANCE WARNING: clearance below ADA minimum.",
  ]),
}));

describe("PlannerWorkflowPanel", () => {
  const metrics = {
    shapeCount: 3,
    roomAreaSqm: 10,
    zoneAreaSqm: 0,
    totalFloorAreaSqm: 10,
    wallCount: 2,
    furnitureCount: 1,
    calibrated: false,
  };

  it("shows compliance findings and advances workflow", () => {
    const onStepChange = vi.fn();
    const onOpenExport = vi.fn();
    const editor = createPlannerEditorMock();

    render(
      <PlannerWorkflowPanel
        editor={editor}
        metrics={metrics}
        step="place"
        onStepChange={onStepChange}
        onOpenExport={onOpenExport}
      />,
    );

    expect(screen.getByText(/overlap/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Go to Review" }));
    expect(onStepChange).toHaveBeenCalledWith("review");
  });

  it("opens export on review step when allowed", async () => {
    const { runPlannerComplianceCheck } = await import("@/features/planner/lib/compliance");
    vi.mocked(runPlannerComplianceCheck).mockReturnValueOnce([]);

    const onOpenExport = vi.fn();
    const editor = createPlannerEditorMock();
    render(
      <PlannerWorkflowPanel
        editor={editor}
        metrics={metrics}
        step="review"
        onStepChange={vi.fn()}
        onOpenExport={onOpenExport}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Export" }));
    expect(onOpenExport).toHaveBeenCalled();
  });
});
