import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PropertiesInspector } from "@/features/planner/editor/inspector/PropertiesInspector";
import { createPlannerEditorMock, makeShape } from "./planner-editor-mockEditor";

describe("PropertiesInspector", () => {
  it("renders empty state when nothing is selected", () => {
    const editor = createPlannerEditorMock({ selectedIds: [] });
    render(<PropertiesInspector editor={editor} />);
    expect(screen.getByText("Nothing selected")).toBeInTheDocument();
    expect(screen.getByText("Select an element")).toBeInTheDocument();
  });

  it("renders furniture properties and handles edits", () => {
    const shape = makeShape("shape:desk", "planner-furniture", {
      productName: "Desk",
      catalogId: "ws-linear-120",
      widthMm: 1200,
      heightMm: 600,
      seatCount: 4,
      finish: "oak",
    }, { x: 10, y: 20, rotation: 0, isLocked: false });
    const editor = createPlannerEditorMock({
      shapes: [shape],
      selectedIds: ["shape:desk" as never],
    });

    render(<PropertiesInspector editor={editor} />);
    expect(screen.getByText("Desk")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Rotate 90° clockwise" }));
    expect(editor.updateShape).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(editor.duplicateShapes).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
    expect(editor.deleteShape).toHaveBeenCalledWith("shape:desk");
  });

  it("renders zone type controls for zone shapes", () => {
    const shape = makeShape("shape:zone", "planner-zone", {
      label: "Focus",
      widthMm: 120,
      heightMm: 80,
      zoneType: "focus",
    });
    const editor = createPlannerEditorMock({
      shapes: [shape],
      selectedIds: ["shape:zone" as never],
    });

    render(<PropertiesInspector editor={editor} />);
    expect(screen.getByText("Focus")).toBeInTheDocument();
    const zoneSelect = screen.getByLabelText(/Zone type/i);
    fireEvent.change(zoneSelect, { target: { value: "social" } });
    expect(editor.updateShape).toHaveBeenCalled();
  });
});
