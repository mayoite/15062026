/**
 * Fail if co-located test files exist outside tests/.
 * Policy: docs/TESTING.md — flat tests/ only.
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const SCAN_ROOTS = ["app", "components", "features", "lib", "data", "platform"];
const SKIP_DIRS = new Set(["node_modules", ".next", "archive", "dist", "coverage"]);
const TEST_FILE = /\.(test|spec)\.(ts|tsx|js|jsx)$/i;

function walk(dir, hits) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, hits);
      continue;
    }
    if (TEST_FILE.test(entry.name)) {
      hits.push(path.relative(repoRoot, full).replace(/\\/g, "/"));
    }
  }
}

const violations = [];
for (const root of SCAN_ROOTS) {
  walk(path.join(repoRoot, root), violations);
}

if (violations.length) {
  console.error("Co-located tests found outside tests/:");
  for (const file of violations.sort()) console.error(`  - ${file}`);
  console.error("\nMove to tests/ and run npm run docs:sync — see docs/TESTING.md");
  process.exit(1);
}

console.log("test layout OK — no co-located *.test.* / *.spec.* under live source trees");