import { describe, expect, it } from "vitest";

import { createPlannerDocument } from "@/features/planner/model";
import {
  LOCAL_CURRENT_DRAFT_ID,
  VIEWER_PREVIEW_DRAFT_ID,
  buildPlannerToolbarSessionStateLabel,
  createPlannerExportPayload,
  formatPlannerSavedPlanTimestamp,
  sanitizePlannerPlanName,
} from "@/features/planner/lib/sessionState";

describe("planner session state helpers", () => {
  it("exports draft id constants", () => {
    expect(LOCAL_CURRENT_DRAFT_ID).toBe("current");
    expect(VIEWER_PREVIEW_DRAFT_ID).toBe("viewer-preview");
  });

  it("formats valid timestamps and falls back for invalid values", () => {
    const formatted = formatPlannerSavedPlanTimestamp("2026-06-14T12:00:00.000Z");
    expect(formatted).toMatch(/Jun/);
    expect(formatPlannerSavedPlanTimestamp()).toBe("No timestamp");
    expect(formatPlannerSavedPlanTimestamp("not-a-date")).toBe("not-a-date");
  });

  it("sanitizes blank plan names to Untitled plan", () => {
    expect(sanitizePlannerPlanName("  North Bay  ")).toBe("North Bay");
    expect(sanitizePlannerPlanName("   ")).toBe("Untitled plan");
  });

  it("wraps planner documents in export payloads", () => {
    const document = createPlannerDocument({ name: "Export Me" });
    const payload = createPlannerExportPayload(document);

    expect(payload.type).toBe("planner-document");
    expect(payload.document.name).toBe("Export Me");
    expect(payload.schemaVersion).toBe(1);
  });

  it("builds toolbar session labels for busy, error, status, and idle states", () => {
    expect(
      buildPlannerToolbarSessionStateLabel({
        sessionBusy: true,
        sessionErrorMessage: null,
        sessionStatusMessage: null,
        activeDocumentId: null,
      }),
    ).toBe("Updating planner sessions...");

    expect(
      buildPlannerToolbarSessionStateLabel({
        sessionBusy: false,
        sessionErrorMessage: "Network down",
        sessionStatusMessage: null,
        activeDocumentId: "doc-1",
      }),
    ).toBe("Session attention needed. Open Plan Sessions for details.");

    expect(
      buildPlannerToolbarSessionStateLabel({
        sessionBusy: false,
        sessionErrorMessage: null,
        sessionStatusMessage: "Synced just now",
        activeDocumentId: "doc-1",
      }),
    ).toBe("Synced just now");

    expect(
      buildPlannerToolbarSessionStateLabel({
        sessionBusy: false,
        sessionErrorMessage: null,
        sessionStatusMessage: null,
        activeDocumentId: "doc-1",
      }),
    ).toBe("Saved session attached. Open Plan Sessions to load, branch, or import.");

    expect(
      buildPlannerToolbarSessionStateLabel({
        sessionBusy: false,
        sessionErrorMessage: null,
        sessionStatusMessage: null,
        activeDocumentId: null,
      }),
    ).toBe("Unsaved workspace. Save a draft or open Plan Sessions to start a named document.");
  });
});
