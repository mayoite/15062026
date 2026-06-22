/**
 * One-off analysis: why 477 tests → ~15% coverage.
 * npm run test:coverage first, then: node scripts/analyze-coverage-gap.mjs
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const cov = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "results/coverage/coverage-final.json"), "utf8"),
);

function norm(f) {
  return f.replace(/\\/g, "/").toLowerCase();
}

function scopeBucket(n) {
  if (n.includes("/features/planner/")) return "features/planner";
  if (n.includes("/features/")) return "features/other";
  if (n.includes("/app/")) return "app";
  if (n.includes("/components/")) return "components";
  if (n.includes("/lib/")) return "lib";
  if (n.includes("/data/")) return "data";
  return "other";
}

// --- Source statement inventory ---
const buckets = {};
for (const [f, d] of Object.entries(cov)) {
  const n = norm(f);
  const bucket = scopeBucket(n);
  const st = d.s || {};
  const total = Object.keys(st).length;
  const covered = Object.values(st).filter((v) => v > 0).length;
  if (!buckets[bucket]) buckets[bucket] = { files: 0, stmts: 0, covered: 0, zeroFiles: 0 };
  buckets[bucket].files++;
  buckets[bucket].stmts += total;
  buckets[bucket].covered += covered;
  if (total > 0 && covered === 0) buckets[bucket].zeroFiles++;
}

console.log("=== COVERAGE DENOMINATOR (statements in scope) ===\n");
const order = ["features/planner", "app", "lib", "components", "features/other", "data", "other"];
let totalStmts = 0;
for (const key of order) {
  const b = buckets[key];
  if (!b) continue;
  totalStmts += b.stmts;
  const pct = b.stmts ? ((100 * b.covered) / b.stmts).toFixed(1) : "0";
  const share = ((100 * b.stmts) / 19924).toFixed(1);
  console.log(
    `${key.padEnd(20)} ${String(b.stmts).padStart(6)} stmts (${share}% of total) | covered ${pct}% | ${b.zeroFiles}/${b.files} files at 0%`,
  );
}
console.log(`\nTotal in report: ${totalStmts} statements across ${Object.values(buckets).reduce((a, b) => a + b.files, 0)} files`);

// --- Test import targets ---
const testsDir = path.join(repoRoot, "tests");
const testFiles = fs.readdirSync(testsDir).filter((f) => /\.test\.(ts|tsx)$/.test(f));

const importScopes = { planner: 0, "features-other": 0, lib: 0, components: 0, app: 0, data: 0, none: 0 };
const byTest = [];

for (const file of testFiles) {
  const text = fs.readFileSync(path.join(testsDir, file), "utf8");
  const imports = [...text.matchAll(/from ["'](@\/[^"']+)["']/g)].map((m) => m[1]);
  const scopes = new Set();
  for (const imp of imports) {
    if (imp.startsWith("@/features/planner")) scopes.add("planner");
    else if (imp.startsWith("@/features/")) scopes.add("features-other");
    else if (imp.startsWith("@/lib/")) scopes.add("lib");
    else if (imp.startsWith("@/components/")) scopes.add("components");
    else if (imp.startsWith("@/app/")) scopes.add("app");
    else if (imp.startsWith("@/lib/site-data/")) scopes.add("data");
  }
  if (scopes.has("planner")) importScopes.planner++;
  if (scopes.has("features-other")) importScopes["features-other"]++;
  if (scopes.has("lib")) importScopes.lib++;
  if (scopes.has("components")) importScopes.components++;
  if (scopes.has("app")) importScopes.app++;
  if (scopes.has("data")) importScopes.data++;
  if (scopes.size === 0) importScopes.none++;
  byTest.push({ file, scopes: [...scopes], importCount: imports.length });
}

console.log("\n=== TEST TARGETS (70 Vitest files, 477 test cases) ===\n");
console.log("Files importing from each scope:");
for (const [k, v] of Object.entries(importScopes)) console.log(`  ${k}: ${v} test files`);

const noScope = byTest.filter((t) => t.scopes.length === 0);
if (noScope.length) {
  console.log("\nTest files with no @/feature/lib/app imports:", noScope.map((t) => t.file).join(", "));
}

const uiTests = byTest.filter((t) => t.scopes.includes("components") || t.scopes.includes("app"));
console.log(`\nTest files touching app/ or components/: ${uiTests.length}`);
if (uiTests.length) console.log("  ", uiTests.map((t) => t.file).join(", "));

// --- Planner: tested islands vs desert ---
const plannerFiles = [];
for (const [f, d] of Object.entries(cov)) {
  const n = norm(f);
  if (!n.includes("/features/planner/")) continue;
  const st = d.s || {};
  const total = Object.keys(st).length;
  const covered = Object.values(st).filter((v) => v > 0).length;
  if (!total) continue;
  plannerFiles.push({
    rel: f.replace(/\\/g, "/").split("/features/planner/")[1],
    pct: Math.round((1000 * covered) / total) / 10,
    total,
    covered,
  });
}

const plannerTested = plannerFiles.filter((f) => f.pct > 0);
const plannerZero = plannerFiles.filter((f) => f.pct === 0);
const testedStmts = plannerTested.reduce((a, f) => a + f.covered, 0);
const zeroStmts = plannerZero.reduce((a, f) => a + f.total, 0);

console.log("\n=== PLANNER SPLIT ===\n");
console.log(`Files with any coverage: ${plannerTested.length}/${plannerFiles.length}`);
console.log(`Files at 0%: ${plannerZero.length} (${Math.round((100 * plannerZero.length) / plannerFiles.length)}%)`);
console.log(`Statements in 0% files: ${zeroStmts} (${((100 * zeroStmts) / 12034).toFixed(1)}% of planner stmts)`);

const dirs = {};
for (const f of plannerFiles) {
  const dir = f.rel.split("/")[0];
  if (!dirs[dir]) dirs[dir] = { total: 0, covered: 0, files: 0, zero: 0 };
  dirs[dir].total += f.total;
  dirs[dir].covered += f.covered;
  dirs[dir].files++;
  if (f.pct === 0) dirs[dir].zero++;
}
console.log("\nPlanner by top-level dir:");
for (const [dir, d] of Object.entries(dirs).sort((a, b) => b[1].total - a[1].total)) {
  const pct = ((100 * d.covered) / d.total).toFixed(1);
  console.log(`  ${dir.padEnd(14)} ${pct.padStart(5)}% | ${d.zero}/${d.files} files at 0% | ${d.total} stmts`);
}

console.log("\n=== ROOT CAUSES (summary) ===");
console.log("1. Denominator includes app/ + components/ (~4.3k stmts) but Vitest barely imports them.");
console.log("2. Planner tests target pure modules; 65% of planner files (editor/hooks/tldraw UI) never load.");
console.log("3. 55 planner test files ≠ 55 planner files covered — many test the same well-covered libs.");
console.log("4. Playwright (8 specs) is excluded from coverage — routes/workspace never count.");
