import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  assertPlannerDocument,
  type PlannerDocument,
} from "@/features/planner/model/plannerDocument";
import {
  deletePlannerDocumentFromStore,
  loadPlannerDocumentFromStore,
  savePlannerDocumentToStore,
} from "@/features/planner/store/plannerSaves";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getRequestIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1"
  );
}

function isAdminUser(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) {
  const role = user.app_metadata?.role ?? user.user_metadata?.role;
  return role === "admin";
}

export async function GET(req: NextRequest, context: RouteContext) {
  const ip = getRequestIp(req);
  const limitRes = await rateLimit(`plans:get-one:${ip}`, 30, 60 * 1000);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
    );
  }

  const { id } = await context.params;
  const planId = id?.trim();
  if (!planId) {
    return NextResponse.json({ error: "Plan id is required" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const allowAdmin = isAdminUser(authData.user ?? {});
    const document = await loadPlannerDocumentFromStore(
      planId,
      allowAdmin ? undefined : userId,
    );
    if (!document) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ document, source: "drizzle_plans" });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to load plan: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const ip = getRequestIp(req);
  const limitRes = await rateLimit(`plans:put:${ip}`, 20, 60 * 1000);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
    );
  }

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
    return NextResponse.json({ error: "Plan id is required" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const documentInput = (body.document ?? body) as unknown;
  let document: PlannerDocument;
  try {
    document = assertPlannerDocument(documentInput);
  } catch {
    return NextResponse.json({ error: "Invalid planner document payload" }, { status: 400 });
  }

  const ownerUserId =
    typeof body.ownerUserId === "string" && body.ownerUserId.trim()
      ? body.ownerUserId.trim()
      : userId;
  const allowAdmin = isAdminUser(authData.user ?? {});
  if (!allowAdmin && ownerUserId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const saved = await savePlannerDocumentToStore(
      { ...document, id: planId },
      {
        userId: ownerUserId,
        saveId: planId,
      },
    );
    return NextResponse.json({ document: saved, source: "drizzle_plans" });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to save plan: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const ip = getRequestIp(req);
  const limitRes = await rateLimit(`plans:delete:${ip}`, 15, 60 * 1000);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
    );
  }

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
    return NextResponse.json({ error: "Plan id is required" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const existing = await loadPlannerDocumentFromStore(planId, userId);
    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const deleted = await deletePlannerDocumentFromStore(planId);
    return NextResponse.json({ success: deleted, source: "drizzle_plans" });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to delete plan: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}