import type { SupabaseClient } from "@supabase/supabase-js";

import type { PlannerDocument, PlannerSaveSummary } from "../model";
import {
  deletePlanFromApi,
  listAdminPlansFromApi,
  listOwnerPlansFromApi,
  loadPlanFromApi,
  PlannerCloudApiError,
  savePlanToApi,
  type PlannerListDocumentsOptions,
  type PlannerRepositoryAccessMode,
  type PlannerSaveDocumentOptions,
} from "./plannerCloudApi";

export class PlannerStorageError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "planner:no-auth"
      | "planner:save-failed"
      | "planner:load-failed"
      | "planner:list-failed"
      | "planner:delete-failed",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PlannerStorageError";
  }
}

export type { PlannerRepositoryAccessMode, PlannerSaveDocumentOptions, PlannerListDocumentsOptions };

function mapCloudError(error: unknown, fallbackCode: PlannerStorageError["code"]): PlannerStorageError {
  if (error instanceof PlannerCloudApiError) {
    return new PlannerStorageError(error.message, error.code, error);
  }
  if (error instanceof PlannerStorageError) {
    return error;
  }
  return new PlannerStorageError(
    error instanceof Error ? error.message : "Planner cloud request failed.",
    fallbackCode,
    error,
  );
}

async function resolveUserId(client: SupabaseClient, userId?: string): Promise<string> {
  if (userId?.trim()) return userId.trim();

  const { data, error } = await client.auth.getUser();
  const resolved = data.user?.id?.trim();
  if (error || !resolved) {
    throw new PlannerStorageError(
      "Planner saves require an authenticated user.",
      "planner:no-auth",
      error ?? undefined,
    );
  }

  return resolved;
}

export async function savePlannerDocumentToSupabase(
  client: SupabaseClient,
  document: PlannerDocument,
  options: PlannerSaveDocumentOptions = {},
): Promise<PlannerDocument> {
  try {
    const authUserId = await resolveUserId(client, options.userId);
    const accessMode = options.accessMode === "admin" ? "admin" : "owner";
    const ownerUserId =
      accessMode === "admin" && options.ownerUserId?.trim()
        ? options.ownerUserId.trim()
        : authUserId;

    return await savePlanToApi(document, {
      ...options,
      userId: authUserId,
      ownerUserId,
      accessMode,
    });
  } catch (error) {
    throw mapCloudError(error, "planner:save-failed");
  }
}

export async function loadPlannerDocumentFromSupabase(
  client: SupabaseClient,
  saveId: string,
  options: PlannerListDocumentsOptions = {},
): Promise<PlannerDocument | null> {
  try {
    await resolveUserId(client, options.userId);
    return await loadPlanFromApi(saveId, options);
  } catch (error) {
    throw mapCloudError(error, "planner:load-failed");
  }
}

export async function listPlannerDocumentsFromSupabase(
  client: SupabaseClient,
  options: PlannerListDocumentsOptions = {},
): Promise<PlannerSaveSummary[]> {
  try {
    await resolveUserId(client, options.userId);
    if (options.accessMode === "admin") {
      return await listAdminPlansFromApi();
    }
    return await listOwnerPlansFromApi();
  } catch (error) {
    throw mapCloudError(error, "planner:list-failed");
  }
}

export async function deletePlannerDocumentFromSupabase(
  client: SupabaseClient,
  saveId: string,
  options: PlannerListDocumentsOptions = {},
): Promise<boolean> {
  if (options.accessMode === "admin") {
    throw new PlannerStorageError(
      "Admin delete is not supported from the browser planner repository path.",
      "planner:delete-failed",
    );
  }

  try {
    await resolveUserId(client, options.userId);
    return await deletePlanFromApi(saveId);
  } catch (error) {
    throw mapCloudError(error, "planner:delete-failed");
  }
}