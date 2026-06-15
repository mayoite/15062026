export interface CapacitorAppConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime: boolean;
  server: {
    url?: string;
    cleartext?: boolean;
    allowNavigation?: string[];
  };
  plugins: {
    SplashScreen: {
      launchShowDuration: number;
      launchAutoHide: boolean;
      backgroundColor: string;
      showSpinner: boolean;
      spinnerColor: string;
    };
    StatusBar: {
      style: "Dark" | "Light";
      backgroundColor: string;
    };
    Keyboard: {
      resize: "body" | "ionic" | "native" | "none";
      style: "dark" | "light" | "default";
    };
  };
  ios: {
    contentInset: string;
    allowsLinkPreview: boolean;
    scrollEnabled: boolean;
  };
  android: {
    allowMixedContent: boolean;
    backgroundColor: string;
  };
}

export const CAPACITOR_CONFIG: CapacitorAppConfig = {
  appId: "com.oando.planner",
  appName: "One&Only Planner",
  webDir: "out",
  bundledWebRuntime: false,
  server: {
    allowNavigation: ["*.oando.com", "*.supabase.co"],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "var(--border-soft)",
      showSpinner: true,
      spinnerColor: "var(--border-soft)",
    },
    StatusBar: {
      style: "Light",
      backgroundColor: "var(--border-soft)",
    },
    Keyboard: {
      resize: "body",
      style: "light",
    },
  },
  ios: {
    contentInset: "always",
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "var(--border-soft)",
  },
};

export function generateCapacitorConfigJson(): string {
  return JSON.stringify(CAPACITOR_CONFIG, null, 2);
}

export interface TouchConfig {
  minTouchTargetPx: number;
  pinchZoomEnabled: boolean;
  twoFingerPan: boolean;
  longPressDelayMs: number;
  doubleTapZoom: boolean;
  hapticFeedback: boolean;
}

export const TOUCH_CONFIG: TouchConfig = {
  minTouchTargetPx: 44,
  pinchZoomEnabled: true,
  twoFingerPan: true,
  longPressDelayMs: 500,
  doubleTapZoom: true,
  hapticFeedback: true,
};

export interface OfflineSyncConfig {
  maxLocalPlans: number;
  syncIntervalMs: number;
  cacheMaxAgeDays: number;
  catalogCacheEnabled: boolean;
  textureCacheEnabled: boolean;
}

export const OFFLINE_SYNC_CONFIG: OfflineSyncConfig = {
  maxLocalPlans: 50,
  syncIntervalMs: 30000,
  cacheMaxAgeDays: 30,
  catalogCacheEnabled: true,
  textureCacheEnabled: true,
};

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export function isCapacitorApp(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
}

export function getPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "web";
}

export function getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
  if (typeof window === "undefined") {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue("env(safe-area-inset-top)") || "0", 10),
    bottom: parseInt(style.getPropertyValue("env(safe-area-inset-bottom)") || "0", 10),
    left: parseInt(style.getPropertyValue("env(safe-area-inset-left)") || "0", 10),
    right: parseInt(style.getPropertyValue("env(safe-area-inset-right)") || "0", 10),
  };
}
