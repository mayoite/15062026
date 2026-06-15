/**
 * One generator — one pass. No separate "check" that regenerates again.
 *
 * npm run docs:sync              test inventory + JSON (fast; after test changes)
 * npm run docs:sync:all          above + all CONTENTS.md (folder manifest edits)
 * npm run docs:sync:coverage     sync + vitest coverage summary
 * npm run docs:check             sync + fail if tracked JSON/INVENTORY stale
 * npm run docs:check:coverage    coverage sync + fail if stale
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(scriptsDir, "..");
const argv = process.argv.slice(2);
const withAll = argv.includes("--all");
const withCoverage = argv.includes("--coverage");
const withCheck = argv.includes("--check");

const TRACKED = [
  "tests/INVENTORY.md",
  "results/test-inventory.json",
  "results/test-migration-map.json",
  ...(withCoverage
    ? ["results/coverage-summary.json", "results/COVERAGE-REPORT.md"]
    : []),
];

const steps = [
  ...(withAll ? ["generate-contents-md.mjs"] : []),
  "generate-test-inventory.mjs",
  ...(withCoverage
    ? ["generate-coverage-summary.mjs", "analyze-coverage-report.mjs"]
    : []),
];

for (const name of steps) {
  const result = spawnSync("node", [path.join(scriptsDir, name)], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!withCheck) {
  process.exit(0);
}

const stale = [];
for (const rel of TRACKED) {
  const diff = spawnSync("git", ["diff", "--exit-code", "--", rel], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (diff.status !== 0) {
    stale.push(rel);
  }
}

if (stale.length) {
  console.error("Generated artifacts are stale — run `npm run docs:sync` and commit:");
  for (const f of stale) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("Generated artifacts are up to date.");