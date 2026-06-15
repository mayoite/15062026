import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { LayerManagerPanel } from "@/features/planner/editor/LayerManagerPanel";
import { createPlannerEditorMock, makeShape } from "./planner-editor-mockEditor";

describe("LayerManagerPanel", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders grouped entries and handles selection actions", () => {
    const editor = createPlannerEditorMock({
      shapes: [
        makeShape("shape:wall", "planner-wall", {
          startX: 0,
          startY: 0,
          endX: 100,
          endY: 0,
        }),
        makeShape("shape:desk", "planner-furniture", {
          productName: "Desk",
          widthMm: 1200,
          heightMm: 600,
        }),
      ],
      selectedIds: ["shape:desk" as never],
    });

    render(<LayerManagerPanel editor={editor} unitSystem="metric" />);

    expect(screen.getByText("Manage Layers")).toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
    expect(screen.getByText("Desk")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(editor.selectAll).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Fit selection" }));
    expect(editor.zoomToSelection).toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText(/Search layers/i), {
      target: { value: "desk" },
    });
    expect(screen.getByText("Desk")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Desk furniture 1200 x 600 mm" }));
    fireEvent.click(screen.getByRole("button", { name: "Bring to front" }));
    expect(editor.bringToFront).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Collapse all groups" }));
    fireEvent.click(screen.getByRole("button", { name: "Expand all groups" }));
  });

  it("shows empty states for filtered and blank canvases", () => {
    const editor = createPlannerEditorMock({ shapes: [] });
    const { rerender } = render(<LayerManagerPanel editor={editor} unitSystem="metric" />);
    expect(screen.getByText(/Add walls, zones, or furniture/i)).toBeInTheDocument();

    const filled = createPlannerEditorMock({
      shapes: [makeShape("shape:desk", "planner-furniture", { productName: "Desk" })],
    });
    rerender(<LayerManagerPanel editor={filled} unitSystem="metric" />);
    fireEvent.change(screen.getByPlaceholderText(/Search layers/i), {
      target: { value: "zzzz-no-match" },
    });
    expect(screen.getByText(/No layers match this filter/i)).toBeInTheDocument();
  });

  it("renders empty panel without editor", () => {
    render(<LayerManagerPanel editor={null} unitSystem="metric" />);
    expect(screen.getByText("0 items")).toBeInTheDocument();
  });

  it("aligns, distributes, locks, and manages group actions", () => {
    const wall = makeShape("shape:wall", "planner-wall", {
      label: "Wall A",
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
    });
    const desk = makeShape("shape:desk", "planner-furniture", {
      productName: "Desk",
      widthMm: 1200,
      heightMm: 600,
    });
    const zone = makeShape("shape:zone", "planner-zone", {
      label: "Focus",
      widthMm: 2000,
      heightMm: 1500,
    });
    const editor = createPlannerEditorMock({
      shapes: [wall, desk, zone],
      selectedIds: ["shape:desk" as never, "shape:zone" as never, "shape:wall" as never],
    });

    render(<LayerManagerPanel editor={editor} unitSystem="metric" />);

    fireEvent.click(screen.getByRole("button", { name: "Align left" }));
    fireEvent.click(screen.getByRole("button", { name: "Align center horizontally" }));
    fireEvent.click(screen.getByRole("button", { name: "Align right" }));
    fireEvent.click(screen.getByRole("button", { name: "Distribute horizontally" }));
    fireEvent.click(screen.getByRole("button", { name: "Align top" }));
    fireEvent.click(screen.getByRole("button", { name: "Align center vertically" }));
    fireEvent.click(screen.getByRole("button", { name: "Align bottom" }));
    fireEvent.click(screen.getByRole("button", { name: "Distribute vertically" }));
    expect(editor.alignShapes).toHaveBeenCalled();
    expect(editor.distributeShapes).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Lock" }));
    expect(editor.toggleLock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "wall" }));
    fireEvent.click(screen.getByText("Wall A"));
    fireEvent.click(screen.getByRole("button", { name: "Send to back" }));
    expect(editor.sendToBack).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "zone" }));
    fireEvent.click(screen.getByRole("button", { name: "Select group" }));
    fireEvent.click(screen.getByRole("button", { name: "Fit group" }));
    fireEvent.click(screen.getByRole("button", { name: "Lock group" }));
    expect(editor.setSelectedShapes).toHaveBeenCalled();
    expect(editor.zoomToSelection).toHaveBeenCalled();
  });

  it("supports shift and ctrl range selection", () => {
    const shapes = [
      makeShape("shape:wall", "planner-wall", { label: "Wall" }),
      makeShape("shape:desk", "planner-furniture", { productName: "Desk" }),
      makeShape("shape:zone", "planner-zone", { label: "Zone" }),
    ];
    const editor = createPlannerEditorMock({ shapes, selectedIds: ["shape:wall" as never] });
    render(<LayerManagerPanel editor={editor} unitSystem="metric" />);

    const zoneButton = screen.getByText("Zone").closest("button") as HTMLButtonElement;
    fireEvent.click(zoneButton, { shiftKey: true });
    fireEvent.click(zoneButton, { ctrlKey: true });
    expect(editor.setSelectedShapes).toHaveBeenCalled();
  });
});