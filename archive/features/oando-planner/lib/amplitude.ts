"use client";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type AmplitudeBrowserModule = typeof import("@amplitude/analytics-browser");

let amplitudeInstance: AmplitudeBrowserModule | null = null;
let initialized = false;

export async function initAmplitude() {
  if (initialized || typeof window === "undefined") return;
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey) return;

  try {
    const amp = await import(/* webpackIgnore: true */ "@amplitude/analytics-browser");
    amp.init(apiKey, undefined, {
      defaultTracking: {
        sessions: true,
        pageViews: true,
        formInteractions: false,
        fileDownloads: true,
      },
    });
    amplitudeInstance = amp;
    initialized = true;
  } catch {
    console.warn("Amplitude SDK not available");
  }
}

export function trackEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean>
) {
  if (!amplitudeInstance) return;
  amplitudeInstance.track(eventName, properties);
}

export function identifyUser(userId: string, traits?: Record<string, string>) {
  if (!amplitudeInstance) return;
  amplitudeInstance.setUserId(userId);
  if (traits) {
    const identify = new amplitudeInstance.Identify();
    Object.entries(traits).forEach(([k, v]) => identify.set(k, v));
    amplitudeInstance.identify(identify);
  }
}

export const PLANNER_EVENTS = {
  TOOL_SELECTED: "tool_selected",
  PROJECT_SAVED: "project_saved",
  PROJECT_LOADED: "project_loaded",
  EXPORT_STARTED: "export_started",
  WALL_DRAWN: "wall_drawn",
  ROOM_CREATED: "room_created",
  FURNITURE_PLACED: "furniture_placed",
  AI_ASSIST_USED: "ai_assist_used",
  VIEW_TOGGLED: "view_toggled",
  TEMPLATE_APPLIED: "template_applied",
  BOQ_GENERATED: "boq_generated",
  UNDO_REDO: "undo_redo",
  INTEGRATION_USED: "integration_used",
  SESSION_START: "session_start",
} as const;
