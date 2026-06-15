/**
 * Session Status Indicator - Shows sync status, recovery drafts, and offline state
 * Provides visual feedback for save/sync operations and recovery options
 */

import React from "react";

export interface SessionStatusIndicatorProps {
  syncStatus: "idle" | "saving" | "saved" | "syncing" | "offline" | "error";
  hasUnsavedChanges: boolean;
  isOnline: boolean;
  lastSyncedAt: string | null;
  hasRecoveryDraft: boolean;
  error: string | null;
  onRestoreDraft?: () => void;
  onDismissDraft?: () => void;
  onRetrySync?: () => void;
}

export function SessionStatusIndicator({
  syncStatus,
  hasUnsavedChanges,
  isOnline,
  lastSyncedAt,
  hasRecoveryDraft,
  error,
  onRestoreDraft,
  onDismissDraft,
  onRetrySync,
}: SessionStatusIndicatorProps) {
  const formatLastSynced = (date: string | null): string => {
    if (!date) return "Never";
    
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case "saved":
        return "text-green-600";
      case "saving":
      case "syncing":
        return "text-blue-600";
      case "offline":
        return "text-amber-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case "saved":
        return "✓";
      case "saving":
      case "syncing":
        return "⟳";
      case "offline":
        return "⚠";
      case "error":
        return "✕";
      default:
        return hasUnsavedChanges ? "●" : "○";
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case "saved":
        return "Saved";
      case "saving":
        return "Saving...";
      case "syncing":
        return "Syncing...";
      case "offline":
        return "Offline";
      case "error":
        return error || "Sync failed";
      default:
        return hasUnsavedChanges ? "Unsaved changes" : "Up to date";
    }
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Sync Status */}
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        <span className={`text-xs ${syncStatus === "saving" || syncStatus === "syncing" ? "animate-spin" : ""}`}>
          {getStatusIcon()}
        </span>
        <span className="font-medium">{getStatusText()}</span>
      </div>

      {/* Last Synced */}
      {lastSyncedAt && isOnline && (
        <div className="text-gray-500 text-xs">
          Last synced: {formatLastSynced(lastSyncedAt)}
        </div>
      )}

      {/* Online/Offline Indicator */}
      <div className={`flex items-center gap-1 text-xs ${isOnline ? "text-green-600" : "text-amber-600"}`}>
        <span>{isOnline ? "●" : "○"}</span>
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>

      {/* Recovery Draft Alert */}
      {hasRecoveryDraft && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          <span className="text-amber-700 text-xs font-medium">
            Draft available
          </span>
          <button
            onClick={onRestoreDraft}
            className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded hover:bg-amber-700 transition-colors"
          >
            Restore
          </button>
          <button
            onClick={onDismissDraft}
            className="text-xs text-amber-700 hover:text-amber-900 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Retry Sync Button */}
      {syncStatus === "error" && onRetrySync && (
        <button
          onClick={onRetrySync}
          className="text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Recovery Dialog - Shows when a recovery draft is available
 */
export interface RecoveryDialogProps {
  isOpen: boolean;
  draftDate: string | null;
  onRestore: () => void;
  onDismiss: () => void;
}

export function RecoveryDialog({ isOpen, draftDate, onRestore, onDismiss }: RecoveryDialogProps) {
  if (!isOpen) return null;

  const formatDraftDate = (date: string | null): string => {
    if (!date) return "recently";
    const then = new Date(date);
    return then.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recover Unsaved Work?
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            We found a draft of your plan from {formatDraftDate(draftDate)}. 
            Would you like to restore it?
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={onRestore}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Restore Draft
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Offline Banner - Shows when offline with pending changes
 */
export interface OfflineBannerProps {
  isOffline: boolean;
  pendingChanges: number;
  onSyncNow?: () => void;
}

export function OfflineBanner({ isOffline, pendingChanges, onSyncNow }: OfflineBannerProps) {
  if (!isOffline && pendingChanges === 0) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-40 px-4 py-2 text-sm text-center ${
      isOffline 
        ? "bg-amber-500 text-white" 
        : "bg-blue-500 text-white"
    }`}>
      <div className="flex items-center justify-center gap-2">
        {isOffline ? (
          <>
            <span>⚠ You&apos;re offline</span>
            {pendingChanges > 0 && (
              <span>({pendingChanges} unsaved change{pendingChanges > 1 ? "s" : ""})</span>
            )}
          </>
        ) : (
          <>
            <span>● {pendingChanges} change{pendingChanges > 1 ? "s" : ""} pending sync</span>
            {onSyncNow && (
              <button
                onClick={onSyncNow}
                className="underline font-medium hover:no-underline"
              >
                Sync now
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Sync Progress Indicator - Shows sync progress for multiple items
 */
export interface SyncProgressProps {
  current: number;
  total: number;
  message?: string;
}

export function SyncProgress({ current, total, message }: SyncProgressProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-gray-600 whitespace-nowrap">
        {message || `Syncing ${current}/${total}`}
      </span>
    </div>
  );
}