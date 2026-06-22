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

import * as plannerPersistenceMod from "@/features/planner/store/plannerPersistence";

describe("plannerSaves repository wrappers", () => {
  beforeEach(() => {
    vi.spyOn(plannerPersistenceMod, "savePlannerDocument").mockImplementation(vi.fn());
    vi.spyOn(plannerPersistenceMod, "loadPlannerDocument").mockImplementation(vi.fn());
    vi.spyOn(plannerPersistenceMod, "listPlannerDocuments").mockImplementation(vi.fn());
    vi.spyOn(plannerPersistenceMod, "deletePlannerDocument").mockImplementation(vi.fn());
  });

  it("requires userId when saving", async () => {
    await expect(savePlannerDocumentToStore(document)).rejects.toThrow(/userId/);
  });

  it("saves and surfaces persistence failures", async () => {
    vi.spyOn(plannerPersistenceMod, "savePlannerDocument").mockResolvedValue({
      success: true,
      id: "00000000-0000-4000-8000-000000000006",
      document,
    });
    const saved = await savePlannerDocumentToStore(document, { userId: "00000000-0000-4000-8000-000000000002", saveId: "00000000-0000-4000-8000-000000000006" });
    expect(saved.name).toBe("Cloud Plan");

    vi.spyOn(plannerPersistenceMod, "savePlannerDocument").mockResolvedValue({
      success: false,
      error: new Error("boom") as never,
    });
    await expect(savePlannerDocumentToStore(document, { userId: "00000000-0000-4000-8000-000000000002" })).rejects.toThrow();
  });

  it("loads documents and maps NOT_FOUND to null", async () => {
    vi.spyOn(plannerPersistenceMod, "loadPlannerDocument").mockResolvedValue({
      success: true,
      document,
    });
    await expect(loadPlannerDocumentFromStore("00000000-0000-4000-8000-000000000006", "00000000-0000-4000-8000-000000000002")).resolves.toEqual(document);

    vi.spyOn(plannerPersistenceMod, "loadPlannerDocument").mockResolvedValue({
      success: false,
      error: { code: "NOT_FOUND", message: "missing" } as never,
    });
    await expect(loadPlannerDocumentFromStore("missing")).resolves.toBeNull();

    vi.spyOn(plannerPersistenceMod, "loadPlannerDocument").mockResolvedValue({
      success: false,
      error: { code: "LOAD_FAILED", message: "db down" } as never,
    });
    await expect(loadPlannerDocumentFromStore("00000000-0000-4000-8000-000000000006")).rejects.toThrow(/db down/);
  });

  it("lists summaries and returns empty without userId", async () => {
    await expect(listPlannerDocumentsFromStore({})).resolves.toEqual([]);

    vi.spyOn(plannerPersistenceMod, "listPlannerDocuments").mockResolvedValue({
      success: true,
      documents: [{ id: "00000000-0000-4000-8000-000000000006", document }],
    });
    const rows = await listPlannerDocumentsFromStore({ ownerUserId: "00000000-0000-4000-8000-000000000002" });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Cloud Plan");
    expect(rows[0]?.item_count).toBe(2);
  });

  it("deletes documents via persistence", async () => {
    vi.spyOn(plannerPersistenceMod, "deletePlannerDocument").mockResolvedValue({ success: true });
    await expect(deletePlannerDocumentFromStore("00000000-0000-4000-8000-000000000006")).resolves.toBe(true);
  });

  it("exposes backwards-compatible Supabase aliases", async () => {
    vi.spyOn(plannerPersistenceMod, "savePlannerDocument").mockResolvedValue({ success: true, id: "00000000-0000-4000-8000-000000000006", document } as never);
    vi.spyOn(plannerPersistenceMod, "loadPlannerDocument").mockResolvedValue({ success: true, document } as never);
    vi.spyOn(plannerPersistenceMod, "listPlannerDocuments").mockResolvedValue({ success: true, documents: [{ id: "00000000-0000-4000-8000-000000000006", document }] } as never);
    vi.spyOn(plannerPersistenceMod, "deletePlannerDocument").mockResolvedValue({ success: true } as never);

    await savePlannerDocumentToSupabase(document, { userId: "00000000-0000-4000-8000-000000000002" });
    await loadPlannerDocumentFromSupabase("00000000-0000-4000-8000-000000000006");
    await listPlannerDocumentsFromSupabase({ userId: "00000000-0000-4000-8000-000000000002" });
    await deletePlannerDocumentFromSupabase("00000000-0000-4000-8000-000000000006");
    expect(plannerPersistenceMod.savePlannerDocument).toHaveBeenCalled();
  });
});