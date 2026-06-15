import type { SupabaseClient } from "@supabase/supabase-js";

import {
  plannerManagedProductWriteSchema,
  type PlannerManagedProductRow,
  type PlannerManagedProductWrite,
} from "../model";
import { normalizePlannerManagedProductRow } from "./plannerManagedProductsShared";

export async function listPlannerManagedProductsFromSupabase(
  client: SupabaseClient,
): Promise<PlannerManagedProductRow[]> {
  const { data, error } = await client
    .from("planner_managed_products")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load planner-managed products: ${error.message}`);
  }

  return (data ?? []).map((row) => normalizePlannerManagedProductRow(row));
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
