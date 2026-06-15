import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import {
  createAdminServiceClient,
  enforceAdminRateLimit,
  requireAdminSession,
  isMissingTableError,
} from "@/app/api/admin/_lib/server";
import { buildConfiguratorRow } from "@/lib/catalog/configuratorCatalogPayload";

const TABLE = "configurator_products";

// GET — list configurator catalog products (admin). Optional ?category= & ?active=.
export async function GET(req: NextRequest) {
  const rateError = await enforceAdminRateLimit(req, "cfg-catalog:get");
  if (rateError) return rateError;
  const authError = await requireAdminSession();
  if (authError) return authError;

  const supabase = createAdminServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Catalog storage is not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category")?.trim().toLowerCase() || "";
  const activeFilter = searchParams.get("active");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any).from(TABLE).select("*").order("category").order("name");
  if (category) query = query.eq("category", category);
  if (activeFilter === "true" || activeFilter === "false") {
    query = query.eq("active", activeFilter === "true");
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch configurator catalog" },
      { status: isMissingTableError(error.message) ? 503 : 500 },
    );
  }

  return NextResponse.json({ items: data ?? [], total: (data ?? []).length });
}

// POST — create a configurator catalog product (admin).
export async function POST(req: NextRequest) {
  const rateError = await enforceAdminRateLimit(req, "cfg-catalog:post", 20);
  if (rateError) return rateError;
  const authError = await requireAdminSession();
  if (authError) return authError;

  const supabase = createAdminServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Catalog storage is not configured" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = buildConfiguratorRow(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .insert(result.row)
    .select("*")
    .single();

  if (error) {
    const conflict = error.code === "23505";
    return NextResponse.json(
      { error: conflict ? "A product with this slug already exists" : "Failed to create product" },
      { status: conflict ? 409 : isMissingTableError(error.message) ? 503 : 500 },
    );
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
