import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";
import type { Database } from "@/lib/supabase/types";

function readOptionalServiceEnv() {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

export function createAdminServiceClient() {
  const env = readOptionalServiceEnv();
  if (!env) return null;

  return createClient<Database>(env.url, env.serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

export async function enforceAdminRateLimit(
  req: NextRequest,
  scope: string,
  limit = 30,
  windowMs = 60 * 1000,
): Promise<NextResponse | null> {
  const ip = getClientIp(req);
  const limitRes = await rateLimit(`admin:${scope}:${ip}`, limit, windowMs);

  if (limitRes.success) return null;

  return NextResponse.json(
    { error: "Too many requests." },
    {
      status: 429,
      headers: { "X-RateLimit-Reset": limitRes.reset.toString() },
    },
  );
}

export async function requireAdminSession(): Promise<NextResponse | null> {
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

export function isMissingTableError(message: string | undefined): boolean {
  const normalized = (message || "").toLowerCase();
  return (
    normalized.includes("does not exist") ||
    normalized.includes("could not find the table") ||
    normalized.includes("permission denied")
  );
}
