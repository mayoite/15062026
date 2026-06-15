import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

export function getPublicApiIp(req: Request | NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1"
  );
}

export async function enforcePublicApiRateLimit(
  req: Request | NextRequest,
  scope: string,
  limit = 60,
  windowMs = 60 * 1000,
): Promise<NextResponse | null> {
  const ip = getPublicApiIp(req);
  const limitRes = await rateLimit(`public:${scope}:${ip}`, limit, windowMs);
  if (limitRes.success) return null;

  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: { "X-RateLimit-Reset": limitRes.reset.toString() },
    },
  );
}
