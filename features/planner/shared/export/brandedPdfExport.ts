/**
 * Branded PDF Export — Phase 07
 *
 * High-level export that wraps the base pdfExport with One&Only branding:
 * - Company logo placeholder
 * - Consistent header/footer with project info
 * - Theme-aware color scheme (uses CSS var fallbacks)
 * - Works for both Oando and Buddy planners
 */

import type { PdfBoqRow, PdfExportOptions } from "./pdfExport";
import { exportBoqToPdf } from "./pdfExport";
import type { ExportLayout } from "./types";

export type BrandedExportOptions = {
  /** Project/layout metadata */
  layout: ExportLayout;
  /** BOQ line items */
  rows: PdfBoqRow[];
  /** Optional canvas element for floor plan screenshot */
  canvasElement?: HTMLElement | HTMLCanvasElement | null;
  /** Brand name override (defaults to "One&Only") */
  brandName?: string;
  /** Custom filename (auto-generated if omitted) */
  fileName?: string;
  /** Include cover page with project summary */
  includeCoverPage?: boolean;
};

/**
 * Generate a branded PDF with project metadata, BOQ table, and optional
 * floor plan screenshot. Delegates to the base exportBoqToPdf after
 * enriching the layout with branding.
 */
export async function exportBrandedPdf(options: BrandedExportOptions): Promise<void> {
  const {
    layout,
    rows,
    canvasElement,
    brandName = "One&Only",
    fileName,
    includeCoverPage: _includeCoverPage,
  } = options;

  // Enrich layout with brand context
  const enrichedLayout: ExportLayout = {
    ...layout,
    projectName: layout.projectName || "Workspace Plan",
    preparedBy: layout.preparedBy ?? `${brandName} Space Planner`,
  };

  // Build filename
  const projectSlug = enrichedLayout.projectName
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  const date = new Date().toISOString().split("T")[0];
  const exportFileName =
    fileName ?? `${brandName.toLowerCase().replace(/[^a-z0-9]/g, "")}-${projectSlug}-boq-${date}.pdf`;

  const pdfOptions: PdfExportOptions = {
    layout: enrichedLayout,
    rows,
    canvasElement,
    fileName: exportFileName,
  };

  await exportBoqToPdf(pdfOptions);
}

/**
 * Quick BOQ-only export (no canvas screenshot).
 * Useful for "Download BOQ" buttons in both planners.
 */
export async function exportBoqOnly(
  projectName: string,
  rows: PdfBoqRow[],
  opts?: { clientName?: string; brandName?: string },
): Promise<void> {
  const layout: ExportLayout = {
    projectName,
    clientName: opts?.clientName,
    roomWidthMm: 0,
    roomDepthMm: 0,
    unitSystem: "metric",
    generatedAt: new Date().toISOString(),
  };

  await exportBrandedPdf({
    layout,
    rows,
    brandName: opts?.brandName ?? "One&Only",
  });
}
