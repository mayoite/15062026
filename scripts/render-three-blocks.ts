/**
 * Render 3 planner catalog blocks to PNG + JPEG for visual review.
 * Run: npx tsx scripts/render-three-blocks.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PLANNER_CATALOG_ITEMS } from "../../features/planner/data/workspaceCatalog";
import { resolveCatalogItemBlock2D } from "../../features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";
import { blockToSvg, type Block2D } from "../../lib/catalog/blocks2d";
import { loadBlockCss, rasterizeSvg, RASTER_BG, styleTag } from "./blockRenderUtils";

const REPO = resolve(__dirname, "../..");
const OUT = resolve(REPO, "results/block-previews");
const PAD = 480;

const PICK_IDS = [
  "linear-workstation-partition-system-4-seater-sh-1200mm-6",
  "room-meeting-8",
  "infra-display",
] as const;

function parseBlockSvg(block: Block2D, css: string): { viewBox: string; inner: string; displayW: number; displayH: number } {
  const raw = blockToSvg(block, undefined, css);
  const vb = raw.match(/viewBox="([^"]+)"/)?.[1] ?? `0 0 ${block.footprint.L} ${block.footprint.D}`;
  const inner = raw.replace(/^[\s\S]*?<svg[^>]*>\s*/i, "").replace(/\s*<\/svg>\s*$/i, "");
  const w = block.footprint.L + PAD * 2;
  const h = block.footprint.D + PAD * 2;
  return { viewBox: vb, inner, displayW: w / 4, displayH: h / 4 };
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function renderOne(
  slug: string,
  label: string,
  block: Block2D,
  targetWidth: number,
  css: string,
) {
  const { viewBox, inner, displayW, displayH } = parseBlockSvg(block, css);
  const titleH = 48;
  const margin = 32;
  const svgW = displayW + margin * 2;
  const svgH = displayH + margin * 2 + titleH;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" shape-rendering="geometricPrecision">`,
    styleTag(css),
    `<rect width="100%" height="100%" fill="${RASTER_BG}"/>`,
    `<text x="${margin}" y="${margin + 20}" font-family="system-ui,sans-serif" font-size="14" font-weight="600" fill="#1e293b">${escapeXml(label)}</text>`,
    `<text x="${margin}" y="${margin + 38}" font-family="system-ui,sans-serif" font-size="11" fill="#64748b">${block.footprint.L}×${block.footprint.D} mm · ${block.prims.length} primitives</text>`,
    `<svg x="${margin}" y="${margin + titleH}" width="${displayW}" height="${displayH}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">`,
    inner,
    `</svg>`,
    `</svg>`,
  ].join("\n");

  const base = resolve(OUT, slug);
  writeFileSync(`${base}.svg`, svg, "utf8");
  await rasterizeSvg(svg, `${base}.png`, targetWidth, css, `${base}.jpg`);
  console.log(`wrote ${slug}.png + ${slug}.jpg (${targetWidth}px wide)`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const css = loadBlockCss();

  const entries = PICK_IDS.map((id) => {
    const item = PLANNER_CATALOG_ITEMS.find((i) => i.id === id);
    if (!item) throw new Error(`missing catalog item: ${id}`);
    const block = resolveCatalogItemBlock2D(item);
    if (!block) throw new Error(`no block for: ${id}`);
    return { id, item, block, parsed: parseBlockSvg(block, css) };
  });

  await renderOne("01-four-seater-desk", entries[0].item.name, entries[0].block, 1920, css);
  await renderOne("02-meeting-room", entries[1].item.name, entries[1].block, 960, css);
  await renderOne("03-wall-display", entries[2].item.name, entries[2].block, 720, css);

  const colW = 1100;
  let y = 24;
  const rows: string[] = [];

  for (const { item, block, parsed } of entries) {
    const rowH = parsed.displayH + 72;
    rows.push(
      `<g transform="translate(24, ${y})">`,
      `<text x="0" y="18" font-family="system-ui,sans-serif" font-size="15" font-weight="600" fill="#1e293b">${escapeXml(item.name)}</text>`,
      `<text x="0" y="36" font-family="system-ui,sans-serif" font-size="11" fill="#64748b">${block.footprint.L}×${block.footprint.D} mm · ${block.prims.length} primitives</text>`,
      `<svg x="0" y="48" width="${colW - 48}" height="${parsed.displayH}" viewBox="${parsed.viewBox}" preserveAspectRatio="xMidYMid meet">`,
      parsed.inner,
      `</svg>`,
      `</g>`,
    );
    y += rowH + 32;
  }

  const sheetH = y + 24;
  const sheet = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${colW}" height="${sheetH}" viewBox="0 0 ${colW} ${sheetH}" shape-rendering="geometricPrecision">`,
    styleTag(css),
    `<rect width="100%" height="100%" fill="${RASTER_BG}"/>`,
    ...rows,
    `</svg>`,
  ].join("\n");

  writeFileSync(resolve(OUT, "three-blocks-sheet.svg"), sheet, "utf8");
  await rasterizeSvg(
    sheet,
    resolve(OUT, "three-blocks-sheet.png"),
    1920,
    css,
    resolve(OUT, "three-blocks-sheet.jpg"),
  );
  console.log("wrote three-blocks-sheet.png + .jpg");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
