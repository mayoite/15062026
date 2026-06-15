"use client";

/**
 * OfflinePill Component
 * 
 * Displays offline status indicator in the editor top bar.
 * Shows "Offline" when browser is offline, "Sync pending (N)" when
 * there are queued operations, or hides when online with empty queue.
 * 
 * Uses brand tokens for styling and includes proper accessibility attributes.
 */

import React from "react";
import { useOnlineStatus } from "@/features/oando-planner/hooks/useOnlineStatus";

/**
 * Offline indicator pill for the editor top bar.
 * 
 * - Shows "Offline" pill when navigator.onLine is false
 * - Shows "Sync pending (N)" when online but queue has items
 * - Hidden when online and queue is empty
 * - Uses aria-live for screen reader announcements
 */
export function OfflinePill(): React.ReactElement | null {
  const { isOnline, queueDepth } = useOnlineStatus();

  // Determine what to display
  const showOffline = !isOnline;
  const showSyncPending = isOnline && queueDepth > 0;

  // Hide when online and queue is empty
  if (isOnline && queueDepth === 0) {
    return null;
  }

  // Build accessible label
  let accessibleLabel: string;
  let displayText: string;

  if (showOffline) {
    displayText = "Offline";
    accessibleLabel = "You are currently offline. Changes will be saved locally.";
  } else if (showSyncPending) {
    displayText = `Sync pending (${queueDepth})`;
    accessibleLabel = `${queueDepth} change${queueDepth === 1 ? "" : "s"} pending sync to server.`;
  } else {
    // Should not reach here due to early return, but TypeScript needs this
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={accessibleLabel}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
        transition-all duration-300 ease-out
        animate-fade-in
        ${showOffline 
          ? "bg-[var(--color-offline,var(--color-danger))]/20 text-[var(--color-offline,var(--color-danger))] border border-[var(--color-offline,var(--color-danger))]/30" 
          : "bg-[var(--color-warning,var(--color-warning))]/20 text-[var(--color-warning,var(--color-warning))] border border-[var(--color-warning,var(--color-warning))]/30"
        }
      `}
    >
      {/* Status indicator dot */}
      <span
        className={`
          w-1.5 h-1.5 rounded-full
          ${showOffline 
            ? "bg-[var(--color-offline,var(--color-danger))] animate-pulse" 
            : "bg-[var(--color-warning,var(--color-warning))]"
          }
        `}
        aria-hidden="true"
      />
      <span>{displayText}</span>
    </div>
  );
}

export default OfflinePill;
