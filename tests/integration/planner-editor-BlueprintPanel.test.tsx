import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BlueprintPanel } from "@/features/planner/editor/BlueprintPanel";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

const getPdfPageCount = vi.fn();
const pdfPageToDataUrl = vi.fn();

vi.mock("@/features/planner/lib/blueprintPdf", () => ({
  getPdfPageCount: (...args: unknown[]) => getPdfPageCount(...args),
  pdfPageToDataUrl: (...args: unknown[]) => pdfPageToDataUrl(...args),
}));

class MockImage {
  naturalWidth = 1200;
  naturalHeight = 900;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = "";

  get src() {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    queueMicrotask(() => {
      if (value.includes("fail-image")) {
        this.onerror?.();
      } else {
        this.onload?.();
      }
    });
  }
}

class MockFileReader {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  readAsDataURL(_file: File) {
    if (_file.name.includes("fail-read")) {
      queueMicrotask(() => this.onerror?.());
      return;
    }
    this.result = "data:image/png;base64,abc";
    queueMicrotask(() => this.onload?.());
  }
}

function resetBlueprintStore() {
  usePlannerWorkspaceStore.setState({
    blueprint: {
      dataUrl: null,
      sourceKind: null,
      sourcePage: null,
      sourcePageCount: null,
      interactionMode: "idle",
      x: 0,
      y: 0,
      scale: 1,
      widthPx: 0,
      heightPx: 0,
      opacity: 0.45,
      mmPerUnit: null,
      calibrating: false,
      calibrationPoints: [],
      knownDistanceMm: 3000,
    },
    layerVisible: {
      underlay: true,
      walls: true,
      rooms: true,
      zones: true,
      furniture: true,
      measurements: true,
    },
  });
}

function setLoadedBlueprint(overrides: Record<string, unknown> = {}) {
  usePlannerWorkspaceStore.setState({
    blueprint: {
      ...usePlannerWorkspaceStore.getState().blueprint,
      dataUrl: "data:image/png;base64,loaded",
      sourceKind: "image",
      sourcePage: null,
      sourcePageCount: null,
      interactionMode: "idle",
      widthPx: 800,
      heightPx: 600,
      x: 10,
      y: 20,
      scale: 1,
      opacity: 0.45,
      mmPerUnit: 2.5,
      calibrating: false,
      calibrationPoints: [],
      knownDistanceMm: 3000,
      ...overrides,
    },
  });
}

function getHiddenFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("BlueprintPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetBlueprintStore();
    vi.stubGlobal("Image", MockImage);
    vi.stubGlobal("FileReader", MockFileReader);
    getPdfPageCount.mockResolvedValue(3);
    pdfPageToDataUrl.mockResolvedValue("data:image/png;base64,pdfpage");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows guest import message and hides import button", () => {
    render(<BlueprintPanel guestMode />);
    expect(screen.getByText(/Sign in to import/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Import image or PDF/i })).not.toBeInTheDocument();
  });

  it("imports an image blueprint", async () => {
    const { container } = render(<BlueprintPanel />);
    const file = new File(["png"], "plan.png", { type: "image/png" });
    fireEvent.change(getHiddenFileInput(container), { target: { files: [file] } });

    await waitFor(() =>
      expect(usePlannerWorkspaceStore.getState().blueprint.dataUrl).toBe(
        "data:image/png;base64,abc",
      ),
    );
    expect(screen.getByText(/Imported image blueprint underlay/i)).toBeInTheDocument();
  });

  it("imports a multi-page PDF blueprint", async () => {
    const { container } = render(<BlueprintPanel />);
    const file = new File(["pdf"], "plan.pdf", { type: "application/pdf" });
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => new ArrayBuffer(8),
    });
    fireEvent.change(getHiddenFileInput(container), { target: { files: [file] } });

    await waitFor(() =>
      expect(usePlannerWorkspaceStore.getState().blueprint.sourceKind).toBe("pdf"),
    );
    expect(screen.getByText(/Imported PDF page 1 of 3/i)).toBeInTheDocument();
  });

  it("imports a single-page PDF blueprint", async () => {
    getPdfPageCount.mockResolvedValueOnce(1);
    const { container } = render(<BlueprintPanel />);
    const file = new File(["pdf"], "plan.pdf", { type: "application/pdf" });
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => new ArrayBuffer(8),
    });
    fireEvent.change(getHiddenFileInput(container), { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByText(/Imported PDF blueprint underlay/i)).toBeInTheDocument(),
    );
  });

  it("shows validation errors for unsupported and oversized files", () => {
    const { container } = render(<BlueprintPanel />);
    const unsupported = new File(["txt"], "notes.txt", { type: "text/plain" });
    fireEvent.change(getHiddenFileInput(container), { target: { files: [unsupported] } });
    expect(screen.getByText(/Use PNG, JPG, WebP, or PDF/i)).toBeInTheDocument();

    const oversized = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(oversized, "size", { value: 9 * 1024 * 1024 });
    fireEvent.change(getHiddenFileInput(container), { target: { files: [oversized] } });
    expect(screen.getByText(/8 MB or smaller/i)).toBeInTheDocument();
  });

  it("shows import errors for PDF render, image load, and read failures", async () => {
    getPdfPageCount.mockRejectedValueOnce(new Error("pdf fail"));
    const { container, rerender } = render(<BlueprintPanel />);
    const pdf = new File(["pdf"], "plan.pdf", { type: "application/pdf" });
    Object.defineProperty(pdf, "arrayBuffer", { value: async () => new ArrayBuffer(8) });
    fireEvent.change(getHiddenFileInput(container), { target: { files: [pdf] } });
    await waitFor(() =>
      expect(screen.getByText(/PDF blueprint could not be rendered/i)).toBeInTheDocument(),
    );

    resetBlueprintStore();
    rerender(<BlueprintPanel />);
    pdfPageToDataUrl.mockResolvedValueOnce("data:image/png;base64,fail-image");
    const pdf2 = new File(["pdf"], "plan2.pdf", { type: "application/pdf" });
    Object.defineProperty(pdf2, "arrayBuffer", { value: async () => new ArrayBuffer(8) });
    fireEvent.change(getHiddenFileInput(container), { target: { files: [pdf2] } });
    await waitFor(() =>
      expect(screen.getByText(/Blueprint image could not be loaded/i)).toBeInTheDocument(),
    );

    resetBlueprintStore();
    rerender(<BlueprintPanel />);
    const badRead = new File(["png"], "fail-read.png", { type: "image/png" });
    fireEvent.change(getHiddenFileInput(container), { target: { files: [badRead] } });
    await waitFor(() =>
      expect(screen.getByText(/Blueprint image could not be read/i)).toBeInTheDocument(),
    );
  });

  it("removes blueprint and edits loaded controls", async () => {
    setLoadedBlueprint();
    const { unmount } = render(<BlueprintPanel embedded />);

    fireEvent.click(screen.getByRole("button", { name: "Remove blueprint" }));
    expect(usePlannerWorkspaceStore.getState().blueprint.dataUrl).toBeNull();
    unmount();

    setLoadedBlueprint({ interactionMode: "idle", calibrating: false });
    render(<BlueprintPanel />);
    const underlayToggle = screen.getAllByRole("checkbox")[0]!;
    expect(underlayToggle).toBeChecked();

    fireEvent.click(underlayToggle);
    expect(usePlannerWorkspaceStore.getState().layerVisible.underlay).toBe(false);

    const opacity = screen.getByLabelText(/Opacity/i) as HTMLInputElement;
    fireEvent.change(opacity, { target: { value: "0.6" } });
    expect(usePlannerWorkspaceStore.getState().blueprint.opacity).toBeCloseTo(0.6);

    const scale = screen.getAllByRole("slider")[1]!;
    fireEvent.change(scale, { target: { value: "1.5" } });
    expect(usePlannerWorkspaceStore.getState().blueprint.scale).toBeCloseTo(1.5);

    fireEvent.change(screen.getByLabelText("Blueprint scale percent"), {
      target: { value: "200" },
    });
    expect(usePlannerWorkspaceStore.getState().blueprint.scale).toBeCloseTo(2);

    fireEvent.click(screen.getByRole("button", { name: /Calibrate/i }));
    expect(usePlannerWorkspaceStore.getState().blueprint.calibrating).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /Move on canvas/i }));
    expect(usePlannerWorkspaceStore.getState().blueprint.interactionMode).toBe("move");
    fireEvent.click(screen.getByRole("button", { name: /Finish move/i }));
    expect(usePlannerWorkspaceStore.getState().blueprint.interactionMode).toBe("idle");

    fireEvent.change(screen.getByLabelText("Known distance in millimetres"), {
      target: { value: "4500" },
    });
    expect(usePlannerWorkspaceStore.getState().blueprint.knownDistanceMm).toBe(4500);

    fireEvent.click(screen.getByRole("button", { name: "Nudge blueprint up" }));
    fireEvent.click(screen.getByRole("button", { name: "Nudge blueprint left" }));
    fireEvent.click(screen.getByRole("button", { name: "Nudge blueprint right" }));
    fireEvent.click(screen.getByRole("button", { name: "Nudge blueprint down" }));
    fireEvent.click(screen.getByRole("button", { name: "Center blueprint offsets" }));
    fireEvent.click(screen.getByRole("button", { name: /Reset transform/i }));

    const offsetInputs = Array.from(document.querySelectorAll('input[type="number"]')).filter(
      (input) => !input.getAttribute("aria-label"),
    );
    fireEvent.change(offsetInputs.at(-2)!, { target: { value: "42" } });
    fireEvent.change(offsetInputs.at(-1)!, { target: { value: "24" } });
    expect(usePlannerWorkspaceStore.getState().blueprint.x).toBe(42);
    expect(usePlannerWorkspaceStore.getState().blueprint.y).toBe(24);

    expect(screen.getByText(/mm per canvas unit/i)).toBeInTheDocument();

    cleanup();
    setLoadedBlueprint({ calibrating: true, interactionMode: "idle", mmPerUnit: null });
    render(<BlueprintPanel />);
    expect(screen.getByText(/Click two points on the plan/i)).toBeInTheDocument();

    cleanup();
    setLoadedBlueprint({ calibrating: false, interactionMode: "move" });
    render(<BlueprintPanel />);
    expect(screen.getByText(/Drag directly on the canvas/i)).toBeInTheDocument();
  });

  it("navigates PDF pages when session is active", async () => {
    cleanup();
    const { container } = render(<BlueprintPanel />);
    const file = new File(["pdf"], "plan.pdf", { type: "application/pdf" });
    Object.defineProperty(file, "arrayBuffer", { value: async () => new ArrayBuffer(8) });
    fireEvent.change(getHiddenFileInput(container), { target: { files: [file] } });
    await waitFor(() => expect(screen.getAllByText(/PDF page 1 of 3/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole("button", { name: "Next PDF page" }));
    await waitFor(() =>
      expect(usePlannerWorkspaceStore.getState().blueprint.sourcePage).toBe(2),
    );

    fireEvent.change(screen.getByLabelText("PDF page number"), { target: { value: "3" } });
    await waitFor(() =>
      expect(usePlannerWorkspaceStore.getState().blueprint.sourcePage).toBe(3),
    );
  });

  it("shows reimport hint when pdf session is unavailable", () => {
    setLoadedBlueprint({
      sourceKind: "pdf",
      sourcePage: 2,
      sourcePageCount: 4,
    });
    render(<BlueprintPanel />);
    expect(screen.getByText(/Reimport to change page/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next PDF page" })).toBeDisabled();
  });
});