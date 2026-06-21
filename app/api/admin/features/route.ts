/**
 * GET/PATCH /api/admin/features — Feature flag management (admin only).
 *
 * GET lists all feature flags (merged from Supabase `feature_flags` table and
 * local defaults). PATCH updates one or more flags by key, validating keys
 * against the known allowlist.
 *
 * Auth: `admin` role required (enforced by `withAuth`). Rate-limited per IP.
 *
 * PATCH body: {@link FeatureFlagsPatchSchema} —
 *   `{ key?, enabled?, updates?: { [flagName]: boolean } }`.
 *
 * Response (GET 200): `{ success: true, flags, source }`.
 * Response (PATCH 200): `{ success: true, source }`.
 * Errors: 400 (validation / unknown flag), 401, 403, 429, 500.
 */

import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withAuth } from "@/lib/api/withAuth";
import { success, error, validationError } from "@/lib/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/lib/api/ApiError";
import { FeatureFlagsPatchSchema } from "@/lib/api/schemas";
import type { FeatureFlagName } from "@/features/planner/lib/featureFlags";
import { getFeatureFlags, setFeatureFlags, getAllFlagNames } from "@/features/planner/lib/featureFlags";

type FeatureFlagRow = {
  key: string;
  enabled: boolean | null;
};

function createFeatureFlagsAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

async function handleFeaturesGet(): Promise<NextResponse> {
  try {
    const supabase = createFeatureFlagsAdminClient();
    if (!supabase) {
      return success({ flags: getFeatureFlags(), source: "local" });
    }

    const { data, error: dbError } = await supabase
      .from("feature_flags")
      .select("key, enabled");

    if (dbError) {
      console.error("[admin/features] GET error:", dbError.message);
      return success({ flags: getFeatureFlags(), source: "local" });
    }

    const remoteFlags = (data || []).reduce<Record<string, boolean>>((acc, row) => {
      const typedRow = row as FeatureFlagRow;
      if (typedRow.key) {
        acc[typedRow.key] = Boolean(typedRow.enabled);
      }
      return acc;
    }, {});

    const mergedFlags = { ...getFeatureFlags(), ...remoteFlags };
    setFeatureFlags(mergedFlags);

    return success({ flags: mergedFlags, source: "supabase+local" });
  } catch (err) {
    console.error("[admin/features] GET failed:", err);
    return success({ flags: getFeatureFlags(), source: "local" });
  }
}

async function handleFeaturesPatch(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = FeatureFlagsPatchSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);
  const { key, enabled, updates } = parsed.data;

  const rawUpdates =
    updates && Object.keys(updates).length > 0
      ? updates
      : key
        ? { [key]: Boolean(enabled) }
        : null;

  if (!rawUpdates) {
    return validationError(
      [{ path: ["updates"], message: "No updates provided" }],
      "No updates provided",
    );
  }

  // Validate all keys against the known allowlist to prevent arbitrary rows.
  const allowedKeys = new Set<string>(getAllFlagNames());
  const invalidKeys = Object.keys(rawUpdates).filter((k) => !allowedKeys.has(k));
  if (invalidKeys.length > 0) {
    return error(
      new ApiError(
        400,
        API_ERROR_CODES.VALIDATION_ERROR,
        `Unknown flag keys: ${invalidKeys.join(", ")}`,
      ),
    );
  }

  const updatesTyped = rawUpdates as Partial<Record<FeatureFlagName, boolean>>;

  const supabase = createFeatureFlagsAdminClient();
  if (!supabase) {
    setFeatureFlags(updatesTyped);
    return success({ source: "local" });
  }

  const rows = Object.entries(updatesTyped).map(([flagKey, flagEnabled]) => ({
    key: flagKey,
    enabled: Boolean(flagEnabled),
    rollout_percentage: 100,
    updated_at: new Date().toISOString(),
  }));

  const { error: dbError } = await supabase.from("feature_flags").upsert(rows);
  if (dbError) {
    console.error("[admin/features] PATCH error:", dbError.message);
    return error(
      new ApiError(500, API_ERROR_CODES.DATABASE_ERROR, dbError.message),
    );
  }

  setFeatureFlags(updatesTyped);
  return success({ source: "supabase" });
}

/** List feature flags. Admin role; rate-limited. */
export const GET = withAuth(
  async () => handleFeaturesGet(),
  { role: "admin", rateLimitScope: "admin-features:get", rateLimit: 30 },
);

/** Update feature flags. Admin role; rate-limited. */
export const PATCH = withAuth(
  async (req) => handleFeaturesPatch(req as NextRequest),
  { role: "admin", rateLimitScope: "admin-features:patch", rateLimit: 20 },
);
