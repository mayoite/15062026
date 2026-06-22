import type { BusinessStats } from "@/lib/types/businessStats";

export const BUSINESS_STATS_FETCH_TIMEOUT_MS = 1200;
export const BUSINESS_STATS_REVALIDATE_SECONDS = 300;
export const CATALOG_REVALIDATE_SECONDS = 300;

export const BUSINESS_STATS_SAFE_DEFAULTS: BusinessStats = {
  projectsDelivered: 259,
  clientOrganisations: 120,
  sectorsServed: 18,
  locationsServed: 20,
  yearsExperience: 15,
  asOfDate: "2026-03-01",
};
