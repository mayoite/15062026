import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  enforceAdminRateLimit,
  requireAdminSession,
} from "@/app/api/admin/_lib/server";
import { validateCsrfRequest } from "@/lib/security/csrf";
import {
  isPlannerDatabaseConfigured,
  loadPlannerDocumentAdmin,
  patchPlannerDocumentAdmin,
  planRowToAdminDetail,
} from "@/features/planner/store/plannerPersistence";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  const rateError = await enforceAdminRateLimit(req, "plans:detail:get");
  if (rateError) return rateError;

  const authError = await requireAdminSession();
  if (authError) return authError;

  const { id } = await context.params;
  const planId = id?.trim();
  if (!planId) {
    return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
  }

  if (!isPlannerDatabaseConfigured()) {
    return NextResponse.json({ error: "Admin storage is not configured" }, { status: 503 });
  }

  const loaded = await loadPlannerDocumentAdmin(planId);
  if (!loaded.success) {
    const status = loaded.error.code === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: "Plan not found" }, { status });
  }

  return NextResponse.json({ plan: planRowToAdminDetail(loaded.row) });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const rateError = await enforceAdminRateLimit(req, "plans:detail:patch", 20);
  if (rateError) return rateError;

  const authError = await requireAdminSession();
  if (authError) return authError;

  const isCsrfValid = await validateCsrfRequest(req);
  if (!isCsrfValid) {
    return NextResponse.json(
      { error: "Invalid or missing CSRF token" },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const planId = id?.trim();
  if (!planId) {
    return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
  }

  if (!isPlannerDatabaseConfigured()) {
    return NextResponse.json({ error: "Admin storage is not configured" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: {
    status?: "draft" | "active" | "archived";
  } = {};

  if (typeof body.status === "string") {
    const status = body.status.trim();
    if (!["draft", "active", "archived"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Expected draft, active, or archived." },
        { status: 400 },
      );
    }
    patch.status = status as "draft" | "active" | "archived";
  }

  if (typeof body.comment === "string" && body.comment.trim()) {
    return NextResponse.json(
      { error: "Review comments are not enabled for drizzle plans." },
      { status: 501 },
    );
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  }

  const result = await patchPlannerDocumentAdmin(planId, patch);
  if (!result.success) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: "Failed to update plan" }, { status });
  }

  return NextResponse.json({ plan: planRowToAdminDetail(result.row) });
}