"use client";

import { trackEvent, PLANNER_EVENTS } from "./amplitude";

/**
 * Analytics event vocabulary for the OOFPL planner.
 * 
 * This module provides typed event tracking functions that wrap the underlying
 * Amplitude SDK. All events strip PII and include only the documented fields.
 * 
 * @see Requirements 29 (Analytics Vocabulary Expansion)
 */

// ============================================================================
// Event Types
// ============================================================================

export type ExportFormat = "pdf" | "svg" | "png" | "json" | "csv" | "zip";
export type ExportPreset = "client_deliverable" | "internal";
export type MaterialPreset = "wood" | "concrete" | "fabric";
export type LightingPreset = "day" | "night" | "dusk";
export type Unit = "mm" | "cm" | "m" | "inch" | "ft";
export type SortOption = "name" | "last_edited" | "quote_status";
export type FavoriteAction = "add" | "remove";
export type VersionAction = "view" | "restore";
export type ThemeMode = "light" | "dark";

// ============================================================================
// Extended Event Names
// ============================================================================

export const ANALYTICS_EVENTS = {
  // Existing events (re-exported for convenience)
  ...PLANNER_EVENTS,

  // Tool usage (REQ-29.1)
  TOOL_USED: "tool_used",

  // Funnel tracking (REQ-29.2)
  FUNNEL_DROP_OFF: "funnel_drop_off",

  // Session lifecycle (REQ-29.3)
  SESSION_STARTED: "session_started",
  SESSION_ENDED: "session_ended",

  // Error tracking (REQ-17)
  RENDER_ERROR: "render_error",

  // Template selection
  TEMPLATE_SELECTED: "template_selected",
  TEMPLATE_PREVIEW: "template_preview",

  // Export actions
  EXPORT_PDF: "export_pdf",
  EXPORT_SVG: "export_svg",
  EXPORT_PNG: "export_png",
  EXPORT_JSON: "export_json",
  EXPORT_CSV: "export_csv",
  EXPORT_ZIP: "export_zip",
  EXPORT_PRESET_USED: "export_preset_used",

  // Search and filter
  SEARCH_USED: "search_used",
  SORT_CHANGED: "sort_changed",
  TAG_FILTER_USED: "tag_filter_used",

  // Favorites
  FAVORITE_TOGGLED: "favorite_toggled",
  FAVORITES_TAB_VIEWED: "favorites_tab_viewed",

  // Version history
  VERSION_HISTORY_OPENED: "version_history_opened",
  VERSION_RESTORED: "version_restored",

  // Theme toggle
  THEME_TOGGLED: "theme_toggled",

  // Unit preference
  UNIT_PREFERENCE_CHANGED: "unit_preference_changed",

  // 3D presets
  MATERIAL_PRESET_CHANGED: "material_preset_changed",
  LIGHTING_PRESET_CHANGED: "lighting_preset_changed",

  // Bulk actions
  BULK_ACTION_USED: "bulk_action_used",

  // Comments
  COMMENT_VIEWED: "comment_viewed",
  COMMENT_PIN_CLICKED: "comment_pin_clicked",

  // Conflict resolution
  CONFLICT_DETECTED: "conflict_detected",
  CONFLICT_RESOLVED: "conflict_resolved",
} as const;

// ============================================================================
// Payload Types
// ============================================================================

interface BasePayload {
  timestamp?: number;
}

interface ToolUsedPayload extends BasePayload {
  tool: string;
  source?: "toolbar" | "keyboard" | "context_menu";
}

interface FunnelDropOffPayload extends BasePayload {
  route: string;
  hadUnsavedChanges: boolean;
  timeOnPage?: number;
}

interface SessionPayload extends BasePayload {
  sessionId: string;
  durationSeconds?: number;
}

interface RenderErrorPayload extends BasePayload {
  route: string;
  errorName: string;
  errorMessage: string; // Sanitized, max 500 chars
}

interface TemplatePayload extends BasePayload {
  templateId: string;
  templateName?: string;
}

interface ExportPayload extends BasePayload {
  format: ExportFormat;
  preset?: ExportPreset;
  success: boolean;
  errorReason?: string;
}

interface SearchPayload extends BasePayload {
  context: "dashboard" | "portal";
  queryLength: number;
  resultCount: number;
}

interface SortPayload extends BasePayload {
  context: "dashboard" | "portal";
  sortOption: SortOption;
}

interface TagFilterPayload extends BasePayload {
  tagCount: number;
  resultCount: number;
}

interface FavoritePayload extends BasePayload {
  action: FavoriteAction;
  itemId: string;
  itemCategory?: string;
}

interface VersionPayload extends BasePayload {
  action: VersionAction;
  snapshotId?: string;
  snapshotAge?: number; // seconds since snapshot was created
}

interface ThemePayload extends BasePayload {
  mode: ThemeMode;
  context: "admin" | "editor";
}

interface UnitPayload extends BasePayload {
  previousUnit: Unit;
  newUnit: Unit;
}

interface MaterialPresetPayload extends BasePayload {
  preset: MaterialPreset;
  itemId: string;
}

interface BulkActionPayload extends BasePayload {
  action: "archive" | "delete" | "export_boq";
  itemCount: number;
}

interface ConflictPayload extends BasePayload {
  resolution?: "keep_mine" | "keep_theirs" | "merge";
}

// ============================================================================
// PII Sanitization
// ============================================================================

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IP_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const PHONE_REGEX = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;

/**
 * Strips PII from a string value.
 * Removes emails, IP addresses, and phone numbers.
 */
function stripPII(value: string): string {
  return value
    .replace(EMAIL_REGEX, "[email]")
    .replace(IP_REGEX, "[ip]")
    .replace(PHONE_REGEX, "[phone]");
}

/**
 * Sanitizes an error message for analytics.
 * Strips PII and truncates to max 500 characters.
 */
function sanitizeErrorMessage(message: string): string {
  const stripped = stripPII(message);
  return stripped.length > 500 ? stripped.slice(0, 497) + "..." : stripped;
}

/**
 * Sanitizes a route path for analytics.
 * Strips PII and truncates to max 256 characters.
 */
function sanitizeRoute(route: string): string {
  const stripped = stripPII(route);
  return stripped.length > 256 ? stripped.slice(0, 253) + "..." : stripped;
}

// ============================================================================
// Typed Track Functions
// ============================================================================

/**
 * Generic typed track function.
 * Adds timestamp to all events.
 */
export function track<T extends Record<string, unknown>>(
  eventName: string,
  payload?: T
): void {
  const enrichedPayload = {
    ...payload,
    timestamp: Date.now(),
  };
  trackEvent(eventName, enrichedPayload as Record<string, string | number | boolean>);
}

// ============================================================================
// Tool Usage Events
// ============================================================================

/**
 * Track when a tool is used from the toolbar.
 * @see REQ-29.1
 */
export function trackToolUsed(payload: ToolUsedPayload): void {
  track(ANALYTICS_EVENTS.TOOL_USED, {
    tool: payload.tool,
    source: payload.source ?? "toolbar",
  });
}

// ============================================================================
// Funnel Events
// ============================================================================

/**
 * Track when a user drops off before saving.
 * @see REQ-29.2
 */
export function trackFunnelDropOff(payload: FunnelDropOffPayload): void {
  track(ANALYTICS_EVENTS.FUNNEL_DROP_OFF, {
    route: sanitizeRoute(payload.route),
    hadUnsavedChanges: payload.hadUnsavedChanges,
    timeOnPage: payload.timeOnPage,
  });
}

// ============================================================================
// Session Events
// ============================================================================

/**
 * Track session start.
 * @see REQ-29.3
 */
export function trackSessionStarted(sessionId: string): void {
  track(ANALYTICS_EVENTS.SESSION_STARTED, { sessionId });
}

/**
 * Track session end.
 * @see REQ-29.3
 */
export function trackSessionEnded(payload: SessionPayload): void {
  track(ANALYTICS_EVENTS.SESSION_ENDED, {
    sessionId: payload.sessionId,
    durationSeconds: payload.durationSeconds,
  });
}

// ============================================================================
// Error Events
// ============================================================================

/**
 * Track render errors caught by ErrorBoundary.
 * @see REQ-17.6
 */
export function trackRenderError(payload: RenderErrorPayload): void {
  track(ANALYTICS_EVENTS.RENDER_ERROR, {
    route: sanitizeRoute(payload.route),
    errorName: payload.errorName,
    errorMessage: sanitizeErrorMessage(payload.errorMessage),
  });
}

// ============================================================================
// Template Events
// ============================================================================

/**
 * Track when a template is selected.
 */
export function trackTemplateSelected(payload: TemplatePayload): void {
  track(ANALYTICS_EVENTS.TEMPLATE_SELECTED, {
    templateId: payload.templateId,
    templateName: payload.templateName,
  });
}

/**
 * Track when a template is previewed.
 */
export function trackTemplatePreview(templateId: string): void {
  track(ANALYTICS_EVENTS.TEMPLATE_PREVIEW, { templateId });
}

// ============================================================================
// Export Events
// ============================================================================

/**
 * Track export actions with format-specific events.
 */
export function trackExportAction(payload: ExportPayload): void {
  const eventMap: Record<ExportFormat, string> = {
    pdf: ANALYTICS_EVENTS.EXPORT_PDF,
    svg: ANALYTICS_EVENTS.EXPORT_SVG,
    png: ANALYTICS_EVENTS.EXPORT_PNG,
    json: ANALYTICS_EVENTS.EXPORT_JSON,
    csv: ANALYTICS_EVENTS.EXPORT_CSV,
    zip: ANALYTICS_EVENTS.EXPORT_ZIP,
  };

  track(eventMap[payload.format], {
    success: payload.success,
    errorReason: payload.errorReason,
  });
}

/**
 * Track when an export preset is used.
 */
export function trackExportPresetUsed(preset: ExportPreset, success: boolean): void {
  track(ANALYTICS_EVENTS.EXPORT_PRESET_USED, { preset, success });
}

// ============================================================================
// Search and Filter Events
// ============================================================================

/**
 * Track search usage.
 */
export function trackSearchUsed(payload: SearchPayload): void {
  track(ANALYTICS_EVENTS.SEARCH_USED, {
    context: payload.context,
    queryLength: payload.queryLength,
    resultCount: payload.resultCount,
  });
}

/**
 * Track sort option changes.
 */
export function trackSortChanged(payload: SortPayload): void {
  track(ANALYTICS_EVENTS.SORT_CHANGED, {
    context: payload.context,
    sortOption: payload.sortOption,
  });
}

/**
 * Track tag filter usage.
 */
export function trackTagFilterUsed(payload: TagFilterPayload): void {
  track(ANALYTICS_EVENTS.TAG_FILTER_USED, {
    tagCount: payload.tagCount,
    resultCount: payload.resultCount,
  });
}

// ============================================================================
// Favorites Events
// ============================================================================

/**
 * Track favorite toggle actions.
 */
export function trackFavoriteToggled(payload: FavoritePayload): void {
  track(ANALYTICS_EVENTS.FAVORITE_TOGGLED, {
    action: payload.action,
    itemId: payload.itemId,
    itemCategory: payload.itemCategory,
  });
}

/**
 * Track when favorites tab is viewed.
 */
export function trackFavoritesTabViewed(): void {
  track(ANALYTICS_EVENTS.FAVORITES_TAB_VIEWED, {});
}

// ============================================================================
// Version History Events
// ============================================================================

/**
 * Track version history panel opened.
 */
export function trackVersionHistoryOpened(): void {
  track(ANALYTICS_EVENTS.VERSION_HISTORY_OPENED, {});
}

/**
 * Track version restore action.
 */
export function trackVersionRestored(payload: VersionPayload): void {
  track(ANALYTICS_EVENTS.VERSION_RESTORED, {
    snapshotId: payload.snapshotId,
    snapshotAge: payload.snapshotAge,
  });
}

// ============================================================================
// Theme Events
// ============================================================================

/**
 * Track theme toggle.
 */
export function trackThemeToggled(payload: ThemePayload): void {
  track(ANALYTICS_EVENTS.THEME_TOGGLED, {
    mode: payload.mode,
    context: payload.context,
  });
}

// ============================================================================
// Unit Preference Events
// ============================================================================

/**
 * Track unit preference changes.
 */
export function trackUnitPreferenceChanged(payload: UnitPayload): void {
  track(ANALYTICS_EVENTS.UNIT_PREFERENCE_CHANGED, {
    previousUnit: payload.previousUnit,
    newUnit: payload.newUnit,
  });
}

// ============================================================================
// 3D Preset Events
// ============================================================================

/**
 * Track material preset changes.
 */
export function trackMaterialPresetChanged(payload: MaterialPresetPayload): void {
  track(ANALYTICS_EVENTS.MATERIAL_PRESET_CHANGED, {
    preset: payload.preset,
    itemId: payload.itemId,
  });
}

/**
 * Track lighting preset changes.
 */
export function trackLightingPresetChanged(preset: LightingPreset): void {
  track(ANALYTICS_EVENTS.LIGHTING_PRESET_CHANGED, { preset });
}

// ============================================================================
// Bulk Action Events
// ============================================================================

/**
 * Track bulk actions in portal.
 */
export function trackBulkActionUsed(payload: BulkActionPayload): void {
  track(ANALYTICS_EVENTS.BULK_ACTION_USED, {
    action: payload.action,
    itemCount: payload.itemCount,
  });
}

// ============================================================================
// Comment Events
// ============================================================================

/**
 * Track comment viewed.
 */
export function trackCommentViewed(commentId: string): void {
  track(ANALYTICS_EVENTS.COMMENT_VIEWED, { commentId });
}

/**
 * Track comment pin clicked.
 */
export function trackCommentPinClicked(commentId: string, shapeId: string): void {
  track(ANALYTICS_EVENTS.COMMENT_PIN_CLICKED, { commentId, shapeId });
}

// ============================================================================
// Conflict Events
// ============================================================================

/**
 * Track conflict detected.
 */
export function trackConflictDetected(): void {
  track(ANALYTICS_EVENTS.CONFLICT_DETECTED, {});
}

/**
 * Track conflict resolved.
 */
export function trackConflictResolved(resolution: ConflictPayload["resolution"]): void {
  track(ANALYTICS_EVENTS.CONFLICT_RESOLVED, { resolution });
}
