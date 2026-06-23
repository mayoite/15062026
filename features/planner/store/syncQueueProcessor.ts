/**
 * Sync Queue Processor - Handles syncing offline changes when connectivity returns
 * Processes sync queue items with retry logic and conflict resolution
 */

import { 
  offlineStorage, 
  markPlanAsSynced,
  type SyncQueueItem,
} from "./offlineStorage";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";


// Sync configuration
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds
const SYNC_BATCH_SIZE = 10;

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ itemId: string; error: string }>;
}

export interface SyncProcessorOptions {
  /** Owner of the synced documents. Required for Drizzle persistence. */
  userId: string;
  onSyncProgress?: (progress: { current: number; total: number }) => void;
  onSyncComplete?: (result: SyncResult) => void;
  onSyncError?: (error: string) => void;
}

/**
 * Sync queue processor class
 */
export class SyncQueueProcessor {
  private isProcessing = false;
  private options: SyncProcessorOptions;

  constructor(options: SyncProcessorOptions) {
    this.options = options;
  }

  /**
   * Process all pending sync queue items
   */
  async processSyncQueue(): Promise<SyncResult> {
    if (this.isProcessing) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: [{ itemId: "processor", error: "Sync already in progress" }],
      };
    }

    if (!this.options.userId) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: [{ itemId: "processor", error: "userId required for sync" }],
      };
    }

    this.isProcessing = true;

    try {
      // Get all sync queue items ordered by creation time
      const queueItems = await offlineStorage.listSyncQueue();
      const sortedItems = queueItems.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      if (sortedItems.length === 0) {
        return {
          success: true,
          processed: 0,
          failed: 0,
          errors: [],
        };
      }

      const result: SyncResult = {
        success: true,
        processed: 0,
        failed: 0,
        errors: [],
      };

      // Process items in batches
      for (let i = 0; i < sortedItems.length; i += SYNC_BATCH_SIZE) {
        const batch = sortedItems.slice(i, i + SYNC_BATCH_SIZE);
        
        for (const item of batch) {
          try {
            await this.processSyncItem(item);
            result.processed++;
            
            // Report progress
            if (this.options.onSyncProgress) {
              this.options.onSyncProgress({
                current: result.processed,
                total: sortedItems.length,
              });
            }
          } catch (error) {
            result.failed++;
            result.errors.push({
              itemId: item.id,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      }

      if (this.options.onSyncComplete) {
        this.options.onSyncComplete(result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown sync error";
      if (this.options.onSyncError) {
        this.options.onSyncError(errorMessage);
      }
      
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: [{ itemId: "processor", error: errorMessage }],
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single sync queue item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    if (item.retryCount >= MAX_RETRY_COUNT) {
      await this.markSyncFailed(item, `Max retry count exceeded for item ${item.id}`);
      throw new Error(`Max retry count exceeded for item ${item.id}`);
    }

    if (item.lastAttempt) {
      const lastAttemptTime = new Date(item.lastAttempt).getTime();
      const now = Date.now();
      if (now - lastAttemptTime < RETRY_DELAY_MS) {
        throw new Error(`Retry delay not met for item ${item.id}`);
      }
    }

    const updatedItem: SyncQueueItem = {
      ...item,
      retryCount: item.retryCount + 1,
      lastAttempt: new Date().toISOString(),
    };

    try {
      await this.updatePlanSyncState(item.planId, "syncing");

      switch (item.operation) {
        case "create":
          await this.processCreate(item);
          break;
        case "update":
          await this.processUpdate(item);
          break;
        case "delete":
          await this.processDelete(item);
          break;
        default:
          throw new Error(`Unknown operation: ${item.operation}`);
      }

      await offlineStorage.removeSyncQueueItem(item.id);
    } catch (error) {
      updatedItem.error = error instanceof Error ? error.message : "Unknown error";
      await offlineStorage.updateSyncQueueItem(updatedItem);
      await this.markSyncFailed(item, updatedItem.error);
      throw error;
    }
  }

  /**
   * Update plan's sync state in offline storage
   */
  private async updatePlanSyncState(planId: string, syncState: "syncing" | "synced" | "sync_failed" | "conflict"): Promise<void> {
    try {
      const plan = await offlineStorage.getPlan(planId);
      if (!plan) return;

      plan.syncState = syncState;
      plan.syncStatus = syncState === "synced" ? "synced" : "pending";
      if (syncState === "sync_failed") {
        plan.syncErrorCode = "SYNC_FAILED";
      } else if (syncState === "synced") {
        plan.syncErrorCode = null;
      }
      await offlineStorage.savePlan(plan);
    } catch {
      // Sync status persistence is best-effort and should not hide the transport error.
    }
  }

  /**
   * Mark plan and queue item as sync failed
   */
  private async markSyncFailed(item: SyncQueueItem, _error: string): Promise<void> {
    await this.updatePlanSyncState(item.planId, "sync_failed");
  }

  /**
   * Process create operation
   */
  private async processCreate(item: SyncQueueItem): Promise<void> {
    if (!item.document) {
      throw new Error("Document required for create operation");
    }

    const response = await browserApiFetch(apiPath("/api/plans"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item.document),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Save failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const remoteRevision = result.revision || result.updatedAt || undefined;

    await markPlanAsSynced(item.planId, result.id, remoteRevision);
  }

  /**
   * Process update operation
   */
  private async processUpdate(item: SyncQueueItem): Promise<void> {
    if (!item.document) {
      throw new Error("Document required for update operation");
    }

    if (!item.remoteId) {
      throw new Error("Remote ID required for update operation");
    }

    const response = await browserApiFetch(apiPath(`/api/plans/${item.remoteId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item.document),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Update failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const remoteRevision = result.revision || result.updatedAt || undefined;

    await markPlanAsSynced(item.planId, item.remoteId, remoteRevision);
  }

  /**
   * Process delete operation
   */
  private async processDelete(item: SyncQueueItem): Promise<void> {
    if (!item.remoteId) {
      throw new Error("Remote ID required for delete operation");
    }

    const response = await browserApiFetch(apiPath(`/api/plans/${item.remoteId}`), {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delete failed: ${response.status} ${errorText}`);
    }

    // Remove from offline storage
    await offlineStorage.deletePlan(item.planId);
  }

  /**
   * Get sync queue status
   */
  async getSyncStatus(): Promise<{
    pendingItems: number;
    failedItems: number;
    totalPlans: number;
    pendingPlans: number;
  }> {
    const queueItems = await offlineStorage.listSyncQueue();
    const plans = await offlineStorage.listPlans();

    const failedItems = queueItems.filter(
      item => item.retryCount >= MAX_RETRY_COUNT
    ).length;

    const pendingPlans = await offlineStorage.listPendingPlans();

    return {
      pendingItems: queueItems.length,
      failedItems,
      totalPlans: plans.length,
      pendingPlans: pendingPlans.length,
    };
  }

  /**
   * Clear failed sync items
   */
  async clearFailedItems(): Promise<number> {
    const queueItems = await offlineStorage.listSyncQueue();
    const failedItems = queueItems.filter(
      item => item.retryCount >= MAX_RETRY_COUNT
    );

    for (const item of failedItems) {
      await offlineStorage.removeSyncQueueItem(item.id);
    }

    return failedItems.length;
  }

  /**
   * Retry failed sync items
   */
  async retryFailedItems(): Promise<void> {
    const queueItems = await offlineStorage.listSyncQueue();
    const failedItems = queueItems.filter(
      item => item.retryCount >= MAX_RETRY_COUNT
    );

    for (const item of failedItems) {
      const resetItem: SyncQueueItem = {
        ...item,
        retryCount: 0,
        lastAttempt: null,
        error: null,
      };
      await offlineStorage.updateSyncQueueItem(resetItem);
    }
  }
}

/**
 * Hook for using sync queue processor in React components
 */
export function useSyncQueueProcessor(options: SyncProcessorOptions) {
  const processor = new SyncQueueProcessor(options);

  return {
    processSyncQueue: () => processor.processSyncQueue(),
    getSyncStatus: () => processor.getSyncStatus(),
    clearFailedItems: () => processor.clearFailedItems(),
    retryFailedItems: () => processor.retryFailedItems(),
  };
}
