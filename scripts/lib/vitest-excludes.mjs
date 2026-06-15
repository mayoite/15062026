import fs from "node:fs";
import path from "node:path";

/**
 * Read test file excludes from vitest.config.ts (single source of truth).
 * @param {string} repoRoot
 * @returns {{ exact: string[], globs: string[] }}
 */
export function loadVitestTestExcludes(repoRoot) {
  const configPath = path.join(repoRoot, "vitest.config.ts");
  const text = fs.readFileSync(configPath, "utf8");
  const block = text.match(/test:\s*\{[\s\S]*?exclude:\s*\[([\s\S]*?)\]/);
  if (!block) {
    return { exact: [], globs: [] };
  }
  const items = [...block[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
  const testItems = items.filter((s) => s.startsWith("tests/"));
  return {
    exact: testItems.filter((s) => !s.includes("*")),
    globs: testItems.filter((s) => s.includes("*")),
  };
}