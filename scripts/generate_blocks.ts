import * as fs from 'fs';
import * as path from 'path';
import { buildBlock2D } from '@/lib/catalog/blocks2d';

const REPO_ROOT = path.resolve(__dirname, '../..');

// We inject these CSS variables into the SVG so the output renders correctly
const cssPath = path.join(REPO_ROOT, 'lib/catalog/styles/tokens.css');
let CSS_VARS = '';
if (fs.existsSync(cssPath)) {
  CSS_VARS = fs.readFileSync(cssPath, 'utf8');
} else {
  // Fallback if tokens.css is missing or split
  CSS_VARS = `
  :root {
    --block-surface: #f8fafc;
    --block-surface-grad-start: #f8fafc;
    --block-surface-grad-end: #f1f5f9;
    --block-surface-stroke: #cbd5e1;
    --block-seat: #e2e8f0;
    --block-seat-stroke: #94a3b8;
    --block-seat-contour: #f1f5f9;
    --block-seat-backrest: #cbd5e1;
    --block-seat-backrest-stroke: #94a3b8;
    --block-armrest: #cbd5e1;
    --block-armrest-soft: #94a3b8;
    --block-caster-base: #f8fafc;
    --block-caster-spoke: #cbd5e1;
    --block-caster-wheel: #64748b;
    --block-panel: #e2e8f0;
    --block-panel-grad-start: #f8fafc;
    --block-glyph: #94a3b8;
    --block-glyph-dark: #64748b;
    --block-screen-grad-start: #334155;
    --block-screen-grad-end: #1e293b;
    --block-shadow-color: rgba(15, 23, 42, 0.15);
  }`;
}

function parseWorkstations() {
  const csvPath = path.join(
    REPO_ROOT,
    'features/planner/data/csv/Workstation and basic storages website.csv',
  );
  if (!fs.existsSync(csvPath)) return [];
  const csvData = fs.readFileSync(csvPath, 'utf8');
  
  const lines = csvData.split('\n');
  const blocks: any[] = [];
  let currentMode = 'NS'; 
  
  for (const line of lines) {
    if (line.includes('WORKSTATION: SHARING')) {
      currentMode = 'SH';
      continue;
    }
    
    if (line.includes('seater')) {
      const parts = line.split(',');
      const desc = parts[1];
      const length = parseInt(parts[2], 10);
      const seaters = parseInt(desc.split(' ')[0], 10);
      const isSharing = currentMode === 'SH' || desc.includes('SH');
      
      blocks.push({
        name: `${desc} (${length}mm)`,
        seaters: seaters,
        length: length,
        depth: isSharing ? 1200 : 600, 
        isSharing
      });
    } else if (line.trim().startsWith(',,1350') || line.trim().startsWith(',,1500')) {
      const length = parseInt(line.split(',')[2], 10);
      const prev: any = blocks[blocks.length - 1];
      if (prev) {
        blocks.push({
          name: `${prev.name.split(' (')[0]} (${length}mm)`,
          seaters: prev.seaters,
          length: length,
          depth: prev.depth,
          isSharing: prev.isSharing
        });
      }
    }
  }
  return blocks;
}

const blocksData = parseWorkstations();
const blocks = [];

for (const data of blocksData) {
  const product = {
    id: 'ws-mock',
    name: data.name,
    category_id: 'workstation',
    sizingType: 'parametric',
    workstation: {
      shape: 'straight',
      system: data.isSharing ? 'partition' : 'none',
      seaterOptions: [data.seaters]
    }
  } as any;
  
  const block = buildBlock2D(product, { selection: { seaters: data.seaters, length: data.length, depth: data.depth } });
  if (block) {
    blocks.push({ name: data.name, block });
  }
}

// Add some standalone blocks
const extraProduct = { id: 'ped', name: 'Pedestal', category_id: 'storage', sizingType: 'discrete' } as any;
const extraBlock = buildBlock2D(extraProduct, { selection: { length: 400, depth: 500 } });
if (extraBlock) blocks.push({ name: 'Mobile Pedestal', block: extraBlock });

const resultsDir = path.join(REPO_ROOT, 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

function primToSvg(p: any): string {
  const shadow = p.shadowColor ? ` filter="drop-shadow(0px ${p.shadowOffsetY || 0}px ${p.shadowBlur || 0}px ${p.shadowColor})"` : "";
  const transform = p.rotation ? ` transform="rotate(${p.rotation} ${p.offsetX || 0} ${p.offsetY || 0})"` : "";
  const baseAttr = `${shadow}${transform}`;

  if (p.kind === 'rect') {
    const fill = p.fill ?? (p.fillLinearGradientColorStops ? 'url(#grad-surface)' : 'none');
    const stroke = p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.strokeWidth ?? 0}"` : "";
    const rx = p.radius ? ` rx="${p.radius}" ry="${p.radius}"` : "";
    return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${fill}"${stroke}${rx}${baseAttr}/>`;
  } else if (p.kind === 'circle') {
    const fill = p.fill ?? (p.fillLinearGradientColorStops ? 'url(#grad-surface)' : 'none');
    const stroke = p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.strokeWidth ?? 0}"` : "";
    return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${fill}"${stroke}${baseAttr}/>`;
  } else if (p.kind === 'line') {
    const pts = [];
    for (let i = 0; i < p.points.length; i += 2) pts.push(`${p.points[i]},${p.points[i + 1]}`);
    const dash = p.dash ? ` stroke-dasharray="${p.dash.join(' ')}"` : "";
    return `<polyline points="${pts.join(' ')}" fill="none" stroke="${p.stroke}" stroke-width="${p.strokeWidth}"${dash} stroke-linecap="${p.lineCap || 'butt'}"${baseAttr}/>`;
  } else if (p.kind === 'path') {
    const fill = p.fill ?? 'none';
    const stroke = p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.strokeWidth ?? 0}"` : "";
    return `<path d="${p.data}" fill="${fill}"${stroke} stroke-linecap="${p.lineCap || 'butt'}"${baseAttr}/>`;
  }
  return '';
}

const PAD = 480;
const GAP = 150;
let currentY = 0;
let maxW = 0;
const groups: string[] = [];

for (const { name, block } of blocks) {
  const w = block.footprint.L + PAD * 2;
  const h = block.footprint.D + PAD * 2;
  if (w > maxW) maxW = w;

  groups.push(`<g transform="translate(0,${currentY})">`);
  groups.push(`<text x="20" y="30" font-family="Inter, sans-serif" font-size="48" font-weight="600" fill="#1e293b">${name}</text>`);
  groups.push(`<text x="20" y="70" font-family="Inter, sans-serif" font-size="28" fill="#64748b">${block.footprint.L}×${block.footprint.D}mm · ${block.prims.length} primitives</text>`);

  groups.push(`<g transform="translate(0,90)">`);
  groups.push(`<g transform="translate(${PAD},${PAD})" stroke-linejoin="round">`);
  for (const p of block.prims) {
    groups.push(primToSvg(p));
  }
  groups.push('</g>');
  groups.push('</g>');
  groups.push('</g>');

  currentY += h + 90 + GAP;
}

const totalH = currentY;
const defs = `<defs>
  <linearGradient id="grad-surface" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="var(--block-surface-grad-start, #f8fafc)"/>
    <stop offset="100%" stop-color="var(--block-surface-grad-end, #f1f5f9)"/>
  </linearGradient>
</defs>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maxW} ${totalH}" width="${maxW / 4}" height="${totalH / 4}">
<style>
${CSS_VARS}
</style>
${defs}
${groups.join('\n')}
</svg>`;

const outputPath = path.join(resultsDir, 'actual_engine_blocks.svg');
fs.writeFileSync(outputPath, svg);
console.log(`Written successfully to ${outputPath}`);
