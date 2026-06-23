"use client";

import { Cloud, CloudOff, Loader2 } from "lucide-react";

import type { PlannerEnvelopeStatus, PlannerSaveStatus } from "../hooks/usePlannerFabricAutosave";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function PlannerSaveIndicator({
  status,
  lastSavedAt,
  envelopeStatus,
  onRetry,
}: {
  status: PlannerSaveStatus;
  lastSavedAt: string | null;
  envelopeStatus?: PlannerEnvelopeStatus;
  onRetry?: () => void;
}) {
  const localSaveState = envelopeStatus?.localSaveState;
  const syncState = envelopeStatus?.syncState;
  const hasTruthfulEnvelope = Boolean(envelopeStatus);

  const label =
    localSaveState === "saving_local"
      ? "Saving locally…"
      : localSaveState === "local_save_failed"
        ? "Local save failed"
        : syncState === "conflict"
          ? "Sync conflict"
          : syncState === "sync_failed"
            ? "Sync failed"
            : syncState === "syncing"
              ? "Syncing to cloud…"
              : syncState === "queued"
                ? "Queued for sync"
                : localSaveState === "saved_local" && lastSavedAt
                  ? `Saved locally ${formatRelativeTime(lastSavedAt)}`
                  : localSaveState === "dirty"
                    ? "Unsaved changes"
                    : status === "saving"
                      ? "Saving…"
                      : status === "saved" && lastSavedAt
                        ? `Saved ${formatRelativeTime(lastSavedAt)}`
                        : status === "error"
                          ? "Save failed"
                          : status === "unsaved"
                            ? "Unsaved"
                            : "Ready";

  const pillStatus =
    syncState === "conflict"
      ? "conflict"
      : syncState === "sync_failed" || localSaveState === "local_save_failed"
        ? "error"
        : syncState === "queued"
          ? "queued"
          : syncState === "syncing"
            ? "syncing"
            : localSaveState === "saving_local"
              ? "saving"
              : localSaveState === "saved_local" && lastSavedAt && hasTruthfulEnvelope
                ? "saved"
                : status === "saved"
                  ? "saved"
                  : status === "error"
                    ? "error"
                    : status === "unsaved"
                      ? "unsaved"
                      : "idle";

  const Icon =
    syncState === "syncing" || localSaveState === "saving_local" || status === "saving"
      ? Loader2
      : syncState === "sync_failed" || localSaveState === "local_save_failed" || status === "error"
        ? CloudOff
        : Cloud;

  const content = (
    <>
      <Icon
        className={`h-3.5 w-3.5 shrink-0 ${Icon === Loader2 ? "animate-spin" : ""}`}
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </>
  );

  return (
    <div
      className="pw-save-pill pwx-save-pill"
      data-status={pillStatus}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {(status === "error" || syncState === "sync_failed" || localSaveState === "local_save_failed") && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2"
          aria-label="Save failed, click to retry"
        >
          {content}
          <span>Retry</span>
        </button>
      ) : (
        <span className="flex items-center gap-2">{content}</span>
      )}
    </div>
  );
}
