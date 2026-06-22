import path from "path";

/** Repository root (same folder as vitest.config.ts). */
export const VITEST_REPO_ROOT = path.resolve(__dirname);

export const VITEST_RESULTS_DIR = path.resolve(VITEST_REPO_ROOT, "results/tests");

export const VITEST_REPORT_PATHS = {
  full: {
    json: path.resolve(VITEST_RESULTS_DIR, "vitest-results.json"),
    csv: path.resolve(VITEST_RESULTS_DIR, "vitest-results.csv"),
    html: path.resolve(VITEST_RESULTS_DIR, "vitest-results.html"),
  },
  site: {
    json: path.resolve(VITEST_RESULTS_DIR, "vitest-site-results.json"),
    csv: path.resolve(VITEST_RESULTS_DIR, "vitest-site-results.csv"),
    html: path.resolve(VITEST_RESULTS_DIR, "vitest-site-results.html"),
  },
} as const;

export const VITEST_COVERAGE_DIRS = {
  full: path.resolve(VITEST_REPO_ROOT, "results/coverage"),
  site: path.resolve(VITEST_REPO_ROOT, "results/coverage-site"),
} as const;

/** Human-readable coverage reports (CSV/HTML/JSON) — separate from raw Vitest output. */
export const VITEST_COVERAGE_REPORT_DIRS = {
  full: path.resolve(VITEST_REPO_ROOT, "results/coverage-reports/planner"),
  site: path.resolve(VITEST_REPO_ROOT, "results/coverage-reports/site"),
} as const;

export const VITEST_SETUP_FILE = path.resolve(VITEST_REPO_ROOT, "tests/setup.ts");

export const VITEST_COMMON_EXCLUDE = [
  "**/node_modules/**",
  "archive/**",
  ".next/**",
  "tech-stack-docs/**",
  "results/**",
  "scripts/**",
] as const;

export const VITEST_COMMON_COVERAGE_REPORTERS = [
  "text",
  "json",
  "json-summary",
  "html",
] as const;
