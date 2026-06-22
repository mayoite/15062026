/**
 * planner-persistence.test.ts
 * P5-11, P5-12, P5-13, P5-14, P5-15 — import parsing and storage corruption/expiry
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlannerDocument } from "@/features/planner/model";
import {
  parsePlannerDocumentImportText,
  parsePlannerDocumentImportValue,
} from "@/features/planner/persistence/plannerImport";
import {
  cleanupExpiredPlannerDrafts,
  PLANNER_DRAFT_TTL_MS,
  savePlannerDraftDocument,
} from "@/features/planner/persistence/plannerDraft";
import {
  shouldMigrateGuestPlan,
  GUEST_PROJECT_ID,
  MEMBER_PROJECT_ID,
  type PlannerProject,
} from "@/features/planner/persistence/persistence";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() { return store.size; },
    clear() { store.clear(); },
    getItem(k: string) { const v = store.get(k); return v === undefined ? null : v; },
    key(i: number) { return Array.from(store.keys())[i] ?? null; },
    removeItem(k: string) { store.delete(k); },
    setItem(k: string, v: string) { store.set(k, v); },
  };
}

function setWindowLocalStorage(storage: Storage) {
  Object.defineProperty(window, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
}

function makeProject(id: string, snapshot = ""): PlannerProject {
  return { id, name: id, createdAt: 1, updatedAt: 2, snapshot };
}

const guestSnap = JSON.stringify({ version: 1 });
const validDocJson = JSON.stringify(
  createPlannerDocument({ id: "550e8400-e29b-41d4-a716-446655440abc", name: "Test" })
);

// ─── P5-11 parsePlannerDocumentImportText ────────────────────────────────────

describe("parsePlannerDocumentImportText", () => {
  it("accepts valid exported JSON and returns ok=true", () => {
    const result = parsePlannerDocumentImportText(validDocJson);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.name).toBe("Test");
    }
  });

  it("returns ok=false for malformed JSON", () => {
    const result = parsePlannerDocumentImportText("{broken");
    expect(result.ok).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it("returns ok=false for valid JSON with wrong schema (not a planner document)", () => {
    const result = parsePlannerDocumentImportText(JSON.stringify({ foo: "bar" }));
    expect(result.ok).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it("returns ok=false for empty string", () => {
    const result = parsePlannerDocumentImportText("");
    expect(result.ok).toBe(false);
  });

  it("returns ok=false for null payload", () => {
    const result = parsePlannerDocumentImportValue(null);
    expect(result.ok).toBe(false);
  });
});

// ─── P5-12 localStorage corruption recovery ──────────────────────────────────

describe("cleanupExpiredPlannerDrafts (localStorage corruption)", () => {
  it("removes corrupt entries and expired entries, keeps fresh ones", () => {
    const storage = makeMemoryStorage();
    const now = Date.parse("2026-05-01T12:00:00Z");

    // corrupt
    storage.setItem("cad-suite:planner:draft:v1:doc:bad", "{CORRUPT");
    // expired
    storage.setItem(
      "cad-suite:planner:draft:v1:doc:expired",
      JSON.stringify({
        schemaVersion: 1,
        savedAt: "2026-04-29T12:00:00Z",
        expiresAt: "2026-04-30T12:00:00Z",
        document: {},
      }),
    );
    // fresh (expires 24 h from now in the test scenario)
    storage.setItem(
      "cad-suite:planner:draft:v1:doc:fresh",
      JSON.stringify({
        schemaVersion: 1,
        savedAt: "2026-05-01T11:00:00Z",
        expiresAt: "2026-05-02T11:00:00Z",
        document: {},
      }),
    );

    const removed = cleanupExpiredPlannerDrafts(storage, now);
    expect(removed).toBe(2);
    expect(storage.length).toBe(1);
  });

  it("cleanupExpiredPlannerDrafts does not remove fresh drafts", () => {
    const storage = makeMemoryStorage();
    setWindowLocalStorage(storage);
    const now = Date.parse("2026-05-01T12:00:00Z");
    vi.spyOn(Date, "now").mockReturnValue(now);
    const doc = createPlannerDocument({
      id: "550e8400-e29b-41d4-a716-000000000001",
      name: "Fresh",
    });
    savePlannerDraftDocument(doc, { documentId: "fresh-doc" });
    vi.restoreAllMocks();

    const removed = cleanupExpiredPlannerDrafts(storage, now);
    expect(removed).toBe(0);
    expect(storage.length).toBe(1);
  });
});

// ─── P5-14 draft TTL expiry ───────────────────────────────────────────────────

describe("draft TTL expiry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setWindowLocalStorage(makeMemoryStorage());
  });

  it("PLANNER_DRAFT_TTL_MS equals 24 hours", () => {
    expect(PLANNER_DRAFT_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });

  it("an expired draft is pruned on next cleanup", () => {
    const nowMs = Date.parse("2026-05-01T00:00:00Z");
    vi.spyOn(Date, "now").mockReturnValue(nowMs);
    const doc = createPlannerDocument({
      id: "550e8400-e29b-41d4-a716-000000000002",
      name: "WillExpire",
    });
    savePlannerDraftDocument(doc, { documentId: "expiring-doc" });
    vi.restoreAllMocks();

    // simulate 25 h later
    const removed = cleanupExpiredPlannerDrafts(window.localStorage, nowMs + PLANNER_DRAFT_TTL_MS + 3_600_000);
    expect(removed).toBe(1);
    expect(window.localStorage.length).toBe(0);
  });

  it("fresh draft survives cleanup", () => {
    const nowMs = Date.parse("2026-05-01T00:00:00Z");
    vi.spyOn(Date, "now").mockReturnValue(nowMs);
    const doc = createPlannerDocument({
      id: "550e8400-e29b-41d4-a716-000000000003",
      name: "Fresh",
    });
    savePlannerDraftDocument(doc, { documentId: "fresh-doc" });
    vi.restoreAllMocks();

    const removed = cleanupExpiredPlannerDrafts(window.localStorage, nowMs);
    expect(removed).toBe(0);
    expect(window.localStorage.length).toBe(1);
  });
});

// ─── P5-15 guest migration decisions ─────────────────────────────────────────

describe("shouldMigrateGuestPlan (P5-15 exhaustive matrix)", () => {
  it("(a) no guest data → skips migration", () => {
    expect(shouldMigrateGuestPlan(undefined, undefined, false)).toBe(false);
  });

  it("(a) guest has empty snapshot → skips migration", () => {
    expect(shouldMigrateGuestPlan(makeProject(GUEST_PROJECT_ID, ""), undefined, false)).toBe(false);
    expect(shouldMigrateGuestPlan(makeProject(GUEST_PROJECT_ID, "  "), undefined, false)).toBe(false);
  });

  it("(b) guest data + empty member → migrates", () => {
    expect(shouldMigrateGuestPlan(makeProject(GUEST_PROJECT_ID, guestSnap), undefined, false)).toBe(true);
  });

  it("(c) guest data + occupied member → does NOT overwrite", () => {
    expect(
      shouldMigrateGuestPlan(
        makeProject(GUEST_PROJECT_ID, guestSnap),
        makeProject(MEMBER_PROJECT_ID, guestSnap),
        false,
      ),
    ).toBe(false);
  });

  it("(d) already claimed → skips immediately", () => {
    expect(shouldMigrateGuestPlan(makeProject(GUEST_PROJECT_ID, guestSnap), undefined, true)).toBe(false);
  });
});

