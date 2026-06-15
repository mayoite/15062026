/**
 * Buddy BOQ Export Adapter — Phase 07
 *
 * Converts Buddy planner element state into PdfBoqRow[] for the shared
 * PDF export pipeline. Buddy elements use a different shape than Oando's
 * FurnitureItem[], so this adapter bridges the gap.
 */

import type { PdfBoqRow } from "./pdfExport";
import type { ExportLayout } from "./types";

/**
 * Minimal shape expected from Buddy's element store.
 * Matches what `useBuddyElementsStore` exposes for placed elements.
 */
export type BuddyExportElement = {
  id: string;
  type: string;
  label?: string;
  name?: string;
  category?: string;
  width: number;
  height: number;
  depth?: number;
  shape?: string;
  catalogId?: string;
};

/**
 * Buddy element type → human-readable category mapping.
 */
const TYPE_TO_CATEGORY: Record<string, string> = {
  "table-rect": "Tables",
  "table-conference": "Tables",
  "table-round": "Tables",
  "table-oval": "Tables",
  desk: "Desks",
  "hot-desk": "Desks",
  workstation: "Desks",
  "private-office": "Desks",
  "conference-room": "Rooms",
  "phone-booth": "Rooms",
  "common-area": "Rooms",
  chair: "Seating",
  sofa: "Furniture",
  plant: "Furniture",
  printer: "Equipment",
  whiteboard: "Equipment",
  divider: "Structure",
  planter: "Furniture",
  counter: "Facilities",
  decor: "Furniture",
  "custom-shape": "Custom",
  "text-label": "Labels",
};

/**
 * Elements that should NOT appear in a BOQ (non-physical items).
 */
const EXCLUDED_TYPES = new Set(["text-label", "custom-svg"]);

/**
 * Convert Buddy elements into PdfBoqRow entries, grouped and counted.
 */
export function buddyElementsToBoqRows(elements: BuddyExportElement[]): PdfBoqRow[] {
  const filtered = elements.filter((el) => !EXCLUDED_TYPES.has(el.type));

  // Group by type + shape + dimensions (same item = same BOQ line)
  const grouped = new Map<string, { element: BuddyExportElement; count: number }>();

  for (const el of filtered) {
    const key = `${el.type}|${el.shape ?? ""}|${el.width}x${el.height}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.count++;
    } else {
      grouped.set(key, { element: el, count: 1 });
    }
  }

  const rows: PdfBoqRow[] = [];
  for (const { element, count } of grouped.values()) {
    rows.push({
      name: element.label ?? element.name ?? element.type,
      category: element.category ?? TYPE_TO_CATEGORY[element.type] ?? "Other",
      quantity: count,
      widthCm: Math.round(element.width / 10),
      depthCm: Math.round((element.depth ?? element.height) / 10),
      heightCm: 75, // default desk height when not specified
    });
  }

  return rows;
}

/**
 * Build an ExportLayout from Buddy project metadata.
 */
export function buildBuddyExportLayout(opts: {
  projectName: string;
  clientName?: string;
  roomWidthMm?: number;
  roomDepthMm?: number;
}): ExportLayout {
  return {
    projectName: opts.projectName || "Buddy Workspace Plan",
    clientName: opts.clientName,
    roomWidthMm: opts.roomWidthMm ?? 6000,
    roomDepthMm: opts.roomDepthMm ?? 4000,
    unitSystem: "metric",
    generatedAt: new Date().toISOString(),
  };
}
