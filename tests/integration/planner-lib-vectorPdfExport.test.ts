import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const drawImage = vi.fn();
const drawText = vi.fn();

vi.mock("pdf-lib", async () => {
  const actual = await vi.importActual("pdf-lib");
  return {
    ...actual,
    PDFDocument: {
      create: vi.fn(async () => ({
        setTitle: vi.fn(),
        setCreator: vi.fn(),
        embedFont: vi.fn(async () => ({})),
        embedPng: vi.fn(async () => ({
          scale: () => ({ width: 40, height: 20 }),
          scaleToFit: () => ({ width: 200, height: 100 }),
        })),
        embedJpg: vi.fn(async () => ({
          scale: () => ({ width: 40, height: 20 }),
        })),
        addPage: vi.fn(() => ({
          getSize: () => ({ width: 595, height: 842 }),
          drawText,
          drawImage,
        })),
        save: vi.fn(async () => new Uint8Array([37, 80, 68, 70])),
      })),
    },
  };
});

import { createPlannerPdf } from "@/features/planner/lib/vectorPdfExport";

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 120;
  naturalHeight = 60;
  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

describe("planner vector pdf export", () => {
  const originalImage = globalThis.Image;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;

  beforeEach(() => {
    drawImage.mockClear();
    drawText.mockClear();
    vi.stubGlobal("Image", MockImage);
    URL.createObjectURL = vi.fn(() => "blob:mock");
    URL.revokeObjectURL = vi.fn();
    HTMLCanvasElement.prototype.toDataURL = vi.fn(
      () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    );
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
    })) as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    vi.stubGlobal("Image", originalImage);
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
    vi.restoreAllMocks();
  });

  it("creates a multi-page PDF with title and page numbers", async () => {
    const bytes = await createPlannerPdf({
      title: "North Bay",
      pages: [{ svgContent: "" }, { svgContent: "" }],
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(drawText).toHaveBeenCalled();
  });

  it("embeds SVG content and logo images when rendering succeeds", async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect width="100" height="50" fill="white"/></svg>';

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]).buffer,
    } as Response);

    const bytes = await createPlannerPdf({
      title: "Rendered",
      pages: [{ svgContent: svg }],
      logoPath: "/logo.png",
    });

    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(drawImage).toHaveBeenCalled();
  });

  it("supports jpg logos and webp rasterization", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new Uint8Array([255, 216, 255, 224]).buffer,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new Uint8Array([82, 73, 70, 70]).buffer,
      } as Response);

    await createPlannerPdf({
      title: "Logo JPG",
      pages: [{ svgContent: "" }],
      logoPath: "/logo.jpg",
    });
    await createPlannerPdf({
      title: "Logo WEBP",
      pages: [{ svgContent: "" }],
      logoPath: "/logo.webp",
    });

    expect(drawText).toHaveBeenCalled();
  });

  it("continues when logo fetch or SVG rendering fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    class BrokenImage extends MockImage {
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal("Image", BrokenImage);

    const bytes = await createPlannerPdf({
      title: "Fallback",
      pages: [{ svgContent: "<svg></svg>" }],
      logoPath: "/missing.png",
    });

    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(drawText).toHaveBeenCalledWith("[SVG rendering failed]", expect.any(Object));
  });
});
