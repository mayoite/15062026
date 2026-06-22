import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import type { CatalogItem } from "./catalogTypes";

type PlannerCatalogApiResponse = {
  success?: boolean;
  items?: CatalogItem[];
  source?: string;
  total?: number;
};

export async function fetchPlannerCatalogItems(): Promise<{
  items: CatalogItem[];
  source: string;
}> {
  const response = await browserApiFetch(apiPath("/api/planner/catalog"));
  if (!response.ok) {
    return { items: [], source: "static" };
  }
  const payload = (await response.json()) as PlannerCatalogApiResponse;
  return {
    items: payload.items ?? [],
    source: payload.source ?? "planner_managed_products",
  };
}
