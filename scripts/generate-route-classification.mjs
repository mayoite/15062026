/**
 * Scan app/ pages + API routes; write docs/ops/context/route-classification.md
 * Run: node scripts/generate-route-classification.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(repoRoot, "app");
const outPath = path.join(repoRoot, "docs", "ops", "context", "route-classification.md");

const LEGACY_REDIRECTS = [
  ["/oando-planner", "/planner/"],
  ["/oando-planner/canvas", "/planner/canvas/"],
  ["/oando-planner/guest", "/planner/guest/"],
  ["/buddy-planner", "/planner/canvas/"],
  ["/buddy-planner/guest", "/planner/guest/"],
  ["/buddy-planner/editor", "/planner/canvas/"],
  ["/buddy-planner/:path*", "/planner/canvas/"],
];

function walk(dir, matcher, base = appDir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, matcher, base));
    else if (matcher(full)) out.push(path.relative(base, full).replace(/\\/g, "/"));
  }
  return out.sort();
}

function routeFromPage(relative) {
  const segments = relative
    .replace(/\/page\.(tsx|ts|jsx|js)$/, "")
    .split("/")
    .filter((s) => !(s.startsWith("(") && s.endsWith(")")));
  const url = "/" + segments.join("/");
  return url === "/" ? "/" : url.replace(/\/+/g, "/");
}

function bucket(url) {
  if (url.startsWith("/planner")) return "planner";
  if (url.startsWith("/admin")) return "admin";
  if (url.startsWith("/crm")) return "crm";
  if (url.startsWith("/ops")) return "ops";
  if (url.startsWith("/api")) return "api";
  return "site";
}

const pageMatcher = (f) => /[/\\]page\.(tsx|ts|jsx|js)$/.test(f);
const routeMatcher = (f) => /[/\\]route\.(tsx|ts|jsx|js)$/.test(f);

const pages = walk(appDir, pageMatcher);
const routes = walk(appDir, routeMatcher);

const byBucket = { planner: [], site: [], admin: [], crm: [], ops: [], api: [] };
for (const p of pages) {
  const url = routeFromPage(p);
  byBucket[bucket(url)].push({ url, file: `app/${p}` });
}

for (const r of routes) {
  const url =
    "/" +
    r
      .replace(/\/route\.(tsx|ts|jsx|js)$/, "")
      .split("/")
      .filter((s) => !(s.startsWith("(") && s.endsWith(")")))
      .join("/");
  byBucket.api.push({ url: url.replace(/\/+/g, "/") || "/api", file: `app/${r}` });
}

const lines = [
  "# Live route classification",
  "",
  `*Generated: ${new Date().toISOString().slice(0, 10)} — \`node scripts/generate-route-classification.mjs\`*`,
  "",
  "Canonical planner surface is **`/planner/**`** (`app/planner/`). Legacy `/oando-planner/**` and `/buddy-planner/**` redirect via `config/build/next.config.js`.",
  "",
  "## Canonical planner",
  "",
  ...byBucket.planner.map(({ url, file }) => `- \`${url}\` → \`${file}\``),
  "",
  "## Public site (`app/(site)/`)",
  "",
  ...byBucket.site.slice(0, 40).map(({ url, file }) => `- \`${url}\` → \`${file}\``),
  ...(byBucket.site.length > 40 ? [`- … +${byBucket.site.length - 40} more site routes`] : []),
  "",
  "## Admin / CRM / Ops",
  "",
  ...[...byBucket.admin, ...byBucket.crm, ...byBucket.ops].map(
    ({ url, file }) => `- \`${url}\` → \`${file}\``,
  ),
  "",
  "## API routes",
  "",
  ...byBucket.api.slice(0, 30).map(({ url, file }) => `- \`${url}\` → \`${file}\``),
  ...(byBucket.api.length > 30 ? [`- … +${byBucket.api.length - 30} more API routes`] : []),
  "",
  "## Legacy redirects (301)",
  "",
  ...LEGACY_REDIRECTS.map(([src, dest]) => `- \`${src}\` → \`${dest}\``),
  "",
  "See also: `config/route-contract.json`, `proxy.ts`, `docs/Handover.md`.",
  "",
];

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath}`);
