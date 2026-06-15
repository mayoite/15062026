// eslint-disable-next-line @typescript-eslint/no-require-imports
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
let content = fs.readFileSync('e:/gemini2/features/buddy-planner/types/elements.ts', 'utf8');

const str1 = `  // IT/AV/Network/Power layer (M1) — physical infrastructure props that
  // live on the floor next to seating/decor. Each is non-assignable (no
  // employee, no neighborhood) and contributes to one of four logical
  // sub-layers (network/av/security/power) used by the M2 view-toggle
  // work. Listed individually rather than rolled into a single \`device\`
  // discriminated union so that future per-type renderers, defaults, and
  // analyzer carve-outs (utilisation, churn) follow the same one-type-→-
  // one-renderer contract the existing furniture catalog established.
  // See \`IT_DEVICE_TYPES\` and \`itLayerOf\` below.
  | 'access-point'
  | 'network-jack'
  | 'display'
  | 'video-bar'
  | 'badge-reader'
  | 'outlet'`;

content = content.replace(str1, '');

const str2 = `  | AccessPointElement
  | NetworkJackElement
  | DisplayElement
  | VideoBarElement
  | BadgeReaderElement
  | OutletElement`;

content = content.replace(str2, '');

const regex1 = /\/\/ -{77}\r?\n\/\/ IT\/AV\/Network\/Power layer \(M1\)\r?\n\/\/ -{77}[\s\S]*?export type ITLayer = 'network' \| 'av' \| 'security' \| 'power'\r?\n/;
content = content.replace(regex1, '');

const regex2 = /\/\/ -{77}\r?\n\/\/ IT\/AV\/Network\/Power layer \(M1\) — type guards \+ layer router\r?\n\/\/ -{77}[\s\S]*?export function itLayerOf\(el: CanvasElement\): ITLayer \| null \{[\s\S]*?\}\r?\n/;
content = content.replace(regex2, '');

fs.writeFileSync('e:/gemini2/features/buddy-planner/types/elements.ts', content, 'utf8');
