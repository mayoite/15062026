import { apiPath, browserApiFetch } from "@/lib/api/browserApi";

import type { PlannerDocument, PlannerSaveSummary } from "../model";
import { plannerDocumentSchema, plannerSaveSummarySchema } from "../model";

export class PlannerCloudApiError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "planner:no-auth"
      | "planner:save-failed"
      | "planner:load-failed"
      | "planner:list-failed"
      | "planner:delete-failed",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "PlannerCloudApiError";
  }
}

export type PlannerRepositoryAccessMode = "owner" | "admin";

export interface PlannerSaveDocumentOptions {
  userId?: string;
  saveId?: string;
  ownerUserId?: string;
  accessMode?: PlannerRepositoryAccessMode;
}

export interface PlannerListDocumentsOptions {
  userId?: string;
  ownerUserId?: string;
  accessMode?: PlannerRepositoryAccessMode;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

function normalizeSummaryRows(rows: unknown[]): PlannerSaveSummary[] {
  return rows.map((row) => plannerSaveSummarySchema.parse(row));
}

export async function listOwnerPlansFromApi(): Promise<PlannerSaveSummary[]> {
  const response = await fetch("/api/plans", {
    method: "GET",
    credentials: "include",
  });
  if (response.status === 401) {
    throw new PlannerCloudApiError("Authentication required.", "planner:no-auth", 401);
  }
  if (!response.ok) {
    const body = await readJson(response);
    throw new PlannerCloudApiError(
      typeof body.error === "string" ? body.error : "Unable to list planner documents.",
      "planner:list-failed",
      response.status,
    );
  }

  const body = await readJson(response);
  const documents = Array.isArray(body.documents) ? body.documents : [];
  return normalizeSummaryRows(documents);
}

export async function listAdminPlansFromApi(): Promise<PlannerSaveSummary[]> {
  const response = await fetch("/api/admin/plans?limit=100", {
    method: "GET",
    credentials: "include",
  });
  if (response.status === 401 || response.status === 403) {
    throw new PlannerCloudApiError("Admin access required.", "planner:no-auth", response.status);
  }
  if (!response.ok) {
    const body = await readJson(response);
    throw new PlannerCloudApiError(
      typeof body.error === "string" ? body.error : "Unable to list admin planner documents.",
      "planner:list-failed",
      response.status,
    );
  }

  const body = await readJson(response);
  const plans = Array.isArray(body.plans) ? body.plans : [];
  return normalizeSummaryRows(
    plans.map((plan) => {
      const row = plan as Record<string, unknown>;
      return {
        id: row.id,
        user_id: row.user_id,
        name: row.title ?? row.name ?? "Untitled plan",
        project_name: row.project_name,
        client_name: row.client_name,
        prepared_by: row.prepared_by,
        room_width_mm: row.room_width_mm,
        room_depth_mm: row.room_depth_mm,
        seat_target: row.seat_target,
        unit_system: row.unit_system ?? "metric",
        item_count: row.item_count,
        thumbnail_url: row.thumbnail_url ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }),
  );
}

export async function loadPlanFromApi(
  saveId: string,
  options: PlannerListDocumentsOptions = {},
): Promise<PlannerDocument | null> {
  const normalizedSaveId = saveId.trim();
  if (!normalizedSaveId) {
    throw new PlannerCloudApiError("Planner document id is required.", "planner:load-failed");
  }

  const response = await browserApiFetch(
    apiPath(`/api/plans/${encodeURIComponent(normalizedSaveId)}`),
    { method: "GET" },
  );

  if (response.status === 404) return null;
  if (response.status === 401) {
    throw new PlannerCloudApiError("Authentication required.", "planner:no-auth", 401);
  }
  if (!response.ok) {
    const body = await readJson(response);
    throw new PlannerCloudApiError(
      typeof body.error === "string" ? body.error : "Unable to load planner document.",
      "planner:load-failed",
      response.status,
    );
  }

  const body = await readJson(response);
  const document = body.document;
  if (!document || typeof document !== "object") {
    throw new PlannerCloudApiError("Planner document payload missing.", "planner:load-failed");
  }

  void options;
  return plannerDocumentSchema.parse(document);
}

export async function savePlanToApi(
  document: PlannerDocument,
  options: PlannerSaveDocumentOptions = {},
): Promise<PlannerDocument> {
  const normalized = plannerDocumentSchema.parse(document);
  const saveId = (options.saveId ?? normalized.id ?? crypto.randomUUID()).trim();
  const ownerUserId = options.ownerUserId?.trim();

  const response = await browserApiFetch(apiPath(`/api/plans/${encodeURIComponent(saveId)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      document: { ...normalized, id: saveId },
      ownerUserId,
    }),
  });

  if (response.status === 401) {
    throw new PlannerCloudApiError("Authentication required.", "planner:no-auth", 401);
  }
  if (!response.ok) {
    const body = await readJson(response);
    throw new PlannerCloudApiError(
      typeof body.error === "string" ? body.error : "Unable to save planner document.",
      "planner:save-failed",
      response.status,
    );
  }

  const body = await readJson(response);
  const saved = body.document;
  if (!saved || typeof saved !== "object") {
    throw new PlannerCloudApiError("Planner save response missing document.", "planner:save-failed");
  }

  return plannerDocumentSchema.parse(saved);
}

export async function deletePlanFromApi(saveId: string): Promise<boolean> {
  const response = await browserApiFetch(
    apiPath(`/api/plans/${encodeURIComponent(saveId.trim())}`),
    { method: "DELETE" },
  );

  if (response.status === 401) {
    throw new PlannerCloudApiError("Authentication required.", "planner:no-auth", 401);
  }
  if (response.status === 404) return false;
  if (!response.ok) {
    const body = await readJson(response);
    throw new PlannerCloudApiError(
      typeof body.error === "string" ? body.error : "Unable to delete planner document.",
      "planner:delete-failed",
      response.status,
    );
  }

  const body = await readJson(response);
  return body.success === true;
}
