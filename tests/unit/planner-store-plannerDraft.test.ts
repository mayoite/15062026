import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlannerDocument, plannerDocumentSchema } from "@/features/planner/model";
import {
  cleanupExpiredPlannerDrafts,
  deletePlannerDraftDocument,
  loadOrCreatePlannerDraftDocument,
  loadPlannerDraftDocument,
  PLANNER_DRAFT_TTL_MS,
  resolvePlannerDraftDocument,
  savePlannerDraftDocument,
} from "@/features/planner/persistence";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      const value = store.get(key);
      return value === undefined ? null : value;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("planner draft cache", () => {
  const draftScope = { documentId: "current", userId: "user-1" };
  const plannerDocument = createPlannerDocument({
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Draft Cache Test",
    sceneJson: { shapes: [] },
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
  });

  it("writes an expiring draft envelope and loads it before expiry", () => {
    const nowMs = Date.parse("2026-04-07T10:00:00.000Z");
    vi.spyOn(Date, "now").mockReturnValue(nowMs);

    const saved = savePlannerDraftDocument(plannerDocument, draftScope);

    expect(saved).not.toBeNull();
    expect(saved?.savedAt).toBe("2026-04-07T10:00:00.000Z");
    expect(saved?.expiresAt).toBe("2026-04-08T10:00:00.000Z");

    const loaded = loadPlannerDraftDocument(draftScope);
    expect(loaded?.name).toBe("Draft Cache Test");
  });

  it("deletes expired drafts on load", () => {
    const nowMs = Date.parse("2026-04-07T10:00:00.000Z");
    vi.spyOn(Date, "now").mockReturnValue(nowMs);
    savePlannerDraftDocument(plannerDocument, draftScope);

    vi.spyOn(Date, "now").mockReturnValue(nowMs + PLANNER_DRAFT_TTL_MS + 1);

    const loaded = loadPlannerDraftDocument(draftScope);
    expect(loaded).toBeNull();
    expect(window.localStorage.length).toBe(0);
  });

  it("cleans up malformed and expired draft records", () => {
    const freshNowMs = Date.parse("2026-04-07T10:00:00.000Z");
    window.localStorage.setItem("cad-suite:planner:draft:v1:doc:bad-json", "{");
    window.localStorage.setItem(
      "cad-suite:planner:draft:v1:doc:expired",
      JSON.stringify({
        schemaVersion: 1,
        savedAt: "2026-04-05T10:00:00.000Z",
        expiresAt: "2026-04-06T10:00:00.000Z",
        document: plannerDocument,
      }),
    );
    window.localStorage.setItem(
      "cad-suite:planner:draft:v1:doc:fresh",
      JSON.stringify({
        schemaVersion: 1,
        savedAt: "2026-04-07T09:00:00.000Z",
        expiresAt: "2026-04-08T09:00:00.000Z",
        document: plannerDocument,
      }),
    );

    const removed = cleanupExpiredPlannerDrafts(
      window.localStorage,
      freshNowMs,
    );

    expect(removed).toBe(2);
    expect(window.localStorage.length).toBe(1);
  });

  it("deletes drafts and creates defaults when none exist", () => {
    savePlannerDraftDocument(plannerDocument, draftScope);
    expect(deletePlannerDraftDocument(draftScope)).toBe(true);
    expect(loadPlannerDraftDocument(draftScope)).toBeNull();

    const created = loadOrCreatePlannerDraftDocument(draftScope, { name: "Fresh Draft" });
    expect(created.name).toBe("Fresh Draft");
  });

  it("resolves scoped drafts with fallback ordering", () => {
    savePlannerDraftDocument(plannerDocument, { userId: "user-1", documentId: "doc-1" });
    const resolved = resolvePlannerDraftDocument({ userId: "user-1", documentId: "doc-1" });
    expect(resolved.status).toBe("loaded");
    expect(resolved.document?.name).toBe("Draft Cache Test");

    const missing = resolvePlannerDraftDocument({ userId: "missing" });
    expect(missing.status).toBe("missing");
  });

  it("returns null when draft storage is unavailable", () => {
    Object.defineProperty(window, "localStorage", {
      value: undefined,
      configurable: true,
    });
    expect(savePlannerDraftDocument(plannerDocument, draftScope)).toBeNull();
    expect(deletePlannerDraftDocument(draftScope)).toBe(false);
  });

  it("resolves user-scoped drafts before document-only keys", () => {
    savePlannerDraftDocument(plannerDocument, { userId: "user-1", documentId: "doc-1" });
    const resolved = resolvePlannerDraftDocument({ userId: "user-1", documentId: "doc-1" });
    expect(resolved.status).toBe("loaded");
    expect(resolved.scope).toEqual({ userId: "user-1", documentId: "doc-1" });
  });

  it("removes stale savedAt-only envelopes during cleanup", () => {
    const staleSavedAt = new Date(Date.now() - PLANNER_DRAFT_TTL_MS - 60_000).toISOString();
    window.localStorage.setItem(
      "cad-suite:planner:draft:v1:doc:stale-doc",
      JSON.stringify({
        schemaVersion: 1,
        savedAt: staleSavedAt,
        document: plannerDocument,
      }),
    );
    expect(loadPlannerDraftDocument({ documentId: "stale-doc" })).toBeNull();
    expect(window.localStorage.getItem("cad-suite:planner:draft:v1:doc:stale-doc")).toBeNull();
  });

  it("returns missing when no document id is provided", () => {
    expect(resolvePlannerDraftDocument({ userId: "user-1" }).status).toBe("missing");
  });

  it("returns null when draft save fails", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(savePlannerDraftDocument(plannerDocument, draftScope)).toBeNull();
  });

  it("returns false when draft deletion fails", () => {
    savePlannerDraftDocument(plannerDocument, draftScope);
    vi.spyOn(window.localStorage, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(deletePlannerDraftDocument(draftScope)).toBe(false);
  });

  it("reports storage-unavailable when localStorage access throws", () => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
      configurable: true,
    });
    expect(resolvePlannerDraftDocument({ documentId: "doc" }).status).toBe("storage-unavailable");
    expect(savePlannerDraftDocument(plannerDocument, draftScope)).toBeNull();
  });

  it("reports invalid when draft document validation fails", () => {
    const nowMs = Date.parse("2026-04-07T10:00:00.000Z");
    vi.spyOn(Date, "now").mockReturnValue(nowMs);
    window.localStorage.setItem(
      "cad-suite:planner:draft:v1:doc:bad-doc",
      JSON.stringify({
        schemaVersion: 1,
        savedAt: "2026-04-07T10:00:00.000Z",
        expiresAt: "2026-04-08T10:00:00.000Z",
        document: plannerDocument,
      }),
    );
    vi.spyOn(plannerDocumentSchema, "parse").mockImplementation(() => {
      throw new Error("invalid draft");
    });
    expect(resolvePlannerDraftDocument({ documentId: "bad-doc" }).status).toBe("invalid");
  });

  it("reports expired when cleanup cannot remove stale envelopes", () => {
    window.localStorage.setItem(
      "cad-suite:planner:draft:v1:doc:expired-doc",
      JSON.stringify({
        schemaVersion: 1,
        savedAt: "2026-01-01T00:00:00.000Z",
        expiresAt: "2026-01-02T00:00:00.000Z",
        document: plannerDocument,
      }),
    );
    vi.spyOn(window.localStorage, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const result = resolvePlannerDraftDocument({ documentId: "expired-doc" });
    expect(result.status).toBe("expired");
  });

  it("returns zero when draft cleanup cannot enumerate keys", () => {
    vi.spyOn(window.localStorage, "key").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(cleanupExpiredPlannerDrafts(window.localStorage)).toBe(0);
  });

  it("falls back to document-only scope when user-scoped draft is missing", () => {
    savePlannerDraftDocument(plannerDocument, { documentId: "shared-doc" });
    const result = resolvePlannerDraftDocument({
      userId: "other-user",
      documentId: "shared-doc",
    });
    expect(result.status).toBe("loaded");
    expect(result.scope).toEqual({ documentId: "shared-doc" });
  });

});

