import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LayerVisibilityPanel } from "@/features/planner/editor/LayerVisibilityPanel";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { resetFabricRuntimeState, seedFabricRuntime } from "./planner-fabric-mockRuntime";

describe("LayerVisibilityPanel", () => {
  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("renders layer rows and toggles visibility", () => {
    seedFabricRuntime({
      objects: [
        { name: "WALL:North", width: 100, height: 4 },
        { name: "GENERIC:Desk", width: 120, height: 60 },
      ],
    });

    render(<LayerVisibilityPanel />);
    expect(screen.getByText("Walls & openings")).toBeInTheDocument();
    expect(screen.getByText("Furniture")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Hide Furniture layer/i }));
    expect(usePlannerWorkspaceStore.getState().layerVisible.furniture).toBe(false);
  });
});
