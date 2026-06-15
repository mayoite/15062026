import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlannerHistoryControls } from "@/features/planner/editor/PlannerHistoryControls";
import { createPlannerEditorMock, makeShape } from "./planner-editor-mockEditor";

describe("PlannerHistoryControls", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null without editor", () => {
    const { container } = render(<PlannerHistoryControls editor={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("syncs undo/redo state and handles actions", () => {
    const onReset = vi.fn();
    const editor = createPlannerEditorMock({
      shapes: [makeShape("shape:1", "planner-wall")],
      canUndo: true,
      canRedo: false,
    });

    render(<PlannerHistoryControls editor={editor} onReset={onReset} />);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(editor.undo).toHaveBeenCalled();

    vi.stubGlobal("confirm", vi.fn(() => true));
    fireEvent.click(screen.getByRole("button", { name: "Clear canvas" }));
    expect(onReset).toHaveBeenCalled();
  });
});