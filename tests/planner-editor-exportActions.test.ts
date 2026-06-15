import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  downloadPlannerBoqPdf,
  downloadPlannerJson,
} from "@/features/planner/editor/exportActions";
import { createPlannerEditorMock, makeShape } from "./planner-editor-mockEditor";

vi.mock("tldraw", () => ({
  getSnapshot: vi.fn(() => ({ store: { version: 1 } })),
}));

vi.mock("@/features/planner/document/plannerDocumentBridge", () => ({
  buildPlannerDocumentFromEditor: vi.fn(() => ({ version: 1, shapes: [] })),
}));

vi.mock("@/features/planner/persistence/plannerSession", () => ({
  buildSessionEnvelope: vi.fn((snapshot) => ({ snapshot, savedAt: "now" })),
}));

vi.mock("@/features/planner/shared/export/pdfExport", () => ({
  exportBoqToPdf: vi.fn(async () => undefined),
}));

describe("exportActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div class="pw-canvas-surface"></div>';
  });

  it("downloads planner json envelope", () => {
    const click = vi.fn();
    const createObjectURL = vi.fn(() => "blob:test");
    const revokeObjectURL = vi.fn();
    const createElement = vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click,
    } as HTMLAnchorElement);
    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL,
    });

    const editor = createPlannerEditorMock({
      shapes: [makeShape("shape:1", "planner-furniture", { catalogId: "desk", productName: "Desk" })],
    });
    editor.store = { listen: vi.fn() } as never;

    downloadPlannerJson(editor, "plan.json");
    expect(createElement).toHaveBeenCalledWith("a");
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("exports BOQ pdf without preset or canvas element", async () => {
    const { exportBoqToPdf } = await import("@/features/planner/shared/export/pdfExport");
    document.body.innerHTML = "";
    const editor = createPlannerEditorMock({
      shapes: [
        makeShape("shape:1", "planner-furniture", {
          label: "Bench",
          widthMm: 800,
          heightMm: 400,
        }),
        makeShape("shape:2", "planner-wall"),
      ],
    });
    editor.store = { listen: vi.fn() } as never;

    await downloadPlannerBoqPdf(editor);
    expect(exportBoqToPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        canvasElement: null,
        preset: undefined,
        rows: expect.arrayContaining([expect.objectContaining({ name: "Bench" })]),
      }),
    );
  });

  it("exports BOQ pdf with furniture rows", async () => {
    const { exportBoqToPdf } = await import("@/features/planner/shared/export/pdfExport");
    const editor = createPlannerEditorMock({
      shapes: [
        makeShape("shape:1", "planner-furniture", {
          catalogId: "ws-linear-120",
          productName: "Desk",
          widthMm: 1200,
          heightMm: 600,
        }),
        makeShape("shape:2", "planner-furniture", {
          catalogId: "hidden",
          productName: "Hidden",
          widthMm: 1200,
          heightMm: 600,
        }, { meta: { layerHidden: true } }),
      ],
    });
    editor.store = { listen: vi.fn() } as never;

    await downloadPlannerBoqPdf(editor, "Workspace Plan", "standard");
    expect(exportBoqToPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.objectContaining({ projectName: "Workspace Plan" }),
        rows: expect.arrayContaining([
          expect.objectContaining({ name: "Desk", quantity: expect.any(Number) }),
        ]),
      }),
    );
  });
});