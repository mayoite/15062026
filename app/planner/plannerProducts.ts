import "server-only";

import { getPlannerCatalogProducts } from "@/features/planner/catalog/plannerCatalog";

const PLANNER_CATALOG_TIMEOUT_MS = 3000;

function timeoutAfter(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`planner-catalog-timeout>${ms}ms`)), ms);
  });
}

export async function getPlannerCatalogProductsSafe() {
  try {
    return await Promise.race([
      getPlannerCatalogProducts(),
      timeoutAfter(PLANNER_CATALOG_TIMEOUT_MS),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[planner] catalog preload fallback: ${message}`);
    return [];
  }
}
