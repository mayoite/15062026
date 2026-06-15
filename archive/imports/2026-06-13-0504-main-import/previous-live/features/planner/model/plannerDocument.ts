import { z } from "zod";
import type { Json } from "@/lib/supabase/types";

/**
 * PlannerDocument - Canonical schema for all planner saves, exports, and transfers
 * This is the single source of truth for planner data persistence (Phase 2 Data & Model Ownership).
 *
 * Ownership:
 * - Active space-planner owns this contract and its evolution.
 * - Product/catalog data lives elsewhere; planner-managed metadata is bridged via PlannerManagedProduct.
 *
 * Versioning and elements:
 * - schemaVersion enables future migrations.
 * - sceneJson stores the active tldraw scene envelope for planner state.
 * - Room constraints, unit system, status, and metadata define the saved plan contract.
 *
 * Persistence and interoperability:
 * - Used by plannerPersistence.ts, offlineStorage.ts, sync queue processing, and export/share flows.
 * - Legacy configurator models remain isolated until an explicit migration path exists.
 */

export const plannerDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  
  // Identity
  title: z.string().min(1).max(200).default("Untitled plan"),
  projectName: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
  preparedBy: z.string().nullable().optional(),
  
  // Room
  roomWidthMm: z.number().int().positive().default(6000),
  roomDepthMm: z.number().int().positive().default(8000),
  seatTarget: z.number().int().nonnegative().default(10),
  
  // Settings
  unitSystem: z.enum(["metric", "imperial"]).default("metric"),
  
  // Scene
  sceneJson: z.custom<Json>(() => true), // PlannerJsonValue - full tldraw scene serialization
  
  // Metadata
  itemCount: z.number().int().nonnegative().default(0),
  thumbnailUrl: z.string().url().nullable().optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  
  // Timestamps
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type PlannerDocument = z.infer<typeof plannerDocumentSchema>;

/**
 * Scene envelope for tldraw snapshot
 */
export const plannerSceneEnvelopeSchema = z.object({
  type: z.literal("cad-suite-planner-scene"),
  version: z.literal(1),
  measurement: z.object({
    canonicalUnit: z.literal("mm"),
    displayUnit: z.enum(["mm", "ft-in"]),
  }),
  tldrawSnapshot: z.custom<Json>(() => true), // StoreSnapshot from tldraw
});

export type PlannerSceneEnvelope = z.infer<typeof plannerSceneEnvelopeSchema>;

/**
 * Validation utilities
 */
export function validatePlannerDocument(data: unknown): PlannerDocument {
  return plannerDocumentSchema.parse(data);
}

export function validatePlannerDocumentSafe(data: unknown): { success: true; data: PlannerDocument } | { success: false; error: z.ZodError } {
  const result = plannerDocumentSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateSceneEnvelope(data: unknown): PlannerSceneEnvelope {
  return plannerSceneEnvelopeSchema.parse(data);
}

/**
 * Architecture guard — assert a value is a valid PlannerDocument before it
 * crosses a boundary (save, export, AI serialization, admin preview render).
 * Throws with an architecture-flavored message; returns the typed document so
 * callers can use it inline: `const doc = assertPlannerDocument(input)`.
 */
export function assertPlannerDocument(doc: unknown): PlannerDocument {
  const result = plannerDocumentSchema.safeParse(doc);
  if (!result.success) {
    throw new Error(
      `[Architecture Violation] Value is not a valid PlannerDocument and must ` +
        `not be persisted, exported, or serialized. ${result.error.message}`,
    );
  }
  return result.data;
}

/**
 * Document creation utilities
 */
export function createEmptyPlannerDocument(overrides: Partial<PlannerDocument> = {}): PlannerDocument {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    title: "Untitled plan",
    roomWidthMm: 6000,
    roomDepthMm: 8000,
    seatTarget: 10,
    unitSystem: "metric",
    sceneJson: {
      type: "cad-suite-planner-scene",
      version: 1,
      measurement: {
        canonicalUnit: "mm",
        displayUnit: "mm",
      },
      tldrawSnapshot: {},
    },
    itemCount: 0,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Document migration utilities (for future schema versions)
 */
export function migrateDocument(data: unknown): PlannerDocument {
  const validated = validatePlannerDocument(data);
  
  // Future migration logic would go here
  // e.g., if (validated.schemaVersion < 2) { ... }
  
  return validated;
}

export type PlannerJsonValue = Json;
export type PlannerUnitSystem = "metric" | "imperial";
export const PLANNER_DOCUMENT_SCHEMA_VERSION = 1;

export interface PlannerDocumentImportResult {
  ok: boolean;
  source?: "document" | "envelope";
  document?: PlannerDocument;
  errors: string[];
}

export interface PlannerImportValidationResult {
  valid: boolean;
  errors: string[];
}

export function createPlannerDocument(defaults: Partial<PlannerDocument> = {}): PlannerDocument {
  return createEmptyPlannerDocument(defaults);
}

function coerceNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function coerceString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function coerceDateString(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : new Date().toISOString();
}

function coercePlannerStatus(value: unknown): PlannerDocument["status"] {
  return value === "active" || value === "archived" ? value : "draft";
}

export function normalizePlannerDocument(input: unknown): PlannerDocument {
  if (!input || typeof input !== "object") {
    return createEmptyPlannerDocument();
  }
  
  const rawObj = input as Record<string, unknown>;
  
  // Handle envelope { type: "planner-document", document: {...} }
  if (rawObj.type === "planner-document" && rawObj.document && typeof rawObj.document === "object") {
    return normalizePlannerDocument(rawObj.document);
  }

  // Handle the planner transfer envelope used by save/import/export flows.
  if (
    rawObj.type === "cad-suite-planner-transfer-envelope" &&
    rawObj.document &&
    typeof rawObj.document === "object"
  ) {
    return normalizePlannerDocument(rawObj.document);
  }

  // Handle case where title is stored as 'name' or 'title'
  const title = coerceString(rawObj.title ?? rawObj.name, "Untitled plan");
  const projectName = coerceNullableString(rawObj.projectName ?? rawObj.project_name);
  const clientName = coerceNullableString(rawObj.clientName ?? rawObj.client_name);
  const preparedBy = coerceNullableString(rawObj.preparedBy ?? rawObj.prepared_by);
  
  const roomWidthMm = typeof rawObj.roomWidthMm === "number" ? rawObj.roomWidthMm : (typeof rawObj.room_width_mm === "number" ? rawObj.room_width_mm : 6000);
  const roomDepthMm = typeof rawObj.roomDepthMm === "number" ? rawObj.roomDepthMm : (typeof rawObj.room_depth_mm === "number" ? rawObj.room_depth_mm : 8000);
  const seatTarget = typeof rawObj.seatTarget === "number" ? rawObj.seatTarget : (typeof rawObj.seat_target === "number" ? rawObj.seat_target : 10);
  const unitSystem = rawObj.unitSystem === "imperial" || rawObj.unit_system === "imperial" ? "imperial" : "metric";
  
  const sceneJson = (rawObj.sceneJson ?? rawObj.scene_json ?? {
    type: "cad-suite-planner-scene",
    version: 1,
    measurement: {
      canonicalUnit: "mm",
      displayUnit: unitSystem === "imperial" ? "ft-in" : "mm",
    },
    tldrawSnapshot: {},
  }) as Json;
  
  const itemCount = typeof rawObj.itemCount === "number" ? rawObj.itemCount : (typeof rawObj.item_count === "number" ? rawObj.item_count : 0);
  const thumbnailUrl = coerceNullableString(rawObj.thumbnailUrl ?? rawObj.thumbnail_url);
  const status = coercePlannerStatus(rawObj.status);
  const createdAt = coerceDateString(rawObj.createdAt ?? rawObj.created_at);
  const updatedAt = coerceDateString(rawObj.updatedAt ?? rawObj.updated_at);

  return {
    schemaVersion: 1,
    title,
    projectName,
    clientName,
    preparedBy,
    roomWidthMm,
    roomDepthMm,
    seatTarget,
    unitSystem,
    sceneJson,
    itemCount,
    thumbnailUrl,
    status,
    createdAt,
    updatedAt,
  };
}

export function parsePlannerDocumentImport(input: unknown): PlannerDocumentImportResult {
  try {
    const doc = normalizePlannerDocument(input);
    const parsed = validatePlannerDocument(doc);
    return {
      ok: true,
      source: "document",
      document: parsed,
      errors: [],
    };
  } catch (err) {
    return {
      ok: false,
      errors: [err instanceof Error ? err.message : "Failed to parse import"],
    };
  }
}

export function validatePlannerDocumentImport(input: unknown): PlannerImportValidationResult {
  const parsed = parsePlannerDocumentImport(input);
  return {
    valid: parsed.ok,
    errors: parsed.errors,
  };
}
