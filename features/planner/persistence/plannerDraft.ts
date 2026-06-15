import {
  createPlannerDocument,
  normalizePlannerDocument,
  plannerDocumentSchema,
  type PlannerDocument,
} from "../model";

const PLANNER_DRAFT_STORAGE_PREFIX = "cad-suite:planner:draft:v1";
export const PLANNER_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export interface PlannerDraftScope {
  userId?: string;
  documentId?: string;
}

export interface PlannerDraftEnvelope {
  schemaVersion: 1;
  savedAt: string;
  expiresAt: string;
  document: PlannerDocument;
}

export type PlannerDraftLoadStatus = "loaded" | "missing" | "expired" | "invalid" | "storage-unavailable";

export interface PlannerDraftLoadResult {
  document: PlannerDocument | null;
  status: PlannerDraftLoadStatus;
  scope: PlannerDraftScope | null;
}

export interface PlannerDraftListEntry {
  storageKey: string;
  scope: PlannerDraftScope;
  envelope: PlannerDraftEnvelope;
}

function getPlannerDraftStorageKey(scope: PlannerDraftScope = {}): string {
  const parts = [PLANNER_DRAFT_STORAGE_PREFIX];
  if (scope.userId?.trim()) parts.push(`user:${scope.userId.trim()}`);
  if (scope.documentId?.trim()) parts.push(`doc:${scope.documentId.trim()}`);
  return parts.join(":");
}

function normalizePlannerDraftScope(scope: PlannerDraftScope = {}): PlannerDraftScope {
  return {
    documentId: scope.documentId?.trim() || undefined,
    userId: scope.userId?.trim() || undefined,
  };
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
  } catch {
    return null;
  }

  if (!storage) {
    return null;
  }

  if (
    typeof storage.getItem !== "function" ||
    typeof storage.setItem !== "function" ||
    typeof storage.removeItem !== "function" ||
    typeof storage.key !== "function"
  ) {
    return null;
  }

  return storage;
}

function isDraftEnvelope(value: unknown): value is Partial<PlannerDraftEnvelope> {
  return Boolean(value && typeof value === "object" && "document" in value);
}

function resolveDraftExpiryMs(envelope: Partial<PlannerDraftEnvelope>): number | null {
  if (typeof envelope.expiresAt === "string") {
    const parsed = Date.parse(envelope.expiresAt);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if (typeof envelope.savedAt === "string") {
    const parsed = Date.parse(envelope.savedAt);
    if (!Number.isNaN(parsed)) {
      return parsed + PLANNER_DRAFT_TTL_MS;
    }
  }

  return null;
}

function isExpiredDraftEnvelope(envelope: Partial<PlannerDraftEnvelope>, nowMs = Date.now()): boolean {
  const expiresAtMs = resolveDraftExpiryMs(envelope);
  if (expiresAtMs === null) {
    return true;
  }

  return expiresAtMs <= nowMs;
}

function buildPlannerDraftLoadScopes(scope: PlannerDraftScope = {}): PlannerDraftScope[] {
  const normalized = normalizePlannerDraftScope(scope);
  const documentId = normalized.documentId;
  if (!documentId) return [];

  const candidates: PlannerDraftScope[] = [];
  if (normalized.userId) {
    candidates.push({ documentId, userId: normalized.userId });
  }
  candidates.push({ documentId });

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = getPlannerDraftStorageKey(candidate);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function loadPlannerDraftDocumentAtKey(
  storage: Storage,
  scope: PlannerDraftScope,
  nowMs = Date.now(),
): PlannerDraftLoadResult {
  const storageKey = getPlannerDraftStorageKey(scope);
  let raw: string | null = null;
  try {
    raw = storage.getItem(storageKey);
  } catch {
    return { document: null, status: "storage-unavailable", scope };
  }

  if (!raw) {
    return { document: null, status: "missing", scope };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PlannerDraftEnvelope> | PlannerDocument;

    if (isDraftEnvelope(parsed)) {
      if (isExpiredDraftEnvelope(parsed, nowMs)) {
        try {
          storage.removeItem(storageKey);
        } catch {
          // ignore storage removal failures
        }
        return { document: null, status: "expired", scope };
      }

      return {
        document: plannerDocumentSchema.parse(normalizePlannerDocument(parsed.document)),
        status: "loaded",
        scope,
      };
    }

    try {
      storage.removeItem(storageKey);
    } catch {
      // ignore storage removal failures
    }
    return { document: null, status: "invalid", scope };
  } catch {
    try {
      storage.removeItem(storageKey);
    } catch {
      // ignore storage removal failures
    }
    return { document: null, status: "invalid", scope };
  }
}

export function cleanupExpiredPlannerDrafts(storage = getLocalStorage(), nowMs = Date.now()): number {
  if (!storage) return 0;

  const keys: string[] = [];
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(PLANNER_DRAFT_STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
  } catch {
    return 0;
  }

  let removed = 0;

  for (const key of keys) {
    let raw: string | null = null;
    try {
      raw = storage.getItem(key);
    } catch {
      continue;
    }

    if (!raw) {
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      try {
        storage.removeItem(key);
        removed += 1;
      } catch {
        // ignore storage removal failures
      }
      continue;
    }

    if (!isDraftEnvelope(parsed) || isExpiredDraftEnvelope(parsed, nowMs)) {
      try {
        storage.removeItem(key);
        removed += 1;
      } catch {
        // ignore storage removal failures
      }
    }
  }

  return removed;
}

export function listPlannerDraftDocuments(storage = getLocalStorage(), nowMs = Date.now()): PlannerDraftListEntry[] {
  if (!storage) return [];

  try {
    cleanupExpiredPlannerDrafts(storage, nowMs);
  } catch {
    return [];
  }

  const entries: PlannerDraftListEntry[] = [];

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key?.startsWith(PLANNER_DRAFT_STORAGE_PREFIX)) continue;

      const raw = storage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as unknown;
      if (!isDraftEnvelope(parsed) || isExpiredDraftEnvelope(parsed, nowMs)) continue;

      const envelope = parsed as PlannerDraftEnvelope;
      const scope: PlannerDraftScope = {};
      const parts = key.split(":");
      const userIndex = parts.indexOf("user");
      const docIndex = parts.indexOf("doc");
      if (userIndex !== -1 && userIndex < parts.length - 1) {
        scope.userId = parts.slice(userIndex + 1, docIndex === -1 ? undefined : docIndex).join(":") || undefined;
      }
      if (docIndex !== -1 && docIndex < parts.length - 1) {
        scope.documentId = parts.slice(docIndex + 1).join(":") || undefined;
      }

      entries.push({
        storageKey: key,
        scope,
        envelope: {
          ...envelope,
          document: plannerDocumentSchema.parse(normalizePlannerDocument(envelope.document)),
        },
      });
    }
  } catch {
    return [];
  }

  return entries.sort((left, right) => right.envelope.savedAt.localeCompare(left.envelope.savedAt));
}

export function resolvePlannerDraftDocument(scope: PlannerDraftScope = {}): PlannerDraftLoadResult {
  const storage = getLocalStorage();
  if (!storage) {
    return { document: null, status: "storage-unavailable", scope: null };
  }

  try {
    cleanupExpiredPlannerDrafts(storage);
  } catch {
    return { document: null, status: "storage-unavailable", scope: null };
  }

  const loadScopes = buildPlannerDraftLoadScopes(scope);
  if (loadScopes.length === 0) {
    return { document: null, status: "missing", scope: null };
  }

  let fallbackResult: PlannerDraftLoadResult | null = null;

  for (const loadScope of loadScopes) {
    const result = loadPlannerDraftDocumentAtKey(storage, loadScope);
    if (result.document) {
      return result;
    }

    if (result.status !== "missing" && fallbackResult === null) {
      fallbackResult = result;
    }
  }

  return fallbackResult ?? { document: null, status: "missing", scope: loadScopes[0] ?? null };
}

export function savePlannerDraftDocument(
  document: PlannerDocument,
  scope: PlannerDraftScope = {},
): PlannerDraftEnvelope | null {
  const storage = getLocalStorage();
  if (!storage) return null;

  try {
    cleanupExpiredPlannerDrafts(storage);
  } catch {
    return null;
  }

  const normalized = plannerDocumentSchema.parse(normalizePlannerDocument(document));
  const nowMs = Date.now();
  const envelope: PlannerDraftEnvelope = {
    schemaVersion: 1,
    savedAt: new Date(nowMs).toISOString(),
    expiresAt: new Date(nowMs + PLANNER_DRAFT_TTL_MS).toISOString(),
    document: normalized,
  };

  try {
    storage.setItem(getPlannerDraftStorageKey(scope), JSON.stringify(envelope));
    return envelope;
  } catch {
    return null;
  }
}

export function loadPlannerDraftDocument(scope: PlannerDraftScope = {}): PlannerDocument | null {
  return resolvePlannerDraftDocument(scope).document;
}

export function deletePlannerDraftDocument(scope: PlannerDraftScope = {}): boolean {
  const storage = getLocalStorage();
  if (!storage) return false;

  try {
    storage.removeItem(getPlannerDraftStorageKey(scope));
    return true;
  } catch {
    return false;
  }
}

export function loadOrCreatePlannerDraftDocument(
  scope: PlannerDraftScope = {},
  defaults: Parameters<typeof createPlannerDocument>[0] = {},
): PlannerDocument {
  return loadPlannerDraftDocument(scope) ?? createPlannerDocument(defaults);
}
