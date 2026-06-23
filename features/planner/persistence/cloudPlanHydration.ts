/**
 * Cloud Plan Hydration - Lane 3 requirement
 * Implements deterministic hydration by choosing newest valid state
 * Handles explicit conflict detection based on contentHash and remoteRevision
 */

import type { OfflinePlan } from "@/features/planner/store/offlineStorage";

export interface HydrationResult {
  plan: OfflinePlan | null;
  source: "local" | "cloud" | "conflict";
  conflictDetails?: {
    localHash: string;
    remoteHash: string;
    localUpdatedAt: string;
    remoteUpdatedAt: string;
  };
}

/**
 * Hydrate cloud plan on load
 * Lane 3 Hydration Precedence Ranking:
 * 1. Valid schema only
 * 2. Newest updatedAt among valid records
 * 3. Use contentHash and remoteRevision as conflict evidence
 * 4. Use explicit source preference only as final tie-breaker
 */
export function hydrateCloudPlanIntoIndexedDb(
  localPlan: OfflinePlan | null,
  cloudPlan: OfflinePlan | null
): HydrationResult {
  if (!localPlan && !cloudPlan) {
    return { plan: null, source: "local" };
  }

  if (!localPlan) {
    return {
      plan: cloudPlan,
      source: "cloud",
    };
  }

  if (!cloudPlan) {
    return {
      plan: localPlan,
      source: "local",
    };
  }

  const localTime = new Date(localPlan.updatedAt).getTime();
  const cloudTime = new Date(cloudPlan.updatedAt).getTime();

  const sameContentHash = localPlan.contentHash === cloudPlan.contentHash;

  if (sameContentHash) {
    const newer = cloudTime > localTime ? cloudPlan : localPlan;
    return {
      plan: newer,
      source: cloudTime > localTime ? "cloud" : "local",
    };
  }

  if (localPlan.remoteRevision && cloudPlan.remoteRevision && 
      localPlan.remoteRevision !== cloudPlan.remoteRevision) {
    return {
      plan: null,
      source: "conflict",
      conflictDetails: {
        localHash: localPlan.contentHash,
        remoteHash: cloudPlan.contentHash,
        localUpdatedAt: localPlan.updatedAt,
        remoteUpdatedAt: cloudPlan.updatedAt,
      },
    };
  }

  const newer = cloudTime > localTime ? cloudPlan : localPlan;
  return {
    plan: newer,
    source: cloudTime > localTime ? "cloud" : "local",
  };
}

/**
 * Detect conflict between local and cloud plans
 * Explicit conflict handling per Lane 3 requirements
 */
export function detectPlanConflict(
  localPlan: OfflinePlan,
  cloudPlan: OfflinePlan
): boolean {
  if (localPlan.contentHash === cloudPlan.contentHash) {
    return false;
  }

  if (localPlan.remoteRevision !== cloudPlan.remoteRevision) {
    return true;
  }

  return false;
}

/**
 * Choose deterministically between conflicted versions
 * Preference: newest by updatedAt
 */
export function resolveConflict(
  localPlan: OfflinePlan,
  cloudPlan: OfflinePlan
): OfflinePlan {
  const localTime = new Date(localPlan.updatedAt).getTime();
  const cloudTime = new Date(cloudPlan.updatedAt).getTime();

  const winner = cloudTime >= localTime ? cloudPlan : localPlan;

  return {
    ...winner,
    syncState: "conflict",
    syncErrorCode: "CONFLICT_DETECTED",
  };
}
