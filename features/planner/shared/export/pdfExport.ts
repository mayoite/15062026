import type { ExportLayout } from "./types";
import type { ExportPreset } from "@/features/planner/lib/exportPresets";

export type PdfBoqRow = {
  sku?: string;
  name: string;
  category: string;
  quantity: number;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  unitPriceInr?: number;
  spec?: string;
};

export type PdfExportOptions = {
  layout: ExportLayout;
  rows: PdfBoqRow[];
  canvasElement?: HTMLElement | HTMLCanvasElement | null;
  fileName?: string;
  /** Optional branded output style preset */
  preset?: ExportPreset;
};

const BRAND_HEADER = "ONE&ONLY WORKSPACE PLANNER";
const PAGE_MARGIN = 14;
const ROW_HEIGHT = 8;
const HEADER_HEIGHT = 12;

function formatDim(cm: number): string {
  return `${Math.round(cm)} cm`;
}

function buildFileName(layout: ExportLayout): string {
  const project = layout.projectName.trim().replace(/\s+/g, "-").toLowerCase();
  return `oando-${project || "workspace"}-plan.pdf`;
}

async function captureCanvasDataUrl(
  el: HTMLElement | HTMLCanvasElement,
): Promise<string | null> {
  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(el as HTMLElement, {
      useCORS: true,
      scale: 1.5,
      backgroundColor: "#ffffff",
      logging: false,
    });
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export async function exportBoqToPdf(options: PdfExportOptions): Promise<void> {
  const { layout, rows, canvasElement, fileName } = options;

  const canvasImageDataUrl = canvasElement
    ? await captureCanvasDataUrl(canvasElement)
    : null;

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;

  let y = PAGE_MARGIN;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(10, 20, 30);
  pdf.text(BRAND_HEADER, PAGE_MARGIN, y + 6);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(80, 90, 100);
  pdf.text(
    new Date(layout.generatedAt).toLocaleDateString("en-GB"),
    pageWidth - PAGE_MARGIN,
    y + 6,
    { align: "right" },
  );

  y += 14;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(10, 20, 30);
  pdf.text(layout.projectName || "Untitled Plan", PAGE_MARGIN, y);
  y += 6;

  const metaItems: string[] = [];
  if (layout.clientName) metaItems.push(`Client: ${layout.clientName}`);
  if (layout.preparedBy) metaItems.push(`Prepared by: ${layout.preparedBy}`);
  if (layout.roomWidthMm > 0 && layout.roomDepthMm > 0) {
    metaItems.push(
      `Room: ${Math.round(layout.roomWidthMm / 10)} cm × ${Math.round(layout.roomDepthMm / 10)} cm`,
    );
  }

  if (metaItems.length > 0) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(80, 90, 100);
    pdf.text(metaItems.join("   ·   "), PAGE_MARGIN, y);
    y += 8;
  }

  if (canvasImageDataUrl) {
    const imgMaxH = pageHeight * 0.45;
    const imgMaxW = contentWidth * 0.6;
    pdf.addImage(
      canvasImageDataUrl,
      "PNG",
      PAGE_MARGIN,
      y,
      imgMaxW,
      imgMaxH,
      undefined,
      "FAST",
    );
    y += imgMaxH + 8;
  }

  if (y > pageHeight - 40) {
    pdf.addPage();
    y = PAGE_MARGIN;
  }

  const colWidths = [
    contentWidth * 0.20,
    contentWidth * 0.10,
    contentWidth * 0.10,
    contentWidth * 0.05,
    contentWidth * 0.1,
    contentWidth * 0.1,
    contentWidth * 0.1,
    contentWidth * 0.10,
    contentWidth * 0.14,
  ];
  const headers = ["Item", "Category", "SKU", "Qty", "Width", "Depth", "Height", "Unit Price", "Spec"];

  pdf.setFillColor(15, 25, 40);
  pdf.rect(PAGE_MARGIN, y, contentWidth, HEADER_HEIGHT, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(230, 240, 255);

  let colX = PAGE_MARGIN + 2;
  for (let i = 0; i < headers.length; i++) {
    pdf.text(headers[i], colX, y + HEADER_HEIGHT * 0.65);
    colX += colWidths[i];
  }
  y += HEADER_HEIGHT;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);

  rows.forEach((row, index) => {
    if (y + ROW_HEIGHT > pageHeight - PAGE_MARGIN) {
      pdf.addPage();
      y = PAGE_MARGIN;
    }

    if (index % 2 === 0) {
      pdf.setFillColor(240, 244, 250);
      pdf.rect(PAGE_MARGIN, y, contentWidth, ROW_HEIGHT, "F");
    }

    pdf.setTextColor(15, 25, 40);
    const cells = [
      row.name,
      row.category,
      row.sku ?? "—",
      String(row.quantity),
      formatDim(row.widthCm),
      formatDim(row.depthCm),
      formatDim(row.heightCm),
      row.unitPriceInr ? `₹${row.unitPriceInr.toLocaleString("en-IN")}` : "—",
      row.spec ?? "",
    ];

    colX = PAGE_MARGIN + 2;
    for (let i = 0; i < cells.length; i++) {
      const maxChars = Math.floor(colWidths[i] / 2.1);
      const cell =
        cells[i].length > maxChars
          ? cells[i].slice(0, maxChars - 1) + "…"
          : cells[i];
      pdf.text(cell, colX, y + ROW_HEIGHT * 0.68);
      colX += colWidths[i];
    }

    y += ROW_HEIGHT;
  });

  y += 4;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(10, 20, 30);
  pdf.text(
    `Total items: ${rows.reduce((sum, r) => sum + r.quantity, 0)}  ·  ${rows.length} line${rows.length !== 1 ? "s" : ""}`,
    PAGE_MARGIN,
    y,
  );

  const outputFileName = fileName ?? buildFileName(layout);
  pdf.save(outputFileName);
}
