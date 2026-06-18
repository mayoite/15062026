import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PropertiesInspector } from "@/features/planner/editor/inspector/PropertiesInspector";
import { resetFabricRuntimeState, seedFabricRuntime } from "./planner-fabric-mockRuntime";

describe("PropertiesInspector", () => {
  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("renders empty state when nothing is selected", () => {
    seedFabricRuntime({ selections: [] });
    render(<PropertiesInspector />);
    expect(screen.getByText("Nothing selected")).toBeInTheDocument();
    expect(screen.getByText("Select an element")).toBeInTheDocument();
  });

  it("renders Fabric selection dimensions", () => {
    seedFabricRuntime({
      selections: [{ name: "GENERIC:Desk", width: 120, height: 60, angle: 90, selectable: true }],
    });

    render(<PropertiesInspector step="review" />);
    expect(screen.getByText("Desk")).toBeInTheDocument();
    expect(screen.getByText(/1200 mm × 600 mm/)).toBeInTheDocument();
    expect(screen.getByText(/Rotation 90°/)).toBeInTheDocument();
  });
});
