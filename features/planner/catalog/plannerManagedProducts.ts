import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PlannerCatalogProduct } from "./plannerCatalogCore";
import {
  plannerManagedProductWriteSchema,
  type PlannerManagedProductRow,
  type PlannerManagedProductWrite,
} from "../model";
import {
  normalizePlannerManagedProductRow,
  plannerManagedProductRowToCatalogProduct,
} from "./plannerManagedProductsShared";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

async function resolveServerClient() {
  try {
    return await createServerSupabaseClient();
  } catch {
    return null;
  }
}

function isMissingPlannerManagedProductsTable(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("planner_managed_products") &&
    (normalized.includes("could not find the table") ||
      normalized.includes("relation") && normalized.includes("does not exist"))
  );
}

export async function listPlannerManagedProductsForPlannerCatalog(): Promise<PlannerCatalogProduct[]> {
  const client = await resolveServerClient();
  if (!client) return [];

  const { data, error } = await client
    .from("planner_managed_products")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingPlannerManagedProductsTable(error.message ?? "")) {
      // Deploy-safe fallback until planner-managed product migrations are applied.
      return [];
    }
    console.error("[planner] Unable to load planner-managed products:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => normalizePlannerManagedProductRow(row))
    .filter((row) => row.active)
    .map((row) => plannerManagedProductRowToCatalogProduct(row));
}

export async function upsertPlannerManagedProduct(
  client: SupabaseClient,
  input: PlannerManagedProductWrite,
): Promise<PlannerManagedProductRow> {
  const payload = plannerManagedProductWriteSchema.parse(input);
  const { data, error } = await client
    .from("planner_managed_products")
    .upsert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Unable to save planner-managed product: ${error?.message ?? "Unknown error"}`);
  }

  return normalizePlannerManagedProductRow(data);
}

export async function deletePlannerManagedProduct(client: SupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await client
    .from("planner_managed_products")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to delete planner-managed product: ${error.message}`);
  }

  return Boolean(data?.id);
}
