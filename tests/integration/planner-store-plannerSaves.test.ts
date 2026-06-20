import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlannerDocument } from "@/features/planner/model";
import {
  savePlannerDocumentToStore,
  loadPlannerDocumentFromStore,
  listPlannerDocumentsFromStore,
  deletePlannerDocumentFromStore,
  savePlannerDocumentToSupabase,
  loadPlannerDocumentFromSupabase,
  listPlannerDocumentsFromSupabase,
  deletePlannerDocumentFromSupabase,
} from "@/features/planner/store/plannerSaves";

const document = createPlannerDocument({ name: "Cloud Plan", itemCount: 2 });

vi.mock("@/features/planner/store/plannerPersistence", () => ({
  savePlannerDocument: vi.fn(),
  loadPlannerDocument: vi.fn(),
  listPlannerDocuments: vi.fn(),
  deletePlannerDocument: vi.fn(),
}));

import {
  savePlannerDocument,
  loadPlannerDocument,
  listPlannerDocuments,
  deletePlannerDocument,
} from "@/features/planner/store/plannerPersistence";

describe("plannerSaves repository wrappers", () => {
  beforeEach(() => {
    vi.mocked(savePlannerDocument).mockReset();
    vi.mocked(loadPlannerDocument).mockReset();
    vi.mocked(listPlannerDocuments).mockReset();
    vi.mocked(deletePlannerDocument).mockReset();
  });

  it("requires userId when saving", async () => {
    await expect(savePlannerDocumentToStore(document)).rejects.toThrow(/userId/);
  });

  it("saves and surfaces persistence failures", async () => {
    vi.mocked(savePlannerDocument).mockResolvedValue({
      success: true,
      id: "save-1",
      document,
    });
    const saved = await savePlannerDocumentToStore(document, { userId: "user-1", saveId: "save-1" });
    expect(saved.name).toBe("Cloud Plan");

    vi.mocked(savePlannerDocument).mockResolvedValue({
      success: false,
      error: new Error("boom") as never,
    });
    await expect(savePlannerDocumentToStore(document, { userId: "user-1" })).rejects.toThrow();
  });

  it("loads documents and maps NOT_FOUND to null", async () => {
    vi.mocked(loadPlannerDocument).mockResolvedValue({
      success: true,
      document,
    });
    await expect(loadPlannerDocumentFromStore("save-1", "user-1")).resolves.toEqual(document);

    vi.mocked(loadPlannerDocument).mockResolvedValue({
      success: false,
      error: { code: "NOT_FOUND", message: "missing" } as never,
    });
    await expect(loadPlannerDocumentFromStore("missing")).resolves.toBeNull();

    vi.mocked(loadPlannerDocument).mockResolvedValue({
      success: false,
      error: { code: "LOAD_FAILED", message: "db down" } as never,
    });
    await expect(loadPlannerDocumentFromStore("save-1")).rejects.toThrow(/db down/);
  });

  it("lists summaries and returns empty without userId", async () => {
    await expect(listPlannerDocumentsFromStore({})).resolves.toEqual([]);

    vi.mocked(listPlannerDocuments).mockResolvedValue({
      success: true,
      documents: [{ id: "save-1", document }],
    });
    const rows = await listPlannerDocumentsFromStore({ ownerUserId: "user-1" });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Cloud Plan");
    expect(rows[0]?.item_count).toBe(2);
  });

  it("deletes documents via persistence", async () => {
    vi.mocked(deletePlannerDocument).mockResolvedValue({ success: true });
    await expect(deletePlannerDocumentFromStore("save-1")).resolves.toBe(true);
  });

  it("exposes backwards-compatible Supabase aliases", async () => {
    vi.mocked(savePlannerDocument).mockResolvedValue({ success: true, id: "save-1", document });
    vi.mocked(loadPlannerDocument).mockResolvedValue({ success: true, document });
    vi.mocked(listPlannerDocuments).mockResolvedValue({ success: true, documents: [{ id: "save-1", document }] });
    vi.mocked(deletePlannerDocument).mockResolvedValue({ success: true });

    await savePlannerDocumentToSupabase(document, { userId: "user-1" });
    await loadPlannerDocumentFromSupabase("save-1");
    await listPlannerDocumentsFromSupabase({ userId: "user-1" });
    await deletePlannerDocumentFromSupabase("save-1");
    expect(savePlannerDocument).toHaveBeenCalled();
  });
});