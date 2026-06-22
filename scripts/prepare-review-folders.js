/**
 * prepare-review-folders.js
 *
 * Copies live flat-root source into critic/review folders under results/reviews/.
 * Run from repo root: node scripts/prepare-review-folders.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "results", "reviews");

const CODE_EXTS = new Set([".ts", ".tsx", ".css", ".js", ".mjs", ".json"]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walkDir(dir, filter) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", ".swc", "archive"].includes(entry.name)) continue;
      results.push(...walkDir(fullPath, filter));
    } else if (!filter || filter(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

function copyToReview(srcPath, destFolder) {
  const rel = path.relative(ROOT, srcPath);
  const dest = path.join(destFolder, rel);
  ensureDir(path.dirname(dest));
  fs.copyFileSync(srcPath, dest);
  return rel;
}

function isCodeFile(p) {
  return CODE_EXTS.has(path.extname(p).toLowerCase());
}

function isRouteFile(p) {
  const base = path.basename(p);
  return (
    base === "page.tsx" ||
    base === "layout.tsx" ||
    base === "route.ts" ||
    base === "loading.tsx" ||
    base === "error.tsx" ||
    base === "not-found.tsx" ||
    base === "robots.ts" ||
    base === "sitemap.ts" ||
    p.includes(`${path.sep}api${path.sep}`)
  );
}

const folders = {
  "UX-UI-Critic": {
    description: "UX & UI — pages, components, CSS, theme",
    sources: [
      { dir: "app", filter: (p) => isCodeFile(p) },
      { dir: "components", filter: (p) => isCodeFile(p) },
      { dir: "features/shared", filter: (p) => isCodeFile(p) },
      { dir: "features/planner/landing", filter: (p) => isCodeFile(p) },
      { dir: "features/planner/ui", filter: (p) => isCodeFile(p) },
      { dir: "lib/theme", filter: (p) => isCodeFile(p) },
      { dir: "lib/ui", filter: (p) => isCodeFile(p) },
      { dir: "lib/site-data", filter: (p) => isCodeFile(p) },
      { dir: "public", filter: (p) => p.endsWith(".svg") || p.endsWith(".html") },
    ],
  },
  "Route-Engineer": {
    description: "Routing, API, proxy, auth, navigation",
    sources: [
      { dir: "config/route-contract.json", single: true },
      { dir: "proxy.ts", single: true },
      { dir: "config/build/next.config.js", single: true },
      { dir: "app", filter: (p) => isRouteFile(p) },
      { dir: "lib/auth", filter: (p) => isCodeFile(p) },
      { dir: "lib/navigation.ts", single: true },
      { dir: "lib/siteNav.ts", single: true },
      { dir: "lib/siteUrl.ts", single: true },
      { dir: "lib/rateLimit.ts", single: true },
      { dir: "lib/supabase", filter: (p) => isCodeFile(p) },
      { dir: "config", filter: (p) => isCodeFile(p) },
      { dir: "docs/ops/context/route-classification.md", single: true },
    ],
  },
  "Code-Expert-Frontend": {
    description: "Marketing app — app/(site), components, lib/site-data",
    sources: [
      { dir: "app/(site)", filter: (p) => isCodeFile(p) },
      { dir: "components", filter: (p) => isCodeFile(p) },
      { dir: "lib/site-data", filter: (p) => isCodeFile(p) },
      { dir: "features/site-assistant", filter: (p) => isCodeFile(p) },
      { dir: "package.json", single: true },
      { dir: "tsconfig.json", single: true },
      { dir: "config/build/next.config.js", single: true },
    ],
  },
  "Code-Expert-Packages": {
    description: "Domain features + lib (flat-root packages layer)",
    sources: [
      { dir: "features", filter: (p) => isCodeFile(p) },
      { dir: "lib", filter: (p) => isCodeFile(p) },
      { dir: "data", filter: (p) => isCodeFile(p) },
      { dir: "package.json", single: true },
      { dir: "tsconfig.json", single: true },
    ],
  },
  "Code-Expert-Platform": {
    description: "Platform, config, tests, scripts",
    sources: [
      { dir: "platform", filter: (p) => isCodeFile(p) },
      { dir: "config", filter: (p) => isCodeFile(p) },
      { dir: "tests", filter: (p) => isCodeFile(p) },
      { dir: "scripts", filter: (p) => isCodeFile(p) || p.endsWith(".py") },
      { dir: "vitest.config.ts", single: true },
      { dir: "package.json", single: true },
      { dir: "proxy.ts", single: true },
    ],
  },
};

const briefIntro = {
  "UX-UI-Critic": "Pages, layouts, FOCSS (`app/css/`), marketing components, theme tokens, and static copy.",
  "Route-Engineer": "App Router tree, API handlers, `proxy.ts`, auth guards, navigation data, route classification.",
  "Code-Expert-Frontend": "Public marketing surface: `app/(site)/`, `components/`, `lib/site-data/`, site assistant.",
  "Code-Expert-Packages": "All `features/`, `lib/`, and `data/` — domain logic for planner, catalog, auth, ops.",
  "Code-Expert-Platform": "`platform/`, `config/`, flat `tests/`, maintenance `scripts/`, build configs.",
};

function buildBrief(folderName, fileCount, fileList) {
  return `# ${folderName} Review Brief

## Scope (flat-root monolith)
${briefIntro[folderName]}

## Repo layout
- Live code: \`app/\`, \`features/\`, \`components/\`, \`lib/\`, \`data/\`
- Tests: flat \`tests/\` only — see \`docs/TESTING.md\`
- Plans: \`docs/plans/01-hardcoding.md\`, \`docs/plans/02-docs.md\`, \`docs/plans/03-guardrails.md\`

## Deliverable
Executive summary (1–10), critical/major/minor issues, strengths, file-referenced recommendations.

---

## Files included (${fileCount})

${fileList.map((f) => `- \`${f}\``).join("\n")}
`;
}

function main() {
  console.log(`Preparing review folders from ${ROOT}\n`);

  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
  ensureDir(OUT);

  const stats = {};

  for (const [folderName, config] of Object.entries(folders)) {
    const destDir = path.join(OUT, folderName);
    ensureDir(destDir);

    let fileCount = 0;
    const fileList = [];

    for (const source of config.sources) {
      const srcPath = path.join(ROOT, source.dir);

      if (source.single) {
        if (fs.existsSync(srcPath) && fs.statSync(srcPath).isFile()) {
          fileList.push(copyToReview(srcPath, destDir));
          fileCount++;
        }
      } else if (fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
        for (const file of walkDir(srcPath, source.filter)) {
          fileList.push(copyToReview(file, destDir));
          fileCount++;
        }
      }
    }

    fs.writeFileSync(
      path.join(destDir, "REVIEW-BRIEF.md"),
      buildBrief(folderName, fileCount, fileList),
      "utf8",
    );

    stats[folderName] = fileCount;
    console.log(`${folderName}: ${fileCount} files`);
  }

  const summary = `# Review Folders Summary

Generated: ${new Date().toISOString()}
Source root: \`${ROOT}\`

| Folder | Files | Purpose |
|--------|-------|---------|
${Object.entries(stats)
  .map(([name, count]) => `| ${name} | ${count} | ${folders[name].description} |`)
  .join("\n")}
`;

  fs.writeFileSync(path.join(OUT, "SUMMARY.md"), summary, "utf8");
  console.log(`\nDone — ${OUT}`);
}

main();
