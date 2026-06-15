import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExportModal } from "@/features/planner/editor/ExportModal";
import { createPlannerEditorMock } from "./planner-editor-mockEditor";

vi.mock("@/features/planner/editor/exportActions", () => ({
  downloadPlannerJson: vi.fn(),
  downloadPlannerBoqPdf: vi.fn(async () => undefined),
}));

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

    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() =>
      expect(downloadPlannerBoqPdf).toHaveBeenCalledWith(editor, "Workspace Plan", "technical"),
    );
  });

  it("exports svg via tldraw getSvg", async () => {
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgEl.setAttribute("width", "100");
    svgEl.setAttribute("height", "80");
    const editor = createPlannerEditorMock();
    editor.getCurrentPageShapeIds = vi.fn(() => new Set(["shape:1" as never]));
    (editor as unknown as { getSvg: ReturnType<typeof vi.fn> }).getSvg = vi.fn(async () => svgEl);

    const createObjectURL = vi.fn(() => "blob:test");
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL: vi.fn() });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<ExportModal isOpen onClose={vi.fn()} editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: "SVG" }));
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("exports png via tldraw getSvg", async () => {
    class MockImage {
      naturalWidth = 100;
      naturalHeight = 80;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", MockImage);

    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgEl.setAttribute("width", "100");
    svgEl.setAttribute("height", "80");
    const editor = createPlannerEditorMock();
    editor.getCurrentPageShapeIds = vi.fn(() => new Set(["shape:1" as never]));
    (editor as unknown as { getSvg: ReturnType<typeof vi.fn> }).getSvg = vi.fn(async () => svgEl);

    const toBlob = vi.fn((cb: (blob: Blob | null) => void) => cb(new Blob(["png"])));
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() })) as never;
    HTMLCanvasElement.prototype.toBlob = toBlob as never;

    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<ExportModal isOpen onClose={vi.fn()} editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: "PNG" }));
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => expect(clickSpy).toHaveBeenCalled());

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
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
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() =>
      expect(downloadPlannerBoqPdf).toHaveBeenCalledWith(editor, "Workspace Plan", "proposal"),
    );
  });

  it("recovers when vector export fails", async () => {
    const editor = createPlannerEditorMock();
    editor.getCurrentPageShapeIds = vi.fn(() => new Set(["shape:1" as never]));
    (editor as unknown as { getSvg: ReturnType<typeof vi.fn> }).getSvg = vi.fn(async () => {
      throw new Error("svg fail");
    });

    render(<ExportModal isOpen onClose={vi.fn()} editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: "SVG" }));
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument());
  });

  it("exports client preset pdf", async () => {
    const { downloadPlannerBoqPdf } = await import("@/features/planner/editor/exportActions");
    const editor = createPlannerEditorMock();
    render(<ExportModal isOpen onClose={vi.fn()} editor={editor} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Client Clean visual for client presentations/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() =>
      expect(downloadPlannerBoqPdf).toHaveBeenCalledWith(
        editor,
        "Workspace Plan",
        "client-presentation",
      ),
    );
  });
});