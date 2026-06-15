/** Refresh results/coverage-summary.json scopes from on-disk coverage-final files (no Vitest). */
import fs from "node:fs";
import path from "node:path";
import {
  addMetrics,
  emptyMetrics,
  finalizeMetrics,
} from "./coverage-metrics.mjs";

const repoRoot = process.cwd();

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

function isSiteScopeFile(filePath) {
  const n = normalizePath(filePath);
  if (n.endsWith(SITE_SCOPE_EXACT)) return true;
  if (!n.includes("/lib/configurator/")) {
    return SITE_SCOPE_PREFIXES.some((prefix) => n.includes(`/${prefix}`));
  }
  return n.endsWith(".ts") && !n.endsWith(".d.ts");
}

const summaryPath = path.join(repoRoot, "results/coverage-summary.json");
const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));

const planner = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "results/coverage/coverage-final.json"), "utf8"),
);
const siteData = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "results/coverage-site/coverage-final.json"), "utf8"),
);

const scopes = {
  all: emptyMetrics(),
  "features/planner": emptyMetrics(),
  "features/other": emptyMetrics(),
  lib: emptyMetrics(),
  components: emptyMetrics(),
  app: emptyMetrics(),
  data: emptyMetrics(),
};

for (const [fp, cov] of Object.entries(planner)) {
  addMetrics(scopes.all, cov);
  const scope = scopeFromPath(fp);
  if (scopes[scope]) addMetrics(scopes[scope], cov);
}

const site = emptyMetrics();
for (const [fp, cov] of Object.entries(siteData)) {
  if (isSiteScopeFile(fp)) addMetrics(site, cov);
}

for (const b of Object.values(scopes)) finalizeMetrics(b);
finalizeMetrics(site);

summary.scopes = { ...scopes, site };
summary.generatedAt = new Date().toISOString();
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
console.log("planner", summary.scopes["features/planner"].statements);
console.log("site", summary.scopes.site.statements);