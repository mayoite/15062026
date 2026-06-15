/**
 * Parse planner product CSVs into catalog items.
 * Source files live under features/planner/catalog/ingest/csv/.
 */

import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { PlannerCatalogShapeType } from "@/features/planner/catalog/shapeTypeRegistry";

export type CsvWorkstationRow = {
  series: string;
  name: string;
  seaters: number;
  lengthMm: number;
  depthMm: number;
  isSharing: boolean;
  shape: "straight" | "l-shape";
  armLengthMm?: number;
};

const CSV_DIR = "features/planner/catalog/ingest/csv";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/** Catalog uses compact dims; values under 500 are scaled ×10 on canvas. */
export function toCatalogDim(mm: number): number {
  return mm >= 500 ? Math.round(mm / 10) : mm;
}

function seriesFromContent(firstLines: string): string {
  const productMatch = firstLines.match(/PRODUCT:\s*([^\n,]+)/i);
  if (productMatch) return productMatch[1].trim();
  const lineMatch = firstLines.match(/^([A-Z][^\n,]{3,60})/m);
  if (lineMatch) return lineMatch[1].trim();
  return "Workstation";
}

function parseLinearRows(series: string, lines: string[]): CsvWorkstationRow[] {
  const rows: CsvWorkstationRow[] = [];
  let mode: "NS" | "SH" = "NS";

  for (const line of lines) {
    if (/WORKSTATION:\s*SHARING/i.test(line)) {
      mode = "SH";
      continue;
    }
    if (/WORKSTATION:\s*NON\s*SHARING/i.test(line)) {
      mode = "NS";
      continue;
    }

    const lShapeInline = line.match(/(\d{3,4})\s*-\s*(\d{3,4})\s*X\s*(\d{3,4})/i);
    if (lShapeInline) {
      const prev = rows[rows.length - 1];
      if (prev) {
        rows.push({
          ...prev,
          lengthMm: parseInt(lShapeInline[2], 10),
          armLengthMm: parseInt(lShapeInline[1], 10),
          depthMm: parseInt(lShapeInline[3], 10),
          shape: "l-shape",
          name: prev.name.replace(/\(\d+mm\)/, `(${lShapeInline[2]}mm)`),
        });
      }
      continue;
    }

    if (/seater/i.test(line)) {
      const parts = line.split(",");
      const desc = (parts[1] ?? "").trim();
      const length = parseInt((parts[2] ?? "").trim(), 10);
      if (!desc || Number.isNaN(length)) continue;
      const seaters = parseInt(desc.split(/\s+/)[0], 10);
      if (Number.isNaN(seaters)) continue;
      const isSharing = mode === "SH" || /\bSH\b/i.test(desc);
      rows.push({
        series,
        name: `${desc} (${length}mm)`,
        seaters,
        lengthMm: length,
        depthMm: isSharing ? 1200 : 600,
        isSharing,
        shape: "straight",
      });
      continue;
    }

    const lengthOnly = line.trim().match(/^,,(\d{3,4})$/);
    if (lengthOnly) {
      const length = parseInt(lengthOnly[1], 10);
      const prev = rows[rows.length - 1];
      if (prev) {
        rows.push({
          ...prev,
          lengthMm: length,
          name: `${prev.name.split(" (")[0]} (${length}mm)`,
        });
      }
    }
  }

  return rows;
}

function parseLShapeGrid(series: string, lines: string[]): CsvWorkstationRow[] {
  const rows: CsvWorkstationRow[] = [];
  let mode: "NS" | "SH" = "NS";
  let currentSeaters = 0;
  let currentLabel = "";

  for (const line of lines) {
    if (/WORKSTATION:\s*SHARING/i.test(line)) {
      mode = "SH";
      continue;
    }
    if (/WORKSTATION:\s*NON\s*SHARING/i.test(line)) {
      mode = "NS";
      continue;
    }

    const descMatch = line.match(/^\d+,([^,]+),/);
    if (descMatch && /seater/i.test(descMatch[1])) {
      currentLabel = descMatch[1].trim();
      currentSeaters = parseInt(currentLabel.split(/\s+/)[0], 10) || 0;
      continue;
    }

    const gridMatch = line.match(/,,(\d{3,4}),.*?(\d{3,4}),X,(\d{3,4})/i);
    if (gridMatch && currentSeaters > 0) {
      const armLengthMm = parseInt(gridMatch[1], 10);
      const lengthMm = parseInt(gridMatch[2], 10);
      const depthMm = parseInt(gridMatch[3], 10);
      const isSharing = mode === "SH" || /\bSH\b/i.test(currentLabel);
      rows.push({
        series,
        name: `${currentLabel} L (${lengthMm}mm)`,
        seaters: currentSeaters,
        lengthMm,
        depthMm,
        armLengthMm,
        isSharing,
        shape: "l-shape",
      });
    }
  }

  return rows;
}

function parseCabinTables(series: string, lines: string[]): CsvWorkstationRow[] {
  const rows: CsvWorkstationRow[] = [];
  for (const line of lines) {
    const match = line.match(/^\d+,([^,]+),(\d{3,4})\s*X\s*(\d{3,4})/i);
    if (!match) continue;
    const label = match[1].trim();
    const lengthMm = parseInt(match[2], 10);
    const depthMm = parseInt(match[3], 10);
    rows.push({
      series,
      name: `${label} (${lengthMm}×${depthMm}mm)`,
      seaters: 1,
      lengthMm,
      depthMm,
      isSharing: false,
      shape: "straight",
    });
  }
  return rows;
}

function parseAccessories(series: string, lines: string[]): CatalogItem[] {
  const items: CatalogItem[] = [];
  let section = "accessory";

  for (const line of lines) {
    if (/^SCREEN/i.test(line)) section = "screen";
    if (/^KEYBOARD/i.test(line)) section = "keyboard";
    if (/^CPU/i.test(line)) section = "cpu";

    const match = line.match(/^\d+,([^,]+)/);
    if (!match) continue;
    const name = match[1].trim();
    if (!name || name.toLowerCase() === "item name") continue;

    const id = slugify(`acc-${section}-${name}`);
    items.push({
      id,
      name,
      category: "equipment",
      shapeType: PlannerCatalogShapeType.desk,
      widthMm: 40,
      heightMm: 30,
      depthMm: 30,
      seatCount: 1,
      description: `${series} — ${section}`,
      tags: [section, "accessory", slugify(series)],
    });
  }

  return items;
}

export function rowToCatalogItem(row: CsvWorkstationRow, index: number): CatalogItem {
  const seriesSlug = slugify(row.series);
  const id = `${seriesSlug}-${slugify(row.name)}-${index}`;
  const isBench = row.seaters > 1 || row.isSharing;
  const runLengthMm =
    row.shape === "straight"
      ? row.seaters * row.lengthMm
      : row.shape === "l-shape" && row.armLengthMm
        ? Math.max(row.lengthMm, row.armLengthMm)
        : row.lengthMm;
  const widthMm = toCatalogDim(runLengthMm);
  const heightMm = toCatalogDim(row.depthMm);

  return {
    id,
    name: `${row.series} — ${row.name}`,
    category: "desks",
    shapeType: isBench ? PlannerCatalogShapeType.bench : PlannerCatalogShapeType.desk,
    widthMm,
    heightMm,
    depthMm: heightMm,
    seatCount: row.seaters,
    description: `${row.isSharing ? "Sharing" : "Non-sharing"} ${row.shape} workstation`,
    tags: [
      row.shape,
      row.isSharing ? "sharing" : "non-sharing",
      `${row.seaters}-seater`,
      seriesSlug,
    ],
  };
}

export function parseCsvFile(relativePath: string, raw: string): CatalogItem[] {
  const series = seriesFromContent(raw.slice(0, 600));
  const lines = raw.split(/\r?\n/);
  const lower = raw.toLowerCase();

  if (lower.includes("accessories")) {
    return parseAccessories(series, lines);
  }

  if (lower.includes("cabin tables")) {
    return parseCabinTables(series, lines).map(rowToCatalogItem);
  }

  if (lower.includes("l shape") && lower.includes("l1 x l2")) {
    return parseLShapeGrid(series, lines).map((row, i) => rowToCatalogItem(row, i));
  }

  const linear = parseLinearRows(series, lines);
  if (linear.length > 0) {
    return linear.map((row, i) => rowToCatalogItem(row, i));
  }

  if (lower.includes("l shape")) {
    return parseLShapeGrid(series, lines).map((row, i) => rowToCatalogItem(row, i));
  }

  return [];
}

export const PLANNER_CSV_FILES = [
  "Workstation and basic storages website.csv",
  "Workstation and basic storages website2.csv",
  "Workstation and basic storages website3.csv",
  "Workstation and basic storages website4.csv",
  "Workstation and basic storages website6.csv",
  "Workstation and basic storages website7.csv",
  "Workstation and basic storages website9.csv",
  "Workstation and basic storages website10.csv",
  "Workstation and basic storages website11.csv",
  "Workstation and basic storages website13.csv",
] as const;

export function dedupeCatalogItems(items: CatalogItem[]): CatalogItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.name}|${item.widthMm}|${item.heightMm}|${item.seatCount ?? 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { CSV_DIR };
