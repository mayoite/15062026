import type { z } from "zod";

const LOG_PREFIX = "[planner:document]";

const SENSITIVE_FIELD_NAMES = new Set([
  "name",
  "title",
  "text",
  "label",
  "clientname",
  "client_name",
  "preparedby",
  "prepared_by",
  "projectname",
  "project_name",
  "imageurl",
  "image_url",
  "thumbnailurl",
  "thumbnail_url",
  "email",
  "phone",
  "address",
  "notes",
  "description",
  "price",
  "preparedby",
]);

const LARGE_BLOB_FIELD_NAMES = new Set([
  "scenejson",
  "scene_json",
  "fabricsnapshot",
  "store",
  "workspace",
  "dataurl",
  "data_url",
  "enquirypayload",
  "enquiry_payload",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isSensitiveFieldName(fieldName: string): boolean {
  return SENSITIVE_FIELD_NAMES.has(fieldName.toLowerCase());
}

function isLargeBlobFieldName(fieldName: string): boolean {
  return LARGE_BLOB_FIELD_NAMES.has(fieldName.toLowerCase());
}

function redactString(value: string): { kind: "string"; length: number; redacted: true } {
  return { kind: "string", length: value.length, redacted: true };
}

export function describePlannerValueSample(value: unknown, depth = 0): unknown {
  if (depth > 4) return { kind: "depth_limit" };

  if (value === undefined) return { kind: "undefined" };
  if (value === null) return { kind: "null" };
  if (typeof value === "boolean") return { kind: "boolean", value };
  if (typeof value === "number") {
    return {
      kind: "number",
      value: Number.isFinite(value) ? value : String(value),
      finite: Number.isFinite(value),
    };
  }
  if (typeof value === "string") {
    if (value.length > 120) {
      return redactString(value);
    }
    return { kind: "string", length: value.length, preview: value.slice(0, 32) };
  }
  if (typeof value === "bigint") return { kind: "bigint", redacted: true };
  if (typeof value === "function" || typeof value === "symbol") {
    return { kind: typeof value, redacted: true };
  }

  if (Array.isArray(value)) {
    return {
      kind: "array",
      length: value.length,
      samples: value.slice(0, 3).map((entry) => describePlannerValueSample(entry, depth + 1)),
    };
  }

  if (!isRecord(value)) {
    return { kind: "object", redacted: true };
  }

  const keys = Object.keys(value);
  const sampleEntries: Record<string, unknown> = {};
  for (const key of keys.slice(0, 8)) {
    const entry = value[key];
    if (isSensitiveFieldName(key)) {
      sampleEntries[key] = typeof entry === "string" ? redactString(entry) : { kind: typeof entry, redacted: true };
      continue;
    }
    if (isLargeBlobFieldName(key)) {
      sampleEntries[key] = summarizeLargeBlobField(entry);
      continue;
    }
    sampleEntries[key] = describePlannerValueSample(entry, depth + 1);
  }

  return {
    kind: "object",
    keyCount: keys.length,
    keys: keys.slice(0, 12),
    sample: sampleEntries,
  };
}

function summarizeLargeBlobField(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {
      kind: Array.isArray(value) ? "array" : typeof value,
      length: Array.isArray(value) ? value.length : undefined,
      redacted: true,
    };
  }

  const keys = Object.keys(value);
  const summary: Record<string, unknown> = {
    kind: "object",
    keyCount: keys.length,
    keys: keys.slice(0, 12),
    redacted: true,
  };

  if ("type" in value && typeof value.type === "string") summary.type = value.type;
  if ("version" in value) summary.version = value.version;
  if (Array.isArray(value.items)) summary.itemCount = value.items.length;
  if ("fabricSnapshot" in value) summary.fabricSnapshot = summarizeFabricSnapshot(value.fabricSnapshot);
  if ("document" in value) summary.document = summarizeFabricSnapshot(value);

  return summary;
}

function summarizeFabricSnapshot(snapshot: unknown): Record<string, unknown> {
  if (!isRecord(snapshot)) {
    return { kind: typeof snapshot, redacted: true };
  }

  const document = isRecord(snapshot.document) ? snapshot.document : null;
  const store = document && isRecord(document.store) ? document.store : isRecord(snapshot.store) ? snapshot.store : null;
  const storeKeys = store ? Object.keys(store) : [];

  return {
    hasDocument: Boolean(document),
    hasSession: "session" in snapshot,
    storeRecordCount: storeKeys.length,
    storeShapeTypes: storeKeys.slice(0, 6).map((key) => {
      const record = store?.[key];
      return isRecord(record) && typeof record.type === "string" ? record.type : "unknown";
    }),
    redacted: true,
  };
}

export function summarizePlannerSceneJson(sceneJson: unknown): Record<string, unknown> {
  if (!isRecord(sceneJson)) {
    return { kind: sceneJson === null ? "null" : typeof sceneJson };
  }

  const envelope =
    sceneJson.type === "cad-suite-planner-scene"
      ? sceneJson
      : isRecord(sceneJson.plannerScene) && sceneJson.plannerScene.type === "cad-suite-planner-scene"
        ? sceneJson.plannerScene
        : null;

  if (!envelope) {
    return {
      kind: "object",
      keyCount: Object.keys(sceneJson).length,
      keys: Object.keys(sceneJson).slice(0, 12),
      redacted: true,
    };
  }

  return {
    type: envelope.type,
    version: envelope.version,
    itemCount: Array.isArray(envelope.items) ? envelope.items.length : 0,
    hasRoom: isRecord(envelope.room),
    fabricSnapshot: summarizeFabricSnapshot(envelope.fabricSnapshot),
  };
}

export function summarizePlannerDocumentInput(data: unknown): Record<string, unknown> {
  if (!isRecord(data)) {
    return { valueType: data === null ? "null" : typeof data };
  }

  const name = data.name ?? data.title;
  const title = data.title ?? data.name;

  return {
    id: typeof data.id === "string" ? data.id : undefined,
    name: typeof name === "string" ? redactString(name) : undefined,
    title: typeof title === "string" ? redactString(title) : undefined,
    hasProjectName: Boolean(data.projectName ?? data.project_name),
    hasClientName: Boolean(data.clientName ?? data.client_name),
    hasPreparedBy: Boolean(data.preparedBy ?? data.prepared_by),
    roomWidthMm: data.roomWidthMm ?? data.room_width_mm,
    roomDepthMm: data.roomDepthMm ?? data.room_depth_mm,
    seatTarget: data.seatTarget ?? data.seat_target,
    unitSystem: data.unitSystem ?? data.unit_system,
    itemCount: data.itemCount ?? data.item_count,
    status: data.status,
    schemaVersion: data.schemaVersion ?? data.schema_version,
    sceneJson: summarizePlannerSceneJson(data.sceneJson ?? data.scene_json),
  };
}

export function getPlannerValueAtPath(data: unknown, path: (string | number)[]): unknown {
  let current: unknown = data;
  for (const segment of path) {
    if (typeof segment === "number") {
      if (!Array.isArray(current)) return undefined;
      current = current[segment];
      continue;
    }
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
}

export type PlannerSchemaIssueLog = {
  path: string;
  code: string;
  message: string;
  received?: unknown;
  sample?: unknown;
};

export function formatPlannerZodIssues(error: z.ZodError, data: unknown, limit = 8): PlannerSchemaIssueLog[] {
  return error.issues.slice(0, limit).map((issue) => {
    const path = issue.path.length > 0 ? issue.path.map(String).join(".") : "root";
    const received = "received" in issue ? issue.received : undefined;
    const pathSegments = issue.path.filter(
      (segment): segment is string | number => typeof segment === "string" || typeof segment === "number",
    );
    const valueAtPath = pathSegments.length > 0 ? getPlannerValueAtPath(data, pathSegments) : data;
    const sampleSource = valueAtPath !== undefined ? valueAtPath : received;

    return {
      path,
      code: issue.code,
      message: issue.message,
      received: received === undefined ? undefined : describePlannerValueSample(received),
      sample: sampleSource === undefined ? undefined : describePlannerValueSample(sampleSource),
    };
  });
}

export type PlannerDocumentBuildContext = {
  source: string;
  documentId?: string | null;
  itemCount?: number;
  shapeCount?: number;
  unitSystem?: string;
  sceneEnvelopeType?: string;
};

export function logPlannerDocumentBuildAttempt(_context: PlannerDocumentBuildContext): void {
  // if (process.env.NODE_ENV !== "development") return;
  // console.warn(`${LOG_PREFIX} build`, context);
}

export function logPlannerSchemaValidationFailure(
  context: string,
  error: unknown,
  data: unknown,
  extra?: Record<string, unknown>,
): void {
  const summary = summarizePlannerDocumentInput(data);

  if (error && typeof error === "object" && "issues" in error && Array.isArray((error as z.ZodError).issues)) {
    const zodError = error as z.ZodError;
    console.error(`${LOG_PREFIX} validation failed`, {
      context,
      issueCount: zodError.issues.length,
      issues: formatPlannerZodIssues(zodError, data),
      summary,
      ...extra,
    });
    return;
  }

  console.error(`${LOG_PREFIX} validation failed`, {
    context,
    errorType: error instanceof Error ? error.name : typeof error,
    errorMessage: error instanceof Error ? error.message : undefined,
    summary,
    ...extra,
  });
}
