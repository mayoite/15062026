import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildExportMeta,
  downloadPlannerBoqPdf,
  downloadPlannerJson,
  PlannerExportError,
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

  it("buildExportMeta matches canvas cm shape props after legacy repair", () => {
    const editor = createPlannerEditorMock({
      shapes: [
        makeShape("shape:1", "planner-furniture", {
          catalogId: "desk",
          productName: "Desk",
          widthMm: 120,
          heightMm: 60,
        }),
      ],
    });
    editor.store = { listen: vi.fn() } as never;

    const meta = buildExportMeta(editor);
    expect(meta.furniture[0]).toMatchObject({
      name: "Desk",
      widthMm: 1200,
      depthMm: 600,
      spec: "1200×600×750 mm",
    });
  });

  it("buildExportMeta normalizes furniture dimensions to mm", () => {
    const editor = createPlannerEditorMock({
      shapes: [
        makeShape("shape:1", "planner-furniture", {
          catalogId: "desk",
          productName: "Desk",
          widthMm: 1200,
          heightMm: 600,
        }),
        makeShape("shape:room", "planner-room", { widthMm: 600, heightMm: 400 }),
      ],
    });
    editor.store = { listen: vi.fn() } as never;

    const meta = buildExportMeta(editor);
    expect(meta.canonicalUnit).toBe("mm");
    expect(meta.furniture[0]).toMatchObject({
      name: "Desk",
      widthMm: 1200,
      depthMm: 600,
      spec: "1200×600×750 mm",
    });
    expect(meta.room).toMatchObject({ widthMm: 6000, depthMm: 4000 });
  });

  it("downloads planner json envelope with exportMeta", () => {
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

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toContain("json");
  });

  it("downloadPlannerSvg inlines theme tokens into exported svg", async () => {
    const svg = '<svg><path fill="var(--block-surface)" stroke="var(--color-accent)"/></svg>';
    const click = vi.fn();
    const createObjectURL = vi.fn(() => "blob:svg");
    const revokeObjectURL = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click,
    } as HTMLAnchorElement);
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const editor = createPlannerEditorMock({
      shapes: [
        makeShape("shape:1", "planner-wall"),
        makeShape("shape:2", "planner-furniture", { productName: "Desk" }),
      ],
    });
    editor.getSvgString = vi.fn(async () => ({ svg, width: 100, height: 80 })) as never;
    editor.store = { listen: vi.fn() } as never;

    const { downloadPlannerSvg } = await import("@/features/planner/editor/exportActions");
    await downloadPlannerSvg(editor);

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const text = await blob.text();
    expect(text).not.toContain("var(--");
    expect(click).toHaveBeenCalled();
  });

  it("getVectorExportShapeIds skips layer-hidden shapes", async () => {
    const { getVectorExportShapeIds } = await import("@/features/planner/editor/exportActions");
    const editor = createPlannerEditorMock({
      shapes: [
        makeShape("shape:1", "planner-wall"),
        makeShape("shape:2", "planner-furniture", {}, { meta: { layerHidden: true } }),
      ],
    });
    expect(getVectorExportShapeIds(editor)).toEqual(["shape:1"]);
  });

  it("throws PlannerExportError when svg export has no shapes", async () => {
    const editor = createPlannerEditorMock();
    editor.getSelectedShapeIds = vi.fn(() => []);
    editor.getCurrentPageShapeIds = vi.fn(() => new Set());
    editor.getSvgString = vi.fn() as never;

    const { downloadPlannerSvg } = await import("@/features/planner/editor/exportActions");
    await expect(downloadPlannerSvg(editor)).rejects.toBeInstanceOf(PlannerExportError);
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
          expect.objectContaining({
            name: "Desk",
            quantity: expect.any(Number),
            widthCm: 120,
            depthCm: 60,
            spec: "1200×600×750 mm",
          }),
        ]),
      }),
    );
  });

  it("passes room dimensions into pdf layout", async () => {
    const { exportBoqToPdf } = await import("@/features/planner/shared/export/pdfExport");
    const editor = createPlannerEditorMock({
      shapes: [
        makeShape("shape:room", "planner-room", { widthMm: 600, heightMm: 400 }),
        makeShape("shape:1", "planner-furniture", {
          productName: "Desk",
          widthMm: 120,
          heightMm: 60,
        }),
      ],
    });
    editor.store = { listen: vi.fn() } as never;

    await downloadPlannerBoqPdf(editor, "HQ Plan");
    expect(exportBoqToPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.objectContaining({
          projectName: "HQ Plan",
          roomWidthMm: 6000,
          roomDepthMm: 4000,
        }),
      }),
    );
  });
});
