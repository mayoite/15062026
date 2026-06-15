import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExportModal } from "@/features/planner/editor/ExportModal";
import {
  getExportShapeIds,
  getSafePngPixelRatio,
  PlannerExportError,
} from "@/features/planner/editor/exportActions";
import { createPlannerEditorMock, makeShape } from "./planner-editor-mockEditor";

vi.mock("@/features/planner/editor/exportActions", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, unknown>),
    downloadPlannerJson: vi.fn(),
    downloadPlannerBoqPdf: vi.fn(async () => undefined),
    downloadPlannerSvg: vi.fn(async () => undefined),
    downloadPlannerPng: vi.fn(async () => undefined),
  };
});

describe("ExportModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: vi.fn(async () => undefined) },
    });
  });

  it("returns null when closed", () => {
    const { container } = render(
      <ExportModal isOpen={false} onClose={vi.fn()} editor={createPlannerEditorMock()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("downloads json and copies share link", async () => {
    const { downloadPlannerJson } = await import("@/features/planner/editor/exportActions");
    const onClose = vi.fn();
    const editor = createPlannerEditorMock();
    render(<ExportModal isOpen onClose={onClose} editor={editor} />);

    fireEvent.click(screen.getByRole("button", { name: /JSON Full session data/i }));
    fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));
    await waitFor(() => expect(downloadPlannerJson).toHaveBeenCalledWith(editor));

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText("Copied!")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("exports pdf with selected preset", async () => {
    const { downloadPlannerBoqPdf } = await import("@/features/planner/editor/exportActions");
    const editor = createPlannerEditorMock();
    render(<ExportModal isOpen onClose={vi.fn()} editor={editor} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Technical Monochrome with dimensions and labels/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() =>
      expect(downloadPlannerBoqPdf).toHaveBeenCalledWith(editor, "Workspace Plan", "technical"),
    );
  });

  it("getExportShapeIds prefers selection over full page", () => {
    const editor = createPlannerEditorMock({
      shapes: [makeShape("shape:1", "planner-wall"), makeShape("shape:2", "planner-furniture")],
      selectedIds: ["shape:2" as never],
    });
    expect(getExportShapeIds(editor)).toEqual(["shape:2"]);
    editor.getSelectedShapeIds = vi.fn(() => []);
    expect(getExportShapeIds(editor)).toEqual(["shape:1", "shape:2"]);
  });

  it("getSafePngPixelRatio caps oversized exports", () => {
    expect(getSafePngPixelRatio(100, 80)).toBe(2);
    expect(getSafePngPixelRatio(10000, 10000)).toBeCloseTo(0.4, 5);
    expect(getSafePngPixelRatio(0, 0)).toBe(2);
  });

  it("exports svg via downloadPlannerSvg", async () => {
    const { downloadPlannerSvg } = await import("@/features/planner/editor/exportActions");
    const editor = createPlannerEditorMock({
      shapes: [makeShape("shape:1", "planner-wall")],
    });

    render(<ExportModal isOpen onClose={vi.fn()} editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: /SVG Vector floor plan/i }));
    fireEvent.click(screen.getByRole("button", { name: "Download SVG" }));
    await waitFor(() => expect(downloadPlannerSvg).toHaveBeenCalledWith(editor));
  });

  it("exports png via downloadPlannerPng", async () => {
    const { downloadPlannerPng } = await import("@/features/planner/editor/exportActions");
    const editor = createPlannerEditorMock({
      shapes: [makeShape("shape:1", "planner-wall")],
    });

    render(<ExportModal isOpen onClose={vi.fn()} editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: /PNG Raster snapshot/i }));
    fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
    await waitFor(() => expect(downloadPlannerPng).toHaveBeenCalledWith(editor));
  });

  it("disables vector export when there are no shapes", () => {
    const editor = createPlannerEditorMock({ shapes: [] });
    editor.getSelectedShapeIds = vi.fn(() => []);
    editor.getCurrentPageShapeIds = vi.fn(() => new Set());

    render(<ExportModal isOpen onClose={vi.fn()} editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: /SVG Vector floor plan/i }));
    expect(screen.getByRole("button", { name: "Download SVG" })).toBeDisabled();
    expect(screen.getByText("No shapes on the canvas yet.")).toBeInTheDocument();
  });

  it("closes from backdrop and traps tab focus", () => {
    const onClose = vi.fn();
    render(<ExportModal isOpen onClose={onClose} editor={createPlannerEditorMock()} />);

    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Tab" });
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  });

  it("exports proposal preset pdf", async () => {
    const { downloadPlannerBoqPdf } = await import("@/features/planner/editor/exportActions");
    const editor = createPlannerEditorMock();
    render(<ExportModal isOpen onClose={vi.fn()} editor={editor} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Proposal Branded layout with logo for pitches/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() =>
      expect(downloadPlannerBoqPdf).toHaveBeenCalledWith(editor, "Workspace Plan", "proposal"),
    );
  });

  it("shows an error when vector export fails", async () => {
    const { downloadPlannerSvg } = await import("@/features/planner/editor/exportActions");
    vi.mocked(downloadPlannerSvg).mockRejectedValueOnce(
      new PlannerExportError("SVG export failed. Try again or reload the canvas."),
    );
    const editor = createPlannerEditorMock({
      shapes: [makeShape("shape:1", "planner-wall")],
    });

    render(<ExportModal isOpen onClose={vi.fn()} editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: /SVG Vector floor plan/i }));
    fireEvent.click(screen.getByRole("button", { name: "Download SVG" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("SVG export failed"),
    );
    expect(screen.getByRole("button", { name: "Download SVG" })).toBeInTheDocument();
  });

  it("exports client preset pdf", async () => {
    const { downloadPlannerBoqPdf } = await import("@/features/planner/editor/exportActions");
    const editor = createPlannerEditorMock();
    render(<ExportModal isOpen onClose={vi.fn()} editor={editor} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Client Clean visual for client presentations/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() =>
      expect(downloadPlannerBoqPdf).toHaveBeenCalledWith(
        editor,
        "Workspace Plan",
        "client-presentation",
      ),
    );
  });
});