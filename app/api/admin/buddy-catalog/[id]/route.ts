import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import {
  createAdminServiceClient,
  enforceAdminRateLimit,
  requireAdminSession,
  isMissingTableError,
} from "@/app/api/admin/_lib/server";
import { buildConfiguratorRow } from "@/lib/catalog/configuratorCatalogPayload";
import type { SupabaseClient } from "@supabase/supabase-js";

const TABLE = "configurator_products";

// PATCH — full update, OR a lightweight `{ active }` toggle (visibility).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateError = await enforceAdminRateLimit(req, "cfg-catalog:patch", 40);
  if (rateError) return rateError;
  const authError = await requireAdminSession();
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Catalog storage is not configured" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Lightweight active-only toggle (skip full validation).
  const keys = Object.keys(body);
  if (keys.length === 1 && keys[0] === "active") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped catalog DB schema
    const { data, error } = await (supabase as SupabaseClient<any>)
      .from(TABLE)
      .update({ active: body.active !== false })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "Failed to update visibility" }, { status: 500 });
    }
    return NextResponse.json({ item: data });
  }

  const result = buildConfiguratorRow(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped catalog DB schema
  const { data, error } = await (supabase as SupabaseClient<any>)
    .from(TABLE)
    .update(result.row)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    const conflict = error.code === "23505";
    return NextResponse.json(
      { error: conflict ? "A product with this slug already exists" : "Failed to update product" },
      { status: conflict ? 409 : isMissingTableError(error.message) ? 503 : 500 },
    );
  }

  return NextResponse.json({ item: data });
}

// DELETE — SOFT delete (active=false) so existing Spaces/quotes keep resolving.
// Hard delete is intentionally not exposed (matches the "no permanent delete" rule).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateError = await enforceAdminRateLimit(req, "cfg-catalog:delete", 40);
  if (rateError) return rateError;
  const authError = await requireAdminSession();
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Catalog storage is not configured" }, { status: 503 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped catalog DB schema
  const { data, error } = await (supabase as SupabaseClient<any>)
    .from(TABLE)
    .update({ active: false })
    .eq("id", id)
    .select("id, active")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to archive product" }, { status: 500 });
  }
  return NextResponse.json({ item: data, archived: true });
}
