import { PLANNER_DOCUMENT_SCHEMA_VERSION, type PlannerDocument } from "../model";

export const LOCAL_CURRENT_DRAFT_ID = "current";
export const VIEWER_PREVIEW_DRAFT_ID = "viewer-preview";

export function formatPlannerSavedPlanTimestamp(value?: string) {
  if (!value) return "No timestamp";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function sanitizePlannerPlanName(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "Untitled plan";
}

export function createPlannerExportPayload(document: PlannerDocument) {
  return {
    type: "planner-document",
    schemaVersion: PLANNER_DOCUMENT_SCHEMA_VERSION,
    document,
  };
}

export function buildPlannerToolbarSessionStateLabel({
  sessionBusy,
  sessionErrorMessage,
  sessionStatusMessage,
  activeDocumentId,
}: {
  sessionBusy: boolean;
  sessionErrorMessage: string | null;
  sessionStatusMessage: string | null;
  activeDocumentId: string | null;
}) {
  if (sessionBusy) {
    return "Updating planner sessions...";
  }

  if (sessionErrorMessage) {
    return "Session attention needed. Open Plan Sessions for details.";
  }

  if (sessionStatusMessage) {
    return sessionStatusMessage;
  }

  return activeDocumentId
    ? "Saved session attached. Open Plan Sessions to load, branch, or import."
    : "Unsaved workspace. Save a draft or open Plan Sessions to start a named document.";
}
