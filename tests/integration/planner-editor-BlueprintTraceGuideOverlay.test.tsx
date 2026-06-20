import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { BlueprintTraceGuideOverlay } from "@/features/planner/editor/BlueprintTraceGuideOverlay";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

describe("BlueprintTraceGuideOverlay", () => {
  beforeEach(() => {
    usePlannerWorkspaceStore.setState({
      blueprint: {
        dataUrl: "data:image/png;base64,abc",
        sourceKind: "image",
        sourcePage: 1,
        sourcePageCount: 1,
        interactionMode: "idle",
        x: 0,
        y: 0,
        scale: 1,
        widthPx: 400,
        heightPx: 300,
        opacity: 0.45,
        mmPerUnit: null,
        calibrating: false,
        calibrationPoints: [],
        knownDistanceMm: 3000,
      },
      layerVisible: {
        underlay: true,
        walls: true,
        rooms: true,
        zones: true,
        furniture: true,
        measurements: true,
      },
    });
  });

  it("returns null when blueprint is not traceable", () => {
    const { container, rerender } = render(
      <BlueprintTraceGuideOverlay
        activePlannerTool="select"
        blueprintLoaded
        underlayVisible
        calibrated={false}
        calibrating={false}
        interactionMode="idle"
      />,
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <BlueprintTraceGuideOverlay
        activePlannerTool="wall"
        blueprintLoaded={false}
        underlayVisible
        calibrated={false}
        calibrating={false}
        interactionMode="idle"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders guide and blueprint hud actions", () => {
    render(
      <BlueprintTraceGuideOverlay
        activePlannerTool="wall"
        blueprintLoaded
        underlayVisible
        calibrated
        calibrating={false}
        interactionMode="idle"
      />,
    );

    expect(screen.getByText(/Trace wall runs/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Calibrate blueprint" }));
    expect(usePlannerWorkspaceStore.getState().blueprint.calibrating).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Increase blueprint opacity" }));
    expect(usePlannerWorkspaceStore.getState().blueprint.opacity).toBeGreaterThan(0.45);
  });
});