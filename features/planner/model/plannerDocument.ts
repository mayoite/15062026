import { z } from "zod";

import {
  logPlannerSchemaValidationFailure,
} from "./plannerDocumentLogging";
import { toPlannerJsonSafe } from "./plannerJsonSafe";

export const PLANNER_DOCUMENT_SCHEMA_VERSION = 1 as const;
export const PLANNER_ENQUIRY_PAYLOAD_SCHEMA_VERSION = 1 as const;

export type PlannerUnitSystem = "metric" | "imperial";
export type PlannerMeasurementDisplayUnit = "mm" | "ft-in";
export type PlannerMeasurementSourceUnit = "mm" | "cm" | "m" | "in" | "ft";
export type PlannerCrmSyncStatus = "pending" | "exported" | "failed";
export type PlannerLifecycleStatus = "draft" | "active" | "archived";

export type PlannerJsonPrimitive = string | number | boolean | null;
export type PlannerJsonValue =
  | PlannerJsonPrimitive
  | PlannerJsonValue[]
  | { [key: string]: PlannerJsonValue };

const plannerJsonValueSchema: z.ZodType<PlannerJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(plannerJsonValueSchema),
    z.record(z.string(), plannerJsonValueSchema),
  ]),
);

function trimOrNull(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function trimOrUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function coerceInteger(value: unknown): unknown {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }

  return value;
}

const plannerRequiredTextSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "Untitled plan";
  },
  z.string().min(1).max(200).default("Untitled plan"),
);

const plannerImportRequiredTextSchema = z.preprocess(
  trimOrUndefined,
  z.string().min(1).max(200),
);

const plannerOptionalTextSchema = z.preprocess(
  trimOrNull,
  z.union([z.string().max(255), z.null()]).default(null),
);

const plannerOptionalUrlSchema = z.preprocess(
  trimOrNull,
  z.union([z.string().max(2048), z.null()]).default(null),
);

const plannerOptionalLongTextSchema = z.preprocess(
  trimOrNull,
  z.union([z.string().max(4000), z.null()]).default(null),
);

const plannerPositiveIntegerSchema = z.preprocess(
  coerceInteger,
  z.number().int().positive(),
);

const plannerNonNegativeIntegerSchema = z.preprocess(
  coerceInteger,
  z.number().int().nonnegative(),
);

const plannerUuidSchema = z.preprocess(trimOrUndefined, z.string().uuid().optional());

const plannerIsoTimestampSchema = z.preprocess(
  trimOrUndefined,
  z.string().datetime({ offset: true }).optional(),
);

const plannerMeasurementDisplayUnitSchema = z.enum(["mm", "ft-in"]);
const plannerMeasurementSourceUnitSchema = z.enum(["mm", "cm", "m", "in", "ft"]);
export const plannerCrmSyncStatusSchema = z.enum(["pending", "exported", "failed"]);

const plannerJsonObjectSchema: z.ZodType<Record<string, PlannerJsonValue>> = z.record(z.string(), plannerJsonValueSchema);

export const plannerEnquiryPayloadEnvelopeSchema = z.object({
  type: z.literal("planner-enquiry"),
  schemaVersion: z.literal(PLANNER_ENQUIRY_PAYLOAD_SCHEMA_VERSION).default(PLANNER_ENQUIRY_PAYLOAD_SCHEMA_VERSION),
  generatedAt: plannerIsoTimestampSchema,
  payload: plannerJsonObjectSchema.default({}),
}).passthrough();

export const plannerDocumentSchema = z.object({
  schemaVersion: z.literal(PLANNER_DOCUMENT_SCHEMA_VERSION).default(PLANNER_DOCUMENT_SCHEMA_VERSION),
  id: plannerUuidSchema,
  name: plannerRequiredTextSchema,
  title: z.union([z.string().min(1).max(200), z.undefined()]).optional(),
  projectName: plannerOptionalTextSchema,
  clientName: plannerOptionalTextSchema,
  preparedBy: plannerOptionalTextSchema,
  roomWidthMm: plannerPositiveIntegerSchema.default(6000),
  roomDepthMm: plannerPositiveIntegerSchema.default(8000),
  seatTarget: plannerNonNegativeIntegerSchema.default(10),
  unitSystem: z.enum(["metric", "imperial"]).default("metric"),
  sceneJson: plannerJsonValueSchema.default({}),
  itemCount: plannerNonNegativeIntegerSchema.default(0),
  thumbnailUrl: plannerOptionalUrlSchema,
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  createdAt: plannerIsoTimestampSchema,
  updatedAt: plannerIsoTimestampSchema,
});

export const plannerDocumentImportSchema = z.object({
  schemaVersion: z.literal(PLANNER_DOCUMENT_SCHEMA_VERSION).default(PLANNER_DOCUMENT_SCHEMA_VERSION),
  id: plannerUuidSchema,
  name: plannerImportRequiredTextSchema,
  title: z.union([z.string().min(1).max(200), z.undefined()]).optional(),
  projectName: plannerOptionalTextSchema,
  clientName: plannerOptionalTextSchema,
  preparedBy: plannerOptionalTextSchema,
  roomWidthMm: plannerPositiveIntegerSchema.default(6000),
  roomDepthMm: plannerPositiveIntegerSchema.default(8000),
  seatTarget: plannerNonNegativeIntegerSchema.default(10),
  unitSystem: z.enum(["metric", "imperial"]).default("metric"),
  sceneJson: plannerJsonValueSchema.default({}),
  itemCount: plannerNonNegativeIntegerSchema.default(0),
  thumbnailUrl: plannerOptionalUrlSchema,
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  createdAt: plannerIsoTimestampSchema,
  updatedAt: plannerIsoTimestampSchema,
});

export const plannerSaveRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.union([z.string().uuid(), z.null()]).optional(),
  name: plannerRequiredTextSchema,
  project_name: plannerOptionalTextSchema,
  client_name: plannerOptionalTextSchema,
  prepared_by: plannerOptionalTextSchema,
  room_width_mm: plannerPositiveIntegerSchema.default(6000),
  room_depth_mm: plannerPositiveIntegerSchema.default(8000),
  seat_target: plannerNonNegativeIntegerSchema.default(10),
  unit_system: z.enum(["metric", "imperial"]).default("metric"),
  scene_json: plannerJsonValueSchema.default({}),
  item_count: plannerNonNegativeIntegerSchema.default(0),
  thumbnail_url: plannerOptionalUrlSchema,
  enquiry_payload: z.union([plannerEnquiryPayloadEnvelopeSchema, z.null()]).default(null),
  crm_sync_status: plannerCrmSyncStatusSchema.default("pending"),
  crm_synced_at: z.union([z.string().datetime({ offset: true }), z.null()]).default(null),
  crm_sync_error: plannerOptionalLongTextSchema,
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const plannerSaveWriteSchema = plannerSaveRowSchema.omit({
  created_at: true,
  updated_at: true,
}).extend({
  user_id: z.string().uuid(),
  enquiry_payload: z.union([plannerEnquiryPayloadEnvelopeSchema, z.null()]).optional(),
  crm_sync_status: plannerCrmSyncStatusSchema.optional(),
  crm_synced_at: z.union([z.string().datetime({ offset: true }), z.null()]).optional(),
  crm_sync_error: plannerOptionalLongTextSchema.optional(),
});

export const plannerSaveSummarySchema = plannerSaveRowSchema.pick({
  id: true,
  user_id: true,
  name: true,
  project_name: true,
  client_name: true,
  prepared_by: true,
  room_width_mm: true,
  room_depth_mm: true,
  seat_target: true,
  unit_system: true,
  item_count: true,
  thumbnail_url: true,
  created_at: true,
  updated_at: true,
}).extend({
  crm_sync_status: plannerCrmSyncStatusSchema.default("pending"),
  crm_synced_at: z.union([z.string().datetime({ offset: true }), z.null()]).default(null),
  crm_sync_error: plannerOptionalLongTextSchema,
});

export const plannerDocumentImportEnvelopeSchema = z.object({
  type: z.literal("planner-document"),
  schemaVersion: z.literal(PLANNER_DOCUMENT_SCHEMA_VERSION).default(PLANNER_DOCUMENT_SCHEMA_VERSION),
  document: plannerDocumentImportSchema,
});

export type PlannerDocument = z.infer<typeof plannerDocumentSchema>;
export type PlannerSaveRow = z.infer<typeof plannerSaveRowSchema>;
export type PlannerSaveWrite = z.infer<typeof plannerSaveWriteSchema>;
export type PlannerSaveSummary = z.infer<typeof plannerSaveSummarySchema>;
export type PlannerDocumentImportEnvelope = z.infer<typeof plannerDocumentImportEnvelopeSchema>;
export type PlannerEnquiryPayloadEnvelope = z.infer<typeof plannerEnquiryPayloadEnvelopeSchema>;

// ─── Scene Envelope Types ─────────────────────────────────────────────────────

export interface PlannerSceneRoom {
  widthMm: number;
  depthMm: number;
  wallHeightMm: number;
  wallThicknessMm: number;
  floorThicknessMm: number;
  originMm: {
    xMm: number;
    yMm: number;
  };
}

export interface PlannerSceneItem {
  id: string;
  productId?: string;
  productSlug?: string;
  plannerSourceSlug?: string;
  name: string;
  category: string;
  imageUrl?: string;
  dimensions?: string;
  centerMm: {
    xMm: number;
    yMm: number;
  };
  sizeMm: {
    widthMm: number;
    depthMm: number;
    heightMm: number;
  };
  rotationDeg: number;
}

export interface PlannerSceneEnvelope {
  type: "cad-suite-planner-scene";
  version: 1;
  measurement: {
    canonicalUnit: "mm";
    displayUnit: PlannerMeasurementDisplayUnit;
    sourceUnit?: PlannerMeasurementSourceUnit;
  };
  room: PlannerSceneRoom;
  items: PlannerSceneItem[];
  fabricSnapshot?: unknown;
}

export function isPlannerSceneEnvelope(value: unknown): value is PlannerSceneEnvelope {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<PlannerSceneEnvelope>;
  return candidate.type === "cad-suite-planner-scene" && candidate.version === 1;
}

export function getPlannerSceneEnvelope(sceneJson: PlannerJsonValue): PlannerSceneEnvelope | null {
  if (isPlannerSceneEnvelope(sceneJson)) return sceneJson;

  if (sceneJson && typeof sceneJson === "object" && !Array.isArray(sceneJson)) {
    const obj = sceneJson as Record<string, unknown>;
    if (isPlannerSceneEnvelope(obj.plannerScene)) {
      return obj.plannerScene;
    }
  }

  return null;
}

export interface PlannerDocumentDefaults {
  name?: string;
  title?: string;
  projectName?: string | null;
  clientName?: string | null;
  preparedBy?: string | null;
  roomWidthMm?: number;
  roomDepthMm?: number;
  seatTarget?: number;
  unitSystem?: PlannerUnitSystem;
  sceneJson?: PlannerJsonValue;
  itemCount?: number;
  thumbnailUrl?: string | null;
  status?: PlannerLifecycleStatus;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
}

export interface PlannerDocumentImportResult {
  ok: boolean;
  source?: "document" | "save-row" | "envelope";
  document?: PlannerDocument;
  errors: string[];
}

export interface PlannerImportValidationResult {
  valid: boolean;
  errors: string[];
}

function mapRowToDocumentLike(row: Partial<Record<string, unknown>>): PlannerDocument {
  return plannerDocumentSchema.parse({
    schemaVersion: PLANNER_DOCUMENT_SCHEMA_VERSION,
    id: row.id,
    name: row.name ?? row.title,
    title: row.title ?? row.name,
    projectName: row.project_name,
    clientName: row.client_name,
    preparedBy: row.prepared_by,
    roomWidthMm: row.room_width_mm,
    roomDepthMm: row.room_depth_mm,
    seatTarget: row.seat_target,
    unitSystem: row.unit_system,
    sceneJson: row.scene_json,
    itemCount: row.item_count,
    thumbnailUrl: row.thumbnail_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function normalizeUuid(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return z.string().uuid().safeParse(trimmed).success ? trimmed : undefined;
}

/** Drop non-UUID ids such as LOCAL_CURRENT_DRAFT_ID ("current"). */
export function normalizePlannerDocumentId(value: unknown): string | undefined {
  return normalizeUuid(value);
}

function normalizeLooseText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeLooseInteger(value: unknown, fallback: number, min: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(min, Math.trunc(value));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) return Math.max(min, Math.trunc(parsed));
    }
  }

  return fallback;
}

function normalizeLooseUnitSystem(value: unknown): PlannerUnitSystem | undefined {
  return value === "metric" || value === "imperial" ? value : undefined;
}

function normalizeLooseSceneJson(value: unknown): PlannerJsonValue {
  const safe = toPlannerJsonSafe(value ?? {});
  return plannerJsonValueSchema.safeParse(safe).success ? safe : {};
}

function normalizeLooseTimestamp(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toMeasurementDisplayUnit(unitSystem: PlannerUnitSystem): PlannerMeasurementDisplayUnit {
  return unitSystem === "imperial" ? "ft-in" : "mm";
}

function toPlannerUnitSystem(displayUnit: PlannerMeasurementDisplayUnit): PlannerUnitSystem {
  return displayUnit === "ft-in" ? "imperial" : "metric";
}

function normalizeMeasurementDisplayUnit(value: unknown): PlannerMeasurementDisplayUnit | undefined {
  const parsed = plannerMeasurementDisplayUnitSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

function normalizeMeasurementSourceUnit(value: unknown): PlannerMeasurementSourceUnit | undefined {
  const parsed = plannerMeasurementSourceUnitSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

function convertDimensionToMillimeters(value: number, sourceUnit: PlannerMeasurementSourceUnit): number {
  if (!Number.isFinite(value)) return value;

  if (sourceUnit === "cm") return Math.round(value * 10);
  if (sourceUnit === "m") return Math.round(value * 1000);
  if (sourceUnit === "in") return Math.round(value * 25.4);
  if (sourceUnit === "ft") return Math.round(value * 304.8);
  return Math.round(value);
}

function convertOptionalMeasurementValue(value: unknown, sourceUnit: PlannerMeasurementSourceUnit): unknown {
  return typeof value === "number" && Number.isFinite(value) ? convertDimensionToMillimeters(value, sourceUnit) : value;
}

function getSceneMeasurementRecord(sceneJson: unknown): Record<string, unknown> | null {
  if (!isRecord(sceneJson)) return null;

  if (sceneJson.type === "cad-suite-planner-scene" && isRecord(sceneJson.measurement)) {
    return sceneJson.measurement;
  }

  if (isRecord(sceneJson.plannerScene) && sceneJson.plannerScene.type === "cad-suite-planner-scene") {
    const nested = sceneJson.plannerScene;
    return isRecord(nested.measurement) ? nested.measurement : null;
  }

  return null;
}

function normalizeSceneEnvelopeMeasurement(
  envelope: Record<string, unknown>,
  displayUnit: PlannerMeasurementDisplayUnit,
  sourceUnit: PlannerMeasurementSourceUnit,
) {
  const room = isRecord(envelope.room)
    ? {
        ...envelope.room,
        widthMm: convertOptionalMeasurementValue(envelope.room.widthMm, sourceUnit),
        depthMm: convertOptionalMeasurementValue(envelope.room.depthMm, sourceUnit),
        wallHeightMm: convertOptionalMeasurementValue(envelope.room.wallHeightMm, sourceUnit),
        wallThicknessMm: convertOptionalMeasurementValue(envelope.room.wallThicknessMm, sourceUnit),
        floorThicknessMm: convertOptionalMeasurementValue(envelope.room.floorThicknessMm, sourceUnit),
        originMm: isRecord(envelope.room.originMm)
          ? {
              ...envelope.room.originMm,
              xMm: convertOptionalMeasurementValue(envelope.room.originMm.xMm, sourceUnit),
              yMm: convertOptionalMeasurementValue(envelope.room.originMm.yMm, sourceUnit),
            }
          : envelope.room.originMm,
      }
    : envelope.room;

  const items = Array.isArray(envelope.items)
    ? envelope.items.map((item) => {
        if (!isRecord(item)) return item;

        return {
          ...item,
          centerMm: isRecord(item.centerMm)
            ? {
                ...item.centerMm,
                xMm: convertOptionalMeasurementValue(item.centerMm.xMm, sourceUnit),
                yMm: convertOptionalMeasurementValue(item.centerMm.yMm, sourceUnit),
              }
            : item.centerMm,
          sizeMm: isRecord(item.sizeMm)
            ? {
                ...item.sizeMm,
                widthMm: convertOptionalMeasurementValue(item.sizeMm.widthMm, sourceUnit),
                depthMm: convertOptionalMeasurementValue(item.sizeMm.depthMm, sourceUnit),
                heightMm: convertOptionalMeasurementValue(item.sizeMm.heightMm, sourceUnit),
              }
            : item.sizeMm,
        };
      })
    : envelope.items;

  return {
    ...envelope,
    measurement: {
      canonicalUnit: "mm",
      displayUnit,
      sourceUnit,
    },
    room,
    items,
  };
}

function normalizeSceneJsonMeasurementMetadata(
  sceneJson: PlannerJsonValue,
  displayUnit: PlannerMeasurementDisplayUnit,
  sourceUnit: PlannerMeasurementSourceUnit,
): PlannerJsonValue {
  if (!isRecord(sceneJson)) return sceneJson;

  if (sceneJson.type === "cad-suite-planner-scene") {
    return normalizeSceneEnvelopeMeasurement(sceneJson, displayUnit, sourceUnit) as PlannerJsonValue;
  }

  if (isRecord(sceneJson.plannerScene) && sceneJson.plannerScene.type === "cad-suite-planner-scene") {
    return {
      ...sceneJson,
      plannerScene: normalizeSceneEnvelopeMeasurement(sceneJson.plannerScene, displayUnit, sourceUnit),
    } as PlannerJsonValue;
  }

  return sceneJson;
}

function getSceneRoomDimensions(sceneJson: PlannerJsonValue): { widthMm: number; depthMm: number } | null {
  const envelope = isRecord(sceneJson) && sceneJson.type === "cad-suite-planner-scene"
    ? sceneJson
    : isRecord(sceneJson) && isRecord(sceneJson.plannerScene) && sceneJson.plannerScene.type === "cad-suite-planner-scene"
      ? sceneJson.plannerScene
      : null;

  if (!envelope || !isRecord(envelope.room)) return null;

  const widthMm = envelope.room.widthMm;
  const depthMm = envelope.room.depthMm;

  return typeof widthMm === "number" && Number.isFinite(widthMm) && typeof depthMm === "number" && Number.isFinite(depthMm)
    ? { widthMm: Math.max(1, Math.trunc(widthMm)), depthMm: Math.max(1, Math.trunc(depthMm)) }
    : null;
}

function logPlannerDocumentParseFailure(context: string, error: unknown, data: unknown): void {
  logPlannerSchemaValidationFailure(context, error, data, {
    usedFallback: true,
  });
}

function newPlannerDocumentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, "0")}`;
}

function buildSafeFallbackPlannerDocument(source?: Record<string, unknown> | null): PlannerDocument {
  const loose = source ?? {};

  return {
    schemaVersion: PLANNER_DOCUMENT_SCHEMA_VERSION,
    id: normalizeUuid(loose.id) ?? newPlannerDocumentId(),
    name: normalizeLooseText(loose.name ?? loose.title) ?? "Untitled plan",
    title: normalizeLooseText(loose.title ?? loose.name) ?? "Untitled plan",
    projectName: normalizeLooseText(loose.projectName ?? loose.project_name),
    clientName: normalizeLooseText(loose.clientName ?? loose.client_name),
    preparedBy: normalizeLooseText(loose.preparedBy ?? loose.prepared_by),
    roomWidthMm: normalizeLooseInteger(loose.roomWidthMm ?? loose.room_width_mm, 6000, 1),
    roomDepthMm: normalizeLooseInteger(loose.roomDepthMm ?? loose.room_depth_mm, 8000, 1),
    seatTarget: normalizeLooseInteger(loose.seatTarget ?? loose.seat_target, 10, 0),
    unitSystem: normalizeLooseUnitSystem(loose.unitSystem ?? loose.unit_system) ?? "metric",
    sceneJson: normalizeLooseSceneJson(loose.sceneJson ?? loose.scene_json),
    itemCount: normalizeLooseInteger(loose.itemCount ?? loose.item_count, 0, 0),
    thumbnailUrl: null,
    status: loose.status === "active" || loose.status === "archived" ? loose.status : "draft",
    createdAt: normalizeLooseTimestamp(loose.createdAt ?? loose.created_at),
    updatedAt: normalizeLooseTimestamp(loose.updatedAt ?? loose.updated_at),
  };
}

function parsePlannerDocumentOrFallback(
  data: unknown,
  context: string,
  fallbackSource?: Record<string, unknown> | null,
): PlannerDocument {
  try {
    return plannerDocumentSchema.parse(data);
  } catch (error) {
    logPlannerDocumentParseFailure(context, error, data);
    const source = isRecord(data) ? data : fallbackSource ?? null;
    return buildSafeFallbackPlannerDocument(source);
  }
}

function finalizePlannerDocument(
  document: PlannerDocument,
  source: Record<string, unknown> | null = null,
): PlannerDocument {
  const normalizedInput = {
    ...document,
    name: document.name ?? document.title,
    title: document.title ?? document.name,
  };
  const normalized = parsePlannerDocumentOrFallback(
    normalizedInput,
    "finalizePlannerDocument(input)",
    isRecord(source) ? source : (normalizedInput as Record<string, unknown>),
  );
  const sceneMeasurement = getSceneMeasurementRecord(source?.sceneJson ?? source?.scene_json ?? normalized.sceneJson);
  const topMeasurement = isRecord(source?.measurement) ? source?.measurement : null;
  const displayUnit =
    normalizeMeasurementDisplayUnit(sceneMeasurement?.displayUnit ?? topMeasurement?.displayUnit) ??
    toMeasurementDisplayUnit(normalized.unitSystem);
  const unitSystem = toPlannerUnitSystem(displayUnit);
  const sourceUnit =
    normalizeMeasurementSourceUnit(
      sceneMeasurement?.sourceUnit ??
      topMeasurement?.sourceUnit ??
      sceneMeasurement?.canonicalUnit ??
      topMeasurement?.canonicalUnit,
    ) ?? "mm";
  const sceneJson = normalizeSceneJsonMeasurementMetadata(normalized.sceneJson, displayUnit, sourceUnit);
  const fallbackRoomWidthMm =
    sourceUnit === "mm"
      ? normalized.roomWidthMm
      : Math.max(1, Math.trunc(convertDimensionToMillimeters(normalized.roomWidthMm, sourceUnit)));
  const fallbackRoomDepthMm =
    sourceUnit === "mm"
      ? normalized.roomDepthMm
      : Math.max(1, Math.trunc(convertDimensionToMillimeters(normalized.roomDepthMm, sourceUnit)));
  const sceneRoom = getSceneRoomDimensions(sceneJson);

  const output = {
    ...normalized,
    title: normalized.title ?? normalized.name,
    unitSystem,
    roomWidthMm: sceneRoom?.widthMm ?? fallbackRoomWidthMm,
    roomDepthMm: sceneRoom?.depthMm ?? fallbackRoomDepthMm,
    sceneJson,
  };

  return parsePlannerDocumentOrFallback(
    output,
    "finalizePlannerDocument(output)",
    output as Record<string, unknown>,
  );
}

export function createPlannerDocument(defaults: PlannerDocumentDefaults = {}): PlannerDocument {
  return finalizePlannerDocument(
    parsePlannerDocumentOrFallback(
      {
        schemaVersion: PLANNER_DOCUMENT_SCHEMA_VERSION,
        id: defaults.id ?? newPlannerDocumentId(),
        name: defaults.name ?? defaults.title,
        title: defaults.title ?? defaults.name,
        projectName: defaults.projectName ?? null,
        clientName: defaults.clientName ?? null,
        preparedBy: defaults.preparedBy ?? null,
        roomWidthMm: defaults.roomWidthMm ?? 6000,
        roomDepthMm: defaults.roomDepthMm ?? 8000,
        seatTarget: defaults.seatTarget ?? 10,
        unitSystem: defaults.unitSystem ?? "metric",
        sceneJson: toPlannerJsonSafe(defaults.sceneJson ?? {}),
        itemCount: defaults.itemCount ?? 0,
        thumbnailUrl: defaults.thumbnailUrl ?? null,
        status: defaults.status ?? "draft",
        createdAt: defaults.createdAt,
        updatedAt: defaults.updatedAt,
      },
      "createPlannerDocument",
      { ...defaults },
    ),
  );
}

export function createEmptyPlannerDocument(overrides: Partial<PlannerDocument> = {}): PlannerDocument {
  return createPlannerDocument({
    name: "Untitled plan",
    title: "Untitled plan",
    ...overrides,
  });
}

export function isPlannerDocument(value: unknown): value is PlannerDocument {
  return plannerDocumentSchema.safeParse(value).success;
}

export function isPlannerSaveRow(value: unknown): value is PlannerSaveRow {
  return plannerSaveRowSchema.safeParse(value).success;
}

export function normalizePlannerDocument(input: unknown): PlannerDocument {
  const envelope = plannerDocumentImportEnvelopeSchema.safeParse(input);
  if (envelope.success) return finalizePlannerDocument(envelope.data.document, isRecord(input) ? input : null);

  const row = plannerSaveRowSchema.safeParse(input);
  if (row.success) return finalizePlannerDocument(mapRowToDocumentLike(row.data), isRecord(input) ? input : null);

  const parsed = plannerDocumentSchema.safeParse(input);
  if (parsed.success) return finalizePlannerDocument(parsed.data, isRecord(input) ? input : null);

  if (
    isRecord(input)
    && (
      input.id
      || input.name
      || input.title
      || input.sceneJson
      || input.scene_json
    )
  ) {
    logPlannerSchemaValidationFailure(
      "normalizePlannerDocument(loose-fallback)",
      parsed.error,
      input,
      {
        envelopeIssueCount: envelope.error.issues.length,
        saveRowIssueCount: row.error.issues.length,
      },
    );
  }

  const loose = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return finalizePlannerDocument(
    createPlannerDocument({
      id: normalizeUuid(loose.id),
      name: normalizeLooseText(loose.name ?? loose.title) ?? undefined,
      title: normalizeLooseText(loose.title ?? loose.name) ?? undefined,
      projectName: normalizeLooseText(loose.projectName ?? loose.project_name),
      clientName: normalizeLooseText(loose.clientName ?? loose.client_name),
      preparedBy: normalizeLooseText(loose.preparedBy ?? loose.prepared_by),
      roomWidthMm: normalizeLooseInteger(loose.roomWidthMm ?? loose.room_width_mm, 6000, 1),
      roomDepthMm: normalizeLooseInteger(loose.roomDepthMm ?? loose.room_depth_mm, 8000, 1),
      seatTarget: normalizeLooseInteger(loose.seatTarget ?? loose.seat_target, 10, 0),
      unitSystem: normalizeLooseUnitSystem(loose.unitSystem ?? loose.unit_system),
      sceneJson: normalizeLooseSceneJson(loose.sceneJson ?? loose.scene_json),
      itemCount: normalizeLooseInteger(loose.itemCount ?? loose.item_count, 0, 0),
      thumbnailUrl: normalizeLooseText(loose.thumbnailUrl ?? loose.thumbnail_url),
      status:
        loose.status === "active" || loose.status === "archived" || loose.status === "draft"
          ? loose.status
          : undefined,
      createdAt: normalizeLooseTimestamp(loose.createdAt ?? loose.created_at),
      updatedAt: normalizeLooseTimestamp(loose.updatedAt ?? loose.updated_at),
    }),
    loose,
  );
}

export function plannerDocumentToSaveRow(
  document: PlannerDocument,
  params: {
    userId: string;
    id?: string;
    enquiryPayload?: PlannerEnquiryPayloadEnvelope | null;
    crmSyncStatus?: PlannerCrmSyncStatus;
    crmSyncedAt?: string | null;
    crmSyncError?: string | null;
  },
): PlannerSaveWrite {
  const normalized = plannerDocumentSchema.parse(document);
  const id = params.id ?? normalized.id ?? crypto.randomUUID();

  const saveRow: Record<string, unknown> = {
    id,
    user_id: params.userId,
    name: normalized.name,
    project_name: normalized.projectName,
    client_name: normalized.clientName,
    prepared_by: normalized.preparedBy,
    room_width_mm: normalized.roomWidthMm,
    room_depth_mm: normalized.roomDepthMm,
    seat_target: normalized.seatTarget,
    unit_system: normalized.unitSystem,
    scene_json: normalized.sceneJson,
    item_count: normalized.itemCount,
    thumbnail_url: normalized.thumbnailUrl,
  };

  if (params.enquiryPayload !== undefined) saveRow.enquiry_payload = params.enquiryPayload;
  if (params.crmSyncStatus !== undefined) saveRow.crm_sync_status = params.crmSyncStatus;
  if (params.crmSyncedAt !== undefined) saveRow.crm_synced_at = params.crmSyncedAt;
  if (params.crmSyncError !== undefined) saveRow.crm_sync_error = params.crmSyncError;

  return plannerSaveWriteSchema.parse(saveRow);
}

export function plannerSaveRowToDocument(row: PlannerSaveRow): PlannerDocument {
  return normalizePlannerDocument(row);
}

export function summarizePlannerDocument(document: PlannerDocument) {
  const normalized = plannerDocumentSchema.parse(document);
  const timestamp = new Date().toISOString();
  return {
    id: normalized.id ?? crypto.randomUUID(),
    name: normalized.name,
    project_name: normalized.projectName,
    client_name: normalized.clientName,
    prepared_by: normalized.preparedBy,
    room_width_mm: normalized.roomWidthMm,
    room_depth_mm: normalized.roomDepthMm,
    seat_target: normalized.seatTarget,
    unit_system: normalized.unitSystem,
    item_count: normalized.itemCount,
    thumbnail_url: normalized.thumbnailUrl,
    crm_sync_status: "pending",
    crm_synced_at: null,
    crm_sync_error: null,
    created_at: normalized.createdAt ?? timestamp,
    updated_at: normalized.updatedAt ?? timestamp,
  } satisfies PlannerSaveSummary;
}

export function validatePlannerDocument(data: unknown): PlannerDocument {
  return plannerDocumentSchema.parse(data);
}

export function validatePlannerDocumentSafe(data: unknown) {
  return plannerDocumentSchema.safeParse(data);
}

export function assertPlannerDocument(data: unknown): PlannerDocument {
  return validatePlannerDocument(data);
}

function collectZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `${path}: ${issue.message}`;
  });
}

export function parsePlannerDocumentImport(input: unknown): PlannerDocumentImportResult {
  const envelope = plannerDocumentImportEnvelopeSchema.safeParse(input);
  if (envelope.success) {
    return { ok: true, source: "envelope", document: normalizePlannerDocument(envelope.data.document), errors: [] };
  }

  const row = plannerSaveRowSchema.safeParse(input);
  if (row.success) {
    return { ok: true, source: "save-row", document: normalizePlannerDocument(row.data), errors: [] };
  }

  const document = plannerDocumentImportSchema.safeParse(input);
  if (document.success) {
    return { ok: true, source: "document", document: normalizePlannerDocument(input), errors: [] };
  }

  const errors = [
    ...collectZodIssues(envelope.error),
    ...collectZodIssues(row.error),
    ...collectZodIssues(document.error),
  ];

  logPlannerSchemaValidationFailure(
    "parsePlannerDocumentImport",
    document.error,
    input,
    {
      envelopeIssueCount: envelope.error.issues.length,
      saveRowIssueCount: row.error.issues.length,
      documentIssueCount: document.error.issues.length,
      errorPreview: errors.slice(0, 6),
    },
  );

  return {
    ok: false,
    errors,
  };
}

export function validatePlannerDocumentImport(input: unknown): PlannerImportValidationResult {
  const parsed = parsePlannerDocumentImport(input);
  return {
    valid: parsed.ok,
    errors: parsed.errors,
  };
}
