import fs from "node:fs";
import path from "node:path";
import { loadVitestTestExcludes } from "./lib/vitest-excludes.mjs";

const repoRoot = process.cwd();
const testsDir = path.join(repoRoot, "tests");
const resultsDir = path.join(repoRoot, "results");

const { exact: VITEST_EXCLUDE, globs: VITEST_EXCLUDE_GLOBS } =
  loadVitestTestExcludes(repoRoot);

/** Co-located features/ paths → flat tests/ (commit ba8b0f3). Single source — do not duplicate in TESTING.md. */
const MIGRATION_MAP = [
  ["features/planner/3d/types.test.ts", "tests/planner-3d-types.test.ts"],
  ["features/planner/catalog/ingest/csvCatalogIngest.test.ts", "tests/planner-catalog-ingest-csvCatalogIngest.test.ts"],
  ["features/planner/catalog/plannerCatalog.test.ts", "tests/planner-store-plannerCatalog.test.ts"],
  ["features/planner/lib/assetPipeline.test.ts", "tests/planner-lib-assetPipeline.test.ts"],
  ["features/planner/lib/editorTools.test.ts", "tests/planner-lib-editorTools.test.ts"],
  ["features/planner/lib/measurements.test.ts", "tests/planner-lib-measurements.test.ts"],
  ["features/planner/lib/quoteBridge.test.ts", "tests/planner-lib-quoteBridge.test.ts"],
  ["features/planner/model/planner3dScene.test.ts", "tests/planner-model-planner3dScene.test.ts"],
  ["features/planner/model/plannerDocument.extra.test.ts", "tests/planner-model-plannerDocument.extra.test.ts"],
  ["features/planner/model/plannerDocument.test.ts", "tests/planner-model-plannerDocument.test.ts"],
  ["features/planner/model/plannerEnvelope.test.ts", "tests/planner-model-plannerEnvelope.test.ts"],
  ["features/planner/model/plannerIdentity.test.ts", "tests/planner-model-plannerIdentity.test.ts"],
  ["features/planner/model/plannerPermissions.test.ts", "tests/planner-model-plannerPermissions.test.ts"],
  ["features/planner/model/plannerPlacement.test.ts", "tests/planner-model-plannerPlacement.test.ts"],
  ["features/planner/persistence/plannerDraft.test.ts", "tests/planner-persistence-plannerDraft.test.ts"],
  ["features/planner/persistence/plannerSaves.test.ts", "tests/plannerCloudSaves.test.ts"],
  ["features/planner/shared/boq/quoteCartBridge.test.ts", "tests/planner-shared-boq-quoteCartBridge.test.ts"],
  ["features/planner/shared/catalog/catalogAdapter.test.ts", "tests/planner-shared-catalog-catalogAdapter.test.ts"],
  ["features/planner/shared/export/exportBoq.test.ts", "tests/planner-shared-export-exportBoq.test.ts"],
  ["features/planner/shared/plannerShared.test.tsx", "tests/planner-shared-plannerShared.test.tsx"],
  ["features/planner/store/catalogData.test.ts", "tests/planner-store-catalogData.test.ts"],
  ["features/planner/store/plannerCatalog.test.ts", "tests/planner-store-plannerCatalog.test.ts"],
  ["features/planner/store/plannerDraft.test.ts", "tests/planner-store-plannerDraft.test.ts"],
  ["features/planner/store/plannerFurnitureStore.test.ts", "tests/planner-store-plannerFurnitureStore.test.ts"],
  ["features/planner/store/plannerGeometryStore.test.ts", "tests/planner-store-plannerGeometryStore.test.ts"],
  ["features/planner/store/plannerProjectData.test.ts", "tests/planner-store-plannerProjectData.test.ts"],
  ["features/planner/tldraw/tools/__tests__/ClearanceChecker.test.ts", "tests/planner-tldraw-tools-ClearanceChecker.test.ts"],
  ["features/planner/ui/InspectorPanel.test.tsx", "tests/planner-ui-InspectorPanel.test.tsx"],
  ["features/ops/__tests__/CustomerQueriesOpsPageView.test.tsx", "tests/ops-CustomerQueriesOpsPageView.test.tsx"],
  ["features/shared/__tests__/providerChain.test.ts", "tests/shared-providerChain.test.ts"],
  ["features/shared/auth/components/__tests__/AuthShell.test.tsx", "tests/shared-auth-components-AuthShell.test.tsx"],
  ["features/shared/components/GuestBadge.test.tsx", "tests/shared-components-GuestBadge.test.tsx"],
  ["features/site-assistant/__tests__/AdvancedBot.test.tsx", "tests/site-assistant-AdvancedBot.test.tsx"],
];

function normalize(rel) {
  return rel.replace(/\\/g, "/");
}

function matchesGlob(rel, pattern) {
  const re = new RegExp(
    "^" +
      pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, ".*")
        .replace(/\*/g, "[^/]*") +
      "$",
  );
  return re.test(rel);
}

function isVitestExcluded(rel) {
  const n = normalize(rel);
  if (VITEST_EXCLUDE.includes(n)) return true;
  return VITEST_EXCLUDE_GLOBS.some((g) => matchesGlob(n, g));
}

function classify(name) {
  if (name === "setup.ts" || name === "guestProjectSetup.ts") return "helper";
  if (/\.spec\.(ts|tsx)$/.test(name)) return "playwright";
  if (/\.test\.(ts|tsx)$/.test(name)) {
    if (name.startsWith("planner-") || /^planner[^-].*\.test\./.test(name)) return "planner";
    if (name.startsWith("shared-")) return "shared";
    if (name.startsWith("site-assistant-")) return "site-assistant";
    if (name.startsWith("ops-")) return "ops";
    return "site-unit";
  }
  return "other";
}

function runnerFor(entry) {
  if (entry.kind === "playwright") return "playwright";
  if (entry.kind === "helper") return "helper";
  if (entry.kind === "other") return "unknown";
  if (isVitestExcluded(entry.path)) return "vitest-excluded";
  return "vitest";
}

const HELPER_FILES = new Set(["setup.ts", "guestProjectSetup.ts"]);

const files = fs
  .readdirSync(testsDir, { withFileTypes: true })
  .filter((d) => d.isFile())
  .map((d) => d.name)
  .filter((name) => HELPER_FILES.has(name) || /\.(test|spec)\.(ts|tsx)$/.test(name))
  .sort();

const entries = files.map((name) => {
  const rel = normalize(path.join("tests", name));
  const kind = classify(name);
  const entry = { name, path: rel, kind };
  entry.runner = runnerFor(entry);
  return entry;
});

const counts = {
  total: entries.length,
  vitest: entries.filter((e) => e.runner === "vitest").length,
  vitestExcluded: entries.filter((e) => e.runner === "vitest-excluded").length,
  playwright: entries.filter((e) => e.runner === "playwright").length,
  helpers: entries.filter((e) => e.runner === "helper").length,
};

const byKind = {};
for (const e of entries) {
  if (e.runner === "helper") continue;
  if (!byKind[e.kind]) byKind[e.kind] = [];
  byKind[e.kind].push(e.name);
}

const payload = {
  source: "tests/",
  counts,
  vitestExclude: [...VITEST_EXCLUDE, ...VITEST_EXCLUDE_GLOBS],
  files: entries,
  byKind,
};

fs.mkdirSync(resultsDir, { recursive: true });
const jsonPath = path.join(resultsDir, "test-inventory.json");
const migrationPath = path.join(resultsDir, "test-migration-map.json");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function inventoryBody(doc) {
  if (!doc) return null;
  const { source, counts: c, vitestExclude, files: f, byKind: k } = doc;
  return JSON.stringify({ source, counts: c, vitestExclude, files: f, byKind: k });
}

const prevInventory = readJson(jsonPath);
const inventoryChanged = inventoryBody(prevInventory) !== JSON.stringify(payload);
const generatedAt = inventoryChanged
  ? new Date().toISOString()
  : (prevInventory?.generatedAt ?? new Date().toISOString());

const inventory = { generatedAt, ...payload };

if (inventoryChanged) {
  fs.writeFileSync(jsonPath, JSON.stringify(inventory, null, 2) + "\n", "utf8");
}

const migrationPairs = MIGRATION_MAP.map(([from, to]) => ({ from, to }));
const prevMigration = readJson(migrationPath);
const migrationChanged =
  JSON.stringify(prevMigration?.pairs ?? null) !== JSON.stringify(migrationPairs);

if (migrationChanged) {
  const migration = {
    generatedAt: inventory.generatedAt,
    commit: "ba8b0f3",
    description: "Co-located features/**/*.test.* removed; flat tests/ copies",
    pairs: migrationPairs,
  };
  fs.writeFileSync(migrationPath, JSON.stringify(migration, null, 2) + "\n", "utf8");
}

function renderInventory() {
  const lines = [
    "# Test inventory",
    "",
    "Auto-generated file list and counts. Folder rules: `tests/CONTENTS.md`.",
    "",
    `*Updated: ${inventory.generatedAt.slice(0, 10)} — run \`npm run docs:sync\` to refresh.*`,
    "",
    "## Counts",
    "",
    "| Kind | Count |",
    "|------|-------|",
    `| Vitest (active) | ${counts.vitest} |`,
    `| Vitest (excluded in config) | ${counts.vitestExcluded} |`,
    `| Playwright | ${counts.playwright} |`,
    `| Helpers | ${counts.helpers} |`,
    `| **Total files** | **${counts.total}** |`,
    "",
    "JSON: `results/test-inventory.json` · Migration: `results/test-migration-map.json` · Coverage: `results/coverage-summary.json` (`npm run docs:sync:coverage`)",
    "",
    "## Files by category",
    "",
  ];

  const order = ["planner", "shared", "site-assistant", "ops", "site-unit", "playwright"];
  for (const kind of order) {
    const list = byKind[kind];
    if (!list?.length) continue;
    lines.push(`### ${kind} (${list.length})`, "");
    for (const f of list) lines.push(`- \`${f}\``);
    lines.push("");
  }

  const excluded = entries.filter((e) => e.runner === "vitest-excluded");
  if (excluded.length) {
    lines.push("### vitest-excluded", "");
    for (const e of excluded) lines.push(`- \`${e.name}\``);
    lines.push("");
  }

  lines.push(
    "## See also",
    "",
    "- `tests/CONTENTS.md`",
    "- `docs/TESTING.md`",
    "",
    "---",
    "*Generated by `scripts/generate-docs.mjs` — do not hand-edit; re-run `npm run docs:sync`.*",
    "",
  );
  return lines.join("\n");
}

const inventoryMdPath = path.join(testsDir, "INVENTORY.md");
if (inventoryChanged) {
  fs.writeFileSync(inventoryMdPath, renderInventory(), "utf8");
}

if (inventoryChanged || migrationChanged) {
  if (inventoryChanged) console.log(`Wrote ${jsonPath}`);
  if (migrationChanged) console.log(`Wrote ${migrationPath}`);
  if (inventoryChanged) {
    console.log(
      `Wrote tests/INVENTORY.md (${counts.vitest} vitest, ${counts.playwright} playwright, ${counts.helpers} helpers)`,
    );
  }
} else {
  console.log("Test inventory unchanged — skipped write");
}