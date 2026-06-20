/**
 * fix-css-compat.mjs
 * Adds missing vendor prefixes across all CSS files in app/css/ and lib/catalog/styles/.
 * Run with: node scripts/fix-css-compat.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(new URL('.', import.meta.url).pathname.slice(1).replace(/^\/([A-Z]:)/, '$1'));
const CSS_DIRS = [
  join(ROOT, 'app/css'),
  join(ROOT, 'lib/catalog/styles'),
];

let totalFiles = 0;
let totalChanges = 0;

function walkDir(dir, cb) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkDir(full, cb);
    else if (entry.endsWith('.css')) cb(full);
  }
}

function fixCss(src) {
  let out = src;
  let changed = 0;

  // Helper: insert a prefixed line before the current line if not already present
  function addPrefixBefore(css, stdProp, prefixedProp) {
    const lines = css.split('\n');
    const result = [];
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      // Match e.g. "  backdrop-filter: ..." but NOT "-webkit-backdrop-filter: ..."
      if (trimmed.startsWith(stdProp + ':') && !trimmed.startsWith('-')) {
        const indent = lines[i].slice(0, lines[i].length - lines[i].trimStart().length);
        const prefixedLine = indent + prefixedProp + ':' + trimmed.slice(stdProp.length + 1);
        // Only add if the prefixed version doesn't already exist nearby (within 3 lines)
        const context = lines.slice(Math.max(0, i - 3), i + 3).join('\n');
        if (!context.includes(prefixedProp + ':')) {
          result.push(prefixedLine);
          changed++;
        }
      }
      result.push(lines[i]);
    }
    return result.join('\n');
  }

  // Helper: insert a prefixed line AFTER the current line if not already present
  function addPrefixAfter(css, stdProp, prefixedProp) {
    const lines = css.split('\n');
    const result = [];
    for (let i = 0; i < lines.length; i++) {
      result.push(lines[i]);
      const trimmed = lines[i].trimStart();
      if (trimmed.startsWith(stdProp + ':') && !trimmed.startsWith('-')) {
        const indent = lines[i].slice(0, lines[i].length - lines[i].trimStart().length);
        const prefixedLine = indent + prefixedProp + ':' + trimmed.slice(stdProp.length + 1);
        const context = lines.slice(Math.max(0, i - 3), i + 4).join('\n');
        if (!context.includes(prefixedProp + ':')) {
          result.push(prefixedLine);
          changed++;
        }
      }
    }
    return result.join('\n');
  }

  // 1. backdrop-filter → add -webkit-backdrop-filter BEFORE
  out = addPrefixBefore(out, 'backdrop-filter', '-webkit-backdrop-filter');

  // 2. mask-image → add -webkit-mask-image BEFORE
  out = addPrefixBefore(out, 'mask-image', '-webkit-mask-image');
  out = addPrefixBefore(out, 'mask-size', '-webkit-mask-size');
  out = addPrefixBefore(out, 'mask-repeat', '-webkit-mask-repeat');
  out = addPrefixBefore(out, 'mask-position', '-webkit-mask-position');

  // 3. user-select → add -webkit-user-select BEFORE
  out = addPrefixBefore(out, 'user-select', '-webkit-user-select');

  // 4. text-size-adjust → add -webkit-text-size-adjust BEFORE
  out = addPrefixBefore(out, 'text-size-adjust', '-webkit-text-size-adjust');

  // 5. background-clip: text → add -webkit-background-clip BEFORE
  out = addPrefixBefore(out, 'background-clip', '-webkit-background-clip');

  // 6. appearance → add -webkit-appearance BEFORE
  out = addPrefixBefore(out, 'appearance', '-webkit-appearance');

  // 7. Fix ordering: if -webkit-X comes AFTER X, swap (for appearance, background-clip, user-select)
  // This is handled by using addPrefixBefore which naturally puts the prefix before the standard
  
  return { out, changed };
}

for (const dir of CSS_DIRS) {
  try {
    walkDir(dir, (file) => {
      const src = readFileSync(file, 'utf8');
      const { out, changed } = fixCss(src);
      if (changed > 0) {
        writeFileSync(file, out, 'utf8');
        console.log(`  [+${changed}] ${file.replace(ROOT + '\\', '').replace(ROOT + '/', '')}`);
        totalFiles++;
        totalChanges += changed;
      }
    });
  } catch (e) {
    // dir may not exist
  }
}

console.log(`\nDone. ${totalChanges} prefixes added across ${totalFiles} files.`);
