import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { countShapesByLayer, LayerVisibilityPanel } from "@/features/planner/editor/LayerVisibilityPanel";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { createPlannerEditorMock, makeShape } from "./planner-editor-mockEditor";

describe("countShapesByLayer", () => {
  it("counts shapes by mapped categories", () => {
    const counts = countShapesByLayer([
      { type: "planner-wall" },
      { type: "planner-door" },
      { type: "planner-room" },
      { type: "planner-furniture" },
      { type: "planner-custom" },
    ]);
    expect(counts.walls).toBe(2);
    expect(counts.rooms).toBe(1);
    expect(counts.furniture).toBe(1);
  });
});

describe("LayerVisibilityPanel", () => {
  beforeEach(() => {
    usePlannerWorkspaceStore.setState({
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

  it("renders layer rows and toggles visibility", () => {
    const editor = createPlannerEditorMock({
      shapes: [
        makeShape("shape:1", "planner-wall"),
        makeShape("shape:2", "planner-furniture"),
      ],
    });

    render(<LayerVisibilityPanel editor={editor} />);
    expect(screen.getByText("Layers")).toBeInTheDocument();
    expect(screen.getAllByLabelText("1 elements", { exact: false }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Hide Walls & openings layer/i }));
    expect(usePlannerWorkspaceStore.getState().layerVisible.walls).toBe(false);
  });

  it("renders without editor counts", () => {
    render(<LayerVisibilityPanel />);
    expect(screen.getByText("Blueprint")).toBeInTheDocument();
    expect(screen.queryByLabelText(/elements/i)).not.toBeInTheDocument();
  });
});