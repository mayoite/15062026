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

export type CsvSourceFamily =
  | "accessories"
  | "privacy-screens"
  | "cabin-tables"
  | "storage-discrete"
  | "l-shape-grid"
  | "linear-workstations"
  | "unclassified";

export type CatalogIngestWarning = {
  file: string;
  family: CsvSourceFamily;
  line?: number;
  reason: string;
  snippet?: string;
};

export type ParsedCatalogCsv = {
  family: CsvSourceFamily;
  items: CatalogItem[];
  warnings: CatalogIngestWarning[];
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

function detectCsvSourceFamily(raw: string): CsvSourceFamily {
  const lower = raw.toLowerCase();
  if (lower.includes("accessories")) return "accessories";
  if (lower.includes("privacy screens")) return "privacy-screens";
  if (lower.includes("cabin tables")) return "cabin-tables";
  if (lower.includes("product: pedestal") || lower.includes("product: storage")) return "storage-discrete";
  if (lower.includes("l shape") && lower.includes("l1 x l2")) return "l-shape-grid";
  if (lower.includes("seater") || lower.includes("workstation")) return "linear-workstations";
  return "unclassified";
}

function makeWarning(
  file: string,
  family: CsvSourceFamily,
  reason: string,
  line?: number,
  snippet?: string,
): CatalogIngestWarning {
  return { file, family, reason, line, snippet };
}

function parseLinearRows(
  file: string,
  family: CsvSourceFamily,
  series: string,
  lines: string[],
  warnings: CatalogIngestWarning[],
): CsvWorkstationRow[] {
  const rows: CsvWorkstationRow[] = [];
  let mode: "NS" | "SH" = "NS";

  for (const [lineIndex, line] of lines.entries()) {
    const lineNumber = lineIndex + 1;
    if (/WORKSTATION:\s*SHARING/i.test(line)) {
      mode = "SH";
      continue;
    }
    if (/WORKSTATION:\s*NON\s*SHARING/i.test(line)) {
      mode = "NS";
      continue;
    }

    const lShapeInline = line.match(/^(?:,,\s*)?(\d{3,4})\s*-\s*(\d{3,4})\s*X\s*(\d{3,4})/i);
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
      } else {
        warnings.push(
          makeWarning(
            file,
            family,
            "Detected inline L-shape dimensions without a preceding workstation row",
            lineNumber,
            line.trim(),
          ),
        );
      }
      continue;
    }

    if (/seater/i.test(line)) {
      const parts = line.split(",");
      const desc = (parts[1] ?? "").trim();
      const length = parseInt((parts[2] ?? "").trim(), 10);
      if (!desc || Number.isNaN(length)) {
        warnings.push(
          makeWarning(
            file,
            family,
            "Skipped malformed workstation row",
            lineNumber,
            line.trim(),
          ),
        );
        continue;
      }
      const seaters = parseInt(desc.split(/\s+/)[0], 10);
      if (Number.isNaN(seaters)) {
        warnings.push(
          makeWarning(
            file,
            family,
            "Could not derive seater count from workstation row",
            lineNumber,
            line.trim(),
          ),
        );
        continue;
      }
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
      } else {
        warnings.push(
          makeWarning(
            file,
            family,
            "Found continuation length with no preceding workstation row",
            lineNumber,
            line.trim(),
          ),
        );
      }
    }
  }

  return rows;
}

function parseLShapeGrid(
  file: string,
  family: CsvSourceFamily,
  series: string,
  lines: string[],
  warnings: CatalogIngestWarning[],
): CsvWorkstationRow[] {
  const rows: CsvWorkstationRow[] = [];
  let mode: "NS" | "SH" = "NS";
  let currentSeaters = 0;
  let currentLabel = "";

  for (const [lineIndex, line] of lines.entries()) {
    const lineNumber = lineIndex + 1;
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
      continue;
    }

    if (/L1 X L2 X D|L=Length|D=Depth/i.test(line)) {
      continue;
    }

    if (currentSeaters > 0 && /x/i.test(line) && /seater/i.test(currentLabel)) {
      warnings.push(
        makeWarning(
          file,
          family,
          "Skipped malformed L-shape grid row",
          lineNumber,
          line.trim(),
        ),
      );
    }
  }

  return rows;
}

function parseCabinTables(
  file: string,
  family: CsvSourceFamily,
  series: string,
  lines: string[],
  warnings: CatalogIngestWarning[],
): CsvWorkstationRow[] {
  const rows: CsvWorkstationRow[] = [];
  for (const [lineIndex, line] of lines.entries()) {
    const lineNumber = lineIndex + 1;
    const match = line.match(/^\d+,([^,]+),(\d{3,4})\s*X\s*(\d{3,4})/i);
    if (!match) {
      if (/^\d+,/.test(line) && /x/i.test(line)) {
        warnings.push(
          makeWarning(
            file,
            family,
            "Skipped malformed cabin table row",
            lineNumber,
            line.trim(),
          ),
        );
      }
      continue;
    }
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

function parsePrivacyScreens(
  file: string,
  family: CsvSourceFamily,
  series: string,
  lines: string[],
  warnings: CatalogIngestWarning[],
): CatalogItem[] {
  const items: CatalogItem[] = [];
  let section = "privacy screen";
  let currentLabel = "";

  for (const [lineIndex, line] of lines.entries()) {
    const lineNumber = lineIndex + 1;
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/privacy screens/i.test(trimmed)) continue;
    if (/screen/i.test(trimmed) && !/table top size/i.test(trimmed) && !/line drawing/i.test(trimmed)) {
      section = trimmed;
      continue;
    }

    const parts = trimmed
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (parts.length === 0) continue;

    const labelCandidate = parts[0];
    const tail = parts.slice(-2);
    const numericTail = tail.length === 2 && tail.every((part) => /^\d{3,4}$/.test(part));

    if (!numericTail && /screen/i.test(labelCandidate) && !/^\d+$/.test(labelCandidate)) {
      currentLabel = labelCandidate;
      continue;
    }

    if (!numericTail) {
      if (/^\d+/.test(labelCandidate)) {
        warnings.push(
          makeWarning(
            file,
            family,
            "Skipped malformed privacy-screen row",
            lineNumber,
            trimmed,
          ),
        );
      }
      continue;
    }

    const label = parts.length >= 3 && !/^\d{3,4}$/.test(parts[0]) ? parts[0] : currentLabel || section;
    const widthRaw = parseInt(tail[0], 10);
    const heightRaw = parseInt(tail[1], 10);
    if (!Number.isFinite(widthRaw) || !Number.isFinite(heightRaw)) {
      warnings.push(
        makeWarning(
          file,
          family,
          "Skipped privacy-screen size with invalid numbers",
          lineNumber,
          trimmed,
        ),
      );
      continue;
    }

    currentLabel = label;
    items.push({
      id: `${slugify(series)}-${slugify(label)}-${slugify(`${tail[0]}x${tail[1]}`)}-${items.length}`,
      name: `${series} — ${label}`,
      category: "equipment",
      shapeType: PlannerCatalogShapeType.table,
      widthMm: toCatalogDim(widthRaw),
      heightMm: toCatalogDim(heightRaw),
      depthMm: 0,
      description: `Privacy screen: ${section}`,
      tags: ["screen", "privacy", slugify(series)],
    });
  }

  return items;
}

function parseStorageDiscrete(
  file: string,
  family: CsvSourceFamily,
  series: string,
  lines: string[],
  warnings: CatalogIngestWarning[],
): CatalogItem[] {
  const items: CatalogItem[] = [];
  let currentSection = "storage";
  let currentLabel = "";

  for (const [lineIndex, line] of lines.entries()) {
    const lineNumber = lineIndex + 1;
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^PRODUCT:/i.test(trimmed)) {
      currentSection = trimmed.replace(/^PRODUCT:\s*/i, "").split(",")[0].trim() || currentSection;
      continue;
    }
    if (/^\d+,configuration/i.test(trimmed)) continue;
    if (/^SL NO/i.test(trimmed)) continue;

    const chunks = trimmed
      .split(",,")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (chunks.length === 0) continue;

    for (const chunk of chunks) {
      const labelMatch = chunk.match(/^\d+,([^,]+)$/);
      if (labelMatch) {
        currentLabel = labelMatch[1].trim();
        if (/drawer|filling/i.test(currentLabel)) {
          currentSection = "pedestal";
        } else if (/storage/i.test(currentLabel)) {
          currentSection = "storage";
        }
        continue;
      }

      const sizeMatch = chunk.match(/^(\d{3,4})\s*X\s*(\d{3,4})\s*X\s*(\d{3,4})$/i);
      if (sizeMatch) {
        if (!currentLabel) {
          warnings.push(
            makeWarning(
              file,
              family,
              "Encountered storage size row without a label",
              lineNumber,
              trimmed,
            ),
          );
          continue;
        }

        const widthMm = toCatalogDim(parseInt(sizeMatch[1], 10));
        const heightMm = toCatalogDim(parseInt(sizeMatch[2], 10));
        const depthMm = toCatalogDim(parseInt(sizeMatch[3], 10));
        items.push({
          id: `${slugify(series)}-${slugify(currentSection)}-${slugify(currentLabel)}-${slugify(sizeMatch[1])}-${slugify(sizeMatch[2])}-${slugify(sizeMatch[3])}-${items.length}`,
          name: `${series} — ${currentLabel}`,
          category: "storage",
          shapeType: PlannerCatalogShapeType.storage,
          widthMm,
          heightMm,
          depthMm,
          description: `Discrete storage: ${currentSection}`,
          tags: ["storage", slugify(currentSection), slugify(series)],
        });
        continue;
      }
    }
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

export function parseCsvFileWithAudit(relativePath: string, raw: string): ParsedCatalogCsv {
  const series = seriesFromContent(raw.slice(0, 600));
  const lines = raw.split(/\r?\n/);
  const family = detectCsvSourceFamily(raw);
  const warnings: CatalogIngestWarning[] = [];
  const lower = raw.toLowerCase();

  if (family === "accessories") {
    return { family, items: parseAccessories(series, lines), warnings };
  }

  if (family === "privacy-screens") {
    return {
      family,
      items: parsePrivacyScreens(relativePath, family, series, lines, warnings),
      warnings,
    };
  }

  if (family === "storage-discrete") {
    return {
      family,
      items: parseStorageDiscrete(relativePath, family, series, lines, warnings),
      warnings,
    };
  }

  if (family === "cabin-tables") {
    return {
      family,
      items: parseCabinTables(relativePath, family, series, lines, warnings).map(rowToCatalogItem),
      warnings,
    };
  }

  if (family === "l-shape-grid") {
    return {
      family,
      items: parseLShapeGrid(relativePath, family, series, lines, warnings).map((row, i) =>
        rowToCatalogItem(row, i),
      ),
      warnings,
    };
  }

  if (family === "unclassified") {
    warnings.push(
      makeWarning(
        relativePath,
        family,
        "No supported planner catalog source family matched this file",
      ),
    );
    return { family, items: [], warnings };
  }

  const linear = parseLinearRows(relativePath, family, series, lines, warnings);
  if (linear.length > 0) {
    return {
      family: "linear-workstations",
      items: linear.map((row, i) => rowToCatalogItem(row, i)),
      warnings,
    };
  }

  if (lower.includes("l shape")) {
    return {
      family: "l-shape-grid",
      items: parseLShapeGrid(relativePath, "l-shape-grid", series, lines, warnings).map((row, i) =>
        rowToCatalogItem(row, i),
      ),
      warnings,
    };
  }

  return { family, items: [], warnings };
}

export function parseCsvFile(relativePath: string, raw: string): CatalogItem[] {
  return parseCsvFileWithAudit(relativePath, raw).items;
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
    const key = catalogItemIdentityKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function catalogItemIdentityKey(item: CatalogItem): string {
  return `${item.name}|${item.widthMm}|${item.heightMm}|${item.seatCount ?? 0}`;
}

export { CSV_DIR };
