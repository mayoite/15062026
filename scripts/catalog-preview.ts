// One-off: render a sheet of procedural 2D catalog blocks to an SVG for visual review.
// Run: npx tsx scripts/catalog-preview.ts
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildBlock2D, blockToSvg, type Block2D } from "../lib/catalog/blocks2d";
import type { Product } from "../lib/catalog/types";

function p(partial: Partial<Product>): Product {
  return {
    id: partial.id || "x",
    category_id: partial.category_id || "workstations",
    series: "s",
    name: partial.name || "Item",
    slug: "s",
    images: [],
    specs: { dimensions: "", materials: [], features: [] },
    series_id: "s",
    series_name: "S",
    created_at: new Date(0).toISOString(),
    ...partial,
  };
}

const samples: Array<{ product: Product; opts?: Parameters<typeof buildBlock2D>[1] }> = [
  {
    product: p({
      name: "DeskPro Linear 4-seat",
      category_id: "workstations",
      sizingType: "parametric",
      workstation: {
        shape: "straight",
        system: "leg",
        wireManagement: ["250mm Raceway"],
        sharing: "sharing",
        seaterOptions: [1, 2, 3, 4, 5],
        lengthOptions: [1200, 1350, 1500],
        depthOptions: [600, 750],
        heightMm: 750,
      },
    }),
    opts: { selection: { seaters: 4, length: 1500, depth: 600 } },
  },
  {
    product: p({
      name: "Neo L-Shape 2-seat",
      category_id: "workstations",
      sizingType: "parametric",
      workstation: {
        shape: "l-shape",
        system: "partition",
        wireManagement: ["Flip-Down Raceway"],
        sharing: "non-sharing",
        seaterOptions: [1, 2, 3, 4],
        lengthOptions: [1200, 1350, 1500],
        depthOptions: [600, 750],
        heightMm: 750,
        armOptions: [1200, 1350, 1500],
      },
    }),
    opts: { selection: { seaters: 2, length: 1500, depth: 600, armLength: 1350 } },
  },
  {
    product: p({
      name: "3-Drawer Pedestal",
      category_id: "storage",
      sizingType: "discrete",
      sizeOptions: [{ sku: "PED-3", label: "3-Drawer", dim: { L: 400, D: 500, H: 650 } }],
    }),
  },
  {
    product: p({
      name: "Task Chair",
      category_id: "seating",
      sizingType: "fixed",
      defaultFootprint: { L: 650, D: 650 },
    }),
  },
  {
    product: p({
      name: "Discussion Table",
      category_id: "tables",
      sizingType: "discrete",
      sizeOptions: [{ sku: "DT-2400", label: "2400", dim: { L: 2400, D: 1200, H: 750 } }],
    }),
  },
];

const blocks = samples
  .map((s) => buildBlock2D(s.product, s.opts))
  .filter((b): b is Block2D => b !== null);

// Lay out as a vertical stack with a title per block.
const GAP = 220;
let y = 0;
const parts: string[] = [];
let maxW = 0;
for (const b of blocks) {
  const svg = blockToSvg(b);
  const w = b.footprint.L / 4 + 260;
  maxW = Math.max(maxW, w);
  parts.push(
    `<g transform="translate(20, ${y})">` +
      `<text x="0" y="0" font-family="system-ui, sans-serif" font-size="22" fill="#2b333d">${b.label}</text>` +
      `<g transform="translate(0, 16)">${svg}</g>` +
      `</g>`,
  );
  y += b.footprint.D / 4 + 320 + GAP / 4;
}

// Inline the same CSS entrypoint used by planner runtime imports.
const stylesDir = resolve(__dirname, "../lib/catalog/styles");
let cssContent = "";
try {
  const seen = new Set<string>();
  const inlineCss = (filePath: string): string => {
    const absolutePath = resolve(filePath);
    if (seen.has(absolutePath)) {
      return "";
    }
    seen.add(absolutePath);

    const source = readFileSync(absolutePath, "utf8");
    return source.replace(/@import\s+["']([^"']+)["'];/g, (_match, importPath: string) =>
      inlineCss(resolve(dirname(absolutePath), importPath)),
    );
  };

  const combinedCss = inlineCss(resolve(stylesDir, "index.css"));
  cssContent = `\n<style>\n${combinedCss}\n</style>\n`;
} catch (e) {
  console.warn("Could not read styles directory", e);
}

const sheet =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(maxW + 60)}" height="${Math.ceil(y + 40)}" ` +
  `style="background:#f6f8fa">\n${cssContent}${parts.join("\n")}\n</svg>\n`;

const out = resolve(__dirname, "../../docs/plans/assets/10-BLOCKS-CATALOG-PREVIEW.svg");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, sheet, "utf8");
// eslint-disable-next-line no-console
console.log("Wrote", out, `(${blocks.length} blocks)`);
