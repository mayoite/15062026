"use client";

import * as pdfjsLib from "pdfjs-dist";

// Configure worker - use bundled worker from pdfjs-dist
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
}

type PdfInput = File | ArrayBuffer;

async function toArrayBuffer(input: PdfInput): Promise<ArrayBuffer> {
  if (input instanceof File) {
    return input.arrayBuffer();
  }
  return input;
}

/**
 * Renders a single PDF page to an HTMLCanvasElement.
 */
export async function renderPdfPageToCanvas(
  file: PdfInput,
  pageNum = 1,
  scale = 2,
): Promise<HTMLCanvasElement> {
  const data = await toArrayBuffer(file);
  const doc = await pdfjsLib.getDocument({ data }).promise;
  try {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2d context from canvas");

    await page.render({ canvas, viewport }).promise;
    return canvas;
  } finally {
    if ("destroy" in doc && typeof doc.destroy === "function") {
      await doc.destroy();
    }
  }
}

/**
 * Returns the number of pages in a PDF document.
 */
export async function getPdfPageCount(file: PdfInput): Promise<number> {
  const data = await toArrayBuffer(file);
  const doc = await pdfjsLib.getDocument({ data }).promise;
  try {
    return doc.numPages;
  } finally {
    if ("destroy" in doc && typeof doc.destroy === "function") {
      await doc.destroy();
    }
  }
}

/**
 * Converts a PDF page to a data URL suitable for use as a blueprint underlay image.
 */
export async function pdfPageToDataUrl(
  file: PdfInput,
  pageNum = 1,
  scale = 2,
): Promise<string> {
  const canvas = await renderPdfPageToCanvas(file, pageNum, scale);
  return canvas.toDataURL("image/png");
}
