/**
 * Version History System for Floor Plans
 *
 * Provides snapshot management for plan versioning with localStorage persistence.
 * Each project can have up to MAX_VERSIONS snapshots, with FIFO eviction.
 *
 * Storage key pattern: localStorage["planner.versions.{projectId}"]
 *
 * @module versioning
 */

import type { PlannerDocument } from "@/features/planner/model/plannerDocument";

/**
 * A single version snapshot of a plan document
 */
export interface VersionSnapshot {
  /** Unique identifier for this snapshot */
  id: string;
  /** The project this snapshot belongs to */
  projectId: string;
  /** ISO 8601 timestamp when the snapshot was created */
  createdAt: string;
  /** The full plan document at the time of snapshot */
  document: PlannerDocument;
  /** Why this snapshot was created */
  reason: "save" | "restore";
  /** Optional user-provided label/description */
  label?: string;
}

/** Maximum number of snapshots to retain per project */
export const MAX_VERSIONS = 10;

/** localStorage key prefix for version storage */
const STORAGE_KEY_PREFIX = "planner.versions.";

/**
 * Generate a storage key for a project's version history
 */
function getStorageKey(projectId: string): string {
  return `${STORAGE_KEY_PREFIX}${projectId}`;
}

/**
 * Generate a unique snapshot ID using crypto.randomUUID if available,
 * falling back to a timestamp-based ID
 */
function generateSnapshotId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Safely read snapshots from localStorage
 * Returns an empty array if the data is missing or corrupted
 */
function readSnapshots(projectId: string): VersionSnapshot[] {
  try {
    const key = getStorageKey(projectId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Basic validation of snapshot structure
    return parsed.filter(
      (item): item is VersionSnapshot =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.projectId === "string" &&
        typeof item.createdAt === "string" &&
        item.document !== undefined &&
        (item.reason === "save" || item.reason === "restore")
    );
  } catch {
    // Return empty array on parse errors
    return [];
  }
}

/**
 * Safely write snapshots to localStorage
 * Handles quota errors gracefully
 *
 * @returns true if write succeeded, false if quota exceeded
 */
function writeSnapshots(projectId: string, snapshots: VersionSnapshot[]): boolean {
  try {
    const key = getStorageKey(projectId);
    const json = JSON.stringify(snapshots);
    localStorage.setItem(key, json);
    return true;
  } catch (e: unknown) {
    if (
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" || e.code === 22)
    ) {
      return false;
    }
    // Re-throw unexpected errors
    throw e;
  }
}

/**
 * Append a new snapshot to a project's version history.
 *
 * If the snapshot count exceeds MAX_VERSIONS, the oldest snapshot is evicted (FIFO).
 * If localStorage quota is exceeded, attempts to evict oldest and retry once.
 *
 * @param projectId - The project identifier
 * @param doc - The plan document to snapshot
 * @param reason - Why this snapshot is being created (default: "save")
 * @param label - Optional user-provided label/description
 * @returns The created snapshot, or null if storage failed
 */
export function appendSnapshot(
  projectId: string,
  doc: PlannerDocument,
  reason: "save" | "restore" = "save",
  label?: string
): VersionSnapshot | null {
  const snapshot: VersionSnapshot = {
    id: generateSnapshotId(),
    projectId,
    createdAt: new Date().toISOString(),
    document: JSON.parse(JSON.stringify(doc)), // Deep clone
    reason,
    ...(label && { label }),
  };

  const snapshots = readSnapshots(projectId);

  // Add new snapshot
  snapshots.push(snapshot);

  // Enforce MAX_VERSIONS limit (FIFO eviction)
  while (snapshots.length > MAX_VERSIONS) {
    snapshots.shift();
  }

  // Try to write
  if (writeSnapshots(projectId, snapshots)) {
    return snapshot;
  }

  // Quota exceeded - try evicting one more and retry
  if (snapshots.length > 1) {
    snapshots.shift();
    if (writeSnapshots(projectId, snapshots)) {
      return snapshot;
    }
  }

  // Storage failed
  return null;
}

/**
 * List all snapshots for a project, ordered newest first.
 *
 * @param projectId - The project identifier
 * @returns Array of snapshots, newest first
 */
export function listSnapshots(projectId: string): VersionSnapshot[] {
  const snapshots = readSnapshots(projectId);
  // Sort by createdAt descending (newest first)
  return snapshots.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get a specific snapshot by ID.
 *
 * @param projectId - The project identifier
 * @param snapshotId - The snapshot identifier
 * @returns The snapshot if found, null otherwise
 */
export function getSnapshot(
  projectId: string,
  snapshotId: string
): VersionSnapshot | null {
  const snapshots = readSnapshots(projectId);
  return snapshots.find((s) => s.id === snapshotId) ?? null;
}

/**
 * Restore a plan document from a snapshot.
 *
 * This returns a deep copy of the document from the snapshot.
 * The caller is responsible for:
 * 1. Replacing the current document with the returned one
 * 2. Marking the document as dirty
 * 3. Calling appendSnapshot with reason "restore" to record the restore action
 *
 * @param projectId - The project identifier
 * @param snapshotId - The snapshot identifier to restore from
 * @returns A deep copy of the document, or null if snapshot not found
 */
export function restoreSnapshot(
  projectId: string,
  snapshotId: string
): PlannerDocument | null {
  const snapshot = getSnapshot(projectId, snapshotId);
  if (!snapshot) return null;

  // Return a deep copy to prevent mutations
  return JSON.parse(JSON.stringify(snapshot.document));
}

/**
 * Prune snapshots to enforce the MAX_VERSIONS limit.
 *
 * This is useful for cleanup after imports or migrations.
 *
 * @param projectId - The project identifier
 */
export function pruneSnapshots(projectId: string): void {
  const snapshots = readSnapshots(projectId);

  if (snapshots.length <= MAX_VERSIONS) {
    return; // Nothing to prune
  }

  // Sort by createdAt ascending (oldest first) for FIFO eviction
  // Keep only the most recent MAX_VERSIONS
  const pruned = snapshots
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .slice(-MAX_VERSIONS);

  writeSnapshots(projectId, pruned);
}

/**
 * Delete all snapshots for a project.
 *
 * Use this when deleting a project to clean up associated version history.
 *
 * @param projectId - The project identifier
 */
export function deleteSnapshotsFor(projectId: string): void {
  try {
    const key = getStorageKey(projectId);
    localStorage.removeItem(key);
  } catch {
    // Ignore errors during cleanup
  }
}

/**
 * Get the count of snapshots for a project.
 *
 * @param projectId - The project identifier
 * @returns Number of snapshots stored
 */
export function getSnapshotCount(projectId: string): number {
  return readSnapshots(projectId).length;
}

/**
 * Check if a project has unknown version history.
 *
 * @param projectId - The project identifier
 * @returns true if at least one snapshot exists
 */
export function hasVersionHistory(projectId: string): boolean {
  return getSnapshotCount(projectId) > 0;
}

/**
 * Get the most recent snapshot for a project.
 *
 * @param projectId - The project identifier
 * @returns The most recent snapshot, or null if none exist
 */
export function getLatestSnapshot(projectId: string): VersionSnapshot | null {
  const snapshots = listSnapshots(projectId);
  return snapshots[0] ?? null;
}

/**
 * Update the label of an existing snapshot.
 *
 * @param projectId - The project identifier
 * @param snapshotId - The snapshot identifier
 * @param label - The new label (pass undefined to remove)
 * @returns true if update succeeded, false if snapshot not found
 */
export function updateSnapshotLabel(
  projectId: string,
  snapshotId: string,
  label: string | undefined
): boolean {
  const snapshots = readSnapshots(projectId);
  const index = snapshots.findIndex((s) => s.id === snapshotId);

  if (index === -1) return false;

  if (label === undefined) {
    delete snapshots[index].label;
  } else {
    snapshots[index].label = label;
  }

  return writeSnapshots(projectId, snapshots);
}
