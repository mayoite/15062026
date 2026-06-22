import { describe, expect, it } from "vitest";

import {
  createEmptyPlannerDocument,
  createPlannerDocument,
  normalizePlannerDocument,
  parsePlannerDocumentImport,
  PLANNER_DOCUMENT_SCHEMA_VERSION,
  validatePlannerDocumentSafe,
  assertPlannerDocument,
} from "@/features/planner/model/plannerDocument";
import {
  createPlannerTransferEnvelope,
  validatePlannerTransferEnvelope,
} from "@/features/planner/model/plannerEnvelope";

describe("plannerDocument - additional coverage", () => {
  describe("createEmptyPlannerDocument", () => {
    it("returns a valid document with defaults", () => {
      const doc = createEmptyPlannerDocument();
      expect(doc.schemaVersion).toBe(1);
      expect(doc.name).toBe("Untitled plan");
      expect(doc.title).toBe("Untitled plan");
      expect(doc.roomWidthMm).toBe(6000);
      expect(doc.roomDepthMm).toBe(8000);
      expect(doc.seatTarget).toBe(10);
      expect(doc.unitSystem).toBe("metric");
      expect(doc.itemCount).toBe(0);
      expect(doc.status).toBe("draft");
      expect(doc.sceneJson).toEqual({});
    });

    it("applies overrides", () => {
      const doc = createEmptyPlannerDocument({
        name: "Custom",
        title: "Custom",
        roomWidthMm: 9000,
        unitSystem: "imperial",
      });
      expect(doc.name).toBe("Custom");
      expect(doc.title).toBe("Custom");
      expect(doc.roomWidthMm).toBe(9000);
      expect(doc.unitSystem).toBe("imperial");
    });
  });

  describe("PLANNER_DOCUMENT_SCHEMA_VERSION", () => {
    it("equals 1", () => {
      expect(PLANNER_DOCUMENT_SCHEMA_VERSION).toBe(1);
    });
  });

  describe("validatePlannerDocumentSafe", () => {
    it("returns success for a valid document", () => {
      const doc = createEmptyPlannerDocument();
      const result = validatePlannerDocumentSafe(doc);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Untitled plan");
      }
    });

    it("returns failure for an invalid document", () => {
      const result = validatePlannerDocumentSafe({ schemaVersion: 99 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("validatePlannerTransferEnvelope", () => {
    it("validates a transfer envelope around a planner document", () => {
      const document = createPlannerDocument({ name: "Transfer Me" });
      const envelope = createPlannerTransferEnvelope({
        planner: "oando",
        source: "export",
        documentId: "plan-1",
        metadata: {
          title: document.name,
          status: document.status,
          unitSystem: document.unitSystem,
          itemCount: document.itemCount,
        },
        document,
      });

      const result = validatePlannerTransferEnvelope(envelope);
      expect(result.type).toBe("cad-suite-planner-transfer-envelope");
      expect(result.document.name).toBe("Transfer Me");
    });

    it("throws for an invalid transfer envelope", () => {
      expect(() => validatePlannerTransferEnvelope({ type: "wrong" })).toThrow();
    });
  });

  describe("assertPlannerDocument", () => {
    it("returns the document when valid", () => {
      const doc = createEmptyPlannerDocument();
      const result = assertPlannerDocument(doc);
      expect(result.name).toBe("Untitled plan");
    });

    it("throws for invalid input", () => {
      expect(() => assertPlannerDocument({ schemaVersion: 99 })).toThrow();
    });
  });

  describe("parsePlannerDocumentImport", () => {
    it("returns a validated document for valid input", () => {
      const doc = createEmptyPlannerDocument({ name: "Migrate Me" });
      const parsed = parsePlannerDocumentImport(doc);
      expect(parsed.ok).toBe(true);
      expect(parsed.document?.name).toBe("Migrate Me");
      expect(parsed.document?.schemaVersion).toBe(1);
    });

    it("fails for invalid input", () => {
      const parsed = parsePlannerDocumentImport({ schemaVersion: 99 });
      expect(parsed.ok).toBe(false);
      expect(parsed.errors.length).toBeGreaterThan(0);
    });
  });

  describe("normalizePlannerDocument edge cases", () => {
    it("returns empty document for null input", () => {
      const doc = normalizePlannerDocument(null);
      expect(doc.name).toBe("Untitled plan");
      expect(doc.schemaVersion).toBe(1);
    });

    it("returns empty document for non-object input", () => {
      const doc = normalizePlannerDocument(42);
      expect(doc.name).toBe("Untitled plan");
    });

    it("unwraps planner-document envelope", () => {
      const inner = createEmptyPlannerDocument({ name: "Wrapped" });
      const doc = normalizePlannerDocument({
        type: "planner-document",
        schemaVersion: 1,
        document: inner,
      });
      expect(doc.name).toBe("Wrapped");
    });

    it("handles snake_case planner save rows", () => {
      const doc = normalizePlannerDocument({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Snake",
        room_width_mm: 5000,
        room_depth_mm: 4000,
        seat_target: 8,
        unit_system: "imperial",
        scene_json: { test: true },
        item_count: 3,
        thumbnail_url: "https://example.com/thumb.png",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      });
      expect(doc.roomWidthMm).toBe(5000);
      expect(doc.roomDepthMm).toBe(4000);
      expect(doc.seatTarget).toBe(8);
      expect(doc.unitSystem).toBe("imperial");
      expect(doc.sceneJson).toEqual({ test: true });
      expect(doc.itemCount).toBe(3);
      expect(doc.thumbnailUrl).toBe("https://example.com/thumb.png");
      expect(doc.createdAt).toBe("2026-01-01T00:00:00.000Z");
      expect(doc.updatedAt).toBe("2026-01-02T00:00:00.000Z");
    });

    it("coerces empty/whitespace strings to null for nullable fields", () => {
      const doc = normalizePlannerDocument({
        name: "Test",
        projectName: "  ",
        clientName: "",
        preparedBy: "   ",
        sceneJson: {},
      });
      expect(doc.projectName).toBeNull();
      expect(doc.clientName).toBeNull();
      expect(doc.preparedBy).toBeNull();
    });

    it("coerces unknown status to draft", () => {
      const doc = normalizePlannerDocument({
        name: "Test",
        status: "unknown-status",
        sceneJson: {},
      });
      expect(doc.status).toBe("draft");
    });

    it("preserves active and archived status", () => {
      expect(
        normalizePlannerDocument({ name: "T", status: "active", sceneJson: {} }).status,
      ).toBe("active");
      expect(
        normalizePlannerDocument({ name: "T", status: "archived", sceneJson: {} }).status,
      ).toBe("archived");
    });
  });
});
