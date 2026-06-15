import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PropertiesInspector } from "@/features/planner/editor/inspector/PropertiesInspector";
import { createPlannerEditorMock, makeShape } from "./planner-editor-mockEditor";

describe("PropertiesInspector branches", () => {
  it("edits wall dimensions and lock/front/back actions", () => {
    const shape = makeShape("shape:wall", "planner-wall", {
      label: "North",
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
      thickness: 10,
    });
    const editor = createPlannerEditorMock({
      shapes: [shape],
      selectedIds: ["shape:wall" as never],
    });

    render(<PropertiesInspector editor={editor} />);
    expect(screen.getByText("North")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Front" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Lock" }));
    expect(editor.bringToFront).toHaveBeenCalled();
    expect(editor.sendToBack).toHaveBeenCalled();
    expect(editor.updateShape).toHaveBeenCalled();
  });

  it("updates furniture finish and seat count", () => {
    const shape = makeShape("shape:desk", "planner-furniture", {
      productName: "Desk",
      widthMm: 1200,
      heightMm: 600,
      seatCount: 4,
      finish: "oak",
    });
    const editor = createPlannerEditorMock({
      shapes: [shape],
      selectedIds: ["shape:desk" as never],
    });

    render(<PropertiesInspector editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: "Finish: Walnut" }));
    fireEvent.click(screen.getByRole("button", { name: "2P" }));
    expect(editor.updateShape).toHaveBeenCalled();
  });

  it("edits non-catalog room dimensions and number field commits", () => {
    const shape = makeShape(
      "shape:room",
      "planner-room",
      { label: "Open office", widthMm: 5000, heightMm: 4000 },
      { x: 5, y: 8, rotation: Math.PI / 4 },
    );
    const editor = createPlannerEditorMock({
      shapes: [shape],
      selectedIds: ["shape:room" as never],
    });

    render(<PropertiesInspector editor={editor} />);
    const xField = screen.getByLabelText("X in cm");
    fireEvent.change(xField, { target: { value: "12" } });
    fireEvent.blur(xField);
    expect(editor.updateShape).toHaveBeenCalled();

    const widthField = screen.getByLabelText("W in mm");
    fireEvent.change(widthField, { target: { value: "5200" } });
    fireEvent.keyDown(widthField, { key: "Enter" });
    expect(editor.updateShape).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Rotate 90° counter-clockwise" }));
    fireEvent.click(screen.getByRole("button", { name: "Lock" }));
    expect(editor.updateShape).toHaveBeenCalled();
  });

  it("reverts invalid number input and handles arrow keys", () => {
    const shape = makeShape("shape:zone", "planner-zone", {
      label: "Zone",
      widthMm: 1000,
      heightMm: 800,
      zoneType: "focus",
    }, { x: 10, y: 20 });
    const editor = createPlannerEditorMock({
      shapes: [shape],
      selectedIds: ["shape:zone" as never],
    });

    render(<PropertiesInspector editor={editor} />);
    const xField = screen.getByLabelText("X in cm");
    fireEvent.change(xField, { target: { value: "not-a-number" } });
    fireEvent.blur(xField);
    expect(xField).toHaveValue("10");

    fireEvent.keyDown(xField, { key: "ArrowUp" });
    fireEvent.keyDown(xField, { key: "ArrowDown" });
    expect(editor.updateShape).toHaveBeenCalled();
  });

  it("renders null editor and multi-select empty state", () => {
    const { rerender } = render(<PropertiesInspector editor={null} />);
    expect(screen.getByText("Nothing selected")).toBeInTheDocument();

    const editor = createPlannerEditorMock({
      shapes: [
        makeShape("shape:a", "planner-furniture", { productName: "A" }),
        makeShape("shape:b", "planner-furniture", { productName: "B" }),
      ],
      selectedIds: ["shape:a" as never, "shape:b" as never],
    });
    rerender(<PropertiesInspector editor={editor} />);
    expect(screen.getByText("Nothing selected")).toBeInTheDocument();
  });
});