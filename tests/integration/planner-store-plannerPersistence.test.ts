import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlannerDocument } from "@/features/planner/model";

const dbMocks = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/platform/drizzle/db", () => ({
  db: dbMocks,
}));

import {
  PlannerPersistenceError,
  planRowToDocument,
  planRowToAdminSummary,
  planRowToAdminDetail,
  savePlannerDocument,
  loadPlannerDocument,
  listPlannerDocuments,
  deletePlannerDocument,
  isPlannerDatabaseConfigured,
  listPlannerDocumentsAdmin,
  loadPlannerDocumentAdmin,
  patchPlannerDocumentAdmin,
  listPlannerAnalyticsRows,
} from "@/features/planner/store/plannerPersistence";

function makeThenable<T>(value: T) {
  const chain: Record<string, unknown> = {};
  const attach = () => {
    chain.set = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.values = vi.fn(() => chain);
    chain.from = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.offset = vi.fn(() => chain);
    chain.returning = vi.fn(async () => value);
    chain.then = (resolve: (v: T) => void) => Promise.resolve(value).then(resolve);
  };
  attach();
  return chain;
}

const userId = "550e8400-e29b-41d4-a716-446655440001";
const planId = "550e8400-e29b-41d4-a716-446655440099";
const document = createPlannerDocument({
  id: planId,
  name: "Persistence Plan",
  projectName: "HQ",
  clientName: "Acme",
  preparedBy: "Alex",
  itemCount: 3,
  sceneJson: { walls: [{ id: "w1" }] },
});

function makePlanRow(overrides: Record<string, unknown> = {}) {
  return {
    id: planId,
    userId,
    name: "Persistence Plan",
    engine: "oando",
    payload: document,
    thumbnailUrl: null,
    status: "draft",
    createdAt: new Date("2026-06-15T00:00:00.000Z"),
    updatedAt: new Date("2026-06-15T00:00:00.000Z"),
    ...overrides,
  };
}

describe("plannerPersistence", () => {
  beforeEach(() => {
    dbMocks.select.mockReset();
    dbMocks.insert.mockReset();
    dbMocks.update.mockReset();
    dbMocks.delete.mockReset();
    delete process.env.DATABASE_URL;
  });

  it("planRowToDocument merges row metadata onto payload", () => {
    const row = makePlanRow({
      name: "Row Title",
      thumbnailUrl: "thumb.png",
      status: "active",
    });
    const merged = planRowToDocument(row as never);
    expect(merged.title).toBe("Row Title");
    expect(merged.thumbnailUrl).toBe("thumb.png");
    expect(merged.status).toBe("active");
    expect(merged.projectName).toBe("HQ");
  });

  it("maps admin summary and detail projections", () => {
    const row = makePlanRow({ status: "active" });
    const summary = planRowToAdminSummary(row as never);
    expect(summary.project_name).toBe("HQ");
    const detail = planRowToAdminDetail(row as never);
    expect(detail.review_status).toBe("approved");
    expect(detail.scene_json).toEqual(document.sceneJson);

    const draftDetail = planRowToAdminDetail(makePlanRow({ status: "draft" }) as never);
    expect(draftDetail.review_status).toBe("pending");
  });

  it("saves new and existing documents", async () => {
    dbMocks.insert.mockReturnValue(makeThenable([makePlanRow()]));
    const created = await savePlannerDocument(userId, document);
    expect(created.success).toBe(true);

    dbMocks.update.mockReturnValue(makeThenable([makePlanRow({ name: "Updated" })]));
    const updated = await savePlannerDocument(userId, document, planId);
    expect(updated.success).toBe(true);
    if (updated.success) {
      expect(updated.document.title).toBe("Updated");
    }
  });

  it("returns SAVE_FAILED when persistence returns no row", async () => {
    dbMocks.insert.mockReturnValue(makeThenable([]));
    const result = await savePlannerDocument(userId, document);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("SAVE_FAILED");
    }
  });

  it("loads, lists, and deletes documents", async () => {
    dbMocks.select.mockReturnValue(makeThenable([makePlanRow()]));
    const loaded = await loadPlannerDocument(planId, userId);
    expect(loaded.success).toBe(true);

    const listed = await listPlannerDocuments(userId);
    expect(listed.success).toBe(true);
    if (listed.success) {
      expect(listed.documents).toHaveLength(1);
    }

    dbMocks.delete.mockReturnValue(makeThenable(undefined));
    const deleted = await deletePlannerDocument(planId);
    expect(deleted.success).toBe(true);
  });

  it("maps NOT_FOUND and generic load failures", async () => {
    dbMocks.select.mockReturnValue(makeThenable([]));
    const missing = await loadPlannerDocument("missing");
    expect(missing.success).toBe(false);
    if (!missing.success) {
      expect(missing.error.code).toBe("NOT_FOUND");
    }

    dbMocks.select.mockImplementation(() => {
      throw new Error("connection reset");
    });
    const failed = await loadPlannerDocument(planId);
    expect(failed.success).toBe(false);
    if (!failed.success) {
      expect(failed.error.code).toBe("LOAD_FAILED");
    }
  });

  it("supports admin list sort and filter permutations", async () => {
    dbMocks.select
      .mockReturnValueOnce(makeThenable([{ total: 1 }]))
      .mockReturnValueOnce(makeThenable([makePlanRow()]));

    const byStatus = await listPlannerDocumentsAdmin({ status: "active", sortBy: "status" });
    expect(byStatus.success).toBe(true);

    dbMocks.select
      .mockReturnValueOnce(makeThenable([{ total: 0 }]))
      .mockReturnValueOnce(makeThenable([]));
    const byUpdated = await listPlannerDocumentsAdmin({
      sortBy: "updated_at",
      sortOrder: "desc",
      search: "  ",
    });
    expect(byUpdated.success).toBe(true);
    if (byUpdated.success) {
      expect(byUpdated.plans).toHaveLength(0);
    }
  });

  it("reports database configuration and admin list filters", async () => {
    process.env.DATABASE_URL = " postgres://example ";
    expect(isPlannerDatabaseConfigured()).toBe(true);

    dbMocks.select
      .mockReturnValueOnce(makeThenable([{ total: 2 }]))
      .mockReturnValueOnce(makeThenable([makePlanRow(), makePlanRow({ id: "other" })]));

    const adminListed = await listPlannerDocumentsAdmin({
      page: 1,
      limit: 10,
      status: "draft",
      search: "HQ",
      sortBy: "title",
      sortOrder: "asc",
    });
    expect(adminListed.success).toBe(true);
    if (adminListed.success) {
      expect(adminListed.total).toBe(2);
      expect(adminListed.plans).toHaveLength(2);
    }
  });

  it("loads and patches admin documents", async () => {
    let patched = false;
    dbMocks.select.mockImplementation(() =>
      makeThenable([makePlanRow(patched ? { name: "Patched" } : {})]),
    );
    dbMocks.update.mockImplementation(() => {
      patched = true;
      return makeThenable([makePlanRow({ name: "Patched" })]);
    });

    const loaded = await loadPlannerDocumentAdmin(planId);
    expect(loaded.success).toBe(true);

    const result = await patchPlannerDocumentAdmin(planId, {
      title: "Patched",
      projectName: "New HQ",
      clientName: "Beta",
      preparedBy: "Sam",
      status: "active",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.row.name).toBe("Patched");
    }
  });

  it("maps delete failures and admin load misses", async () => {
    dbMocks.delete.mockImplementation(() => {
      throw new Error("delete failed");
    });
    const deleted = await deletePlannerDocument(planId);
    expect(deleted.success).toBe(false);
    if (!deleted.success) {
      expect(deleted.error.code).toBe("DELETE_FAILED");
    }

    dbMocks.select.mockReturnValue(makeThenable([]));
    const missing = await loadPlannerDocumentAdmin("missing");
    expect(missing.success).toBe(false);

    const patch = await patchPlannerDocumentAdmin("missing", { title: "Nope" });
    expect(patch.success).toBe(false);
  });

  it("loads documents with user scoping and maps generic save failures", async () => {
    dbMocks.select.mockReturnValue(makeThenable([makePlanRow()]));
    const scoped = await loadPlannerDocument(planId, userId);
    expect(scoped.success).toBe(true);

    dbMocks.update.mockImplementation(() => {
      throw "db down";
    });
    const failedUpdate = await savePlannerDocument(userId, document, planId);
    expect(failedUpdate.success).toBe(false);
    if (!failedUpdate.success) {
      expect(failedUpdate.error.code).toBe("SAVE_FAILED");
    }
  });

  it("maps list, admin, patch, and analytics failures", async () => {
    dbMocks.select.mockImplementation(() => {
      throw new Error("list down");
    });
    const listFailed = await listPlannerDocuments(userId);
    expect(listFailed.success).toBe(false);

    dbMocks.select
      .mockReturnValueOnce(makeThenable([{ total: 1 }]))
      .mockReturnValueOnce(makeThenable([makePlanRow()]));
    const adminListed = await listPlannerDocumentsAdmin({
      search: "HQ",
      sortBy: "created_at",
      sortOrder: "asc",
    });
    expect(adminListed.success).toBe(true);

    dbMocks.select.mockImplementation(() => {
      throw new Error("analytics down");
    });
    const analyticsFailed = await listPlannerAnalyticsRows(7);
    expect(analyticsFailed.success).toBe(false);

    dbMocks.select.mockReturnValue(makeThenable([makePlanRow()]));
    dbMocks.update.mockReturnValue(makeThenable([]));
    const patchFailed = await patchPlannerDocumentAdmin(planId, { title: "Broken" });
    expect(patchFailed.success).toBe(false);
  });

  it("lists admin documents without filters and maps string failures", async () => {
    dbMocks.select
      .mockReturnValueOnce(makeThenable([{ total: 1 }]))
      .mockReturnValueOnce(makeThenable([makePlanRow()]));
    const listed = await listPlannerDocumentsAdmin({});
    expect(listed.success).toBe(true);

    dbMocks.select.mockImplementation(() => {
      throw "admin list down";
    });
    const failed = await listPlannerDocumentsAdmin({ sortBy: "name", sortOrder: "asc" });
    expect(failed.success).toBe(false);
    if (!failed.success) {
      expect(failed.error.code).toBe("LIST_FAILED");
    }
  });

  it("maps admin load failures and missing post-patch rows", async () => {
    dbMocks.select.mockImplementation(() => {
      throw "admin load down";
    });
    const adminLoadFailed = await loadPlannerDocumentAdmin(planId);
    expect(adminLoadFailed.success).toBe(false);

    let patched = false;
    dbMocks.select.mockImplementation(() =>
      makeThenable([makePlanRow(patched ? { name: "Patched" } : {})]),
    );
    dbMocks.update.mockImplementation(() => {
      patched = true;
      return makeThenable([makePlanRow({ name: "Patched" })]);
    });
    dbMocks.select.mockImplementationOnce(() => makeThenable([makePlanRow()]));
    dbMocks.select.mockImplementationOnce(() => makeThenable([]));

    const patchMissingRow = await patchPlannerDocumentAdmin(planId, { title: "Patched" });
    expect(patchMissingRow.success).toBe(false);
  });

  it("lists analytics rows and wraps PlannerPersistenceError", async () => {
    dbMocks.select.mockReturnValue(makeThenable([makePlanRow()]));
    const analytics = await listPlannerAnalyticsRows(30);
    expect(analytics.success).toBe(true);
    if (analytics.success) {
      expect(analytics.rows[0]?.item_count).toBe(3);
    }

    const err = new PlannerPersistenceError("known", "LIST_FAILED");
    dbMocks.select.mockImplementation(() => {
      throw err;
    });
    const failed = await listPlannerDocuments(userId);
    expect(failed.success).toBe(false);
    if (!failed.success) {
      expect(failed.error).toBe(err);
    }
  });
});