/**
 * Planner Persistence - Drizzle CRUD operations with hardened error handling.
 *
 * Migrated from Supabase (`planner_saves`) to Drizzle ORM against the
 * DigitalOcean Postgres `plans` table. The full PlannerDocument is stored in
 * the `payload` jsonb column; flat columns (`name`, `thumbnail_url`, `status`)
 * are denormalized for listing and filtering.
 *
 * Phase 2/4 Data & Model + Persistence:
 * - Canonical persistence layer for the active space-planner PlannerDocument model.
 * - Works with offlineStorage.ts and sync queue processing for local-first behavior.
 * - Keeps planner document ownership separate from general catalog/product ownership.
 * - Versioning, sharing, and export flows consume the same document contract.
 */

import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/platform/drizzle/db";
import { plans } from "@/platform/drizzle/schema";
import type { PlannerDocument } from "@/features/planner/model/plannerDocument";
import {
  validatePlannerDocument,
  assertPlannerDocument,
} from "@/features/planner/model/plannerDocument";

const PLANNER_ENGINE = "oando";

// Error types
export class PlannerPersistenceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "PlannerPersistenceError";
  }
}

/** Shape of a row returned by Drizzle from the `plans` table. */
type PlanRow = typeof plans.$inferSelect;

type PlanSummaryProjectionRow = {
  id: string;
  userId: string;
  name: string;
  projectName: string | null;
  clientName: string | null;
  preparedBy: string | null;
  roomWidthMm: number | null;
  roomDepthMm: number | null;
  seatTarget: number | null;
  unitSystem: PlannerDocument["unitSystem"] | null;
  itemCount: number | null;
  thumbnailUrl: string | null;
  status: PlannerDocument["status"];
  createdAt: Date;
  updatedAt: Date;
};

export type PlannerSummaryRow = {
  id: string;
  user_id: string | null;
  name: string;
  project_name: string | null;
  client_name: string | null;
  prepared_by: string | null;
  room_width_mm: number;
  room_depth_mm: number;
  seat_target: number;
  unit_system: PlannerDocument["unitSystem"];
  item_count: number;
  thumbnail_url: string | null;
  status: PlannerDocument["status"];
  created_at: string;
  updated_at: string;
};

const plannerSummarySelect = {
  id: plans.id,
  userId: plans.userId,
  name: plans.name,
  projectName: sql<string | null>`${plans.payload} ->> 'projectName'`,
  clientName: sql<string | null>`${plans.payload} ->> 'clientName'`,
  preparedBy: sql<string | null>`${plans.payload} ->> 'preparedBy'`,
  roomWidthMm: sql<number | null>`NULLIF(${plans.payload} ->> 'roomWidthMm', '')::integer`,
  roomDepthMm: sql<number | null>`NULLIF(${plans.payload} ->> 'roomDepthMm', '')::integer`,
  seatTarget: sql<number | null>`NULLIF(${plans.payload} ->> 'seatTarget', '')::integer`,
  unitSystem: sql<PlannerDocument["unitSystem"] | null>`NULLIF(${plans.payload} ->> 'unitSystem', '')`,
  itemCount: sql<number | null>`NULLIF(${plans.payload} ->> 'itemCount', '')::integer`,
  thumbnailUrl: plans.thumbnailUrl,
  status: plans.status,
  createdAt: plans.createdAt,
  updatedAt: plans.updatedAt,
} satisfies Record<string, unknown>;

function normalizePlanSummaryProjectionRow(row: PlanSummaryProjectionRow): PlannerSummaryRow {
  return {
    id: row.id,
    user_id: row.userId ?? null,
    name: row.name,
    project_name: row.projectName ?? null,
    client_name: row.clientName ?? null,
    prepared_by: row.preparedBy ?? null,
    room_width_mm: row.roomWidthMm ?? 6000,
    room_depth_mm: row.roomDepthMm ?? 8000,
    seat_target: row.seatTarget ?? 10,
    unit_system: row.unitSystem ?? "metric",
    item_count: row.itemCount ?? 0,
    thumbnail_url: row.thumbnailUrl ?? null,
    status: row.status,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

/**
 * Reconstruct a PlannerDocument from a `plans` row. The authoritative document
 * lives in `payload`; row metadata (id, timestamps, status) is merged on top so
 * the returned document reflects the persisted state.
 */
export function planRowToDocument(row: PlanRow): PlannerDocument {
  const base =
    row.payload && typeof row.payload === "object"
      ? validatePlannerDocument(row.payload)
      : assertPlannerDocument(row.payload as PlannerDocument);

  return {
    ...base,
    name: row.name ?? base.name ?? base.title ?? "Untitled plan",
    title: row.name ?? base.title,
    thumbnailUrl: row.thumbnailUrl ?? base.thumbnailUrl ?? null,
    status: (row.status as PlannerDocument["status"]) ?? base.status,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : base.createdAt,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : base.updatedAt,
  };
}

/**
 * Build the column values for an insert/update from a PlannerDocument.
 */
function documentToPlanValues(document: PlannerDocument, userId: string) {
  return {
    userId,
    name: document.title ?? document.name ?? "Untitled plan",
    engine: PLANNER_ENGINE,
    payload: document as unknown as Record<string, unknown>,
    thumbnailUrl: document.thumbnailUrl ?? null,
    status: document.status,
    updatedAt: new Date(),
  };
}

/**
 * Hardened save operation with validation. Inserts a new plan or updates an
 * existing one when `documentId` is provided.
 */
export async function savePlannerDocument(
  userId: string,
  document: PlannerDocument,
  documentId?: string
): Promise<
  | { success: true; id: string; document: PlannerDocument }
  | { success: false; error: PlannerPersistenceError }
> {
  try {
    // Guard: reject anything that is not a valid PlannerDocument before it
    // reaches the database.
    const validated = assertPlannerDocument(document);
    validated.updatedAt = new Date().toISOString();

    const values = documentToPlanValues(validated, userId);

    let rows: PlanRow[];
    if (documentId) {
      rows = await db
        .update(plans)
        .set(values)
        .where(eq(plans.id, documentId))
        .returning();
    } else {
      rows = await db.insert(plans).values(values).returning();
    }

    const savedRow = rows[0];
    if (!savedRow) {
      throw new PlannerPersistenceError(
        documentId ? "Document not found for update" : "Insert returned no row",
        "SAVE_FAILED"
      );
    }

    return {
      success: true,
      id: savedRow.id,
      document: planRowToDocument(savedRow),
    };
  } catch (error) {
    if (error instanceof PlannerPersistenceError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new PlannerPersistenceError(
        `Database save failed: ${error instanceof Error ? error.message : String(error)}`,
        "SAVE_FAILED",
        error
      ),
    };
  }
}

/**
 * Hardened load operation with validation.
 */
export async function loadPlannerDocument(
  documentId: string,
  userId?: string,
): Promise<
  | { success: true; document: PlannerDocument }
  | { success: false; error: PlannerPersistenceError }
> {
  try {
    const rows = await db
      .select()
      .from(plans)
      .where(
        userId
          ? and(eq(plans.id, documentId), eq(plans.userId, userId))
          : eq(plans.id, documentId),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new PlannerPersistenceError("Document not found", "NOT_FOUND");
    }

    const document = planRowToDocument(row);
    validatePlannerDocument(document);

    return { success: true, document };
  } catch (error) {
    if (error instanceof PlannerPersistenceError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new PlannerPersistenceError(
        `Database load failed: ${error instanceof Error ? error.message : String(error)}`,
        "LOAD_FAILED",
        error
      ),
    };
  }
}

/**
 * List a user's planner documents, newest first.
 */
export async function listPlannerDocuments(
  userId: string
): Promise<
  | { success: true; documents: Array<{ id: string; document: PlannerDocument }> }
  | { success: false; error: PlannerPersistenceError }
> {
  try {
    const rows = await db
      .select()
      .from(plans)
      .where(eq(plans.userId, userId))
      .orderBy(desc(plans.updatedAt));

    const documents = rows.map((row) => ({
      id: row.id,
      document: planRowToDocument(row),
    }));

    return { success: true, documents };
  } catch (error) {
    if (error instanceof PlannerPersistenceError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new PlannerPersistenceError(
        `Database list failed: ${error instanceof Error ? error.message : String(error)}`,
        "LIST_FAILED",
        error
      ),
    };
  }
}

/**
 * List a user's planner documents as summary rows only.
 */
export async function listPlannerDocumentSummaries(
  userId: string,
): Promise<
  | { success: true; summaries: PlannerSummaryRow[] }
  | { success: false; error: PlannerPersistenceError }
> {
  try {
    const rows = await db
      .select(plannerSummarySelect)
      .from(plans)
      .where(eq(plans.userId, userId))
      .orderBy(desc(plans.updatedAt));

    return {
      success: true,
      summaries: rows.map((row) => normalizePlanSummaryProjectionRow(row as PlanSummaryProjectionRow)),
    };
  } catch (error) {
    if (error instanceof PlannerPersistenceError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new PlannerPersistenceError(
        `Summary list failed: ${error instanceof Error ? error.message : String(error)}`,
        "LIST_FAILED",
        error,
      ),
    };
  }
}

/**
 * Delete a planner document by id.
 */
export async function deletePlannerDocument(
  documentId: string
): Promise<
  | { success: true }
  | { success: false; error: PlannerPersistenceError }
> {
  try {
    await db.delete(plans).where(eq(plans.id, documentId));
    return { success: true };
  } catch (error) {
    if (error instanceof PlannerPersistenceError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new PlannerPersistenceError(
        `Database delete failed: ${error instanceof Error ? error.message : String(error)}`,
        "DELETE_FAILED",
        error
      ),
    };
  }
}

export function isPlannerDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Admin list row — mirrors legacy `planner_saves` columns for API compatibility. */
export function planRowToAdminSummary(row: PlanRow) {
  const document = planRowToDocument(row);
  return {
    id: row.id,
    user_id: row.userId,
    title: document.title ?? document.name,
    project_name: document.projectName,
    client_name: document.clientName,
    prepared_by: document.preparedBy,
    item_count: document.itemCount,
    room_width_mm: document.roomWidthMm,
    room_depth_mm: document.roomDepthMm,
    seat_target: document.seatTarget,
    status: row.status as PlannerDocument["status"],
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function planSummaryRowToAdminSummary(row: PlannerSummaryRow) {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.name,
    project_name: row.project_name,
    client_name: row.client_name,
    prepared_by: row.prepared_by,
    item_count: row.item_count,
    room_width_mm: row.room_width_mm,
    room_depth_mm: row.room_depth_mm,
    seat_target: row.seat_target,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function planRowToAdminDetail(row: PlanRow) {
  const document = planRowToDocument(row);
  return {
    id: row.id,
    user_id: row.userId,
    title: document.title ?? document.name,
    project_name: document.projectName,
    client_name: document.clientName,
    prepared_by: document.preparedBy,
    room_width_mm: document.roomWidthMm,
    room_depth_mm: document.roomDepthMm,
    seat_target: document.seatTarget,
    unit_system: document.unitSystem,
    item_count: document.itemCount,
    thumbnail_url: document.thumbnailUrl,
    scene_json: document.sceneJson,
    status: document.status,
    review_status: document.status === "active" ? "approved" : "pending",
    review_comments: [] as Array<{
      id: string;
      text: string;
      author: string;
      createdAt: string;
    }>,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    review_features: { status: false, comments: false },
  };
}

export type AdminPlanListOptions = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

function buildAdminPlanFilters(options: AdminPlanListOptions): SQL | undefined {
  const filters: SQL[] = [];
  const status = options.status?.trim();
  if (status) {
    filters.push(eq(plans.status, status));
  }

  const search = options.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    const searchFilter = or(
      ilike(plans.name, pattern),
      sql`${plans.payload}->>'projectName' ilike ${pattern}`,
      sql`${plans.payload}->>'clientName' ilike ${pattern}`,
      sql`${plans.payload}->>'preparedBy' ilike ${pattern}`,
    );
    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  return filters.length > 0 ? and(...filters) : undefined;
}

function resolveAdminPlanSortColumn(sortBy?: string) {
  switch (sortBy?.trim()) {
    case "updated_at":
      return plans.updatedAt;
    case "title":
    case "name":
      return plans.name;
    case "status":
      return plans.status;
    case "created_at":
    default:
      return plans.createdAt;
  }
}

export async function listPlannerDocumentsAdmin(
  options: AdminPlanListOptions = {},
): Promise<
  | {
      success: true;
      plans: ReturnType<typeof planSummaryRowToAdminSummary>[];
      total: number;
    }
  | { success: false; error: PlannerPersistenceError }
> {
  try {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.max(1, Math.min(options.limit ?? 20, 100));
    const offset = (page - 1) * limit;
    const whereClause = buildAdminPlanFilters(options);
    const sortColumn = resolveAdminPlanSortColumn(options.sortBy);
    const orderBy = options.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

    const countQuery = whereClause
      ? db.select({ total: count() }).from(plans).where(whereClause)
      : db.select({ total: count() }).from(plans);
    const [{ total }] = await countQuery;

    const rowsQuery = whereClause
      ? db.select(plannerSummarySelect).from(plans).where(whereClause).orderBy(orderBy).limit(limit).offset(offset)
      : db.select(plannerSummarySelect).from(plans).orderBy(orderBy).limit(limit).offset(offset);
    const rows = await rowsQuery;

    return {
      success: true,
      plans: rows.map((row) => planSummaryRowToAdminSummary(normalizePlanSummaryProjectionRow(row as PlanSummaryProjectionRow))),
      total: Number(total ?? 0),
    };
  } catch (error) {
    if (error instanceof PlannerPersistenceError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new PlannerPersistenceError(
        `Admin list failed: ${error instanceof Error ? error.message : String(error)}`,
        "LIST_FAILED",
        error,
      ),
    };
  }
}

export async function loadPlannerDocumentAdmin(
  documentId: string,
): Promise<
  | { success: true; row: PlanRow }
  | { success: false; error: PlannerPersistenceError }
> {
  try {
    const rows = await db.select().from(plans).where(eq(plans.id, documentId)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new PlannerPersistenceError("Document not found", "NOT_FOUND");
    }
    return { success: true, row };
  } catch (error) {
    if (error instanceof PlannerPersistenceError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new PlannerPersistenceError(
        `Admin load failed: ${error instanceof Error ? error.message : String(error)}`,
        "LOAD_FAILED",
        error,
      ),
    };
  }
}

export type AdminPlanPatchInput = {
  status?: PlannerDocument["status"];
  title?: string;
  projectName?: string | null;
  clientName?: string | null;
  preparedBy?: string | null;
};

export async function patchPlannerDocumentAdmin(
  documentId: string,
  patch: AdminPlanPatchInput,
): Promise<
  | { success: true; row: PlanRow }
  | { success: false; error: PlannerPersistenceError }
> {
  try {
    const loaded = await loadPlannerDocumentAdmin(documentId);
    if (!loaded.success) {
      return loaded;
    }

    const document = planRowToDocument(loaded.row);
    if (patch.title !== undefined) {
      document.title = patch.title;
      document.name = patch.title;
    }
    if (patch.projectName !== undefined) document.projectName = patch.projectName;
    if (patch.clientName !== undefined) document.clientName = patch.clientName;
    if (patch.preparedBy !== undefined) document.preparedBy = patch.preparedBy;
    if (patch.status !== undefined) document.status = patch.status;

    const saved = await savePlannerDocument(loaded.row.userId, document, documentId);
    if (!saved.success) {
      return { success: false, error: saved.error };
    }

    const rows = await db.select().from(plans).where(eq(plans.id, documentId)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new PlannerPersistenceError("Document not found after update", "SAVE_FAILED");
    }

    return { success: true, row };
  } catch (error) {
    if (error instanceof PlannerPersistenceError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new PlannerPersistenceError(
        `Admin patch failed: ${error instanceof Error ? error.message : String(error)}`,
        "SAVE_FAILED",
        error,
      ),
    };
  }
}

export async function listPlannerAnalyticsRows(days: number): Promise<
  | {
      success: true;
      rows: Array<{
        id: string;
        item_count: number;
        room_width_mm: number;
        room_depth_mm: number;
        created_at: string;
        updated_at: string;
      }>;
    }
  | { success: false; error: PlannerPersistenceError }
> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const rows = await db
      .select()
      .from(plans)
      .where(sql`${plans.createdAt} >= ${cutoff}`)
      .orderBy(asc(plans.createdAt));

    return {
      success: true,
      rows: rows.map((row) => {
        const document = planRowToDocument(row);
        return {
          id: row.id,
          item_count: document.itemCount,
          room_width_mm: document.roomWidthMm,
          room_depth_mm: document.roomDepthMm,
          created_at: row.createdAt.toISOString(),
          updated_at: row.updatedAt.toISOString(),
        };
      }),
    };
  } catch (error) {
    if (error instanceof PlannerPersistenceError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new PlannerPersistenceError(
        `Analytics query failed: ${error instanceof Error ? error.message : String(error)}`,
        "LIST_FAILED",
        error,
      ),
    };
  }
}
