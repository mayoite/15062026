/**
 * Compatibility re-export — canonical implementation lives in
 * features/planner/store/plannerCatalogCore.ts
 */
export {
  type PlannerCatalogProduct,
  type PlannerProductReference,
  type PlannerCatalogIndex,
  normalizePlannerCatalogProduct,
  normalizePlannerCatalogProducts,
  mergePlannerCatalogProducts,
  buildPlannerCatalogIndex,
  resolvePlannerCatalogProductByReference,
  resolvePlannerCatalogProductById,
  resolvePlannerCatalogProductBySlug,
} from "@/features/planner/store/plannerCatalogCore";
