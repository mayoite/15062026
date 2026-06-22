// ============================================================================
// Feature Flags System
// ============================================================================

import { apiPath, browserApiFetch } from "@/lib/api/browserApi";

// ============================================================================
// Type Definitions
// ============================================================================

export type FeatureFlagName =
  // Core
  | "planner2D"
  | "planner3D"
  // Editor
  | "catalogSidebar"
  | "inspectorPanel"
  | "layersPanel"
  | "measurementTool"
  | "zoneOverlays"
  | "floorPlanImport"
  | "snapToGrid"
  | "snapToWall"
  // AI
  | "aiAdvisor"
  | "aiFurnish"
  | "complianceChecks"
  // Export
  | "exportPdf"
  | "exportPng"
  | "exportSvg"
  | "exportBoq"
  | "exportPanorama"
  // Data
  | "sessionSave"
  | "supabaseSync"
  | "offlineMode"
  // Mobile
  | "touchGestures"
  // Admin
  | "adminPlans"
  | "adminCatalog"
  | "adminConfiguratorCatalog"
  | "adminAnalytics"
  | "adminPlanReview"
  | "adminFeatureToggle"
  

export interface FeatureFlags {
  // Core
  planner2D: boolean;
  planner3D: boolean;
  // Editor
  catalogSidebar: boolean;
  inspectorPanel: boolean;
  layersPanel: boolean;
  measurementTool: boolean;
  zoneOverlays: boolean;
  floorPlanImport: boolean;
  snapToGrid: boolean;
  snapToWall: boolean;
  // AI
  aiAdvisor: boolean;
  aiFurnish: boolean;
  complianceChecks: boolean;
  // Export
  exportPdf: boolean;
  exportPng: boolean;
  exportSvg: boolean;
  exportBoq: boolean;
  exportPanorama: boolean;
  // Data
  sessionSave: boolean;
  supabaseSync: boolean;
  offlineMode: boolean;
  // Mobile
  touchGestures: boolean;
  // Admin
  adminPlans: boolean;
  adminCatalog: boolean;
  adminConfiguratorCatalog: boolean;
  adminAnalytics: boolean;
  adminPlanReview: boolean;
  adminFeatureToggle: boolean;
}

// ============================================================================
// Default Feature Flags
// ============================================================================

export const DEFAULT_FLAGS: FeatureFlags = {
  // Core
  planner2D: true,
  planner3D: true,
  // Editor
  catalogSidebar: true,
  inspectorPanel: true,
  layersPanel: true,
  measurementTool: true,
  zoneOverlays: true,
  floorPlanImport: false,
  snapToGrid: true,
  snapToWall: true,
  // AI
  aiAdvisor: true,
  aiFurnish: true,
  complianceChecks: true,
  // Export
  exportPdf: true,
  exportPng: true,
  exportSvg: true,
  exportBoq: true,
  exportPanorama: false,
  // Data
  sessionSave: true,
  supabaseSync: true,
  offlineMode: true,
  // Mobile
  touchGestures: true,
  // Admin
  adminPlans: true,
  adminCatalog: true,
  adminConfiguratorCatalog: true,
  adminAnalytics: true,
  adminPlanReview: true,
  adminFeatureToggle: true,
};

// ============================================================================
// Flag Groups
// ============================================================================

export const FLAG_GROUPS = {
  core: ["planner2D", "planner3D"] as const,
  editor: [
    "catalogSidebar",
    "inspectorPanel",
    "layersPanel",
    "measurementTool",
    "zoneOverlays",
    "floorPlanImport",
    "snapToGrid",
    "snapToWall",
  ] as const,
  ai: ["aiAdvisor", "aiFurnish", "complianceChecks"] as const,
  export: ["exportPdf", "exportPng", "exportSvg", "exportBoq", "exportPanorama"] as const,
  data: ["sessionSave", "supabaseSync", "offlineMode"] as const,
  mobile: ["touchGestures"] as const,
  admin: ["adminPlans", "adminCatalog", "adminConfiguratorCatalog", "adminAnalytics", "adminPlanReview", "adminFeatureToggle"] as const,
  
} as const;

// ============================================================================
// Local Storage Key
// ============================================================================

const LOCAL_STORAGE_KEY = "oofpl-feature-flags";

// ============================================================================
// In-Memory Cache
// ============================================================================

let cachedFlags: FeatureFlags | null = null;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Returns cached flags (localStorage + defaults + best-effort remote hydrate)
 */
export function getFeatureFlags(): FeatureFlags {
  // Return in-memory cache if available
  if (cachedFlags) {
    return cachedFlags;
  }

  // Try to read from localStorage
  const stored = getFlagsFromLocalStorage();
  if (stored) {
    cachedFlags = { ...DEFAULT_FLAGS, ...stored };
  } else {
    cachedFlags = { ...DEFAULT_FLAGS };
  }

  if (typeof window !== "undefined") {
    void fetchFeatureFlagsFromSupabase().then((remoteFlags) => {
      if (!remoteFlags || !cachedFlags) {
        return;
      }
      cachedFlags = { ...cachedFlags, ...remoteFlags };
    });
  }

  return cachedFlags;
}

/**
 * Fetches flags from localStorage
 */
function getFlagsFromLocalStorage(): Partial<FeatureFlags> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    return parsed as Partial<FeatureFlags>;
  } catch (error) {
    console.error("Failed to parse feature flags from localStorage:", error);
    return null;
  }
}

/**
 * Sets flags in localStorage and updates cache
 */
export function setFeatureFlags(flags: Partial<FeatureFlags>): void {
  const currentFlags = getFeatureFlags();
  const updatedFlags = { ...currentFlags, ...flags };

  // Update in-memory cache
  cachedFlags = updatedFlags;

  // Save to localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedFlags));
    } catch (error) {
      console.error("Failed to save feature flags to localStorage:", error);
    }
  }
}

/**
 * Resets flags to defaults and clears cache
 */
export function resetFeatureFlags(): void {
  cachedFlags = null;

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear feature flags from localStorage:", error);
    }
  }
}

/**
 * Checks if a specific feature flag is enabled
 */
export function isFeatureEnabled(flag: FeatureFlagName): boolean {
  const flags = getFeatureFlags();
  return flags[flag] ?? false;
}

/**
 * Gets all flags in a specific group
 */
export function getFlagsInGroup(group: keyof typeof FLAG_GROUPS): Partial<FeatureFlags> {
  const flags = getFeatureFlags();
  const groupFlags = FLAG_GROUPS[group];
  const result: Partial<FeatureFlags> = {};

  for (const flag of groupFlags) {
    result[flag] = flags[flag];
  }

  return result;
}

/**
 * Checks if any flag in a group is enabled
 */
export function isAnyFlagInGroupEnabled(group: keyof typeof FLAG_GROUPS): boolean {
  const groupFlags = FLAG_GROUPS[group];
  return groupFlags.some((flag) => isFeatureEnabled(flag));
}

/**
 * Checks if all flags in a group are enabled
 */
export function areAllFlagsInGroupEnabled(group: keyof typeof FLAG_GROUPS): boolean {
  const groupFlags = FLAG_GROUPS[group];
  return groupFlags.every((flag) => isFeatureEnabled(flag));
}

// ============================================================================
// Supabase Integration
// ============================================================================

export async function fetchFeatureFlagsFromSupabase(): Promise<Partial<FeatureFlags> | null> {
  try {
    const response = await browserApiFetch(apiPath("/api/admin/features"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("Failed to fetch feature flags from Supabase:", response.statusText);
      return null;
    }

    const data = await response.json();
    const flags = (data.flags || {}) as Partial<FeatureFlags>;

    setFeatureFlags(flags);
    return flags;
  } catch (error) {
    console.error("Error fetching feature flags from Supabase:", error);
    return null;
  }
}

/**
 * Updates a feature flag in Supabase via the admin API
 * This requires admin authentication
 */
export async function updateFeatureFlagInSupabase(
  key: FeatureFlagName,
  enabled: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await browserApiFetch(apiPath("/api/admin/features"), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        updates: {
          [key]: enabled,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || response.statusText,
      };
    }

    // Update local cache immediately
    setFeatureFlags({ [key]: enabled });

    return { success: true };
  } catch (error) {
    console.error("Error updating feature flag in Supabase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Batch updates multiple feature flags in Supabase
 */
export async function updateMultipleFeatureFlagsInSupabase(
  updates: Partial<Record<FeatureFlagName, boolean>>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await browserApiFetch(apiPath("/api/admin/features"), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        updates,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || response.statusText,
      };
    }

    // Update local cache immediately
    setFeatureFlags(updates);

    return { success: true };
  } catch (error) {
    console.error("Error updating multiple feature flags in Supabase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets all flag names
 */
export function getAllFlagNames(): FeatureFlagName[] {
  return Object.keys(DEFAULT_FLAGS) as FeatureFlagName[];
}

/**
 * Gets flag metadata for admin display
 */
export function getFlagMetadata(flag: FeatureFlagName): {
  name: FeatureFlagName;
  group: string;
  defaultValue: boolean;
  description: string;
} {
  const metadata: Record<
    FeatureFlagName,
    { group: string; description: string }
  > = {
    // Core
    planner2D: { group: "Core", description: "2D Planner (Fabric)" },
    planner3D: { group: "Core", description: "3D Viewer (R3F)" },
    // Editor
    catalogSidebar: { group: "Editor", description: "Furniture catalog panel" },
    inspectorPanel: { group: "Editor", description: "Property inspector" },
    layersPanel: { group: "Editor", description: "Layer management" },
    measurementTool: { group: "Editor", description: "Dimension lines" },
    zoneOverlays: { group: "Editor", description: "Zone shapes" },
    floorPlanImport: { group: "Editor", description: "Floor plan import" },
    snapToGrid: { group: "Editor", description: "Grid snapping" },
    snapToWall: { group: "Editor", description: "Wall snapping" },
    // AI
    aiAdvisor: { group: "AI", description: "AI design assistant" },
    aiFurnish: { group: "AI", description: "AI auto-furnish" },
    complianceChecks: { group: "AI", description: "Compliance validation" },
    // Export
    exportPdf: { group: "Export", description: "PDF exports" },
    exportPng: { group: "Export", description: "PNG images" },
    exportSvg: { group: "Export", description: "SVG vector" },
    exportBoq: { group: "Export", description: "BOQ CSV/JSON" },
    exportPanorama: { group: "Export", description: "3D panorama" },
    // Data
    sessionSave: { group: "Data", description: "localStorage saves" },
    supabaseSync: { group: "Data", description: "Supabase persistence" },
    offlineMode: { group: "Data", description: "Service worker + IndexedDB" },
    // Mobile
    touchGestures: { group: "Mobile", description: "Touch gesture support" },
    // Admin
    adminPlans: { group: "Admin", description: "Plans dashboard" },
    adminCatalog: { group: "Admin", description: "Catalog CRUD" },
    adminConfiguratorCatalog: { group: "Admin", description: "Configurator catalog CRUD" },
    adminAnalytics: { group: "Admin", description: "Analytics dashboard" },
    adminPlanReview: { group: "Admin", description: "Plan review/comments" },
    adminFeatureToggle: { group: "Admin", description: "Feature toggle page" },
  };

  const meta = metadata[flag];
  return {
    name: flag,
    group: meta.group,
    defaultValue: DEFAULT_FLAGS[flag],
    description: meta.description,
  };
}

/**
 * Gets all flags grouped for admin display
 */
export function getAllFlagsGrouped(): Array<{
  group: string;
  flags: Array<{
    name: FeatureFlagName;
    defaultValue: boolean;
    description: string;
  }>;
}> {
  const groups: Record<
    string,
    Array<{
      name: FeatureFlagName;
      defaultValue: boolean;
      description: string;
    }>
  > = {};

  for (const flag of getAllFlagNames()) {
    const meta = getFlagMetadata(flag);
    if (!groups[meta.group]) {
      groups[meta.group] = [];
    }
    groups[meta.group].push({
      name: meta.name,
      defaultValue: meta.defaultValue,
      description: meta.description,
    });
  }

  return Object.entries(groups).map(([group, flags]) => ({ group, flags }));
}
