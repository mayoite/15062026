// One-off: render the real oando seed catalog to an SVG/PNG sheet for visual review.
// Run: npx tsx scripts/seed-catalog-preview.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { buildOandoSeedProducts } from "../../lib/catalog/seed/oandoCatalog";
import { buildBlock2D, blockToSvg } from "../../lib/catalog/blocks2d";

const picks: Array<[string, Parameters<typeof buildBlock2D>[1]]> = [
  ["oando-ws-linear", { selection: { seaters: 4, length: 1500, depth: 600 } }],
  ["oando-ws-lshape-panel", { selection: { seaters: 2, length: 1500, depth: 600, armLength: 1350 } }],
  ["oando-pedestal", {}],
  ["oando-storage-unit", { sizeSku: "STG-FULL-1800-900" }],
  ["oando-cabin-table", { sizeSku: "CAB-1800-900" }],
  ["oando-meeting-table", { sizeSku: "MEET-2400-1200" }],
  ["oando-discussion-table", { sizeSku: "DISC-1200" }],
];

const all = buildOandoSeedProducts();
let y = 0;
let maxW = 0;
const parts: string[] = [];

for (const [id, opts] of picks) {
  const product = all.find((p) => p.id === id);
  if (!product) continue;
  const block = buildBlock2D(product, opts);
  if (!block) continue;
  const svg = blockToSvg(block);
  maxW = Math.max(maxW, block.footprint.L / 4 + 300);
  parts.push(
    `<g transform="translate(20, ${y})">` +
      `<text x="0" y="0" font-family="system-ui, sans-serif" font-size="22" fill="#2b333d">${block.label}</text>` +
      `<g transform="translate(0, 16)">${svg}</g></g>`,
  );
  y += block.footprint.D / 4 + 340;
}

const sheet =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(maxW + 60)}" height="${Math.ceil(y + 40)}" style="background:#f6f8fa">\n` +
  parts.join("\n") +
  `\n</svg>\n`;

const dir = resolve(__dirname, "../../docs/plans/planner-overhaul");
mkdirSync(dir, { recursive: true });
writeFileSync(resolve(dir, "seed-catalog.svg"), sheet, "utf8");

sharp(Buffer.from(sheet), { density: 200 })
  .png()
  .flatten({ background: "#f6f8fa" })
  .toFile(resolve(dir, "seed-catalog.png"))
// eslint-disable-next-line no-console
  .then((info) => console.log("wrote seed-catalog.png", `${info.width}x${info.height}`))
  .catch((err) => {
    console.error("render failed:", err);
    process.exit(1);
  });
