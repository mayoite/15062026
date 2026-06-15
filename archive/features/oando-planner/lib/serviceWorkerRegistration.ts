/**
 * Service Worker Registration - Handles service worker registration and lifecycle
 * Provides utilities for cache management and offline status
 */

import React from "react";

export interface ServiceWorkerStatus {
  supported: boolean;
  registered: boolean;
  activated: boolean;
  controlled: boolean;
  updateAvailable: boolean;
}

export interface CacheStatus {
  caches: string[];
  timestamp: string;
}

/**
 * Register the planner service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerStatus> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return {
      supported: false,
      registered: false,
      activated: false,
      controlled: false,
      updateAvailable: false,
    };
  }

  try {
    const registration = await navigator.serviceWorker.register("/planner-sw.js", {
      scope: "/",
    });

    // Wait for service worker to activate
    if (registration.active) {
      return {
        supported: true,
        registered: true,
        activated: true,
        controlled: !!navigator.serviceWorker.controller,
        updateAvailable: false,
      };
    }

    // Wait for activation
    return new Promise((resolve) => {
      const sw = registration.installing || registration.waiting;
      
      if (sw) {
        sw.addEventListener("statechange", () => {
          if (sw.state === "activated") {
            resolve({
              supported: true,
              registered: true,
              activated: true,
              controlled: !!navigator.serviceWorker.controller,
              updateAvailable: false,
            });
          }
        });
      } else {
        resolve({
          supported: true,
          registered: true,
          activated: true,
          controlled: !!navigator.serviceWorker.controller,
          updateAvailable: false,
        });
      }
    });
  } catch (error) {
    console.error("Service worker registration failed:", error);
    return {
      supported: true,
      registered: false,
      activated: false,
      controlled: false,
      updateAvailable: false,
    };
  }
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return false;
  }

  await registration.update();
  return !!registration.waiting;
}

/**
 * Skip waiting and activate new service worker
 */
export async function skipWaiting(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration || !registration.waiting) {
    return;
  }

  registration.waiting.postMessage({ type: "SKIP_WAITING" });
}

/**
 * Clear all caches
 */
export async function clearCaches(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return;
  }

  registration.active?.postMessage({ type: "CLEAR_CACHE" });
}

/**
 * Get cache status
 */
export async function getCacheStatus(): Promise<CacheStatus | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration || !registration.active) {
    return null;
  }

  return new Promise((resolve) => {
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === "CACHE_STATUS") {
        navigator.serviceWorker.removeEventListener("message", messageHandler);
        resolve(event.data.data);
      }
    };

    navigator.serviceWorker.addEventListener("message", messageHandler);
    registration.active?.postMessage({ type: "GET_CACHE_STATUS" });

    // Timeout after 5 seconds
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener("message", messageHandler);
      resolve(null);
    }, 5000);
  });
}

/**
 * Get current service worker status
 */
export async function getServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return {
      supported: false,
      registered: false,
      activated: false,
      controlled: false,
      updateAvailable: false,
    };
  }

  const registration = await navigator.serviceWorker.getRegistration();
  
  return {
    supported: true,
    registered: !!registration,
    activated: !!registration?.active,
    controlled: !!navigator.serviceWorker.controller,
    updateAvailable: !!registration?.waiting,
  };
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return true;
  }

  const result = await registration.unregister();
  return result;
}

/**
 * React hook for service worker status
 */
export function useServiceWorker() {
  const [status, setStatus] = React.useState<ServiceWorkerStatus>({
    supported: false,
    registered: false,
    activated: false,
    controlled: false,
    updateAvailable: false,
  });

  const [cacheStatus, setCacheStatus] = React.useState<CacheStatus | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const updateStatus = async () => {
      const currentStatus = await getServiceWorkerStatus();
      if (mounted) {
        setStatus(currentStatus);
      }
    };

    updateStatus();

    // Listen for controller changes
    const handleControllerChange = () => {
      if (mounted) {
        updateStatus();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Listen for service worker messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "CACHE_STATUS" && mounted) {
        setCacheStatus(event.data.data);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  const actions = React.useMemo(() => ({
    register: registerServiceWorker,
    checkForUpdates,
    skipWaiting,
    clearCaches,
    getCacheStatus,
    unregister: unregisterServiceWorker,
  }), []);

  return {
    status,
    cacheStatus,
    actions,
  };
}