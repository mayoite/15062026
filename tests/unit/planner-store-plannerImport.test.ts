import { describe, expect, it, vi } from "vitest";

import { createPlannerDocument } from "@/features/planner/model";
import {
  parsePlannerDocumentImportText,
  parsePlannerDocumentImportFile,
  parsePlannerDocumentImportValue,
  validatePlannerDocumentImportText,
  validatePlannerDocumentImportValue,
} from "@/features/planner/persistence";
import {
  computePlannerPortalItemCount,
  buildPlannerDocumentFromPortalPublishData,
} from "@/features/planner/store/plannerPublish";

const validEnvelope = {
  type: "planner-document",
  document: createPlannerDocument({ title: "Imported Plan", sceneJson: { walls: [] } }),
};

describe("planner import and publish helpers", () => {
  it("parses valid import text and values", () => {
    const parsed = parsePlannerDocumentImportText(JSON.stringify(validEnvelope));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.document.title).toBe("Imported Plan");
    }
    expect(parsePlannerDocumentImportValue(validEnvelope).ok).toBe(true);
  });

  it("returns parse errors for invalid JSON", () => {
    const result = parsePlannerDocumentImportText("{");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }

    const parseSpy = vi.spyOn(JSON, "parse").mockImplementation(() => {
      throw "bad json";
    });
    const nonError = parsePlannerDocumentImportText("{}");
    expect(nonError.ok).toBe(false);
    if (!nonError.ok) {
      expect(nonError.errors[0]).toBe("Invalid planner import JSON.");
    }
    parseSpy.mockRestore();
  });

  it("validates import text and surfaces validation failures", () => {
    const valid = validatePlannerDocumentImportText(JSON.stringify(validEnvelope));
    expect(valid.valid).toBe(true);

    const invalid = validatePlannerDocumentImportText("{");
    expect(invalid.valid).toBe(false);

    const validateSpy = vi.spyOn(JSON, "parse").mockImplementation(() => {
      throw "bad json";
    });
    expect(validatePlannerDocumentImportText("{}").valid).toBe(false);
    validateSpy.mockRestore();

    const valueResult = validatePlannerDocumentImportValue({ bad: true });
    expect(valueResult.valid).toBe(false);
  });

  it("parses import files via File.text()", async () => {
    const file = new File([JSON.stringify(validEnvelope)], "plan.json", { type: "application/json" });
    const result = await parsePlannerDocumentImportFile(file);
    expect(result.ok).toBe(true);
  });

  it("builds portal publish documents with trimmed titles and counts", () => {
    const data = {
      projectName: "  Portal Plan  ",
      walls: [{ id: "w1" }],
      rooms: [{ id: "r1" }],
      furniture: [{ id: "f1" }, { id: "f2" }],
      doors: [],
      windows: [],
      measurements: [],
      zones: [],
      textLabels: [],
      structuralElements: [],
      backgroundImage: null,
    };
    expect(computePlannerPortalItemCount(data)).toBe(4);

    const doc = buildPlannerDocumentFromPortalPublishData(data, {
      status: "active",
      now: "2026-06-15T00:00:00.000Z",
    });
    expect(doc.title).toBe("Portal Plan");
    expect(doc.itemCount).toBe(4);
    expect(doc.status).toBe("active");
    expect(doc.updatedAt).toBe("2026-06-15T00:00:00.000Z");
  });

  it("defaults untitled portal publish names", () => {
    const doc = buildPlannerDocumentFromPortalPublishData({
      projectName: "   ",
      walls: [],
      rooms: [],
      furniture: [],
      doors: [],
      windows: [],
      measurements: [],
      zones: [],
      textLabels: [],
      structuralElements: [],
      backgroundImage: null,
    });
    expect(doc.title).toBe("Untitled Project");
  });
});
