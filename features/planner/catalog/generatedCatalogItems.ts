/**
 * AUTO-GENERATED - do not edit by hand.
 * Regenerate: npm.cmd run catalog:ingest
 *
 * Canonical planner catalog entrypoint. The part files are a generated
 * implementation detail so the catalog payload stays manageable.
 */
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { GENERATED_CATALOG_ITEMS_PART1 } from "./generatedCatalogItemsPart1";
import { GENERATED_CATALOG_ITEMS_PART2 } from "./generatedCatalogItemsPart2";

export const GENERATED_CATALOG_ITEMS: CatalogItem[] = [
  ...GENERATED_CATALOG_ITEMS_PART1,
  ...GENERATED_CATALOG_ITEMS_PART2,
];

export const GENERATED_CATALOG_COUNT = GENERATED_CATALOG_ITEMS.length;
