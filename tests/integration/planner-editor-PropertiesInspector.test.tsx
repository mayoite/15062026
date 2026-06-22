import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FloorplanProvider } from "@/features/planner/canvas-fabric";
import { PropertiesInspector } from "@/features/planner/editor/inspector/PropertiesInspector";
import { resetFabricRuntimeState, seedFabricRuntime } from "./planner-fabric-mockRuntime";

function renderInspector(step: "draw" | "review" = "review") {
  return render(
    <FloorplanProvider>
      <PropertiesInspector step={step} />
    </FloorplanProvider>,
  );
}

describe("PropertiesInspector", () => {
  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("renders empty state when nothing is selected", () => {
    seedFabricRuntime({ selections: [] });
    renderInspector();
    expect(screen.getByText("Nothing selected")).toBeInTheDocument();
    expect(screen.getByText("Select an element")).toBeInTheDocument();
  });

  it("renders Fabric selection dimensions", () => {
    seedFabricRuntime({
      selections: [{ name: "GENERIC:Desk", width: 120, height: 60, angle: 90, selectable: true }],
    });

    renderInspector("review");
    expect(screen.getByText("Desk")).toBeInTheDocument();
    expect(screen.getByLabelText("Width in millimeters")).toHaveValue(1200);
    expect(screen.getByLabelText("Depth in millimeters")).toHaveValue(600);
    expect(screen.getByLabelText("Rotation in degrees")).toHaveValue(90);
  });
});
