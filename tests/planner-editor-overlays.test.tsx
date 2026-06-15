import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BlueprintMoveCapture } from "@/features/planner/editor/BlueprintMoveCapture";
import { CalibrationCapture } from "@/features/planner/editor/CalibrationCapture";
import { CanvasMeasurementOverlay } from "@/features/planner/editor/CanvasMeasurementOverlay";
import { SnapIndicatorOverlay } from "@/features/planner/editor/SnapIndicatorOverlay";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { createPlannerEditorMock } from "./planner-editor-mockEditor";

vi.mock("@/features/planner/tldraw/tools/tldrawSnap", () => ({
  snapEditorPoint: vi.fn(() => ({
    snapped: true,
    point: { x: 50, y: 50 },
    kind: "grid",
  })),
}));

vi.mock("@/features/planner/lib/measurements", () => ({
  deriveViewportState: vi.fn(() => ({
    canvasMeasurements: [
      { id: "m1", x: 10, y: 20, caption: "Span", value: "3.2 m", tone: "default" },
    ],
  })),
}));

describe("editor overlays", () => {
  beforeEach(() => {
    usePlannerWorkspaceStore.setState({
      blueprint: {
        dataUrl: "data:image/png;base64,abc",
        sourceKind: "image",
        sourcePage: 1,
        sourcePageCount: 1,
        interactionMode: "move",
        x: 100,
        y: 200,
        scale: 1,
        widthPx: 400,
        heightPx: 300,
        opacity: 0.45,
        mmPerUnit: null,
        calibrating: true,
        calibrationPoints: [{ x: 0, y: 0 }],
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

  it("renders calibration capture and records points", () => {
    const editor = createPlannerEditorMock({ camera: { x: 0, y: 0, z: 1 } });
    const { container } = render(<CalibrationCapture editor={editor} />);
    const overlay = container.querySelector("[aria-label='Calibration mode: click two reference points']");
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay!, { clientX: 120, clientY: 140 });
    expect(usePlannerWorkspaceStore.getState().blueprint.calibrationPoints.length).toBeGreaterThan(1);
  });

  it("renders blueprint move capture overlay and drags underlay", () => {
    usePlannerWorkspaceStore.setState({
      blueprint: {
        ...usePlannerWorkspaceStore.getState().blueprint,
        calibrating: false,
        interactionMode: "move",
        x: 50,
        y: 60,
      },
    });
    const editor = createPlannerEditorMock({ camera: { x: 0, y: 0, z: 1 } });
    const { container } = render(<BlueprintMoveCapture editor={editor} />);
    const overlay = container.querySelector(
      "[aria-label='Move blueprint underlay on canvas']",
    ) as HTMLElement;
    expect(overlay).toBeTruthy();

    fireEvent.pointerDown(overlay, { clientX: 100, clientY: 120, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 140, clientY: 160, pointerId: 1 });
    fireEvent.pointerUp(window, { clientX: 140, clientY: 160, pointerId: 1 });

    const { x, y } = usePlannerWorkspaceStore.getState().blueprint;
    expect(x).not.toBe(50);
    expect(y).not.toBe(60);
  });

  it("completes calibration with two points and draws guide line", () => {
    usePlannerWorkspaceStore.setState({
      blueprint: {
        ...usePlannerWorkspaceStore.getState().blueprint,
        calibrating: true,
        calibrationPoints: [],
        knownDistanceMm: 3000,
      },
    });
    const editor = createPlannerEditorMock({ camera: { x: 0, y: 0, z: 1 } });
    const { container, rerender } = render(<CalibrationCapture editor={editor} />);
    const overlay = container.querySelector(
      "[aria-label='Calibration mode: click two reference points']",
    ) as HTMLElement;

    fireEvent.click(overlay, { clientX: 10, clientY: 10 });
    usePlannerWorkspaceStore.setState({
      blueprint: {
        ...usePlannerWorkspaceStore.getState().blueprint,
        calibrationPoints: [{ x: 0, y: 0 }],
      },
    });
    rerender(<CalibrationCapture editor={editor} />);
    expect(container.querySelector("svg line")).toBeTruthy();

    fireEvent.click(overlay, { clientX: 110, clientY: 10 });
    const state = usePlannerWorkspaceStore.getState().blueprint;
    expect(state.calibrating).toBe(false);
    expect(state.mmPerUnit).toBeGreaterThan(0);
  });

  it("renders snap indicator for active tools", () => {
    const editor = createPlannerEditorMock({ currentToolId: "planner-wall" });
    render(<SnapIndicatorOverlay editor={editor} />);
    expect(document.querySelector(".pw-snap-indicator")).toBeTruthy();
  });

  it("renders canvas measurement chips", () => {
    const editor = createPlannerEditorMock();
    render(<CanvasMeasurementOverlay editor={editor} unitSystem="mm" />);
    expect(screen.getByText("Span")).toBeInTheDocument();
    expect(screen.getByText("3.2 m")).toBeInTheDocument();
  });
});