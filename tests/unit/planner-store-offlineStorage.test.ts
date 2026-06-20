import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPlannerDocument } from "@/features/planner/model/plannerDocument";

const uuidQueue = [
  "plan-uuid-1",
  "sync-uuid-1",
  "sync-uuid-2",
  "sync-uuid-3",
  "sync-uuid-4",
  "sync-uuid-5",
  "sync-uuid-6",
];

vi.stubGlobal(
  "crypto",
  {
    randomUUID: vi.fn(() => uuidQueue.shift() ?? "fallback-uuid"),
  },
);

type StoreRecord = Record<string, unknown>;

interface MockIndex {
  keyPath: string;
  get: (key: IDBValidKey) => IDBRequest<StoreRecord | undefined>;
  getAll: (key?: IDBValidKey) => IDBRequest<StoreRecord[]>;
}

interface MockObjectStore {
  put: (value: StoreRecord) => IDBRequest<void>;
  add: (value: StoreRecord) => IDBRequest<void>;
  get: (key: IDBValidKey) => IDBRequest<StoreRecord | undefined>;
  delete: (key: IDBValidKey) => IDBRequest<void>;
  clear: () => IDBRequest<void>;
  getAll: () => IDBRequest<StoreRecord[]>;
  index: (name: string) => MockIndex;
}

function makeRequest<T>(result: T, shouldFail = false): IDBRequest<T> {
  const request = {
    result,
    error: shouldFail ? new DOMException("mock idb error") : null,
    onsuccess: null as ((event: Event) => void) | null,
    onerror: null as ((event: Event) => void) | null,
  } as IDBRequest<T>;

  queueMicrotask(() => {
    if (shouldFail) {
      request.onerror?.({ target: request } as Event);
      return;
    }
    request.onsuccess?.({ target: request } as Event);
  });

  return request;
}

function createMockIndexedDB() {
  const stores = new Map<string, Map<IDBValidKey, StoreRecord>>();
  const indexes = new Map<string, Map<string, string>>();
  let shouldFailOpen = false;
  let shouldFailTransactions = false;

  function getStoreData(storeName: string): Map<IDBValidKey, StoreRecord> {
    if (!stores.has(storeName)) {
      stores.set(storeName, new Map());
    }
    return stores.get(storeName)!;
  }

  function createObjectStore(storeName: string, _options?: { keyPath?: string }): {
    createIndex: (name: string, keyPath: string) => void;
  } {
    const key = `db:${storeName}`;
    indexes.set(key, new Map());
    getStoreData(storeName);
    return {
      createIndex(indexName: string, keyPath: string) {
        indexes.get(key)!.set(indexName, keyPath);
      },
    };
  }

  function buildObjectStore(storeName: string): MockObjectStore {
    const data = getStoreData(storeName);
    const indexDefs = indexes.get(`db:${storeName}`) ?? new Map<string, string>();

    return {
      put(value: StoreRecord) {
        const keyPath = "id";
        const key = value[keyPath] as IDBValidKey;
        data.set(key, structuredClone(value));
        return makeRequest<void>(undefined, shouldFailTransactions);
      },
      add(value: StoreRecord) {
        const key = value.id as IDBValidKey;
        data.set(key, structuredClone(value));
        return makeRequest<void>(undefined, shouldFailTransactions);
      },
      get(key: IDBValidKey) {
        return makeRequest<StoreRecord | undefined>(data.get(key), shouldFailTransactions);
      },
      delete(key: IDBValidKey) {
        data.delete(key);
        return makeRequest<void>(undefined, shouldFailTransactions);
      },
      clear() {
        data.clear();
        return makeRequest<void>(undefined, shouldFailTransactions);
      },
      getAll() {
        return makeRequest<StoreRecord[]>(Array.from(data.values()), shouldFailTransactions);
      },
      index(name: string) {
        const keyPath = indexDefs.get(name) ?? name;
        return {
          keyPath,
          get(key: IDBValidKey) {
            const match = Array.from(data.values()).find((record) => record[keyPath] === key);
            return makeRequest<StoreRecord | undefined>(match, shouldFailTransactions);
          },
          getAll(key?: IDBValidKey) {
            const values = Array.from(data.values());
            const filtered =
              key === undefined
                ? values
                : values.filter((record) => record[keyPath] === key);
            return makeRequest<StoreRecord[]>(filtered, shouldFailTransactions);
          },
        };
      },
    };
  }

  const api = {
    open(_name: string, _version: number) {
      const request = {
        result: null as IDBDatabase | null,
        error: null as DOMException | null,
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        onupgradeneeded: null as ((event: IDBVersionChangeEvent) => void) | null,
      };

      queueMicrotask(() => {
        if (shouldFailOpen) {
          request.error = new DOMException("open failed");
          request.onerror?.({ target: request } as Event);
          return;
        }

        const objectStoreNames = new Set<string>();
        const db = {
          objectStoreNames: {
            contains: (storeName: string) => objectStoreNames.has(storeName),
          },
          createObjectStore: (storeName: string, options?: { keyPath?: string }) => {
            objectStoreNames.add(storeName);
            return createObjectStore(storeName, options);
          },
          transaction: (storeName: string, _mode: IDBTransactionMode) => ({
            objectStore: () => buildObjectStore(storeName),
          }),
        } as unknown as IDBDatabase;

        request.result = db;
        request.onupgradeneeded?.({ target: request } as IDBVersionChangeEvent);
        request.onsuccess?.({ target: request } as Event);
      });

      return request as IDBOpenDBRequest;
    },
    __reset() {
      stores.clear();
      indexes.clear();
      shouldFailOpen = false;
      shouldFailTransactions = false;
    },
    __failOpen() {
      shouldFailOpen = true;
    },
    __failTransactions() {
      shouldFailTransactions = true;
    },
  };

  return api;
}

const mockIndexedDB = createMockIndexedDB();
vi.stubGlobal("indexedDB", mockIndexedDB);

import {
  OfflineStorageError,
  OfflineStorageManager,
  createOfflinePlan,
  deleteOfflinePlan,
  getSyncQueueOperation,
  markPlanAsSynced,
  offlineStorage,
  updateOfflinePlan,
} from "@/features/planner/store/offlineStorage";

const sampleDocument = createPlannerDocument({
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Offline Test Plan",
  sceneJson: { shapes: [] },
});

describe("offlineStorage helpers", () => {
  it("resolves sync queue operation from remote ids", () => {
    expect(getSyncQueueOperation(null, null)).toBe("create");
    expect(getSyncQueueOperation("remote-1", null)).toBe("update");
    expect(getSyncQueueOperation(null, "remote-1")).toBe("update");
    expect(getSyncQueueOperation("remote-2", "remote-1")).toBe("update");
  });

  it("creates OfflineStorageError with code and original error", () => {
    const original = new Error("boom");
    const error = new OfflineStorageError("failed", "TEST_CODE", original);
    expect(error.name).toBe("OfflineStorageError");
    expect(error.message).toBe("failed");
    expect(error.code).toBe("TEST_CODE");
    expect(error.originalError).toBe(original);
  });
});

describe("OfflineStorageManager", () => {
  let manager: OfflineStorageManager;

  beforeEach(async () => {
    mockIndexedDB.__reset();
    uuidQueue.splice(
      0,
      uuidQueue.length,
      "plan-uuid-1",
      "sync-uuid-1",
      "sync-uuid-2",
      "sync-uuid-3",
      "sync-uuid-4",
      "sync-uuid-5",
      "sync-uuid-6",
    );
    manager = new OfflineStorageManager();
    await manager.init();
  });

  it("reuses the init promise on repeated init calls", async () => {
    await expect(manager.init()).resolves.toBeUndefined();
  });

  it("saves, reads, lists, and deletes plans", async () => {
    const plan = {
      id: "plan-1",
      document: sampleDocument,
      localId: null,
      createdAt: "2026-06-15T00:00:00.000Z",
      updatedAt: "2026-06-15T00:00:00.000Z",
      lastSyncedAt: null,
      syncStatus: "pending" as const,
    };

    await manager.savePlan(plan);
    expect(await manager.getPlan("plan-1")).toEqual(plan);
    expect(await manager.listPlans()).toHaveLength(1);
    expect(await manager.listPendingPlans()).toHaveLength(1);

    plan.localId = "remote-1";
    plan.syncStatus = "synced";
    await manager.savePlan(plan);
    expect(await manager.getPlanByLocalId("remote-1")).toEqual(plan);

    await manager.deletePlan("plan-1");
    expect(await manager.getPlan("plan-1")).toBeUndefined();
  });

  it("manages sync queue items", async () => {
    const item = {
      id: "queue-1",
      operation: "create" as const,
      planId: "plan-1",
      remoteId: null,
      document: sampleDocument,
      createdAt: "2026-06-15T00:00:00.000Z",
      retryCount: 0,
      lastAttempt: null,
      error: null,
    };

    await manager.addToSyncQueue(item);
    expect(await manager.getSyncQueueItem("queue-1")).toEqual(item);
    expect(await manager.listSyncQueue()).toHaveLength(1);
    expect(await manager.listSyncQueueForPlan("plan-1")).toHaveLength(1);

    const updated = { ...item, retryCount: 1, error: "retry me" };
    await manager.updateSyncQueueItem(updated);
    expect(await manager.getSyncQueueItem("queue-1")).toEqual(updated);

    await manager.removeSyncQueueItem("queue-1");
    expect(await manager.listSyncQueue()).toHaveLength(0);
  });

  it("clears all stores", async () => {
    await manager.savePlan({
      id: "plan-1",
      document: sampleDocument,
      localId: null,
      createdAt: "2026-06-15T00:00:00.000Z",
      updatedAt: "2026-06-15T00:00:00.000Z",
      lastSyncedAt: null,
      syncStatus: "pending",
    });
    await manager.addToSyncQueue({
      id: "queue-1",
      operation: "create",
      planId: "plan-1",
      remoteId: null,
      document: sampleDocument,
      createdAt: "2026-06-15T00:00:00.000Z",
      retryCount: 0,
      lastAttempt: null,
      error: null,
    });

    await manager.clearAll();
    expect(await manager.listPlans()).toEqual([]);
    expect(await manager.listSyncQueue()).toEqual([]);
  });

  it("throws when opening the database fails", async () => {
    mockIndexedDB.__failOpen();
    const failingManager = new OfflineStorageManager();
    await expect(failingManager.init()).rejects.toMatchObject({
      code: "DB_OPEN_FAILED",
    });
  });

  it("throws when a transaction fails", async () => {
    mockIndexedDB.__failTransactions();
    await expect(
      manager.savePlan({
        id: "plan-1",
        document: sampleDocument,
        localId: null,
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:00:00.000Z",
        lastSyncedAt: null,
        syncStatus: "pending",
      }),
    ).rejects.toMatchObject({ code: "TRANSACTION_FAILED" });
  });

  it("throws when the database handle is missing after init", async () => {
    await manager.init();
    (manager as unknown as { db: IDBDatabase | null }).db = null;
    await expect(manager.getPlan("missing")).rejects.toMatchObject({
      code: "DB_NOT_INITIALIZED",
    });
  });

  it("throws when listing sync queue operations fail", async () => {
    mockIndexedDB.__failTransactions();
    await expect(manager.listSyncQueue()).rejects.toMatchObject({
      code: "LIST_QUEUE_FAILED",
    });
    await expect(manager.listSyncQueueForPlan("plan-1")).rejects.toMatchObject({
      code: "LIST_QUEUE_FOR_PLAN_FAILED",
    });
  });
});

describe("offlineStorage singleton workflows", () => {
  beforeEach(async () => {
    mockIndexedDB.__reset();
    uuidQueue.splice(
      0,
      uuidQueue.length,
      "plan-uuid-1",
      "sync-uuid-1",
      "sync-uuid-2",
      "sync-uuid-3",
      "sync-uuid-4",
      "sync-uuid-5",
      "sync-uuid-6",
    );
    await offlineStorage.clearAll();
  });

  afterEach(async () => {
    await offlineStorage.clearAll();
  });

  it("creates an offline plan and enqueues a create operation", async () => {
    const plan = await createOfflinePlan(sampleDocument);

    expect(plan.id).toBe("plan-uuid-1");
    expect(plan.syncStatus).toBe("pending");
    expect(await offlineStorage.getPlan(plan.id)).toMatchObject({ id: "plan-uuid-1" });

    const queue = await offlineStorage.listSyncQueueForPlan(plan.id);
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ operation: "create", planId: "plan-uuid-1" });
  });

  it("updates an offline plan and enqueues update operations", async () => {
    const created = await createOfflinePlan(sampleDocument);
    const updatedDoc = createPlannerDocument({
      id: sampleDocument.id,
      name: "Updated Plan",
      sceneJson: { shapes: [{ id: "shape-1" }] },
    });

    const updated = await updateOfflinePlan(created.id, updatedDoc, "remote-123");
    expect(updated.localId).toBe("remote-123");
    expect(updated.document.name).toBe("Updated Plan");

    const queue = await offlineStorage.listSyncQueueForPlan(created.id);
    expect(queue.some((item) => item.operation === "update")).toBe(true);
  });

  it("marks a plan as synced and clears its queue", async () => {
    const created = await createOfflinePlan(sampleDocument);
    await markPlanAsSynced(created.id, "remote-999");

    const stored = await offlineStorage.getPlan(created.id);
    expect(stored?.syncStatus).toBe("synced");
    expect(stored?.localId).toBe("remote-999");
    expect(await offlineStorage.listSyncQueueForPlan(created.id)).toEqual([]);
  });

  it("deletes synced plans with a delete queue item and removes local data", async () => {
    const created = await createOfflinePlan(sampleDocument);
    await markPlanAsSynced(created.id, "remote-del");

    await deleteOfflinePlan(created.id);
    expect(await offlineStorage.getPlan(created.id)).toBeUndefined();

    const queue = await offlineStorage.listSyncQueue();
    expect(queue.some((item) => item.operation === "delete")).toBe(true);
  });

  it("deletes unsynced plans without enqueueing delete", async () => {
    const created = await createOfflinePlan(sampleDocument);
    await deleteOfflinePlan(created.id);

    expect(await offlineStorage.getPlan(created.id)).toBeUndefined();
    const queue = await offlineStorage.listSyncQueue();
    expect(queue.some((item) => item.operation === "delete")).toBe(false);
    expect(queue.some((item) => item.operation === "create")).toBe(true);
  });

  it("throws when updating, syncing, or deleting missing plans", async () => {
    await expect(updateOfflinePlan("missing", sampleDocument)).rejects.toMatchObject({
      code: "PLAN_NOT_FOUND",
    });
    await expect(markPlanAsSynced("missing", "remote-1")).rejects.toMatchObject({
      code: "PLAN_NOT_FOUND",
    });
    await expect(deleteOfflinePlan("missing")).rejects.toMatchObject({
      code: "PLAN_NOT_FOUND",
    });
  });
});