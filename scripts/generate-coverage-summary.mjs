/**
 * Run Vitest v8 coverage (planner + site profiles) and write
 * results/coverage-summary.json. Playwright does not contribute to these numbers.
 * npm run docs:sync:coverage
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  addMetrics,
  emptyMetrics,
  finalizeMetrics,
} from "./coverage-metrics.mjs";

const repoRoot = process.cwd();
const resultsDir = path.join(repoRoot, "results");

/** Optional extra excludes for a partial coverage run (empty = full Vitest suite). */
const COVERAGE_RUN_EXCLUDE = [];

/** Paths aggregated into scopes["site"] — mirrors vitest.site.config.ts coverage.include. */
const SITE_SCOPE_PREFIXES = [
  "data/site/",
  "lib/catalog/",
  "lib/configurator/",
  "features/catalog/",
  "features/shared/",
  "features/site-assistant/",
  "features/ops/",
];
const SITE_SCOPE_EXACT = "features/ai/aiadvisor.ts";

function pct(n, d) {
  return d ? Math.round((1000 * n) / d) / 10 : 0;
}

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/").toLowerCase();
}

function scopeFromPath(filePath) {
  const n = normalizePath(filePath);
  if (n.includes("/features/planner/")) return "features/planner";
  if (n.includes("/features/")) return "features/other";
  if (n.includes("/lib/")) return "lib";
  if (n.includes("/components/")) return "components";
  if (n.includes("/app/")) return "app";
  if (n.includes("/data/")) return "data";
  return "other";
}

function isSiteScopeFile(filePath) {
  const n = normalizePath(filePath);
  if (n.endsWith(SITE_SCOPE_EXACT)) return true;
  if (!n.includes("/lib/configurator/")) {
    return SITE_SCOPE_PREFIXES.some((prefix) => n.includes(`/${prefix}`));
  }
  return n.endsWith(".ts") && !n.endsWith(".d.ts");
}

function aggregatePlannerScopes(covData) {
  const scopes = {
    all: emptyMetrics(),
    "features/planner": emptyMetrics(),
    "features/other": emptyMetrics(),
    lib: emptyMetrics(),
    components: emptyMetrics(),
    app: emptyMetrics(),
    data: emptyMetrics(),
  };

  for (const [file, cov] of Object.entries(covData)) {
    addMetrics(scopes.all, cov);
    const scope = scopeFromPath(file);
    if (scopes[scope]) addMetrics(scopes[scope], cov);
  }

  return Object.fromEntries(
    Object.entries(scopes).map(([k, v]) => [k, finalizeMetrics(v)]),
  );
}

function aggregateSiteScope(covData) {
  const site = emptyMetrics();
  for (const [file, cov] of Object.entries(covData)) {
    if (isSiteScopeFile(file)) addMetrics(site, cov);
  }
  return finalizeMetrics(site);
}

function runVitestCoverage(label, extraArgs = []) {
  const excludeArgs = COVERAGE_RUN_EXCLUDE.flatMap((f) => ["--exclude", f]);
  console.log(`Running Vitest v8 coverage (${label})…`);
  return spawnSync(
    "npx",
    ["vitest", "run", "--coverage", ...excludeArgs, ...extraArgs],
    { cwd: repoRoot, stdio: "inherit", shell: true },
  );
}

const plannerCoverageFinal = path.join(
  resultsDir,
  "coverage",
  "coverage-final.json",
);
const siteCoverageFinal = path.join(
  resultsDir,
  "coverage-site",
  "coverage-final.json",
);

const plannerRun = runVitestCoverage("planner scope");
if (!fs.existsSync(plannerCoverageFinal)) {
  console.error(
    "coverage-final.json missing — planner coverage run did not complete.",
  );
  process.exit(plannerRun.status ?? 1);
}

const plannerCovData = JSON.parse(
  fs.readFileSync(plannerCoverageFinal, "utf8"),
);
const plannerScopes = aggregatePlannerScopes(plannerCovData);

const siteRun = runVitestCoverage("site scope", [
  "--config",
  "vitest.site.config.ts",
]);
if (!fs.existsSync(siteCoverageFinal)) {
  console.error(
    "coverage-final.json missing — site coverage run did not complete.",
  );
  process.exit(siteRun.status ?? 1);
}

const siteCovData = JSON.parse(fs.readFileSync(siteCoverageFinal, "utf8"));
const siteScope = aggregateSiteScope(siteCovData);

const payload = {
  vitestExitCode: plannerRun.status ?? 0,
  vitestSiteExitCode: siteRun.status ?? 0,
  coverageRunExclude: COVERAGE_RUN_EXCLUDE,
  targetPlannerPct: 75,
  targetSitePct: 50,
  scopes: {
    ...plannerScopes,
    site: siteScope,
  },
  reportDir: "results/coverage/",
  siteReportDir: "results/coverage-site/",
};

fs.mkdirSync(resultsDir, { recursive: true });
const outPath = path.join(resultsDir, "coverage-summary.json");
const prev = fs.existsSync(outPath)
  ? JSON.parse(fs.readFileSync(outPath, "utf8"))
  : null;
const bodyKey = (doc) =>
  doc
    ? JSON.stringify({
        vitestExitCode: doc.vitestExitCode,
        vitestSiteExitCode: doc.vitestSiteExitCode,
        coverageRunExclude: doc.coverageRunExclude,
        targetPlannerPct: doc.targetPlannerPct,
        targetSitePct: doc.targetSitePct,
        scopes: doc.scopes,
        reportDir: doc.reportDir,
        siteReportDir: doc.siteReportDir,
      })
    : null;
const changed = bodyKey(prev) !== JSON.stringify(payload);
const summary = {
  generatedAt: changed ? new Date().toISOString() : (prev?.generatedAt ?? new Date().toISOString()),
  ...payload,
};

if (changed) {
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath}`);
} else {
  console.log(`Coverage summary unchanged — skipped write`);
}
console.log(
  `features/planner statements: ${summary.scopes["features/planner"].statements.pct}% (target ${summary.targetPlannerPct}%)`,
);
console.log(
  `site statements: ${summary.scopes.site.statements.pct}% (target ${summary.targetSitePct}%)`,
);

const exitCode = plannerRun.status ?? siteRun.status ?? 0;
if (exitCode !== 0) {
  console.warn("Vitest exited non-zero; summary written from partial coverage.");
}
process.exit(exitCode);