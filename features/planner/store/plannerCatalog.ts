import { getCatalog } from '@/features/catalog/getProducts';
import { listPlannerManagedProductsForPlannerCatalog } from "./plannerManagedProducts";
import {
  normalizePlannerCatalogProducts,
  mergePlannerCatalogProducts,
  type PlannerCatalogIndex,
  type PlannerCatalogProduct,
  type PlannerProductReference,
  buildPlannerCatalogIndex,
  normalizePlannerCatalogProduct,
  resolvePlannerCatalogProductById,
  resolvePlannerCatalogProductByReference,
  resolvePlannerCatalogProductBySlug,
} from "./plannerCatalogCore";

export type {
  PlannerCatalogIndex,
  PlannerCatalogProduct,
  PlannerProductReference,
};
export interface GetPlannerCatalogProductsOptions {
  plannerManagedProducts?:
    | readonly PlannerCatalogProduct[]
    | null
    | undefined
    | Promise<readonly PlannerCatalogProduct[] | null | undefined>
    | (() => Promise<readonly PlannerCatalogProduct[] | null | undefined>);
}

export {
  buildPlannerCatalogIndex,
  mergePlannerCatalogProducts,
  normalizePlannerCatalogProduct,
  normalizePlannerCatalogProducts,
  resolvePlannerCatalogProductById,
  resolvePlannerCatalogProductByReference,
  resolvePlannerCatalogProductBySlug,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unknown error";
}

async function resolvePlannerManagedProductsInput(
  plannerManagedProducts: GetPlannerCatalogProductsOptions["plannerManagedProducts"],
): Promise<readonly PlannerCatalogProduct[]> {
  if (!plannerManagedProducts) {
    return listPlannerManagedProductsForPlannerCatalog();
  }
  if (typeof plannerManagedProducts === "function") {
    return (await plannerManagedProducts()) ?? [];
  }
  return (await plannerManagedProducts) ?? [];
}

export async function getPlannerCatalogProducts(
  options?: GetPlannerCatalogProductsOptions,
): Promise<PlannerCatalogProduct[]> {
  let legacyProducts: PlannerCatalogProduct[] = [];
  try {
    const catalog = await getCatalog();
    legacyProducts = normalizePlannerCatalogProducts(catalog);
  } catch (error) {
    console.error(
      "[planner] Failed to load legacy catalog for planner:",
      getErrorMessage(error),
    );
  }

  let plannerManagedProducts: readonly PlannerCatalogProduct[] = [];
  try {
    plannerManagedProducts = await resolvePlannerManagedProductsInput(
      options?.plannerManagedProducts,
    );
  } catch (error) {
    console.error(
      "[planner] Failed to load planner-managed products:",
      getErrorMessage(error),
    );
  }

  return mergePlannerCatalogProducts(legacyProducts, plannerManagedProducts);
}
