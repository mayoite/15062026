const fs = require('fs');
let c = fs.readFileSync('lib/displayText.ts', 'utf8');
c = c.replace(/export function sanitizeDisplayText\(value: string\): string \{[\s\S]*?\}/m, `export function sanitizeDisplayText(value: string): string {
  return String(value || "")
    .replace(/[\\uFFFD]+/g, "")
    .replace(/[\\u2013\\u2014]/g, "-")
    .replace(/[\\u2018\\u2019']/g, "'")
    .replace(/[\\u201c\\u201d"]/g, '"')
    .replace(/\\u2026/g, "...")
    .replace(/(?:\\u20B9|₹)\\s*/g, "Rs. ")
    .replace(/\\u00a0/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}`);
fs.writeFileSync('lib/displayText.ts', c);
