import "server-only";

import fs from "node:fs";
import path from "node:path";

const RESULTS_ROOT = path.join(process.cwd(), "results");
const SAMPLE_LIMIT = 6;

const INTERESTING_EXTENSIONS = new Set([
  ".csv",
  ".html",
  ".json",
  ".jsonl",
  ".md",
  ".txt",
  ".yaml",
  ".yml",
]);

const SPOTLIGHT_NAMES = new Set([
  "app-pages-inventory.csv",
  "coverage-report.json",
  "coverage-report.csv",
  "coverage-report.html",
  "index.html",
  "r2-object-count.json",
  "raw-playwright.json",
  "script-usage-report.md",
  "scripts-audit-ms-list.csv",
  "scripts-inventory.csv",
  "vitest-results.json",
  "vitest-results.csv",
  "vitest-results.html",
  "vitest-site-results.json",
  "vitest-site-results.csv",
  "vitest-site-results.html",
]);

export type ResultArtifact = {
  relativePath: string;
  title: string;
  extension: string;
  kind: "report" | "data" | "markup" | "text" | "asset" | "other";
};

export type ResultBundle = {
  key: string;
  label: string;
  description: string;
  fileCount: number;
  sampleArtifacts: ResultArtifact[];
};

export type ResultsSnapshot = {
  scannedAt: string;
  bundleCount: number;
  fileCount: number;
  rootFileCount: number;
  bundles: ResultBundle[];
  spotlightArtifacts: ResultArtifact[];
};

function humanizeBundleName(name: string): string {
  if (name === "root") return "root";
  return name.replace(/-/g, " ");
}

function describeBundle(name: string): string {
  if (name === "coverage") return "Vitest raw coverage data (Istanbul JSON/HTML)";
  if (name === "coverage-site") return "Site-only raw Vitest coverage data";
  if (name === "coverage-reports") return "Human-readable coverage reports (CSV/HTML/JSON)";
  if (name === "test-results") return "Playwright run output";
  if (name === "audits") return "Generated audit JSON and markdown";
  if (name === "repo-audit") return "Repository audit evidence";
  if (name === "screenshots") return "Generated screenshots";
  if (name === "root") return "Loose result files at the folder root";
  if (name.startsWith("tmp-")) return "Temporary report scratch space";
  return "Generated test and audit artifacts";
}

export type ResultGenerator = {
  command: string;
  description: string;
  outputPath: string;
  requiresDevServer?: boolean;
};

/** npm commands that write into results/ — surfaced on /results. */
export const RESULT_GENERATORS: ResultGenerator[] = [
  {
    command: "npm run inventory:app-pages",
    description: "App route inventory (layer paths + dependencies)",
    outputPath: "app-pages-inventory.csv",
  },
  {
    command: "npm run inventory:scripts",
    description: "Scripts folder inventory (wired vs unwired)",
    outputPath: "scripts-inventory.csv",
  },
  {
    command: "npm run test:coverage",
    description: "Planner Vitest coverage reports",
    outputPath: "coverage-reports/planner/coverage-report.html",
  },
  {
    command: "npm run test:coverage:site",
    description: "Site Vitest coverage reports",
    outputPath: "coverage-reports/site/coverage-report.html",
  },
  {
    command: "npm run test:e2e:nav",
    description: "Navigation smoke Playwright JSON",
    outputPath: "audits/raw-playwright.json",
  },
  {
    command: "npm run screenshot:planner",
    description: "Planner guest workspace screenshot",
    outputPath: "screenshots/planner-guest-left-panel.png",
    requiresDevServer: true,
  },
  {
    command: "npm run assets:r2:count",
    description: "R2 bucket object count (needs .env.local R2 creds)",
    outputPath: "audits/r2-object-count.json",
  },
];

function classifyExtension(ext: string): ResultArtifact["kind"] {
  if (ext === ".json" || ext === ".csv") return "data";
  if (ext === ".html" || ext === ".htm") return "markup";
  if (ext === ".md" || ext === ".txt" || ext === ".jsonl") return "text";
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)) return "asset";
  return "other";
}

function scoreArtifact(relativePath: string): number {
  const base = path.basename(relativePath).toLowerCase();
  const ext = path.extname(base);
  if (base === "index.html") return 0;
  if (SPOTLIGHT_NAMES.has(base)) return 1;
  if (base.includes("report") || base.includes("summary")) return 2;
  if (INTERESTING_EXTENSIONS.has(ext)) return 3;
  return 8;
}

function createBundle(key: string): {
  key: string;
  label: string;
  description: string;
  fileCount: number;
  sampleArtifacts: Array<{ relativePath: string; score: number }>;
} {
  return {
    key,
    label: humanizeBundleName(key),
    description: describeBundle(key),
    fileCount: 0,
    sampleArtifacts: [],
  };
}

function addSampleArtifact(
  bundle: ReturnType<typeof createBundle>,
  relativePath: string,
): void {
  const score = scoreArtifact(relativePath);
  const sample = { relativePath, score };
  bundle.sampleArtifacts.push(sample);
  bundle.sampleArtifacts.sort((a, b) => a.score - b.score || a.relativePath.localeCompare(b.relativePath));
  if (bundle.sampleArtifacts.length > SAMPLE_LIMIT) {
    bundle.sampleArtifacts.length = SAMPLE_LIMIT;
  }
}

function walkResults(
  dir: string,
  groups: Map<string, ReturnType<typeof createBundle>>,
  spotlight: Array<{ relativePath: string; score: number; bundleKey: string }>,
): number {
  let totalFiles = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      totalFiles += walkResults(absPath, groups, spotlight);
      continue;
    }

    totalFiles += 1;
    const relativePath = path.relative(RESULTS_ROOT, absPath).replace(/\\/g, "/");
    const bundleKey = relativePath.includes("/")
      ? relativePath.split("/")[0]
      : "root";
    const bundle = groups.get(bundleKey) ?? createBundle(bundleKey);
    bundle.fileCount += 1;

    const relForSample = relativePath;
    if (
      scoreArtifact(relForSample) <= 3 ||
      bundle.sampleArtifacts.length < SAMPLE_LIMIT
    ) {
      addSampleArtifact(bundle, relForSample);
    }

    groups.set(bundleKey, bundle);

    const score = scoreArtifact(relForSample);
    if (score <= 2) {
      spotlight.push({ relativePath: relForSample, score, bundleKey });
      spotlight.sort((a, b) => a.score - b.score || a.relativePath.localeCompare(b.relativePath));
      if (spotlight.length > 12) {
        spotlight.length = 12;
      }
    }
  }

  return totalFiles;
}

export function loadResultsSnapshot(): ResultsSnapshot {
  if (!fs.existsSync(RESULTS_ROOT)) {
    return {
      scannedAt: new Date().toISOString(),
      bundleCount: 0,
      fileCount: 0,
      rootFileCount: 0,
      bundles: [],
      spotlightArtifacts: [],
    };
  }

  const groups = new Map<string, ReturnType<typeof createBundle>>();
  const spotlight: Array<{ relativePath: string; score: number; bundleKey: string }> = [];
  const fileCount = walkResults(RESULTS_ROOT, groups, spotlight);
  const bundles = [...groups.values()].sort((a, b) => {
    if (a.key === "root") return -1;
    if (b.key === "root") return 1;
    return a.key.localeCompare(b.key);
  });

  const rootBundle = groups.get("root");
  const rootFileCount = rootBundle?.fileCount ?? 0;

  return {
    scannedAt: new Date().toISOString(),
    bundleCount: bundles.length,
    fileCount,
    rootFileCount,
    bundles: bundles.map((bundle) => ({
      key: bundle.key,
      label: bundle.label,
      description: bundle.description,
      fileCount: bundle.fileCount,
      sampleArtifacts: bundle.sampleArtifacts.map((artifact) => ({
        relativePath: artifact.relativePath,
        title: path.basename(artifact.relativePath),
        extension: path.extname(artifact.relativePath).toLowerCase(),
        kind: classifyExtension(path.extname(artifact.relativePath).toLowerCase()),
      })),
    })),
    spotlightArtifacts: spotlight.map((artifact) => ({
      relativePath: artifact.relativePath,
      title: path.basename(artifact.relativePath),
      extension: path.extname(artifact.relativePath).toLowerCase(),
      kind: classifyExtension(path.extname(artifact.relativePath).toLowerCase()),
    })),
  };
}
