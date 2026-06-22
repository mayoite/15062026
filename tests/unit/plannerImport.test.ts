import { describe, expect, it } from "vitest";
import {
  parsePlannerDocumentImportText,
  parsePlannerDocumentImportFile,
  parsePlannerDocumentImportValue,
  validatePlannerDocumentImportText,
  validatePlannerDocumentImportValue,
} from "@/features/planner/persistence/plannerImport";
import { createPlannerDocument } from "../../features/planner/model";

describe("plannerImport", () => {
  describe("parsePlannerDocumentImportText", () => {
    it("parses valid JSON text", () => {
      const doc = createPlannerDocument();
      const text = JSON.stringify(doc);
      
      const result = parsePlannerDocumentImportText(text);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.document.id).toBe(doc.id);
      }
    });

    it("returns error on invalid JSON", () => {
      const result = parsePlannerDocumentImportText("invalid-json");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("returns error on invalid schema", () => {
      const text = JSON.stringify({ invalid: "data" });
      const result = parsePlannerDocumentImportText(text);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("parsePlannerDocumentImportFile", () => {
    it("parses a valid File", async () => {
      const doc = createPlannerDocument();
      const text = JSON.stringify(doc);
      const file = new File([text], "plan.json", { type: "application/json" });
      
      const result = await parsePlannerDocumentImportFile(file);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.document.id).toBe(doc.id);
      }
    });

    it("returns error on invalid File text", async () => {
      const file = new File(["invalid-json"], "plan.json", { type: "application/json" });
      const result = await parsePlannerDocumentImportFile(file);
      
      expect(result.ok).toBe(false);
    });
  });

  describe("parsePlannerDocumentImportValue", () => {
    it("parses a valid JS object", () => {
      const doc = createPlannerDocument();
      const result = parsePlannerDocumentImportValue(doc);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.document.id).toBe(doc.id);
      }
    });

    it("returns error on invalid object", () => {
      const result = parsePlannerDocumentImportValue({ invalid: "data" });
      expect(result.ok).toBe(false);
    });
  });

  describe("validatePlannerDocumentImportText", () => {
    it("validates valid JSON text", () => {
      const doc = createPlannerDocument();
      const text = JSON.stringify(doc);
      
      const result = validatePlannerDocumentImportText(text);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("invalidates malformed JSON", () => {
      const result = validatePlannerDocumentImportText("invalid-json");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("validatePlannerDocumentImportValue", () => {
    it("validates a valid JS object", () => {
      const doc = createPlannerDocument();
      const result = validatePlannerDocumentImportValue(doc);
      
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("invalidates an invalid object", () => {
      const result = validatePlannerDocumentImportValue({ wrong: "structure" });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

