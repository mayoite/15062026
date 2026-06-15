/**
 * Offline Storage - IndexedDB wrapper for planner offline plan store and sync queue
 * Provides robust offline storage with automatic sync when connectivity returns.
 *
 * Part of Phase 2/4 persistence documentation (local vs Supabase-backed plans).
 *
 * - Stores OfflinePlan (wrapping canonical PlannerDocument from model/).
 * - SyncQueueItem for create/update/delete ops with retry.
 * - Used alongside plannerPersistence.ts (Supabase) for local-first experience.
 *
 * See plannerPersistence.ts, syncQueueProcessor.ts, model/plannerDocument.ts.
 */

import type { PlannerDocument } from "@/features/planner/model/plannerDocument";
import { validatePlannerDocument } from "@/features/planner/model/plannerDocument";

// Database configuration
const DB_NAME = "planner-offline-db";
const DB_VERSION = 1;
const STORE_PLANS = "plans";
const STORE_SYNC_QUEUE = "sync_queue";

// Types
export interface OfflinePlan {
  id: string; // UUID
  document: PlannerDocument;
  localId: string | null; // Remote document ID if synced
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string | null;
  syncStatus: "pending" | "synced" | "conflict";
}

export interface SyncQueueItem {
  id: string; // UUID
  operation: "create" | "update" | "delete";
  planId: string; // Local plan ID
  remoteId: string | null; // Remote document ID if available
  document?: PlannerDocument; // Document payload for create/update
  createdAt: string;
  retryCount: number;
  lastAttempt: string | null;
  error: string | null;
}

export function getSyncQueueOperation(
  existingRemoteId: string | null,
  requestedRemoteId: string | null,
): SyncQueueItem["operation"] {
  return requestedRemoteId ?? existingRemoteId ? "update" : "create";
}

// IndexedDB error types
export class OfflineStorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "OfflineStorageError";
  }
}

/**
 * IndexedDB manager class
 */
class OfflineStorageManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new OfflineStorageError(
          "Failed to open IndexedDB",
          "DB_OPEN_FAILED",
          request.error
        ));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create plans store
        if (!db.objectStoreNames.contains(STORE_PLANS)) {
          const plansStore = db.createObjectStore(STORE_PLANS, { keyPath: "id" });
          plansStore.createIndex("localId", "localId", { unique: false });
          plansStore.createIndex("syncStatus", "syncStatus", { unique: false });
          plansStore.createIndex("updatedAt", "updatedAt", { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: "id" });
          syncStore.createIndex("planId", "planId", { unique: false });
          syncStore.createIndex("operation", "operation", { unique: false });
          syncStore.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new OfflineStorageError("Database not initialized", "DB_NOT_INITIALIZED");
    }
    return this.db;
  }

  /**
   * Generic transaction helper
   */
  private async transaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new OfflineStorageError(
        "Transaction failed",
        "TRANSACTION_FAILED",
        request.error
      ));
    });
  }

  /**
   * Save plan to offline storage
   */
  async savePlan(plan: OfflinePlan): Promise<void> {
    await this.transaction(STORE_PLANS, "readwrite", (store) => {
      return store.put(plan);
    });
  }

  /**
   * Get plan by ID
   */
  async getPlan(id: string): Promise<OfflinePlan | null> {
    return await this.transaction(STORE_PLANS, "readonly", (store) => {
      return store.get(id);
    });
  }

  /**
   * Get plan by local ID (remote document ID)
   */
  async getPlanByLocalId(localId: string): Promise<OfflinePlan | null> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PLANS, "readonly");
      const store = transaction.objectStore(STORE_PLANS);
      const index = store.index("localId");
      const request = index.get(localId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new OfflineStorageError(
        "Failed to get plan by local ID",
        "GET_PLAN_FAILED",
        request.error
      ));
    });
  }

  /**
   * List all plans
   */
  async listPlans(): Promise<OfflinePlan[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PLANS, "readonly");
      const store = transaction.objectStore(STORE_PLANS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new OfflineStorageError(
        "Failed to list plans",
        "LIST_PLANS_FAILED",
        request.error
      ));
    });
  }

  /**
   * List pending sync plans
   */
  async listPendingPlans(): Promise<OfflinePlan[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PLANS, "readonly");
      const store = transaction.objectStore(STORE_PLANS);
      const index = store.index("syncStatus");
      const request = index.getAll("pending");

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new OfflineStorageError(
        "Failed to list pending plans",
        "LIST_PENDING_FAILED",
        request.error
      ));
    });
  }

  /**
   * Delete plan
   */
  async deletePlan(id: string): Promise<void> {
    await this.transaction(STORE_PLANS, "readwrite", (store) => {
      return store.delete(id);
    });
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    await this.transaction(STORE_SYNC_QUEUE, "readwrite", (store) => {
      return store.add(item);
    });
  }

  /**
   * Get sync queue item
   */
  async getSyncQueueItem(id: string): Promise<SyncQueueItem | null> {
    return await this.transaction(STORE_SYNC_QUEUE, "readonly", (store) => {
      return store.get(id);
    });
  }

  /**
   * List all sync queue items
   */
  async listSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SYNC_QUEUE, "readonly");
      const store = transaction.objectStore(STORE_SYNC_QUEUE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new OfflineStorageError(
        "Failed to list sync queue",
        "LIST_QUEUE_FAILED",
        request.error
      ));
    });
  }

  /**
   * List sync queue items for a specific plan
   */
  async listSyncQueueForPlan(planId: string): Promise<SyncQueueItem[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SYNC_QUEUE, "readonly");
      const store = transaction.objectStore(STORE_SYNC_QUEUE);
      const index = store.index("planId");
      const request = index.getAll(planId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new OfflineStorageError(
        "Failed to list sync queue for plan",
        "LIST_QUEUE_FOR_PLAN_FAILED",
        request.error
      ));
    });
  }

  /**
   * Update sync queue item
   */
  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    await this.transaction(STORE_SYNC_QUEUE, "readwrite", (store) => {
      return store.put(item);
    });
  }

  /**
   * Remove sync queue item
   */
  async removeSyncQueueItem(id: string): Promise<void> {
    await this.transaction(STORE_SYNC_QUEUE, "readwrite", (store) => {
      return store.delete(id);
    });
  }

  /**
   * Clear all data (for testing or reset)
   */
  async clearAll(): Promise<void> {
    await this.ensureDb();
    
    await this.transaction(STORE_PLANS, "readwrite", (store) => {
      return store.clear();
    });
    
    await this.transaction(STORE_SYNC_QUEUE, "readwrite", (store) => {
      return store.clear();
    });
  }
}

// Singleton instance
const offlineStorage = new OfflineStorageManager();

/**
 * Helper functions for offline storage operations
 */

export async function createOfflinePlan(document: PlannerDocument): Promise<OfflinePlan> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const plan: OfflinePlan = {
    id,
    document: validatePlannerDocument(document),
    localId: null,
    createdAt: now,
    updatedAt: now,
    lastSyncedAt: null,
    syncStatus: "pending",
  };
  
  await offlineStorage.savePlan(plan);
  
  // Add to sync queue
  const syncItem: SyncQueueItem = {
    id: crypto.randomUUID(),
    operation: "create",
    planId: id,
    remoteId: null,
    document,
    createdAt: now,
    retryCount: 0,
    lastAttempt: null,
    error: null,
  };
  
  await offlineStorage.addToSyncQueue(syncItem);
  
  return plan;
}

export async function updateOfflinePlan(
  id: string,
  document: PlannerDocument,
  remoteId: string | null = null
): Promise<OfflinePlan> {
  const existing = await offlineStorage.getPlan(id);
  if (!existing) {
    throw new OfflineStorageError("Plan not found", "PLAN_NOT_FOUND");
  }
  
  const now = new Date().toISOString();
  const updated: OfflinePlan = {
    ...existing,
    document: validatePlannerDocument(document),
    localId: remoteId ?? existing.localId,
    updatedAt: now,
    syncStatus: "pending",
  };
  
  await offlineStorage.savePlan(updated);
  
  // Add to sync queue
  const syncItem: SyncQueueItem = {
    id: crypto.randomUUID(),
    operation: getSyncQueueOperation(existing.localId, remoteId),
    planId: id,
    remoteId: remoteId ?? existing.localId,
    document,
    createdAt: now,
    retryCount: 0,
    lastAttempt: null,
    error: null,
  };
  
  await offlineStorage.addToSyncQueue(syncItem);
  
  return updated;
}

export async function markPlanAsSynced(id: string, remoteId: string): Promise<void> {
  const existing = await offlineStorage.getPlan(id);
  if (!existing) {
    throw new OfflineStorageError("Plan not found", "PLAN_NOT_FOUND");
  }
  
  const now = new Date().toISOString();
  const updated: OfflinePlan = {
    ...existing,
    localId: remoteId,
    lastSyncedAt: now,
    syncStatus: "synced",
  };
  
  await offlineStorage.savePlan(updated);
  
  // Clear sync queue items for this plan
  const queueItems = await offlineStorage.listSyncQueueForPlan(id);
  for (const item of queueItems) {
    await offlineStorage.removeSyncQueueItem(item.id);
  }
}

export async function deleteOfflinePlan(id: string): Promise<void> {
  const existing = await offlineStorage.getPlan(id);
  if (!existing) {
    throw new OfflineStorageError("Plan not found", "PLAN_NOT_FOUND");
  }
  
  // Add delete to sync queue if it was synced
  if (existing.localId) {
    const syncItem: SyncQueueItem = {
      id: crypto.randomUUID(),
      operation: "delete",
      planId: id,
      remoteId: existing.localId,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      lastAttempt: null,
      error: null,
    };
    await offlineStorage.addToSyncQueue(syncItem);
  }
  
  await offlineStorage.deletePlan(id);
}

export {
  offlineStorage,
  OfflineStorageManager,
};
