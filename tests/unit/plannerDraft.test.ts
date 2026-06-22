import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import {
  savePlannerDraftDocument,
  resolvePlannerDraftDocument,
  loadPlannerDraftDocument,
  deletePlannerDraftDocument,
  listPlannerDraftDocuments,
  cleanupExpiredPlannerDrafts,
  loadOrCreatePlannerDraftDocument,
  PLANNER_DRAFT_TTL_MS,
} from "@/features/planner/persistence/plannerDraft";
import { createPlannerDocument } from "../../features/planner/model";

class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("plannerDraft", () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("savePlannerDraftDocument", () => {
    it("saves a valid planner document", () => {
      const doc = createPlannerDocument();
      const envelope = savePlannerDraftDocument(doc, { userId: "user-1", documentId: "doc-1" });
      
      expect(envelope).not.toBeNull();
      expect(envelope?.document.id).toBe(doc.id);
      expect(mockStorage.length).toBe(1);
    });
  });

  describe("resolvePlannerDraftDocument", () => {
    it("resolves a saved document by scope", () => {
      const doc = createPlannerDocument();
      savePlannerDraftDocument(doc, { documentId: "doc-1" });
      
      const result = resolvePlannerDraftDocument({ documentId: "doc-1" });
      expect(result.status).toBe("loaded");
      expect(result.document?.id).toBe(doc.id);
    });

    it("returns missing status if not found", () => {
      const result = resolvePlannerDraftDocument({ documentId: "doc-1" });
      expect(result.status).toBe("missing");
      expect(result.document).toBeNull();
    });

    it("returns expired status if TTL has passed", () => {
      vi.useFakeTimers();
      const doc = createPlannerDocument();
      savePlannerDraftDocument(doc, { documentId: "doc-2" });
      
      vi.advanceTimersByTime(PLANNER_DRAFT_TTL_MS + 1000);
      
      const result = resolvePlannerDraftDocument({ documentId: "doc-2" });
      expect(result.status).toBe("missing");
      expect(result.document).toBeNull();
      expect(mockStorage.length).toBe(0);
    });

    it("handles invalid storage data gracefully", () => {
      mockStorage.setItem("cad-suite:planner:draft:v1:doc:bad-doc", "invalid-json");
      const result = resolvePlannerDraftDocument({ documentId: "bad-doc" });
      expect(result.status).toBe("missing");
      expect(result.document).toBeNull();
    });
  });

  describe("loadPlannerDraftDocument", () => {
    it("loads document if available", () => {
      const doc = createPlannerDocument();
      savePlannerDraftDocument(doc, { documentId: "doc-1" });
      
      const loaded = loadPlannerDraftDocument({ documentId: "doc-1" });
      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe(doc.id);
    });

    it("returns null if not available", () => {
      const loaded = loadPlannerDraftDocument({ documentId: "missing" });
      expect(loaded).toBeNull();
    });
  });

  describe("deletePlannerDraftDocument", () => {
    it("deletes the draft document for a scope", () => {
      const doc = createPlannerDocument();
      savePlannerDraftDocument(doc, { documentId: "doc-to-delete" });
      expect(mockStorage.length).toBe(1);
      
      const deleted = deletePlannerDraftDocument({ documentId: "doc-to-delete" });
      expect(deleted).toBe(true);
      expect(mockStorage.length).toBe(0);
    });

    it("returns true even if document didn't exist", () => {
      const deleted = deletePlannerDraftDocument({ documentId: "doc-missing" });
      expect(deleted).toBe(true);
    });
  });

  describe("listPlannerDraftDocuments", () => {
    it("lists all valid drafts", () => {
      const doc1 = createPlannerDocument();
      const doc2 = createPlannerDocument();
      
      savePlannerDraftDocument(doc1, { userId: "user-1", documentId: "doc-1" });
      savePlannerDraftDocument(doc2, { userId: "user-2", documentId: "doc-2" });
      
      const entries = listPlannerDraftDocuments();
      expect(entries.length).toBe(2);
      expect(entries.some(e => e.scope.documentId === "doc-1")).toBe(true);
      expect(entries.some(e => e.scope.documentId === "doc-2")).toBe(true);
    });

    it("cleans up expired drafts while listing", () => {
      vi.useFakeTimers();
      const doc = createPlannerDocument();
      savePlannerDraftDocument(doc, { documentId: "expiring-doc" });
      
      vi.advanceTimersByTime(PLANNER_DRAFT_TTL_MS + 1000);
      const entries = listPlannerDraftDocuments();
      
      expect(entries.length).toBe(0);
      expect(mockStorage.length).toBe(0);
    });
  });

  describe("cleanupExpiredPlannerDrafts", () => {
    it("removes only expired drafts", () => {
      vi.useFakeTimers();
      const doc1 = createPlannerDocument();
      savePlannerDraftDocument(doc1, { documentId: "old-doc" });
      
      vi.advanceTimersByTime(PLANNER_DRAFT_TTL_MS / 2);
      
      const doc2 = createPlannerDocument();
      savePlannerDraftDocument(doc2, { documentId: "new-doc" });
      
      vi.advanceTimersByTime((PLANNER_DRAFT_TTL_MS / 2) + 1000);
      
      const removed = cleanupExpiredPlannerDrafts();
      expect(removed).toBe(1); // Only doc1 should be removed
      expect(mockStorage.length).toBe(1);
    });
  });

  describe("loadOrCreatePlannerDraftDocument", () => {
    it("loads existing draft", () => {
      const doc = createPlannerDocument();
      savePlannerDraftDocument(doc, { documentId: "doc-1" });
      
      const result = loadOrCreatePlannerDraftDocument({ documentId: "doc-1" });
      expect(result.id).toBe(doc.id);
    });

    it("creates a new draft if not found", () => {
      const result = loadOrCreatePlannerDraftDocument({ documentId: "missing-doc" });
      expect(result.name).toBeDefined();
      expect(result.schemaVersion).toBe(1);
    });
  });
});

