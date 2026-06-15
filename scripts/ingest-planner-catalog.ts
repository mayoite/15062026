/**
 * Ingest planner CSVs → features/planner/data/generatedCatalogItems.ts
 *
 * Usage: npx tsx scripts/ingest-planner-catalog.ts
 */

import * as fs from "fs";
import * as path from "path";

import {
  CSV_DIR,
  PLANNER_CSV_FILES,
  dedupeCatalogItems,
  parseCsvFile,
} from "../../features/planner/data/csvCatalogIngest";
import type { CatalogItem } from "../../features/planner/data/catalogTypes";

const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "features/planner/data/generatedCatalogItems.ts");

function main() {
  const generated: CatalogItem[] = [];

  for (const file of PLANNER_CSV_FILES) {
    const filePath = path.join(ROOT, CSV_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`skip missing: ${file}`);
      continue;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    const items = parseCsvFile(file, raw);
    console.log(`${file}: ${items.length} items`);
    generated.push(...items);
  }

  const unique = dedupeCatalogItems(generated);
  console.log(`total: ${unique.length} unique catalog items`);

  const body = `/**
 * AUTO-GENERATED — do not edit by hand.
 * Regenerate: npx tsx scripts/ingest-planner-catalog.ts
 */
import type { CatalogItem } from "@/features/planner/data/catalogTypes";

export const GENERATED_CATALOG_ITEMS: CatalogItem[] = ${JSON.stringify(unique, null, 2)} as CatalogItem[];

export const GENERATED_CATALOG_COUNT = ${unique.length};
`;

  fs.writeFileSync(OUT, body, "utf8");
  console.log(`written → ${OUT}`);
}

main();
