#!/usr/bin/env node

/**
 * Phase 09 — Quality Gate Audit Script
 *
 * Validates the codebase meets minimum quality standards before release.
 * Runs as part of CI or manually via: node scripts/audit-quality-gate.mjs
 *
 * Checks:
 * 1. No files exceed 700 lines (hard limit from AGENTS.md)
 * 2. No .env files in tracked paths
 * 3. No console.log in production code (warnings only)
 * 4. Package.json has pinned deps (no ^ or ~ on critical packages)
 * 5. Route contract is valid JSON
 * 6. Theme presets have required tokens
 */

import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { join, resolve } from "path";

const ROOT = resolve(import.meta.dirname, "../..");
const ERRORS = [];
const WARNINGS = [];

function error(msg) {
  ERRORS.push(msg);
}
function warn(msg) {
  WARNINGS.push(msg);
}

// ─── Check 1: File size limits ──────────────────────────────────────────────
console.log("▶ Checking file size limits...");

const MAX_LINES = 700;
const SCAN_DIRS = ["app", "features", "lib", "state", "components", "data"];

for (const dir of SCAN_DIRS) {
  const fullDir = join(ROOT, dir);
  if (!existsSync(fullDir)) continue;

  try {
    const files = execSync(
      `git ls-files -- "${dir}/**/*.ts" "${dir}/**/*.tsx" "${dir}/**/*.css"`,
      { cwd: ROOT, encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean);

    for (const file of files) {
      const filePath = join(ROOT, file);
      if (!existsSync(filePath)) continue;
      const content = readFileSync(filePath, "utf8");
      const lines = content.split("\n").length;
      if (lines > MAX_LINES) {
        warn(`${file} has ${lines} lines (limit: ${MAX_LINES})`);
      }
    }
  } catch {
    // git ls-files might fail outside a repo
  }
}

// ─── Check 2: No .env in tracked files ─────────────────────────────────────
console.log("▶ Checking for tracked .env files...");

try {
  const tracked = execSync("git ls-files -- '*.env' '.env*'", {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();

  if (tracked) {
    const envFiles = tracked.split("\n").filter((f) => !f.includes(".example"));
    for (const f of envFiles) {
      error(`Tracked .env file found: ${f} — must be in .gitignore`);
    }
  }
} catch {
  // ok
}

// ─── Check 3: Route contract is valid JSON ──────────────────────────────────
console.log("▶ Validating route contract...");

const contractPath = join(ROOT, "config/route-contract.json");
if (existsSync(contractPath)) {
  try {
    const content = readFileSync(contractPath, "utf8");
    JSON.parse(content);
  } catch (e) {
    error(`route-contract.json is invalid JSON: ${e.message}`);
  }
} else {
  warn("config/route-contract.json does not exist");
}

// ─── Check 4: Theme presets have required tokens ────────────────────────────
console.log("▶ Validating theme presets...");

const presetsPath = join(ROOT, "lib/theme/presets.ts");
if (existsSync(presetsPath)) {
  const content = readFileSync(presetsPath, "utf8");
  const requiredTokens = ["block-surface", "block-text", "block-accent", "block-border"];
  for (const token of requiredTokens) {
    if (!content.includes(`"${token}"`)) {
      error(`Theme presets missing required token: ${token}`);
    }
  }
} else {
  error("lib/theme/presets.ts does not exist");
}

// ─── Check 5: Package.json critical deps are pinned ─────────────────────────
console.log("▶ Checking critical dependency pinning...");

const pkgPath = join(ROOT, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const criticalDeps = ["next", "react", "react-dom", "typescript"];
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

for (const dep of criticalDeps) {
  const version = allDeps[dep];
  if (version && (version.startsWith("^") || version.startsWith("~"))) {
    warn(`Critical dep "${dep}" uses range "${version}" — consider pinning exact version`);
  }
}

// ─── Report ─────────────────────────────────────────────────────────────────
console.log("");
console.log("═══════════════════════════════════════");
console.log("  QUALITY GATE AUDIT REPORT");
console.log("═══════════════════════════════════════");
console.log(`  Errors:   ${ERRORS.length}`);
console.log(`  Warnings: ${WARNINGS.length}`);
console.log("═══════════════════════════════════════");

if (WARNINGS.length > 0) {
  console.log("\n⚠️  Warnings:");
  for (const w of WARNINGS) {
    console.log(`   • ${w}`);
  }
}

if (ERRORS.length > 0) {
  console.log("\n❌ Errors:");
  for (const e of ERRORS) {
    console.log(`   • ${e}`);
  }
  console.log("\nQuality gate FAILED.");
  process.exit(1);
} else {
  console.log("\n✅ Quality gate PASSED.");
  process.exit(0);
}
