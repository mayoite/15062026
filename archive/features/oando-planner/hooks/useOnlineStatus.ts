/**
 * useOnlineStatus Hook
 * 
 * Tracks browser online/offline status and sync queue depth.
 * Used by OfflinePill to display connectivity and sync state.
 */

import { useState, useEffect, useCallback } from "react";
import { offlineStorage } from "../data/offlineStorage";

export interface OnlineStatus {
  /** Whether the browser reports being online */
  isOnline: boolean;
  /** Number of pending sync queue items */
  queueDepth: number;
}

/**
 * Hook that tracks navigator.onLine status and sync queue depth.
 * Listens to 'online' and 'offline' events and polls queue depth.
 * 
 * @returns OnlineStatus object with isOnline and queueDepth
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const [queueDepth, setQueueDepth] = useState<number>(0);

  // Update queue depth from IndexedDB
  const updateQueueDepth = useCallback(async () => {
    try {
      const items = await offlineStorage.listSyncQueue();
      setQueueDepth(items.length);
    } catch (error) {
      // Silently handle errors - queue depth will remain at last known value
      console.warn("Failed to get sync queue depth:", error);
    }
  }, []);

  useEffect(() => {
    // Handle online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // When coming back online, refresh queue depth
      updateQueueDepth();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Defer the first queue read so the effect doesn't synchronously set state.
    const initialStatusTimeout = window.setTimeout(() => {
      setIsOnline(window.navigator.onLine);
    }, 0);

    const initialQueueDepthTimeout = window.setTimeout(() => {
      void updateQueueDepth();
    }, 0);

    // Poll queue depth periodically (every 5 seconds)
    const pollInterval = window.setInterval(() => {
      void updateQueueDepth();
    }, 5000);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearTimeout(initialStatusTimeout);
      clearTimeout(initialQueueDepthTimeout);
      clearInterval(pollInterval);
    };
  }, [updateQueueDepth]);

  return { isOnline, queueDepth };
}
