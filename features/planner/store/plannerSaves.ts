import type { PlannerDocument } from "@/features/planner/model/plannerDocument";
import * as plannerPersistence from "./plannerPersistence";

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

// Lightweight summary projected from a stored PlannerDocument.
export interface PlannerSaveSummary {
  id: string;
  user_id: string | null;
  name: string;
  project_name: string | null;
  client_name: string | null;
  prepared_by: string | null;
  room_width_mm: number;
  room_depth_mm: number;
  seat_target: number;
  unit_system: "metric" | "imperial";
  item_count: number;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function savePlannerDocumentToStore(
  document: PlannerDocument,
  options: PlannerSaveDocumentOptions = {},
): Promise<PlannerDocument> {
  const userId = options.userId ?? options.ownerUserId;
  if (!userId) {
    throw new Error("savePlannerDocumentToStore requires a userId");
  }
  const res = await plannerPersistence.savePlannerDocument(userId, document, options.saveId);
  if (!res.success) {
    throw new Error(res.error.message);
  }
  return res.document;
}

export async function loadPlannerDocumentFromStore(
  saveId: string,
  userId?: string,
): Promise<PlannerDocument | null> {
  const res = await plannerPersistence.loadPlannerDocument(saveId, userId);
  if (!res.success) {
    if (res.error.code === "NOT_FOUND") return null;
    throw new Error(res.error.message);
  }
  return res.document;
}

export async function listPlannerDocumentsFromStore(
  options: PlannerListDocumentsOptions = {},
): Promise<PlannerSaveSummary[]> {
  const userId = options.userId ?? options.ownerUserId;
  if (!userId) return [];
  const res = await plannerPersistence.listPlannerDocuments(userId);
  if (!res.success) {
    throw new Error(res.error.message);
  }
  return res.documents.map(({ id, document }) => ({
    id,
    user_id: userId,
    name: document.name,
    project_name: document.projectName ?? null,
    client_name: document.clientName ?? null,
    prepared_by: document.preparedBy ?? null,
    room_width_mm: document.roomWidthMm,
    room_depth_mm: document.roomDepthMm,
    seat_target: document.seatTarget,
    unit_system: document.unitSystem,
    item_count: document.itemCount,
    thumbnail_url: document.thumbnailUrl ?? null,
    created_at: document.createdAt ?? document.updatedAt ?? new Date(0).toISOString(),
    updated_at: document.updatedAt ?? document.createdAt ?? new Date(0).toISOString(),
  }));
}

export async function deletePlannerDocumentFromStore(
  saveId: string,
): Promise<boolean> {
  const res = await plannerPersistence.deletePlannerDocument(saveId);
  return res.success;
}

// --- Backwards-compatible aliases ---------------------------------------
// Older callers imported the `*FromSupabase` names. Persistence now uses
// Drizzle; these aliases keep call sites working during the migration.
export const savePlannerDocumentToSupabase = (
  document: PlannerDocument,
  options?: PlannerSaveDocumentOptions,
) => savePlannerDocumentToStore(document, options);

export const loadPlannerDocumentFromSupabase = (saveId: string) =>
  loadPlannerDocumentFromStore(saveId);

export const listPlannerDocumentsFromSupabase = (
  options?: PlannerListDocumentsOptions,
) => listPlannerDocumentsFromStore(options);

export const deletePlannerDocumentFromSupabase = (saveId: string) =>
  deletePlannerDocumentFromStore(saveId);
