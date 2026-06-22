import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  offlineStorage,
  createOfflinePlan,
  updateOfflinePlan,
  markPlanAsSynced,
  deleteOfflinePlan,
  OfflineStorageError,
} from "@/features/planner/store/offlineStorage";
import { createPlannerDocument } from "@/features/planner/model/plannerDocument";

// Minimal IndexedDB Mock
class MockIDBRequest {
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
  result: unknown = null;
  error: unknown = null;

  triggerSuccess(res?: unknown) {
    this.result = res;
    if (this.onsuccess) this.onsuccess();
  }

  triggerError(err?: unknown) {
    this.error = err;
    if (this.onerror) this.onerror();
  }
}

class MockIDBOpenDBRequest extends MockIDBRequest {
  onupgradeneeded: ((event: unknown) => void) | null = null;
}

class MockIDBIndex {
  name: string;
  keyPath: string;
  store: MockIDBObjectStore;

  constructor(name: string, keyPath: string, store: MockIDBObjectStore) {
    this.name = name;
    this.keyPath = keyPath;
    this.store = store;
  }

  get(key: unknown) {
    const request = new MockIDBRequest();
    setTimeout(() => {
      const match = Array.from(this.store.data.values()).find(
        (val: unknown) => {
          if (val && typeof val === "object" && this.keyPath in val) {
            return (val as Record<string, unknown>)[this.keyPath] === key;
          }
          return false;
        }
      );
      request.triggerSuccess(match);
    }, 0);
    return request;
  }

  getAll(key?: unknown) {
    const request = new MockIDBRequest();
    setTimeout(() => {
      const all = Array.from(this.store.data.values());
      const match = key ? all.filter((val: unknown) => {
        if (val && typeof val === "object" && this.keyPath in val) {
          return (val as Record<string, unknown>)[this.keyPath] === key;
        }
        return false;
      }) : all;
      request.triggerSuccess(match);
    }, 0);
    return request;
  }
}

class MockIDBObjectStore {
  name: string;
  data = new Map<unknown, unknown>();
  keyPath: string;
  indexes = new Map<string, MockIDBIndex>();

  constructor(name: string, keyPath: string) {
    this.name = name;
    this.keyPath = keyPath;
  }

  createIndex(name: string, keyPath: string) {
    const index = new MockIDBIndex(name, keyPath, this);
    this.indexes.set(name, index);
    return index;
  }

  index(name: string) {
    const idx = this.indexes.get(name);
    if (!idx) throw new Error("Index not found");
    return idx;
  }

  put(value: unknown) {
    const request = new MockIDBRequest();
    setTimeout(() => {
      if (value && typeof value === "object" && this.keyPath in value) {
        const key = (value as Record<string, unknown>)[this.keyPath];
        this.data.set(key, value);
        request.triggerSuccess(key);
      }
    }, 0);
    return request;
  }

  add(value: unknown) {
    const request = new MockIDBRequest();
    setTimeout(() => {
      if (value && typeof value === "object" && this.keyPath in value) {
        const key = (value as Record<string, unknown>)[this.keyPath];
        this.data.set(key, value);
        request.triggerSuccess(key);
      }
    }, 0);
    return request;
  }

  get(key: unknown) {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request.triggerSuccess(this.data.get(key));
    }, 0);
    return request;
  }

  getAll() {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request.triggerSuccess(Array.from(this.data.values()));
    }, 0);
    return request;
  }

  delete(key: unknown) {
    const request = new MockIDBRequest();
    setTimeout(() => {
      this.data.delete(key);
      request.triggerSuccess();
    }, 0);
    return request;
  }

  clear() {
    const request = new MockIDBRequest();
    setTimeout(() => {
      this.data.clear();
      request.triggerSuccess();
    }, 0);
    return request;
  }
}

class MockIDBTransaction {
  storeNames: string[];
  mode: string;
  db: MockIDBDatabase;

  constructor(storeNames: string | string[], mode: string, db: MockIDBDatabase) {
    this.storeNames = Array.isArray(storeNames) ? storeNames : [storeNames];
    this.mode = mode;
    this.db = db;
  }

  objectStore(name: string) {
    const store = this.db.stores.get(name);
    if (!store) throw new Error("Store not found");
    return store;
  }
}

class MockIDBDatabase {
  stores = new Map<string, MockIDBObjectStore>();

  get objectStoreNames() {
    return {
      contains: (name: string) => this.stores.has(name),
    };
  }

  createObjectStore(name: string, options: { keyPath: string }) {
    const store = new MockIDBObjectStore(name, options.keyPath);
    this.stores.set(name, store);
    return store;
  }

  transaction(storeNames: string | string[], mode: string) {
    return new MockIDBTransaction(storeNames, mode, this);
  }
}

const mockIndexedDB = {
  open: vi.fn((_name: string, _version: number) => {
    const request = new MockIDBOpenDBRequest();
    setTimeout(() => {
      const db = new MockIDBDatabase();
      request.result = db;
      if (request.onupgradeneeded) {
        request.onupgradeneeded({ target: request } as unknown);
      }
      request.triggerSuccess(db);
    }, 0);
    return request;
  }),
};

describe("offlineStorage", () => {
  beforeEach(async () => {
    vi.stubGlobal("indexedDB", mockIndexedDB);
    // Reset instance state hack by clearing db
    const os = offlineStorage as unknown as { db: unknown; initPromise: unknown };
    os.db = null;
    os.initPromise = null;
    await offlineStorage.init();
    await offlineStorage.clearAll();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("createOfflinePlan", () => {
    it("creates a plan and adds it to sync queue", async () => {
      const doc = createPlannerDocument();
      const plan = await createOfflinePlan(doc);

      expect(plan.id).toBeDefined();
      expect(plan.document.id).toBe(doc.id);
      expect(plan.syncStatus).toBe("pending");

      const savedPlan = await offlineStorage.getPlan(plan.id);
      expect(savedPlan).not.toBeNull();
      expect(savedPlan?.id).toBe(plan.id);

      const queue = await offlineStorage.listSyncQueueForPlan(plan.id);
      expect(queue.length).toBe(1);
      expect(queue[0]?.operation).toBe("create");
    });
  });

  describe("updateOfflinePlan", () => {
    it("updates an existing plan", async () => {
      const doc = createPlannerDocument();
      const plan = await createOfflinePlan(doc);

      const updatedDoc = { ...doc, roomDepthMm: 10000 };
      const updatedPlan = await updateOfflinePlan(plan.id, updatedDoc);

      expect(updatedPlan.document.roomDepthMm).toBe(10000);
      expect(updatedPlan.syncStatus).toBe("pending");

      const queue = await offlineStorage.listSyncQueueForPlan(plan.id);
      expect(queue.length).toBe(2); // 1 create, 1 update
      expect(queue[1]?.operation).toBe("create"); // Since localId is null, it stays 'create' as per getSyncQueueOperation logic
    });

    it("throws if plan not found", async () => {
      const doc = createPlannerDocument();
      await expect(updateOfflinePlan("missing", doc)).rejects.toThrow(OfflineStorageError);
    });
  });

  describe("markPlanAsSynced", () => {
    it("updates status and clears queue for plan", async () => {
      const doc = createPlannerDocument();
      const plan = await createOfflinePlan(doc);

      await markPlanAsSynced(plan.id, "remote-123");

      const syncedPlan = await offlineStorage.getPlan(plan.id);
      expect(syncedPlan?.localId).toBe("remote-123");
      expect(syncedPlan?.syncStatus).toBe("synced");

      const queue = await offlineStorage.listSyncQueueForPlan(plan.id);
      expect(queue.length).toBe(0);
    });

    it("throws if plan not found", async () => {
      await expect(markPlanAsSynced("missing", "remote-123")).rejects.toThrow(OfflineStorageError);
    });
  });

  describe("deleteOfflinePlan", () => {
    it("deletes locally if not synced yet", async () => {
      const doc = createPlannerDocument();
      const plan = await createOfflinePlan(doc);

      await deleteOfflinePlan(plan.id);

      const deletedPlan = await offlineStorage.getPlan(plan.id);
      expect(deletedPlan).toBeNull();
      
      const queue = await offlineStorage.listSyncQueueForPlan(plan.id);
      // Wait, delete does not add to queue if localId is missing.
      // And the previous queue item isn't automatically removed by deleteOfflinePlan.
      expect(queue.length).toBe(1); // the create item remains unless manually cleared.
    });

    it("adds delete to queue if synced", async () => {
      const doc = createPlannerDocument();
      const plan = await createOfflinePlan(doc);
      await markPlanAsSynced(plan.id, "remote-123");

      await deleteOfflinePlan(plan.id);

      const deletedPlan = await offlineStorage.getPlan(plan.id);
      expect(deletedPlan).toBeNull();

      const queue = await offlineStorage.listSyncQueueForPlan(plan.id);
      expect(queue.length).toBe(1);
      expect(queue[0]?.operation).toBe("delete");
    });

    it("throws if plan not found", async () => {
      await expect(deleteOfflinePlan("missing")).rejects.toThrow(OfflineStorageError);
    });
  });

  describe("offlineStorageManager", () => {
    it("can list plans", async () => {
      const doc1 = createPlannerDocument();
      const doc2 = createPlannerDocument();
      await createOfflinePlan(doc1);
      await createOfflinePlan(doc2);

      const list = await offlineStorage.listPlans();
      expect(list.length).toBe(2);
    });

    it("can list pending plans", async () => {
      const doc1 = createPlannerDocument();
      const doc2 = createPlannerDocument();
      const plan1 = await createOfflinePlan(doc1);
      await createOfflinePlan(doc2);

      await markPlanAsSynced(plan1.id, "remote-1");

      const pending = await offlineStorage.listPendingPlans();
      expect(pending.length).toBe(1);
    });

    it("can get plan by local id", async () => {
      const doc = createPlannerDocument();
      const plan = await createOfflinePlan(doc);
      await markPlanAsSynced(plan.id, "remote-123");

      const fetched = await offlineStorage.getPlanByLocalId("remote-123");
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(plan.id);
    });
  });
});

