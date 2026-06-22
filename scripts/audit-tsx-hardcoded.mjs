#!/usr/bin/env node
/**
 * Scans .tsx files for hardcoded layout, color, typography, animation, spacing.
 * Output: results/tsx-hardcoded-audit.csv
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "results", "tsx-hardcoded-audit.csv");

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "results",
  "outputs",
  ".git",
]);

const PATTERNS = [
  { id: "inline_style", re: /style=\{\{/, label: "inline style={{ }}" },
  { id: "hex_color", re: /#[0-9a-fA-F]{3,8}\b/, label: "hex color" },
  { id: "rgb_color", re: /rgba?\([^)]+\)/, label: "rgb/rgba" },
  { id: "hsl_color", re: /hsl[a]?\([^)]+\)/, label: "hsl" },
  { id: "tailwind_arbitrary", re: /(?:className|class)=["'][^"']*\[[^\]]+\]/, label: "Tailwind arbitrary [...]" },
  { id: "px_literal", re: /\b\d+px\b/, label: "Npx literal" },
  { id: "rem_em_literal", re: /\b\d+(\.\d+)?(?:rem|em)\b/, label: "rem/em literal" },
  { id: "percent_literal", re: /\b\d+(\.\d+)?%/, label: "% literal" },
  { id: "vh_vw", re: /\b\d+(\.\d+)?v[wh]\b/, label: "vh/vw" },
  { id: "z_index_num", re: /\bz-\[?\d+\]?/, label: "z-index numeric" },
  { id: "duration_ms", re: /(?:duration|delay)-\d+/, label: "Tailwind duration/delay" },
  { id: "animate_class", re: /\banimate-[\w-]+/, label: "animate-*" },
  { id: "transition_class", re: /\btransition[\w-]*/, label: "transition*" },
  { id: "font_size_tw", re: /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[[^\]]+\])/, label: "text-* size" },
  { id: "spacing_tw", re: /\b[pm][trblxy]?-(?:\d+|\[[^\]]+\])/, label: "padding/margin *" },
  { id: "gap_space", re: /\b(?:gap|space-[xy])-(?:\d+|\[[^\]]+\])/, label: "gap/space-*" },
  { id: "size_wh", re: /\b[wh]-(?:\d+|\[[^\]]+\])/, label: "w-/h-*" },
  { id: "max_min_size", re: /\b(?:max|min)-[wh]-(?:\d+|\[[^\]]+\])/, label: "max/min w/h" },
  { id: "rounded_literal", re: /\brounded-(?:\w+|\[[^\]]+\])/, label: "rounded-*" },
  { id: "shadow_literal", re: /\bshadow(?:-[\w]+)?/, label: "shadow*" },
  { id: "slate_gray_tailwind", re: /\b(?:bg|text|border)-(?:slate|gray|zinc|neutral|stone|red|blue|green|amber|emerald|orange|yellow|purple|pink|indigo|sky|teal|cyan|lime|rose)-\d{2,3}\b/, label: "Tailwind palette color" },
  { id: "font_weight", re: /\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/, label: "font-weight" },
  { id: "tracking_leading", re: /\b(?:tracking|leading)-[\w.\[\]-]+/, label: "tracking/leading" },
  { id: "style_prop_key", re: /(?:fontSize|lineHeight|letterSpacing|width|height|padding|margin|gap|top|left|right|bottom|color|backgroundColor|borderRadius|zIndex|opacity|transform|animation|transition)\s*:/, label: "style object key" },
  { id: "framer_motion", re: /(?:initial|animate|exit|transition)=\{\{/, label: "motion props" },
  { id: "gsap_duration", re: /duration\s*:\s*[\d.]+/, label: "GSAP/anim duration" },
];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(name.name)) continue;
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full, acc);
    else if (name.name.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

function csvEscape(s) {
  const v = String(s ?? "");
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

const files = walk(ROOT).sort();
const rows = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);
  const hits = new Map();

  for (const pat of PATTERNS) {
    let count = 0;
    const samples = [];
    lines.forEach((line, i) => {
      const m = line.match(pat.re);
      if (m) {
        count += 1;
        if (samples.length < 2) {
          samples.push(`L${i + 1}:${line.trim().slice(0, 120)}`);
        }
      }
    });
    if (count > 0) {
      hits.set(pat.id, { label: pat.label, count, samples });
    }
  }

  if (hits.size === 0) continue;

  const categories = [...hits.values()].map((h) => `${h.label}(${h.count})`).join("; ");
  const total = [...hits.values()].reduce((s, h) => s + h.count, 0);
  const sampleLines = [...hits.values()]
    .flatMap((h) => h.samples)
    .slice(0, 4)
    .join(" | ");

  rows.push({
    file: rel(file),
    category_count: hits.size,
    match_lines: total,
    categories,
    samples: sampleLines,
  });
}

rows.sort((a, b) => b.match_lines - a.match_lines || a.file.localeCompare(b.file));

const header = "file,category_count,match_lines,categories,samples";
const body = rows
  .map((r) =>
    [r.file, r.category_count, r.match_lines, r.categories, r.samples].map(csvEscape).join(","),
  )
  .join("\n");

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${header}\n${body}\n`, "utf8");

const byArea = {};
for (const r of rows) {
  const area = r.file.split("/")[0];
  byArea[area] = (byArea[area] || 0) + 1;
}

console.log(`Wrote ${rows.length} files to ${OUT}`);
console.log("Files with hits by top folder:", byArea);
console.log("Top 15 by match_lines:");
for (const r of rows.slice(0, 15)) {
  console.log(`  ${r.match_lines}\t${r.file}`);
}
