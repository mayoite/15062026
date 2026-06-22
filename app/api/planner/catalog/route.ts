/**
 * GET /api/planner/catalog
 *
 * Public read of active planner-managed catalog products for the workspace library.
 * Does not require admin auth; returns only active/visible items.
 */

import type { NextRequest } from "next/server";
import { createAdminServiceClient, isMissingTableError } from "@/app/api/admin/_lib/server";
import { success, error } from "@/lib/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/lib/api/ApiError";
import {
  managedProductRowToCatalogItem,
} from "@/features/planner/catalog/managedProductCatalogBridge";
import { normalizePlannerManagedProductRow } from "@/features/planner/catalog/plannerManagedProductsShared";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? 200)));

  const supabase = createAdminServiceClient();
  if (!supabase) {
    return success({ items: [], source: "none", total: 0 });
  }

  const { data, error: dbError } = await supabase
    .from("planner_managed_products")
    .select("*")
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (dbError) {
    if (isMissingTableError(dbError.message)) {
      return success({ items: [], source: "planner_managed_products", total: 0 });
    }
    return error(
      new ApiError(500, API_ERROR_CODES.DATABASE_ERROR, "Failed to load planner catalog"),
    );
  }

  const rows = (data ?? []).map((row) => normalizePlannerManagedProductRow(row));
  const items = rows
    .map((row) => managedProductRowToCatalogItem(row))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return success({
    items,
    total: items.length,
    source: "planner_managed_products",
  });
}
