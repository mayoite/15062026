import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LayerManagerPanel } from "@/features/planner/editor/LayerManagerPanel";
import { resetFabricRuntimeState, seedFabricRuntime } from "./planner-fabric-mockRuntime";

describe("LayerManagerPanel", () => {
  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("renders Fabric object rows from runtime state", () => {
    seedFabricRuntime({
      objects: [
        { name: "WALL:North", width: 100, height: 4 },
        { name: "GENERIC:Desk", width: 120, height: 60 },
      ],
      selections: [{ name: "GENERIC:Desk" }],
    });

    render(<LayerManagerPanel unitSystem="metric" />);

    expect(screen.getByText("Desk")).toBeInTheDocument();
    expect(screen.getByText("GENERIC")).toBeInTheDocument();
  });

  it("shows an empty state when no canvas objects exist", () => {
    seedFabricRuntime({ objects: [] });
    render(<LayerManagerPanel unitSystem="metric" />);
    expect(screen.getByText(/No canvas objects yet/i)).toBeInTheDocument();
  });
});
