import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FEATURES_TESTS = path.join(ROOT, "tests", "features");

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.test\.(ts|tsx)$/.test(ent.name)) continue;

    const relDir = path
      .relative(FEATURES_TESTS, path.dirname(full))
      .split(path.sep)
      .join("/");

    const content = fs.readFileSync(full, "utf8");
    const updated = content.replace(
      /from (["'])(\.\.?\/[^"']+)\1/g,
      (_match, quote, importPath) => {
        const resolved = path.posix
          .normalize(path.posix.join(relDir, importPath))
          .replace(/\\/g, "/");
        return `from ${quote}@/features/${resolved}${quote}`;
      },
    );

    if (updated !== content) {
      fs.writeFileSync(full, updated);
      console.log(`fixed ${path.relative(ROOT, full)}`);
    }
  }
}

walk(FEATURES_TESTS);