import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";
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

/**
 * Validates that the caller has an active Supabase session and the "admin" role.
 * Returns null on success, or a NextResponse with an error status on failure.
 */
async function requireAdminSession(): Promise<NextResponse | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = user.app_metadata?.role ?? user.user_metadata?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return null;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1"
  );
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limitRes = await rateLimit(`admin:features:get:${ip}`, 30, 60 * 1000);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
    );
  }

  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const supabase = createFeatureFlagsAdminClient();
    if (!supabase) {
      return NextResponse.json({ flags: getFeatureFlags(), source: "local" });
    }

    const { data, error } = await supabase
      .from("feature_flags")
      .select("key, enabled");

    if (error) {
      console.error("[admin/features] GET error:", error.message);
      return NextResponse.json({ flags: getFeatureFlags(), source: "local" });
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

    return NextResponse.json({ flags: mergedFlags, source: "supabase+local" });
  } catch (error) {
    console.error("[admin/features] GET failed:", error);
    return NextResponse.json({ flags: getFeatureFlags(), source: "local" });
  }
}

export async function PATCH(req: NextRequest) {
  const ip = getClientIp(req);
  const limitRes = await rateLimit(`admin:features:patch:${ip}`, 20, 60 * 1000);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
    );
  }

  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      key?: string;
      enabled?: boolean;
      updates?: Partial<Record<FeatureFlagName, boolean>>;
    };

    const rawUpdates =
      body.updates && Object.keys(body.updates).length > 0
        ? body.updates
        : body.key
          ? { [body.key]: Boolean(body.enabled) }
          : null;

    if (!rawUpdates) {
      return NextResponse.json(
        { success: false, error: "No updates provided" },
        { status: 400 },
      );
    }

    // Validate all keys against the known allowlist to prevent arbitrary rows
    const allowedKeys = new Set<string>(getAllFlagNames());
    const invalidKeys = Object.keys(rawUpdates).filter((k) => !allowedKeys.has(k));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { success: false, error: `Unknown flag keys: ${invalidKeys.join(", ")}` },
        { status: 400 },
      );
    }

    const updates = rawUpdates as Partial<Record<FeatureFlagName, boolean>>;

    const supabase = createFeatureFlagsAdminClient();
    if (!supabase) {
      setFeatureFlags(updates);
      return NextResponse.json({ success: true, source: "local" });
    }

    const rows = Object.entries(updates).map(([key, enabled]) => ({
      key,
      enabled: Boolean(enabled),
      rollout_percentage: 100,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("feature_flags").upsert(rows);
    if (error) {
      console.error("[admin/features] PATCH error:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    setFeatureFlags(updates);
    return NextResponse.json({ success: true, source: "supabase" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[admin/features] PATCH failed:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
