import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { BlueprintUnderlay } from "@/features/planner/editor/BlueprintUnderlay";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

describe("BlueprintUnderlay", () => {
  beforeEach(() => {
    usePlannerWorkspaceStore.setState({
      blueprint: {
        dataUrl: null,
        sourceKind: null,
        sourcePage: null,
        sourcePageCount: null,
        interactionMode: "idle",
        x: 0,
        y: 0,
        scale: 1,
        widthPx: 0,
        heightPx: 0,
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

  it("returns null when blueprint is hidden or missing", () => {
    const { container, rerender } = render(<BlueprintUnderlay camera={{ x: 0, y: 0, z: 1 }} />);
    expect(container.firstChild).toBeNull();

    usePlannerWorkspaceStore.setState({
      blueprint: {
        ...usePlannerWorkspaceStore.getState().blueprint,
        dataUrl: "data:image/png;base64,abc",
        widthPx: 400,
        heightPx: 300,
      },
      layerVisible: {
        ...usePlannerWorkspaceStore.getState().layerVisible,
        underlay: false,
      },
    });
    rerender(<BlueprintUnderlay camera={{ x: 0, y: 0, z: 1 }} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders transformed blueprint image", () => {
    usePlannerWorkspaceStore.setState({
      blueprint: {
        ...usePlannerWorkspaceStore.getState().blueprint,
        dataUrl: "data:image/png;base64,abc",
        widthPx: 400,
        heightPx: 300,
        x: 20,
        y: 30,
        scale: 1.5,
        opacity: 0.6,
      },
    });

    const { container } = render(<BlueprintUnderlay camera={{ x: 10, y: 20, z: 2 }} />);
    const image = container.querySelector("[role='presentation']") as HTMLElement;
    expect(image).toBeTruthy();
    expect(image.style.backgroundImage).toContain("data:image/png;base64,abc");
    expect(image.style.transform).toContain("scale(3)");
  });
});