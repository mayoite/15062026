/**
 * One-off analyzer for results/COVERAGE-REPORT.md — reads coverage-final.json
 * without re-running Vitest. Handles Windows absolute paths.
 */
import fs from "node:fs";
import path from "node:path";
import { fileCounts, pct } from "./coverage-metrics.mjs";

const repoRoot = process.cwd();

function relPath(filePath) {
  const n = filePath.replace(/\\/g, "/").toLowerCase();
  const markers = [
    "features/planner/",
    "features/",
    "data/site/",
    "lib/catalog/",
    "lib/configurator/",
    "data/",
  ];
  for (const m of markers) {
    const i = n.indexOf(m);
    if (i >= 0) return n.slice(i);
  }
  return n;
}

function fileMetrics(cov) {
  const c = fileCounts(cov);
  return {
    ...c,
    stmtPct: pct(c.stmtCovered, c.stmtTotal),
    fnPct: pct(c.fnCovered, c.fnTotal),
    brPct: pct(c.brCovered, c.brTotal),
    linePct: pct(c.lineCovered, c.lineTotal),
  };
}

function emptyBucket() {
  return {
    statements: { covered: 0, total: 0, pct: 0 },
    functions: { covered: 0, total: 0, pct: 0 },
    branches: { covered: 0, total: 0, pct: 0 },
    lines: { covered: 0, total: 0, pct: 0 },
    files: 0,
    zeroStmtFiles: 0,
  };
}

function addToBucket(bucket, m) {
  bucket.statements.covered += m.stmtCovered;
  bucket.statements.total += m.stmtTotal;
  bucket.functions.covered += m.fnCovered;
  bucket.functions.total += m.fnTotal;
  bucket.branches.covered += m.brCovered;
  bucket.branches.total += m.brTotal;
  bucket.lines.covered += m.lineCovered;
  bucket.lines.total += m.lineTotal;
  bucket.files++;
  if (m.stmtTotal > 0 && m.stmtCovered === 0) bucket.zeroStmtFiles++;
}

function finalizeBucket(bucket) {
  for (const key of ["statements", "functions", "branches", "lines"]) {
    const m = bucket[key];
    m.pct = pct(m.covered, m.total);
  }
  return bucket;
}

function analyze(jsonPath, bucketFn) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const buckets = {};
  const total = emptyBucket();
  const files = [];

  for (const [filePath, cov] of Object.entries(data)) {
    const rel = relPath(filePath);
    const m = fileMetrics(cov);
    const bk = bucketFn(rel);
    if (!buckets[bk]) buckets[bk] = emptyBucket();
    addToBucket(buckets[bk], m);
    addToBucket(total, m);
    files.push({ rel, ...m });
  }

  for (const b of Object.values(buckets)) finalizeBucket(b);
  finalizeBucket(total);
  files.sort((a, b) => b.stmtTotal - a.stmtTotal);
  return { buckets, total, files, fileCount: Object.keys(data).length };
}

const PLANNER_BUCKETS = [
  "store",
  "hooks",
  "tldraw",
  "ui",
  "domain",
  "canvas",
  "export",
  "import",
  "sync",
  "api",
  "admin",
  "3d",
  "utils",
  "types",
  "components",
  "pages",
  "planner-root",
];

function plannerBucket(rel) {
  const m = rel.match(/^features\/planner\/([^/]+)/);
  return m ? m[1] : "planner-root";
}

const SITE_RULES = [
  ["data/site", /^data\/site/],
  ["lib/catalog", /^lib\/catalog/],
  ["lib/configurator", /^lib\/configurator/],
  ["features/catalog", /^features\/catalog/],
  ["features/shared", /^features\/shared/],
  ["features/site-assistant", /^features\/site-assistant/],
  ["features/ops", /^features\/ops/],
  ["features/ai", /^features\/ai\/aiadvisor/],
];

function siteBucket(rel) {
  for (const [name, re] of SITE_RULES) {
    if (re.test(rel)) return name;
  }
  return "unscoped";
}

function remarkForColumn(col, scope, m, target) {
  const gap = target - m.pct;
  const remarks = {
    statements: {
      low: `Only ${m.pct}% of executable statements run in tests; ${m.total - m.covered} statements never executed. Primary lever for raising overall %.`,
      mid: `${m.pct}% — meaningful execution but ${gap.toFixed(1)} pts below ${target}% target; expand happy-path + error-path tests.`,
      high: `${m.pct}% — near or above target; maintain on new code.`,
    },
    functions: {
      low: `${m.pct}% of functions invoked; many exported handlers/helpers never called — often UI callbacks or store actions.`,
      mid: `${m.pct}% — aligns with statements; add tests that call untested exports directly.`,
      high: `${m.pct}% — good function reach; watch thin wrappers re-exporting untested deps.`,
    },
    branches: {
      low: `${m.pct}% branch arms taken — conditionals, ternaries, &&/|| short-circuit largely untested; usually lags statements.`,
      mid: `${m.pct}% — add cases for if/else both sides, switch defaults, and error branches.`,
      high: `${m.pct}% — strong branch coverage; keep edge-case tables in tests.`,
    },
    lines: {
      low: `${m.pct}% of source lines hit — derived from statementMap (Vitest v8 omits \`l\` in coverage-final.json).`,
      mid: `${m.pct}% line reach — usually within ~2 pts of statements; blank/import-only lines excluded.`,
      high: `${m.pct}% — aligns with Vitest \`lines\` CI threshold; keep new code on green paths.`,
    },
  };
  const tier = m.pct < target * 0.5 ? "low" : m.pct < target * 0.85 ? "mid" : "high";
  const base = remarks[col][tier];
  if (scope.zeroStmtFiles > 0 && col === "statements") {
    return `${base} ${scope.zeroStmtFiles} file(s) at 0% statements in this bucket.`;
  }
  if (col === "branches" && m.pct < m.statements?.pct - 5) {
    return `${base} Branches trail statements by ${(m.statements.pct - m.pct).toFixed(1)} pts — typical for UI/conditional-heavy code.`;
  }
  return base;
}

function bucketRemark(name, b, target) {
  const parts = [];
  if (b.zeroStmtFiles === b.files) {
    parts.push("Entire bucket untested — high ROI if in critical path.");
  } else if (b.zeroStmtFiles > b.files * 0.5) {
    parts.push(`Majority of files (${b.zeroStmtFiles}/${b.files}) at 0% — slice tests here for fast gains.`);
  } else if (b.statements.pct >= target * 0.85) {
    parts.push("Near target — protect with threshold ratchet.");
  } else if (b.statements.total > 1500) {
    parts.push("Large surface area — prioritize store/domain/hooks over presentational TSX.");
  } else if (b.statements.pct > 40) {
    parts.push("Already partially covered — extend existing test files.");
  } else {
    parts.push("Early slice candidate per PLANNER-COVERAGE-75 / SITE-COVERAGE plans.");
  }
  return parts.join(" ");
}

function mdTableRow(cells) {
  return `| ${cells.join(" | ")} |`;
}

function formatMetric(m) {
  return `${m.pct}% (${m.covered}/${m.total})`;
}

function buildScopeSection(title, analysis, target, bucketOrder) {
  const t = analysis.total;
  const lines = [];
  lines.push(`## ${title}`);
  lines.push("");
  lines.push(`**Files in scope:** ${analysis.fileCount} · **Zero-statement files:** ${t.zeroStmtFiles}`);
  lines.push("");
  lines.push("### Rollup by metric");
  lines.push("");
  lines.push(mdTableRow(["Metric", "Covered / Total", "%", `Target`, "Remarks"]));
  lines.push(mdTableRow(["---", "---", "---", "---", "---"]));

  const cols = [
    ["Statements", t.statements, target],
    ["Functions", t.functions, target],
    ["Branches", t.branches, target],
    ["Lines", t.lines, target],
  ];

  for (const [label, m, tgt] of cols) {
    const colKey = label.toLowerCase();
    const scopeCtx = { zeroStmtFiles: t.zeroStmtFiles, statements: t.statements };
    const remark = remarkForColumn(colKey, scopeCtx, m, tgt);
    lines.push(
      mdTableRow([
        label,
        `${m.covered} / ${m.total}`,
        `${m.pct}%`,
        `${tgt}%`,
        remark,
      ]),
    );
  }

  lines.push("");
  lines.push(
    "**Lines source:** Counts above use `scripts/coverage-metrics.mjs` — reads `l` when present, otherwise derives from `statementMap` + `s` (same basis as Vitest's `lines` threshold).",
  );
  lines.push("");

  lines.push("### By subfolder");
  lines.push("");
  lines.push(
    mdTableRow([
      "Subfolder",
      "Statements",
      "Functions",
      "Branches",
      "Lines",
      "Files",
      "0% files",
      "Remarks",
    ]),
  );
  lines.push(
    mdTableRow(["---", "---", "---", "---", "---", "---", "---", "---"]),
  );

  const entries = Object.entries(analysis.buckets).sort(
    (a, b) => b[1].statements.total - a[1].statements.total,
  );

  const order = bucketOrder || entries.map(([k]) => k);
  const sorted = [
    ...order.filter((k) => analysis.buckets[k]).map((k) => [k, analysis.buckets[k]]),
    ...entries.filter(([k]) => !order.includes(k)),
  ];

  for (const [name, b] of sorted) {
    lines.push(
      mdTableRow([
        `\`${name}/\``,
        formatMetric(b.statements),
        formatMetric(b.functions),
        formatMetric(b.branches),
        formatMetric(b.lines),
        String(b.files),
        String(b.zeroStmtFiles),
        bucketRemark(name, b, target),
      ]),
    );
  }

  lines.push("");
  lines.push("### Largest untested files (by statement count)");
  lines.push("");
  const zeros = analysis.files
    .filter((f) => f.stmtTotal > 0 && f.stmtCovered === 0)
    .slice(0, 15);
  if (zeros.length === 0) {
    lines.push("_None — all files with statements have some coverage._");
  } else {
    lines.push(mdTableRow(["File", "Statements", "Remarks"]));
    lines.push(mdTableRow(["---", "---", "---"]));
    for (const f of zeros) {
      lines.push(
        mdTableRow([
          `\`${f.rel}\``,
          String(f.stmtTotal),
          f.stmtTotal > 200 ? "High mass — single file test can move rollup %" : "Quick win — small isolated module",
        ]),
      );
    }
  }
  lines.push("");
  return lines;
}

const summary = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "results/coverage-summary.json"), "utf8"),
);
const planner = analyze(
  path.join(repoRoot, "results/coverage/coverage-final.json"),
  plannerBucket,
);
const site = analyze(
  path.join(repoRoot, "results/coverage-site/coverage-final.json"),
  siteBucket,
);

const gatePlanner = summary.targetPlannerPct;
const gateSite = summary.targetSitePct;
const threshPlanner = "20 / 21 / 20 / 21 (statements / functions / branches / lines)";
const threshSite = "14 / 14 / 7 / 15";

const out = [];
out.push("# Coverage report (Vitest v8)");
out.push("");
out.push(
  `Regenerate: \`npm run docs:sync:coverage\` · Source: \`results/coverage-summary.json\` · **${summary.generatedAt}**`,
);
out.push("");
out.push("## Executive summary");
out.push("");
function trackStatus(actualPct, ciFloor, productTarget) {
  const gap = Math.round((productTarget - actualPct) * 10) / 10;
  if (actualPct < ciFloor) return "Below Vitest floor";
  if (actualPct >= productTarget) return "At or above product target";
  return `Passes Vitest floor; **${gap} pts** below ${productTarget}% product target`;
}

out.push(
  "| Track | Scope | Statements | Functions | Branches | Lines | Gate target | CI threshold | Status |",
);
out.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
out.push(
  mdTableRow([
    "Planner",
    "`features/planner/**`",
    formatMetric(planner.total.statements),
    formatMetric(planner.total.functions),
    formatMetric(planner.total.branches),
    formatMetric(planner.total.lines),
    `${gatePlanner}%`,
    threshPlanner,
    trackStatus(planner.total.statements.pct, 20, gatePlanner),
  ]),
);
out.push(
  mdTableRow([
    "Site",
    "site-logic include (see `vitest.site.config.ts`)",
    formatMetric(site.total.statements),
    formatMetric(site.total.functions),
    formatMetric(site.total.branches),
    formatMetric(site.total.lines),
    `${gateSite}%`,
    threshSite,
    trackStatus(site.total.statements.pct, 14, gateSite),
  ]),
);
out.push("");
out.push("### Cross-cutting remarks");
out.push("");
out.push(
  "1. **Statements** are the most reliable rollup column — they count whether each executable statement ran at least once.",
);
out.push(
  "2. **Functions** track whether each declared function body was entered; re-export-only files can show 0 functions despite imports.",
);
out.push(
  "3. **Branches** count each outcome of conditionals (`if`, `?:`, `&&`, `||`, `switch`); this repo's UI and config code has many branches per statement, so branch % often trails statement % by 5–10 pts.",
);
out.push(
  `4. **Lines** match Vitest's \`lines\` threshold — derived from \`statementMap\` when \`l\` is absent in \`coverage-final.json\` (Vitest v8 default).`,
);
out.push(
  `5. **${planner.total.zeroStmtFiles} / ${planner.fileCount}** planner files and **${site.total.zeroStmtFiles} / ${site.fileCount}** site files have **0% statements** — target large zero-coverage modules first.`,
);
out.push(
  "6. Product targets (75% planner / 50% site) are **not** CI thresholds yet; see `plans/MASTER-PLAN.md` critical path.",
);
out.push("");
out.push(...buildScopeSection("Planner track", planner, gatePlanner, PLANNER_BUCKETS));
out.push(...buildScopeSection("Site track", site, gateSite, SITE_RULES.map(([n]) => n)));

const outPath = path.join(repoRoot, "results/COVERAGE-REPORT.md");
fs.writeFileSync(outPath, out.join("\n") + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log(`Planner: ${planner.total.statements.pct}% · buckets: ${Object.keys(planner.buckets).length}`);
console.log(`Site: ${site.total.statements.pct}% · buckets: ${Object.keys(site.buckets).length}`);