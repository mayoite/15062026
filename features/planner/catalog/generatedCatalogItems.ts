/**
 * AUTO-GENERATED — do not edit by hand.
 * Regenerate: npx tsx scripts/ingest-planner-catalog.ts
 *
 * Split into two parts to keep each file under 1 000 lines:
 *   - generatedCatalogItemsPart1.ts  (desks — straight + l-shape, first half)
 *   - generatedCatalogItemsPart2.ts  (desks l-shape second half + all other categories)
 */
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { GENERATED_CATALOG_ITEMS_PART1 } from "./generatedCatalogItemsPart1";
import { GENERATED_CATALOG_ITEMS_PART2 } from "./generatedCatalogItemsPart2";

export const GENERATED_CATALOG_ITEMS: CatalogItem[] = [
  ...GENERATED_CATALOG_ITEMS_PART1,
  ...GENERATED_CATALOG_ITEMS_PART2,
];
