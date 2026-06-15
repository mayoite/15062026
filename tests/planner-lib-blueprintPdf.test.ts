import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPage, destroy, getDocument } = vi.hoisted(() => ({
  getPage: vi.fn(),
  destroy: vi.fn(),
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage,
      destroy,
    }),
  })),
}));

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument,
}));

import { getPdfPageCount, pdfPageToDataUrl, renderPdfPageToCanvas } from "@/features/planner/lib/blueprintPdf";

describe("planner blueprint pdf", () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
    })) as typeof HTMLCanvasElement.prototype.getContext;

    getPage.mockReset();
    destroy.mockReset();
    getDocument.mockClear();

    getPage.mockResolvedValue({
      getViewport: () => ({ width: 120, height: 80 }),
      render: () => ({ promise: Promise.resolve() }),
    });
  });

  it("renders a PDF page to canvas from an ArrayBuffer", async () => {
    const canvas = await renderPdfPageToCanvas(new ArrayBuffer(8), 1, 2);

    expect(getDocument).toHaveBeenCalled();
    expect(canvas.width).toBe(120);
    expect(canvas.height).toBe(80);
    expect(destroy).toHaveBeenCalled();
  });

  it("renders a PDF page from a File input", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "plan.pdf", { type: "application/pdf" });
    await renderPdfPageToCanvas(file);
    expect(getDocument).toHaveBeenCalled();
  });

  it("returns the page count and converts pages to data URLs", async () => {
    await expect(getPdfPageCount(new ArrayBuffer(4))).resolves.toBe(2);

    const dataUrl = await pdfPageToDataUrl(new ArrayBuffer(4));
    expect(dataUrl.startsWith("data:image/png")).toBe(true);
  });

  it("throws when canvas context is unavailable", async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

    await expect(renderPdfPageToCanvas(new ArrayBuffer(4))).rejects.toThrow(
      "Could not get 2d context from canvas",
    );
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });
});