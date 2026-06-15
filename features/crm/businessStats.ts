import "server-only";

import { unstable_cache } from "next/cache";
import { hasSupabasePublicEnv, supabase } from '@/platform/drizzle/db';
import type { BusinessStats, BusinessStatsResult, StatsSource } from "@/lib/types/businessStats";
import {
  BUSINESS_STATS_FETCH_TIMEOUT_MS,
  BUSINESS_STATS_REVALIDATE_SECONDS,
  BUSINESS_STATS_SAFE_DEFAULTS,
} from "@/data/site/fallbacks";

interface BusinessStatsRow {
  projects_delivered: number;
  client_organisations: number;
  sectors_served: number;
  locations_served: number;
  years_experience: number;
  as_of_date: string;
}

let lastKnownGoodStats: BusinessStats | null = null;
const loggedBusinessStatsFallbacks = new Set<string>();
interface BusinessStatsPayload {
  stats: BusinessStats;
  source: StatsSource;
}

function isExpectedStatsFallback(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("public.business_stats_current") ||
    normalized.includes("missing_active_business_stats") ||
    normalized.includes("next_public_supabase_url") ||
    normalized.includes("next_public_supabase_anon_key") ||
    normalized.includes("timeout>") ||
    normalized.includes("fetch failed") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("network")
  );
}

function resolveBusinessStatsPayload(): Promise<BusinessStatsPayload> {
  if (!hasSupabasePublicEnv()) {
    return Promise.resolve(buildFallbackPayload());
  }

  return fetchLiveBusinessStats()
    .then((stats) => {
      lastKnownGoodStats = stats;
      return { stats, source: "supabase" as const };
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      logUnexpectedBusinessStatsFallback(message);
      return buildFallbackPayload();
    });
}

function logUnexpectedBusinessStatsFallback(message: string) {
  const summarized = message.slice(0, 180);
  if (!isExpectedStatsFallback(summarized) && !loggedBusinessStatsFallbacks.has(summarized)) {
    loggedBusinessStatsFallbacks.add(summarized);
    if (process.env.NODE_ENV !== "production") {
      console.error(`[business-stats] fallback: ${summarized}`);
    }
  }
}

function buildFallbackPayload(): BusinessStatsPayload {
  if (lastKnownGoodStats) {
    return { stats: lastKnownGoodStats, source: "stale-cache" };
  }
  return { stats: BUSINESS_STATS_SAFE_DEFAULTS, source: "safe-default" };
}

function normalizeAsOfDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return BUSINESS_STATS_SAFE_DEFAULTS.asOfDate;
  }
  return parsed.toISOString().slice(0, 10);
}

function normalizeRow(row: BusinessStatsRow): BusinessStats {
  return {
    projectsDelivered: Math.max(0, Number(row.projects_delivered) || 0),
    clientOrganisations: Math.max(0, Number(row.client_organisations) || 0),
    sectorsServed: Math.max(0, Number(row.sectors_served) || 0),
    locationsServed: Math.max(0, Number(row.locations_served) || 0),
    yearsExperience: Math.max(0, Number(row.years_experience) || 0),
    asOfDate: normalizeAsOfDate(row.as_of_date),
  };
}

async function fetchLiveBusinessStats(): Promise<BusinessStats> {
  const dbQuery = supabase
    .from("business_stats_current")
    .select(
      "projects_delivered, client_organisations, sectors_served, locations_served, years_experience, as_of_date",
    )
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`timeout>${BUSINESS_STATS_FETCH_TIMEOUT_MS}ms`)),
      BUSINESS_STATS_FETCH_TIMEOUT_MS,
    );
  });

  const result = await Promise.race([dbQuery, timeout]);
  const { data, error } = result as Awaited<typeof dbQuery>;

  if (error) {
    throw new Error(`supabase:${error.message}`);
  }

  if (!data) {
    throw new Error("supabase:missing_active_business_stats");
  }

  return normalizeRow(data as BusinessStatsRow);
}

const getCachedLiveBusinessStats = unstable_cache(fetchLiveBusinessStats, ["business-stats-live"], {
  revalidate: BUSINESS_STATS_REVALIDATE_SECONDS,
  tags: ["business-stats"],
});
const getCachedBusinessStatsPayload = unstable_cache(
  resolveBusinessStatsPayload,
  ["business-stats-live-payload"],
  {
    revalidate: BUSINESS_STATS_REVALIDATE_SECONDS,
    tags: ["business-stats"],
  },
);

export async function getBusinessStats(options?: {
  forceLive?: boolean;
}): Promise<BusinessStatsResult> {
  const fetchedAt = new Date().toISOString();

  if (!options?.forceLive) {
    const payload = await getCachedBusinessStatsPayload();
    return { ...payload, fetchedAt };
  }

  if (!hasSupabasePublicEnv()) {
    return { ...buildFallbackPayload(), fetchedAt };
  }

  try {
    const stats = await getCachedLiveBusinessStats();
    lastKnownGoodStats = stats;
    return { stats, source: "supabase", fetchedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logUnexpectedBusinessStatsFallback(message);
    return { ...buildFallbackPayload(), fetchedAt };
  }
}
