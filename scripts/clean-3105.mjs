#!/usr/bin/env node
// Removes all references to the legacy "3105" repo from text files.
//
// Usage:
//   node scripts/clean-3105.mjs            # clean the current repo root
//   node scripts/clean-3105.mjs <dir>      # clean an explicit directory
//   node scripts/clean-3105.mjs --dry-run  # report only, change nothing
//
// It walks the tree (skipping node_modules/.git/.next/etc.), applies ordered
// literal replacements to text files, and removes files that only existed to
// reference the deleted 3105archive folder.

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const targetArg = args.find((a) => !a.startsWith("--"));
const ROOT = path.resolve(targetArg ?? process.cwd());

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "dist",
  "build",
  "coverage",
  "playwright-report",
  "test-results",
]);

// Binary / generated extensions we never rewrite.
const SKIP_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".svg",
  ".pdf", ".zip", ".gz", ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".mp4", ".webm", ".mov", ".lock", ".tsbuildinfo",
]);

// Ordered literal replacements — order matters (most specific first).
const SUBS = [
  ["3105archive/archive", "archive"],
  ["3105archive", "archive"],
  ["avisaokias/3105_2", "ayushonmicrosoft/claude0206"],
  ["E:\\combine\\sites\\3105", "E:\\combine\\sites\\claude0206"],
  ["only-in-3105", "only-in-base"],
  ["3105", "base repo"],
];

// Files that only exist to reference the deleted 3105archive folder.
const DELETE_RELATIVE = [
  "tests/docs-mini-site-scripts.test.ts",
  "tsconfig.tsbuildinfo",
];

// A NUL byte marks a binary file. Built at runtime to keep the source ASCII.
const NUL_CHAR = String.fromCharCode(0);

let changed = 0;
let deleted = 0;
let scanned = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full);
    } else if (entry.isFile()) {
      processFile(full);
    }
  }
}

const SELF = path.basename(new URL(import.meta.url).pathname);

function processFile(file) {
  if (path.basename(file) === SELF) return; // never rewrite this script
  if (SKIP_EXT.has(path.extname(file).toLowerCase())) return;
  scanned += 1;

  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return;
  }
  if (text.includes(NUL_CHAR)) return;
  if (!text.includes("3105")) return;

  let out = text;
  for (const [from, to] of SUBS) out = out.split(from).join(to);
  if (out === text) return;

  if (dryRun) {
    console.log("would update:", path.relative(ROOT, file));
  } else {
    fs.writeFileSync(file, out, "utf8");
    console.log("updated:", path.relative(ROOT, file));
  }
  changed += 1;
}

function deleteStale() {
  for (const rel of DELETE_RELATIVE) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    if (dryRun) {
      console.log("would delete:", rel);
    } else {
      fs.rmSync(full);
      console.log("deleted:", rel);
    }
    deleted += 1;
  }
}

console.log(`Cleaning "3105" references under: ${ROOT}${dryRun ? " (dry run)" : ""}`);
walk(ROOT);
deleteStale();
console.log(`\nScanned ${scanned} files - ${changed} updated, ${deleted} removed.`);
