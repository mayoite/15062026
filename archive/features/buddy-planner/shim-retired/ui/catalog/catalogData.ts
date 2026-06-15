/**
 * Buddy Planner - Catalog Data
 *
 * Re-exports unified planner catalog (curated + CSV-generated workstations).
 */

export type {
  CatalogCategory,
  CatalogItem,
} from "@/features/planner/data/catalogTypes";

export { CATALOG_CATEGORIES } from "@/features/planner/data/catalogTypes";

export {
  PLANNER_CATALOG_ITEMS as CATALOG_ITEMS,
  getPlannerCatalogByCategory as getCatalogByCategory,
  searchPlannerCatalog as searchCatalog,
} from "@/features/planner/data/plannerCatalog";
