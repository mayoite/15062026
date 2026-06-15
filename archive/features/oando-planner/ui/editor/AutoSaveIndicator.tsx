"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";

/**
 * AutoSaveIndicator
 * 
 * Displays the current save state in the editor top bar:
 * - "Saving..." when a save is in progress
 * - "Saved ✓" with relative timestamp when last saved
 * - "Unsaved" when there are unsaved changes
 * - "Save failed — Retry" when save fails (with retry button)
 * 
 * Uses brand tokens for styling and includes aria-live for screen reader announcements.
 * 
 * @requirement REQ-16 (Auto-save indicator)
 */

type SaveState = "saving" | "saved" | "unsaved" | "failed";

/**
 * Formats a relative time string from an ISO timestamp.
 * Returns "just now", "N seconds ago", "N minutes ago", "N hours ago", or "N days ago".
 */
function formatRelativeTime(isoTimestamp: string): string {
  const savedDate = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - savedDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 10) {
    return "just now";
  } else if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

export interface AutoSaveIndicatorProps {
  /** Optional callback to trigger a manual save (used for retry) */
  onSave?: () => void;
}

export function AutoSaveIndicator({ onSave }: AutoSaveIndicatorProps) {
  const isDirty = usePlannerStore((s) => s.isDirty);
  const lastSavedAt = usePlannerStore((s) => s.lastSavedAt);
  const isSaving = usePlannerStore((s) => s.isSaving);
  const saveError = usePlannerStore((s) => s.saveError);
  const saveProject = usePlannerStore((s) => s.saveProject);

  // Track relative time display, refreshed every 60 seconds
  const [relativeTime, setRelativeTime] = useState<string>("");

  // Determine current save state
  const getSaveState = useCallback((): SaveState => {
    if (isSaving) return "saving";
    if (saveError) return "failed";
    if (isDirty) return "unsaved";
    if (lastSavedAt) return "saved";
    return "unsaved"; // No save yet
  }, [isSaving, saveError, isDirty, lastSavedAt]);

  const [saveState, setSaveState] = useState<SaveState>(getSaveState);

  // Update save state when dependencies change
  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveState(getSaveState());
  }, [getSaveState]);

  // Update relative time display
  useEffect(() => {
    if (!lastSavedAt) {
// eslint-disable-next-line react-hooks/set-state-in-effect
      setRelativeTime("");
      return;
    }

    // Initial update
    setRelativeTime(formatRelativeTime(lastSavedAt));

    // Refresh every 60 seconds
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(lastSavedAt));
    }, 60000);

    return () => clearInterval(interval);
  }, [lastSavedAt]);

  // Handle retry click
  const handleRetry = useCallback(() => {
    if (onSave) {
      onSave();
    } else {
      saveProject();
    }
  }, [onSave, saveProject]);

  // Determine display text and styling based on state
  const getDisplayContent = () => {
    switch (saveState) {
      case "saving":
        return {
          text: "Saving…",
          ariaLabel: "Saving project",
          className: "planner-autosave--saving",
        };
      case "saved":
        return {
          text: `Saved ✓ ${relativeTime}`,
          ariaLabel: `Project saved ${relativeTime}`,
          className: "planner-autosave--saved",
        };
      case "failed":
        return {
          text: "Save failed",
          ariaLabel: "Save failed, click to retry",
          className: "planner-autosave--failed",
        };
      case "unsaved":
      default:
        return {
          text: "Unsaved",
          ariaLabel: "Project has unsaved changes",
          className: "planner-autosave--unsaved",
        };
    }
  };

  const { text, ariaLabel, className } = getDisplayContent();

  return (
    <div
      className={`planner-autosave ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {saveState === "failed" ? (
        <button
          onClick={handleRetry}
          className="planner-autosave__retry"
          aria-label={ariaLabel}
          title="Click to retry saving"
        >
          <span className="planner-autosave__text">{text}</span>
          <span className="planner-autosave__retry-label">— Retry</span>
        </button>
      ) : (
        <span className="planner-autosave__text" aria-label={ariaLabel}>
          {text}
        </span>
      )}
    </div>
  );
}

export default AutoSaveIndicator;
