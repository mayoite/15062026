"use client";

import { Cloud, CloudOff, Loader2 } from "lucide-react";

import type { PlannerSaveStatus } from "../hooks/usePlannerAutosave";

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
  onRetry,
}: {
  status: PlannerSaveStatus;
  lastSavedAt: string | null;
  onRetry?: () => void;
}) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved" && lastSavedAt
        ? `Saved ${formatRelativeTime(lastSavedAt)}`
        : status === "error"
          ? "Save failed"
          : status === "unsaved"
            ? "Unsaved"
            : "Ready";

  const pillStatus =
    status === "saved" ? "saved" : status === "error" ? "error" : status === "unsaved" ? "unsaved" : "idle";

  const Icon =
    status === "saving"
      ? Loader2
      : status === "error"
        ? CloudOff
        : Cloud;

  const content = (
    <>
      <Icon
        className={`h-3.5 w-3.5 shrink-0 ${status === "saving" ? "animate-spin" : ""}`}
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
      {status === "error" && onRetry ? (
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
