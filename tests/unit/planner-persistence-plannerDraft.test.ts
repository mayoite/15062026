import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlannerDocument } from "@/features/planner/model";
import {
  cleanupExpiredPlannerDrafts,
  listPlannerDraftDocuments,
  loadPlannerDraftDocument,
  PLANNER_DRAFT_TTL_MS,
  savePlannerDraftDocument,
} from "@/features/planner/persistence/plannerDraft";

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

    const removed = cleanupExpiredPlannerDrafts(window.localStorage, freshNowMs);

    expect(removed).toBe(2);
    expect(window.localStorage.length).toBe(1);
  });

  it("lists named planner draft sessions in newest-first order", () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-04-07T10:00:00.000Z"));
    savePlannerDraftDocument(
      createPlannerDocument({ name: "Older Draft", id: "550e8400-e29b-41d4-a716-446655440001" }),
      { documentId: "older-draft" },
    );

    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-04-07T11:00:00.000Z"));
    savePlannerDraftDocument(
      createPlannerDocument({ name: "Newest Draft", id: "550e8400-e29b-41d4-a716-446655440002" }),
      { documentId: "newest-draft" },
    );

    const drafts = listPlannerDraftDocuments(window.localStorage);

    expect(drafts).toHaveLength(2);
    expect(drafts[0]?.scope.documentId).toBe("newest-draft");
    expect(drafts[0]?.envelope.document.name).toBe("Newest Draft");
    expect(drafts[1]?.scope.documentId).toBe("older-draft");
  });
});

