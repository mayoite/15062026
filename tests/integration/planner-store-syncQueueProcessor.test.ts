import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlannerDocument } from "@/features/planner/model";

import * as offlineStorageModule from "@/features/planner/store/offlineStorage";
import {
  SyncQueueProcessor,
  useSyncQueueProcessor,
} from "@/features/planner/store/syncQueueProcessor";

const userId = "550e8400-e29b-41d4-a716-446655440001";
const document = createPlannerDocument({ name: "Offline Plan" });

function makeQueueItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "sync-1",
    planId: "local-1",
    operation: "create" as const,
    document,
    remoteId: null,
    retryCount: 0,
    lastAttempt: null,
    createdAt: "2026-06-15T00:00:00.000Z",
    error: null,
    ...overrides,
  };
}

describe("syncQueueProcessor", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(offlineStorageModule.offlineStorage, "listSyncQueue").mockResolvedValue([]);
    vi.spyOn(offlineStorageModule.offlineStorage, "removeSyncQueueItem").mockResolvedValue(undefined);
    vi.spyOn(offlineStorageModule.offlineStorage, "updateSyncQueueItem").mockResolvedValue(undefined);
    vi.spyOn(offlineStorageModule.offlineStorage, "listPlans").mockResolvedValue([]);
    vi.spyOn(offlineStorageModule.offlineStorage, "listPendingPlans").mockResolvedValue([]);
    vi.spyOn(offlineStorageModule.offlineStorage, "deletePlan").mockResolvedValue(undefined);
    vi.spyOn(offlineStorageModule, "markPlanAsSynced").mockResolvedValue(undefined);
    
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "remote-1" }),
      text: async () => "",
    }) as unknown as typeof fetch;
  });

  it("rejects concurrent sync and missing userId", async () => {
    const processor = new SyncQueueProcessor({ userId });
    vi.mocked(offlineStorageModule.offlineStorage.listSyncQueue).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([]), 50);
        }),
    );
    const first = processor.processSyncQueue();
    const second = await processor.processSyncQueue();
    expect(second.success).toBe(false);
    await first;

    const missingUser = new SyncQueueProcessor({ userId: "" });
    const result = await missingUser.processSyncQueue();
    expect(result.errors[0]?.error).toMatch(/userId required/);
  });

  it("processes create, update, and delete queue items", async () => {
    const onSyncProgress = vi.fn();
    const onSyncComplete = vi.fn();
    const processor = new SyncQueueProcessor({ userId, onSyncProgress, onSyncComplete });

    vi.mocked(offlineStorageModule.offlineStorage.listSyncQueue).mockResolvedValue([
      makeQueueItem({ id: "create-1", operation: "create" }),
      makeQueueItem({
        id: "update-1",
        operation: "update",
        remoteId: "remote-1",
        lastAttempt: new Date().toISOString(),
      }),
      makeQueueItem({ id: "delete-1", operation: "delete", remoteId: "remote-2", document: undefined }),
    ]);

    const result = await processor.processSyncQueue();
    expect(result.success).toBe(true);
    expect(result.processed).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.errors[0]?.itemId).toBe("update-1");
    expect(onSyncProgress).toHaveBeenCalled();
    expect(onSyncComplete).toHaveBeenCalled();
    expect(offlineStorageModule.markPlanAsSynced).toHaveBeenCalled();
    expect(offlineStorageModule.offlineStorage.deletePlan).toHaveBeenCalledWith("local-1");
  });

  it("reports sync status and manages failed items", async () => {
    const processor = new SyncQueueProcessor({ userId });
    vi.mocked(offlineStorageModule.offlineStorage.listSyncQueue).mockResolvedValue([
      makeQueueItem({ retryCount: 3 }),
      makeQueueItem({ id: "sync-2", retryCount: 1 }),
    ]);
    vi.mocked(offlineStorageModule.offlineStorage.listPlans).mockResolvedValue([{ id: "p1" } as never]);
    vi.mocked(offlineStorageModule.offlineStorage.listPendingPlans).mockResolvedValue([{ id: "p2" } as never]);

    const status = await processor.getSyncStatus();
    expect(status.pendingItems).toBe(2);
    expect(status.failedItems).toBe(1);
    expect(status.totalPlans).toBe(1);
    expect(status.pendingPlans).toBe(1);

    const cleared = await processor.clearFailedItems();
    expect(cleared).toBe(1);

    await processor.retryFailedItems();
    expect(offlineStorageModule.offlineStorage.updateSyncQueueItem).toHaveBeenCalledWith(
      expect.objectContaining({ retryCount: 0, lastAttempt: null, error: null }),
    );
  });

  it("exposes hook helpers", async () => {
    const hook = useSyncQueueProcessor({ userId });
    await expect(hook.getSyncStatus()).resolves.toEqual(
      expect.objectContaining({ pendingItems: 0, failedItems: 0 }),
    );
  });

  it("fails items that exceed retry count or use unknown operations", async () => {
    const processor = new SyncQueueProcessor({ userId });
    vi.mocked(offlineStorageModule.offlineStorage.listSyncQueue).mockResolvedValue([
      makeQueueItem({ id: "retry-max", retryCount: 3 }),
      makeQueueItem({ id: "unknown", operation: "rename" as "create" }),
      makeQueueItem({ id: "missing-doc", operation: "create", document: undefined }),
    ]);

    const result = await processor.processSyncQueue();
    expect(result.failed).toBe(3);
    expect(offlineStorageModule.offlineStorage.updateSyncQueueItem).toHaveBeenCalled();
  });

  it("surfaces persistence failures for create, update, and delete operations", async () => {
    const processor = new SyncQueueProcessor({ userId });
    vi.mocked(offlineStorageModule.offlineStorage.listSyncQueue).mockResolvedValue([
      makeQueueItem({ id: "save-fail", operation: "create" }),
      makeQueueItem({ id: "update-missing-remote", operation: "update", document }),
      makeQueueItem({ id: "delete-missing-remote", operation: "delete", document: undefined, remoteId: null }),
    ]);
    
    let fetchCount = 0;
    vi.mocked(globalThis.fetch).mockImplementation(async () => {
      fetchCount++;
      if (fetchCount === 1) {
        return { ok: false, status: 500, text: async () => "save failed" } as unknown as Response;
      }
      return { ok: true, json: async () => ({ id: "remote-1" }), text: async () => "" } as unknown as Response;
    });

    const result = await processor.processSyncQueue();
    expect(result.failed).toBe(3);
    expect(result.errors.map((entry) => entry.itemId)).toEqual(
      expect.arrayContaining(["save-fail", "update-missing-remote", "delete-missing-remote"]),
    );
  });

  it("returns success for an empty sync queue", async () => {
    const processor = new SyncQueueProcessor({ userId });
    const result = await processor.processSyncQueue();
    expect(result).toEqual({
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    });
  });

  it("maps non-error failures during item and top-level processing", async () => {
    const processor = new SyncQueueProcessor({ userId });
    vi.mocked(offlineStorageModule.offlineStorage.listSyncQueue).mockResolvedValue([
      makeQueueItem({
        id: "update-fail",
        operation: "update",
        remoteId: "remote-1",
        lastAttempt: null,
      }),
    ]);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false, status: 500, text: async () => "update failed"
    } as unknown as Response);

    const itemResult = await processor.processSyncQueue();
    expect(itemResult.failed).toBe(1);
    expect(itemResult.errors[0]?.error).toMatch(/Update failed.*update failed/);

    vi.mocked(offlineStorageModule.offlineStorage.listSyncQueue).mockResolvedValue([
      makeQueueItem({ id: "create-ok", operation: "create" }),
    ]);
    vi.mocked(offlineStorageModule.offlineStorage.removeSyncQueueItem).mockRejectedValueOnce(
      "remove failed",
    );
    const unknownItem = await processor.processSyncQueue();
    expect(unknownItem.errors[0]?.error).toBe("Unknown error");

    vi.mocked(offlineStorageModule.offlineStorage.listSyncQueue).mockRejectedValue("idb down");
    const topLevel = await processor.processSyncQueue();
    expect(topLevel.errors[0]?.error).toBe("Unknown sync error");
  });

  it("handles top-level sync failures", async () => {
    const onSyncError = vi.fn();
    const processor = new SyncQueueProcessor({ userId, onSyncError });
    vi.mocked(offlineStorageModule.offlineStorage.listSyncQueue).mockRejectedValue(
      new Error("idb unavailable"),
    );
    const result = await processor.processSyncQueue();
    expect(result.success).toBe(false);
    expect(onSyncError).toHaveBeenCalledWith("idb unavailable");
  });
});