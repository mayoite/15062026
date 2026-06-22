#!/usr/bin/env node
/**
 * Line-by-line hardcoded value audit for .tsx and .css (excluding base/token layers).
 *
 * Outputs:
 *   results/hardcoded-audit-detail.csv  — every match (file, line, category, value, snippet)
 *   results/hardcoded-audit-summary.csv — per-file rollup
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DETAIL_OUT = path.join(ROOT, "results", "hardcoded-audit-detail.csv");
const SUMMARY_OUT = path.join(ROOT, "results", "hardcoded-audit-summary.csv");

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "results",
  "outputs",
  ".git",
  "tech-stack-docs",
]);

/** Base / token CSS — design-system foundation, excluded from hardcoding audit. */
const BASE_CSS_PREFIXES = [
  "app/css/base/",
  "app/css/core/tokens/",
  "app/css/core/typography/type.css",
  "app/(site)/globals.css",
];

const TSX_PATTERNS = [
  { id: "inline_style", re: /style=\{\{/g, label: "inline style={{ }}" },
  { id: "hex_color", re: /#[0-9a-fA-F]{3,8}\b/g, label: "hex color" },
  { id: "rgb_color", re: /rgba?\([^)]+\)/g, label: "rgb/rgba" },
  { id: "hsl_color", re: /hsl[a]?\([^)]+\)/g, label: "hsl" },
  { id: "tailwind_arbitrary", re: /\[[^\]]+\]/g, label: "Tailwind/CSS arbitrary [...]" },
  { id: "px_literal", re: /\b\d+(\.\d+)?px\b/g, label: "Npx" },
  { id: "rem_em", re: /\b\d+(\.\d+)?(?:rem|em)\b/g, label: "rem/em" },
  { id: "percent", re: /\b\d+(\.\d+)?%/g, label: "%" },
  { id: "vh_vw", re: /\b\d+(\.\d+)?v[wh]\b/g, label: "vh/vw" },
  { id: "duration_ms", re: /(?:duration|delay)-\d+/g, label: "Tailwind duration/delay" },
  { id: "animate", re: /\banimate-[\w-]+/g, label: "animate-*" },
  { id: "transition", re: /\btransition(?:-[\w-]+)?/g, label: "transition" },
  { id: "spacing_px_py", re: /\b[pm][trblxy]?-(?:\d+(?:\.\d+)?|\[[^\]]+\])/g, label: "p*/m* spacing (px/py/etc)" },
  { id: "gap_space", re: /\b(?:gap|space-[xy])-(?:\d+(?:\.\d+)?|\[[^\]]+\])/g, label: "gap/space-*" },
  { id: "size_wh", re: /\b[wh]-(?:\d+(?:\.\d+)?|\[[^\]]+\])/g, label: "w-/h-*" },
  { id: "text_size", re: /\btext-(?:xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\])/g, label: "text-* size" },
  { id: "font_weight", re: /\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g, label: "font-weight" },
  { id: "tracking_leading", re: /\b(?:tracking|leading)-[\w.\[\]-]+/g, label: "tracking/leading" },
  { id: "palette_tw", re: /\b(?:bg|text|border|ring|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|blue|green|amber|emerald|orange|yellow|purple|pink|indigo|sky|teal|cyan|lime|rose)-\d{2,3}\b/g, label: "Tailwind palette" },
  { id: "rounded", re: /\brounded(?:-[\w\[\].]+)?/g, label: "rounded-*" },
  { id: "shadow", re: /\bshadow(?:-[\w]+)?/g, label: "shadow*" },
  { id: "z_index", re: /\bz-(?:\[\d+\]|\d+)\b/g, label: "z-index" },
  { id: "style_key", re: /(?:fontSize|lineHeight|letterSpacing|width|height|padding|margin|gap|top|left|right|bottom|color|backgroundColor|borderRadius|zIndex|opacity|transform|animation|transition)\s*:/g, label: "style object key" },
  { id: "motion_props", re: /(?:initial|animate|exit|transition)=\{\{/g, label: "motion props" },
  { id: "anim_duration_js", re: /duration\s*:\s*[\d.]+/g, label: "JS anim duration" },
];

const CSS_PATTERNS = [
  { id: "hex_color", re: /#[0-9a-fA-F]{3,8}\b/g, label: "hex color" },
  { id: "rgb_color", re: /rgba?\([^)]+\)/g, label: "rgb/rgba" },
  { id: "hsl_color", re: /hsl[a]?\([^)]+\)/g, label: "hsl" },
  { id: "px_literal", re: /\d+(\.\d+)?px/g, label: "Npx" },
  { id: "rem_em", re: /\d+(\.\d+)?(?:rem|em)\b/g, label: "rem/em" },
  { id: "percent", re: /\d+(\.\d+)?%/g, label: "%" },
  { id: "vh_vw", re: /\d+(\.\d+)?v[wh]/g, label: "vh/vw" },
  { id: "time_ms_s", re: /\d+(\.\d+)?m?s\b/g, label: "time (ms/s)" },
  { id: "cubic_bezier", re: /cubic-bezier\([^)]+\)/g, label: "cubic-bezier" },
  { id: "font_size", re: /font-size\s*:\s*[^;]+/g, label: "font-size" },
  { id: "line_height", re: /line-height\s*:\s*[^;]+/g, label: "line-height" },
  { id: "letter_spacing", re: /letter-spacing\s*:\s*[^;]+/g, label: "letter-spacing" },
  { id: "padding", re: /padding(?:-(?:top|right|bottom|left))?\s*:\s*[^;]+/g, label: "padding" },
  { id: "margin", re: /margin(?:-(?:top|right|bottom|left))?\s*:\s*[^;]+/g, label: "margin" },
  { id: "gap", re: /gap\s*:\s*[^;]+/g, label: "gap" },
  { id: "width_height", re: /(?:width|height|min-width|max-width|min-height|max-height|inset|top|left|right|bottom)\s*:\s*[^;]+/g, label: "box position/size" },
  { id: "border_radius", re: /border-radius\s*:\s*[^;]+/g, label: "border-radius" },
  { id: "box_shadow", re: /box-shadow\s*:\s*[^;]+/g, label: "box-shadow" },
  { id: "transition_anim", re: /(?:transition|animation)(?:-duration|-delay)?\s*:\s*[^;]+/g, label: "transition/animation" },
  { id: "z_index", re: /z-index\s*:\s*[^;]+/g, label: "z-index" },
  { id: "keyframes", re: /@keyframes\s+[\w-]+/g, label: "@keyframes" },
];

function csvEscape(s) {
  const v = String(s ?? "");
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeAtomicFile(targetPath, contents) {
  const dir = path.dirname(targetPath);
  const base = path.basename(targetPath);
  const tempPath = path.join(dir, `${base}.${process.pid}.tmp`);

  fs.writeFileSync(tempPath, contents, "utf8");

  let lastError;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      fs.renameSync(tempPath, targetPath);
      return;
    } catch (error) {
      lastError = error;
      const code = error && typeof error === "object" ? error.code : undefined;
      if (attempt === 5 || !["EBUSY", "EPERM", "EACCES"].includes(code)) {
        break;
      }
      sleep(200 * attempt);
    }
  }

  try {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  } catch {
    // Leave the temp file behind only if cleanup itself is blocked.
  }

  throw lastError;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function isBaseCss(filePath) {
  const r = rel(filePath);
  return BASE_CSS_PREFIXES.some((prefix) => r === prefix || r.startsWith(prefix));
}

function walk(dir, ext, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(name.name)) continue;
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full, ext, acc);
    else if (name.name.endsWith(ext)) acc.push(full);
  }
  return acc;
}

function collectCssFiles() {
  const roots = [
    path.join(ROOT, "app"),
    path.join(ROOT, "components"),
    path.join(ROOT, "features"),
  ];
  const acc = [];
  for (const root of roots) {
    walk(root, ".css", acc);
    walk(root, ".module.css", acc);
  }
  return [...new Set(acc)]
    .filter((f) => !isBaseCss(f))
    .sort();
}

function collectTsxFiles() {
  return walk(ROOT, ".tsx").sort();
}

function scanFile(filePath, kind, patterns) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const hits = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    for (const pat of patterns) {
      pat.re.lastIndex = 0;
      let m;
      while ((m = pat.re.exec(line)) !== null) {
        // Skip pure CSS variable lines in CSS files when match is only var()
        if (kind === "css" && /^\s*--[\w-]+\s*:/.test(trimmed) && !/#[0-9a-f]|rgba?\(|\d+px/.test(m[0])) {
          continue;
        }
        hits.push({
          kind,
          file: rel(filePath),
          line: lineIndex + 1,
          column: m.index + 1,
          category: pat.label,
          category_id: pat.id,
          matched_value: m[0],
          line_text: trimmed.slice(0, 300),
        });
      }
    }
  }

  return hits;
}

const tsxFiles = collectTsxFiles();
const cssFiles = collectCssFiles();
const allHits = [];

for (const f of tsxFiles) {
  allHits.push(...scanFile(f, "tsx", TSX_PATTERNS));
}
for (const f of cssFiles) {
  allHits.push(...scanFile(f, "css", CSS_PATTERNS));
}

allHits.sort((a, b) =>
  a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column,
);

// Summary per file
const summaryMap = new Map();
for (const h of allHits) {
  const key = `${h.kind}:${h.file}`;
  if (!summaryMap.has(key)) {
    summaryMap.set(key, {
      kind: h.kind,
      file: h.file,
      match_count: 0,
      categories: new Map(),
    });
  }
  const row = summaryMap.get(key);
  row.match_count += 1;
  row.categories.set(h.category, (row.categories.get(h.category) || 0) + 1);
}

const summaryRows = [...summaryMap.values()]
  .map((r) => ({
    kind: r.kind,
    file: r.file,
    lines_with_hits: new Set(allHits.filter((h) => h.kind === r.kind && h.file === r.file).map((h) => h.line)).size,
    match_count: r.match_count,
    categories: [...r.categories.entries()].map(([k, v]) => `${k}(${v})`).join("; "),
  }))
  .sort((a, b) => b.match_count - a.match_count || a.file.localeCompare(b.file));

fs.mkdirSync(path.dirname(DETAIL_OUT), { recursive: true });

const detailHeader = "kind,file,line,column,category,category_id,matched_value,line_text";
const detailBody = allHits
  .map((h) =>
    [h.kind, h.file, h.line, h.column, h.category, h.category_id, h.matched_value, h.line_text]
      .map(csvEscape)
      .join(","),
  )
  .join("\n");
writeAtomicFile(DETAIL_OUT, `${detailHeader}\n${detailBody}\n`);

const summaryHeader = "kind,file,lines_with_hits,match_count,categories";
const summaryBody = summaryRows
  .map((r) =>
    [r.kind, r.file, r.lines_with_hits, r.match_count, r.categories].map(csvEscape).join(","),
  )
  .join("\n");
writeAtomicFile(SUMMARY_OUT, `${summaryHeader}\n${summaryBody}\n`);

const tsxHits = allHits.filter((h) => h.kind === "tsx").length;
const cssHits = allHits.filter((h) => h.kind === "css").length;
const excludedCss = walk(path.join(ROOT, "app"), ".css").filter(isBaseCss).length;

console.log(`Detail: ${allHits.length} matches → ${DETAIL_OUT}`);
console.log(`Summary: ${summaryRows.length} files → ${SUMMARY_OUT}`);
console.log(`Scanned: ${tsxFiles.length} tsx, ${cssFiles.length} css (${excludedCss} base/token css excluded)`);
console.log(`Breakdown: tsx=${tsxHits} css=${cssHits}`);
console.log("Excluded base CSS paths:");
for (const p of BASE_CSS_PREFIXES) console.log(`  - ${p}`);
