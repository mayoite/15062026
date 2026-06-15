/**
 * Version Store - Re-exports versioning utilities
 *
 * This module provides access to the version history system for floor plans.
 * The actual implementation is in lib/versioning.ts.
 *
 * @module versionStore
 */

export {
  // Types
  type VersionSnapshot,

  // Constants
  MAX_VERSIONS,

  // Core functions
  appendSnapshot,
  listSnapshots,
  getSnapshot,
  restoreSnapshot,
  pruneSnapshots,
  deleteSnapshotsFor,

  // Utility functions
  getSnapshotCount,
  hasVersionHistory,
  getLatestSnapshot,
  updateSnapshotLabel,
} from "@/features/planner/lib/versioning";
