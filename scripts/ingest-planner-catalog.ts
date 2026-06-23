/**
 * Ingest planner CSVs into the canonical planner catalog output family.
 *
 * Canonical output:
 *   - features/planner/catalog/generatedCatalogItems.ts
 *   - features/planner/catalog/generatedCatalogItemsPart1.ts
 *   - features/planner/catalog/generatedCatalogItemsPart2.ts
 *
 * Audit outputs:
 *   - results/audits/planner-catalog-golden.json
 *   - results/audits/planner-catalog-ingest-report.json
 *   - results/audits/planner-catalog-ingest-report.md
 *   - results/audits/planner-asset-registry-audit.json
 *   - results/audits/planner-asset-registry-audit.md
 *
 * Usage: npx tsx scripts/ingest-planner-catalog.ts
 */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

import {
  CSV_DIR,
  PLANNER_CSV_FILES,
  catalogItemIdentityKey,
  dedupeCatalogItems,
  parseCsvFileWithAudit,
  type CatalogIngestWarning,
} from "@/features/planner/catalog/ingest/csvCatalogIngest";
import { FURNITURE_ASSET_REGISTRY } from "@/features/planner/lib/assetPipeline";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";

const ROOT = process.cwd();
const CATALOG_DIR = path.join(ROOT, "features/planner/catalog");
const PART1_OUT = path.join(CATALOG_DIR, "generatedCatalogItemsPart1.ts");
const PART2_OUT = path.join(CATALOG_DIR, "generatedCatalogItemsPart2.ts");
const WRAPPER_OUT = path.join(CATALOG_DIR, "generatedCatalogItems.ts");
const AUDITS_DIR = path.join(ROOT, "results", "audits");
const GOLDEN_OUT = path.join(AUDITS_DIR, "planner-catalog-golden.json");
const REPORT_JSON_OUT = path.join(AUDITS_DIR, "planner-catalog-ingest-report.json");
const REPORT_MD_OUT = path.join(AUDITS_DIR, "planner-catalog-ingest-report.md");
const ASSET_JSON_OUT = path.join(AUDITS_DIR, "planner-asset-registry-audit.json");
const ASSET_MD_OUT = path.join(AUDITS_DIR, "planner-asset-registry-audit.md");

type ParsedSourceSummary = {
  file: string;
  family: string;
  items: number;
  warnings: CatalogIngestWarning[];
};

type DuplicateGroup = {
  identityKey: string;
  count: number;
  itemIds: string[];
};

type AssetAuditEntry = {
  catalogId: string;
  glbUrl: string;
  glbExists: boolean;
  thumbnailUrl: string | null;
  thumbnailExists: boolean;
};

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function toPosix(pathname: string): string {
  return pathname.split(path.sep).join("/");
}

function formatArray(values: string[]): string {
  if (values.length === 0) return "[]";
  return `[\n${values.map((value) => `  "${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",\n")}\n]`;
}

function splitItems(items: CatalogItem[]): [CatalogItem[], CatalogItem[]] {
  const midpoint = Math.ceil(items.length / 2);
  return [items.slice(0, midpoint), items.slice(midpoint)];
}

function renderModule(name: string, items: CatalogItem[]): string {
  return `/**
 * AUTO-GENERATED - do not edit by hand.
 * Regenerate: npm.cmd run catalog:ingest
 * ${name}
 */
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";

export const ${name}: CatalogItem[] = ${JSON.stringify(items, null, 2)} as CatalogItem[];
`;
}

function renderWrapper(): string {
  return `/**
 * AUTO-GENERATED - do not edit by hand.
 * Regenerate: npm.cmd run catalog:ingest
 *
 * Canonical planner catalog entrypoint. The part files are a generated
 * implementation detail so the catalog payload stays manageable.
 */
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { GENERATED_CATALOG_ITEMS_PART1 } from "./generatedCatalogItemsPart1";
import { GENERATED_CATALOG_ITEMS_PART2 } from "./generatedCatalogItemsPart2";

export const GENERATED_CATALOG_ITEMS: CatalogItem[] = [
  ...GENERATED_CATALOG_ITEMS_PART1,
  ...GENERATED_CATALOG_ITEMS_PART2,
];

export const GENERATED_CATALOG_COUNT = GENERATED_CATALOG_ITEMS.length;
`;
}

function buildDuplicateGroups(items: CatalogItem[]): DuplicateGroup[] {
  const groups = new Map<string, CatalogItem[]>();
  for (const item of items) {
    const key = catalogItemIdentityKey(item);
    const current = groups.get(key) ?? [];
    current.push(item);
    groups.set(key, current);
  }
  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([identityKey, group]) => ({
      identityKey,
      count: group.length,
      itemIds: group.map((item) => item.id),
    }))
    .sort((left, right) => left.identityKey.localeCompare(right.identityKey));
}

function buildAssetAudit(): { entries: AssetAuditEntry[]; missingCount: number } {
  const entries = [...FURNITURE_ASSET_REGISTRY.values()].map((asset) => {
    const glbPath = path.join(ROOT, "public", asset.glbUrl.replace(/^\/+/, "").replace(/\//g, path.sep));
    const thumbnailUrl = asset.thumbnailUrl ?? null;
    const thumbnailPath = thumbnailUrl
      ? path.join(ROOT, "public", thumbnailUrl.replace(/^\/+/, "").replace(/\//g, path.sep))
      : null;

    return {
      catalogId: asset.catalogId,
      glbUrl: asset.glbUrl,
      glbExists: fs.existsSync(glbPath),
      thumbnailUrl,
      thumbnailExists: thumbnailPath ? fs.existsSync(thumbnailPath) : true,
    };
  });

  const missingCount = entries.filter((entry) => !entry.glbExists || !entry.thumbnailExists).length;
  return { entries, missingCount };
}

function renderReportMarkdown(summary: {
  generatedAt: string;
  sourceSummaries: ParsedSourceSummary[];
  totalRawItems: number;
  uniqueItems: number;
  duplicateGroups: DuplicateGroup[];
  missingFiles: string[];
  invalidWarnings: CatalogIngestWarning[];
  canonicalSha256: string;
  canonicalPath: string;
  assetMissingCount: number;
}): string {
  const sourceLines = summary.sourceSummaries
    .map((source) => `- ${source.file} [${source.family}] -> ${source.items} items, ${source.warnings.length} warnings`)
    .join("\n");
  const missingFileLines = summary.missingFiles.length > 0 ? formatArray(summary.missingFiles) : "[]";
  const duplicateLines =
    summary.duplicateGroups.length > 0
      ? summary.duplicateGroups
          .map(
            (group) =>
              `- ${group.identityKey} -> ${group.count} rows (${group.itemIds.join(", ")})`,
          )
          .join("\n")
      : "- none";
  const warningLines =
    summary.invalidWarnings.length > 0
      ? summary.invalidWarnings
          .map(
            (warning) =>
              `- ${warning.file}${warning.line ? `:${warning.line}` : ""} [${warning.family}] ${warning.reason}${
                warning.snippet ? ` :: ${warning.snippet}` : ""
              }`,
          )
          .join("\n")
      : "- none";

  return `# Planner Catalog Ingest Audit

- Generated at: ${summary.generatedAt}
- Canonical output: ${toPosix(summary.canonicalPath)}
- Canonical SHA256: ${summary.canonicalSha256}
- Raw rows parsed: ${summary.totalRawItems}
- Unique rows emitted: ${summary.uniqueItems}
- Duplicate groups: ${summary.duplicateGroups.length}
- Missing assets: ${summary.assetMissingCount}

## Source validation

${sourceLines || "- none"}

## Missing source files

${missingFileLines}

## Duplicate audit

${duplicateLines}

## Invalid row audit

${warningLines}
`;
}

function renderAssetMarkdown(summary: {
  generatedAt: string;
  entries: AssetAuditEntry[];
  missingCount: number;
}): string {
  const missingLines = summary.entries
    .filter((entry) => !entry.glbExists || !entry.thumbnailExists)
    .map(
      (entry) =>
        `- ${entry.catalogId} :: glb=${entry.glbExists ? "ok" : "missing"} thumbnail=${
          entry.thumbnailUrl ? (entry.thumbnailExists ? "ok" : "missing") : "n/a"
        }`,
    )
    .join("\n");

  return `# Planner Asset Registry Audit

- Generated at: ${summary.generatedAt}
- Registry entries: ${summary.entries.length}
- Missing asset references: ${summary.missingCount}

## Missing assets

${missingLines || "- none"}
`;
}

function main() {
  const generated: CatalogItem[] = [];
  const sourceSummaries: ParsedSourceSummary[] = [];
  const missingFiles: string[] = [];
  const invalidWarnings: CatalogIngestWarning[] = [];

  for (const file of PLANNER_CSV_FILES) {
    const filePath = path.join(ROOT, CSV_DIR, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
      console.warn(`skip missing: ${file}`);
      continue;
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = parseCsvFileWithAudit(file, raw);
    console.log(`${file}: ${parsed.items.length} items [${parsed.family}]`);
    generated.push(...parsed.items);
    sourceSummaries.push({
      file,
      family: parsed.family,
      items: parsed.items.length,
      warnings: parsed.warnings,
    });
    invalidWarnings.push(...parsed.warnings);
  }

  const unique = dedupeCatalogItems(generated);
  const duplicateGroups = buildDuplicateGroups(generated);
  const [part1, part2] = splitItems(unique);
  const canonicalJson = JSON.stringify(unique, null, 2);
  const canonicalSha256 = sha256(canonicalJson);
  const now = new Date().toISOString();
  const assetAudit = buildAssetAudit();

  console.log(`total: ${generated.length} raw catalog items`);
  console.log(`unique: ${unique.length} canonical catalog items`);
  console.log(`duplicates: ${duplicateGroups.length}`);

  ensureDir(CATALOG_DIR);
  ensureDir(AUDITS_DIR);

  fs.writeFileSync(PART1_OUT, renderModule("GENERATED_CATALOG_ITEMS_PART1", part1), "utf8");
  fs.writeFileSync(PART2_OUT, renderModule("GENERATED_CATALOG_ITEMS_PART2", part2), "utf8");
  fs.writeFileSync(WRAPPER_OUT, renderWrapper(), "utf8");

  fs.writeFileSync(
    GOLDEN_OUT,
    JSON.stringify(
      {
        generatedAt: now,
        canonicalPath: toPosix(WRAPPER_OUT),
        canonicalSha256,
        itemCount: unique.length,
        items: unique,
      },
      null,
      2,
    ),
    "utf8",
  );

  fs.writeFileSync(
    REPORT_JSON_OUT,
    JSON.stringify(
      {
        generatedAt: now,
        canonicalOutput: {
          path: toPosix(WRAPPER_OUT),
          sha256: canonicalSha256,
          itemCount: unique.length,
        },
        sourceSummaries,
        missingFiles,
        totalRawItems: generated.length,
        uniqueItems: unique.length,
        duplicateGroups,
        invalidWarnings,
        assetMissingCount: assetAudit.missingCount,
      },
      null,
      2,
    ),
    "utf8",
  );

  fs.writeFileSync(
    REPORT_MD_OUT,
    renderReportMarkdown({
      generatedAt: now,
      sourceSummaries,
      totalRawItems: generated.length,
      uniqueItems: unique.length,
      duplicateGroups,
      missingFiles,
      invalidWarnings,
      canonicalSha256,
      canonicalPath: WRAPPER_OUT,
      assetMissingCount: assetAudit.missingCount,
    }),
    "utf8",
  );

  fs.writeFileSync(
    ASSET_JSON_OUT,
    JSON.stringify(
      {
        generatedAt: now,
        registrySize: assetAudit.entries.length,
        missingCount: assetAudit.missingCount,
        entries: assetAudit.entries,
      },
      null,
      2,
    ),
    "utf8",
  );

  fs.writeFileSync(
    ASSET_MD_OUT,
    renderAssetMarkdown({
      generatedAt: now,
      entries: assetAudit.entries,
      missingCount: assetAudit.missingCount,
    }),
    "utf8",
  );

  console.log(`written → ${WRAPPER_OUT}`);
  console.log(`audit → ${REPORT_MD_OUT}`);
  console.log(`asset audit → ${ASSET_MD_OUT}`);
}

main();
