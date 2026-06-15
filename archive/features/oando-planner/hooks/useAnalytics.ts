"use client";
import { useEffect, useRef, useCallback } from "react";
import { initAmplitude, trackEvent, PLANNER_EVENTS } from "../lib/amplitude";
import { initDevRevPlug } from "../lib/devrev";
import { usePlannerStore } from "../data/plannerStore";
import {
  trackToolUsed,
  trackSessionStarted,
  trackSessionEnded,
  trackFunnelDropOff,
  trackTemplateSelected,
  trackExportAction,
  trackExportPresetUsed,
  trackSearchUsed,
  trackSortChanged,
  trackTagFilterUsed,
  trackFavoriteToggled,
  trackFavoritesTabViewed,
  trackVersionHistoryOpened,
  trackVersionRestored,
  trackThemeToggled,
  trackUnitPreferenceChanged,
  trackMaterialPresetChanged,
  trackLightingPresetChanged,
  trackBulkActionUsed,
  trackRenderError,
  type ExportFormat,
  type ExportPreset,
  type SortOption,
  type FavoriteAction,
  type ThemeMode,
  type Unit,
  type MaterialPreset,
  type LightingPreset,
} from "../lib/analyticsEvents";

// Session timeout for inactivity (30 minutes in ms)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Generate a unique session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Main analytics hook for the planner.
 * Handles session lifecycle, tool tracking, and funnel drop-off detection.
 * 
 * @see REQ-29 (Analytics Vocabulary Expansion)
 */
export function useAnalytics() {
  const initRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
// eslint-disable-next-line react-hooks/purity
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInteractedRef = useRef(false);
  
  const tool = usePlannerStore((s) => s.tool);
  const prevToolRef = useRef(tool);
  const isDirty = usePlannerStore((s) => s.isDirty);
  const lastSavedAt = usePlannerStore((s) => s.lastSavedAt);

  // Start a new session
  const startSession = useCallback(() => {
    if (sessionIdRef.current) return; // Already have a session
    
    const sessionId = generateSessionId();
    sessionIdRef.current = sessionId;
    sessionStartTimeRef.current = Date.now();
    trackSessionStarted(sessionId);
  }, []);

  // End the current session
  const endSession = useCallback(() => {
    if (!sessionIdRef.current || !sessionStartTimeRef.current) return;
    
    const durationSeconds = Math.floor(
      (Date.now() - sessionStartTimeRef.current) / 1000
    );
    
    trackSessionEnded({
      sessionId: sessionIdRef.current,
      durationSeconds,
    });
    
    sessionIdRef.current = null;
    sessionStartTimeRef.current = null;
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    inactivityTimerRef.current = setTimeout(() => {
      // 30 minutes of inactivity - end session
      endSession();
    }, SESSION_TIMEOUT_MS);
  }, [endSession]);

  // Handle user interaction (starts session on first interaction)
  const handleInteraction = useCallback(() => {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      startSession();
    }
    resetInactivityTimer();
  }, [startSession, resetInactivityTimer]);

  // Initialize analytics
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    initAmplitude();
    initDevRevPlug();
    trackEvent(PLANNER_EVENTS.SESSION_START);
  }, []);

  // Set up interaction listeners for session tracking
  useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    
    events.forEach((event) => {
      window.addEventListener(event, handleInteraction, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleInteraction);
      });
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [handleInteraction]);

  // Handle tab close / navigation away - funnel drop-off and session end
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Track funnel drop-off if user has unsaved changes and never saved
      if (isDirty && !lastSavedAt) {
        trackFunnelDropOff({
          route: typeof window !== "undefined" ? window.location.pathname : "",
          hadUnsavedChanges: true,
          timeOnPage: sessionStartTimeRef.current
            ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
            : undefined,
        });
      }
      
      // End session on tab close
      endSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, lastSavedAt, endSession]);

  // Track tool changes
  useEffect(() => {
    if (prevToolRef.current !== tool) {
      trackEvent(PLANNER_EVENTS.TOOL_SELECTED, { tool });
      trackToolUsed({ tool, source: "toolbar" });
      prevToolRef.current = tool;
    }
  }, [tool]);
}

// ============================================================================
// Legacy exports (maintained for backward compatibility)
// ============================================================================

export function trackSave() {
  trackEvent(PLANNER_EVENTS.PROJECT_SAVED);
}

export function trackExport(format: string) {
  trackEvent(PLANNER_EVENTS.EXPORT_STARTED, { format });
}

export function trackAIAssist() {
  trackEvent(PLANNER_EVENTS.AI_ASSIST_USED);
}

// ============================================================================
// New typed exports for expanded analytics vocabulary
// ============================================================================

/**
 * Track template selection from the template picker.
 */
export function trackTemplateSelection(templateId: string, templateName?: string) {
  trackTemplateSelected({ templateId, templateName });
}

/**
 * Track export actions with specific format.
 */
export function trackExportWithFormat(
  format: ExportFormat,
  success: boolean,
  errorReason?: string
) {
  trackExportAction({ format, success, errorReason });
}

/**
 * Track export preset usage (Client deliverable / Internal).
 */
export function trackExportPreset(preset: ExportPreset, success: boolean) {
  trackExportPresetUsed(preset, success);
}

/**
 * Track search usage in dashboard or portal.
 */
export function trackSearch(
  context: "dashboard" | "portal",
  queryLength: number,
  resultCount: number
) {
  trackSearchUsed({ context, queryLength, resultCount });
}

/**
 * Track sort option change.
 */
export function trackSort(context: "dashboard" | "portal", sortOption: SortOption) {
  trackSortChanged({ context, sortOption });
}

/**
 * Track tag filter usage.
 */
export function trackTagFilter(tagCount: number, resultCount: number) {
  trackTagFilterUsed({ tagCount, resultCount });
}

/**
 * Track favorite toggle action.
 */
export function trackFavorite(
  action: FavoriteAction,
  itemId: string,
  itemCategory?: string
) {
  trackFavoriteToggled({ action, itemId, itemCategory });
}

/**
 * Track favorites tab view.
 */
export function trackFavoritesView() {
  trackFavoritesTabViewed();
}

/**
 * Track version history panel opened.
 */
export function trackVersionHistory() {
  trackVersionHistoryOpened();
}

/**
 * Track version restore action.
 */
export function trackVersionRestore(snapshotId: string, snapshotAge?: number) {
  trackVersionRestored({ action: "restore", snapshotId, snapshotAge });
}

/**
 * Track theme toggle.
 */
export function trackThemeChange(mode: ThemeMode, context: "admin" | "editor") {
  trackThemeToggled({ mode, context });
}

/**
 * Track unit preference change.
 */
export function trackUnitChange(previousUnit: Unit, newUnit: Unit) {
  trackUnitPreferenceChanged({ previousUnit, newUnit });
}

/**
 * Track material preset change.
 */
export function trackMaterialChange(preset: MaterialPreset, itemId: string) {
  trackMaterialPresetChanged({ preset, itemId });
}

/**
 * Track lighting preset change.
 */
export function trackLightingChange(preset: LightingPreset) {
  trackLightingPresetChanged(preset);
}

/**
 * Track bulk action usage.
 */
export function trackBulkAction(
  action: "archive" | "delete" | "export_boq",
  itemCount: number
) {
  trackBulkActionUsed({ action, itemCount });
}

/**
 * Track render error for ErrorBoundary.
 */
export function trackError(route: string, errorName: string, errorMessage: string) {
  trackRenderError({ route, errorName, errorMessage });
}

// Re-export types for consumers
export type {
  ExportFormat,
  ExportPreset,
  SortOption,
  FavoriteAction,
  ThemeMode,
  Unit,
  MaterialPreset,
  LightingPreset,
};
