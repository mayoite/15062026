import { describe, expect, it } from "vitest";

import {
  captureDocument,
  restoreDocument,
  importFromOtherEngine,
  validateDocument,
  type CaptureInput,
  type CaptureOptions,
} from "@/features/planner/shared/document/index";
import type { PlannerDocument } from "@/features/planner/shared/document/types";

describe("documentBridge", () => {
  describe("captureDocument", () => {
    it("captures document with all minimal fields", () => {
      const input: CaptureInput = {
        walls: [{ id: "w1", start: { x: 0, y: 0 }, end: { x: 10, y: 10 } }],
        rooms: [{ id: "r1", name: "Room", points: [{ x: 0, y: 0 }], color: "red" }],
        furniture: [{ id: "f1", name: "Chair", x: 0, y: 0, width: 10, height: 10, rotation: 0 }],
        doors: [{ id: "d1", x: 0, y: 0, width: 10, rotation: 0 }],
        windows: [{ id: "wi1", x: 0, y: 0, width: 10, rotation: 0 }],
      };
      const options: CaptureOptions = {
        sourceEngine: "oando",
        metadata: { name: "test", createdAt: "now", updatedAt: "now" },
      };

      const doc = captureDocument(input, options);
      expect(doc.version).toBe("1.0.0");
      expect(doc.sourceEngine).toBe("oando");
      expect(doc.metadata.unitSystem).toBe("metric");
      expect(doc.workspace.walls[0]).toEqual({ id: "w1", start: { x: 0, y: 0 }, end: { x: 10, y: 10 } });
      expect(doc.workspace.rooms[0]).toEqual({ id: "r1", name: "Room", points: [{ x: 0, y: 0 }], color: "red" });
      expect(doc.workspace.furniture[0]).toEqual({
        id: "f1", catalogId: "", name: "Chair", category: "uncategorized",
        x: 0, y: 0, width: 10, height: 10, rotation: 0
      });
      expect(doc.workspace.doors[0]).toEqual({ id: "d1", x: 0, y: 0, width: 10, rotation: 0 });
      expect(doc.workspace.windows[0]).toEqual({ id: "wi1", x: 0, y: 0, width: 10, rotation: 0 });
      expect(doc.workspace.zones).toEqual([]);
      expect(doc.workspace.measurements).toEqual([]);
    });

    it("captures document with all optional fields", () => {
      const input: CaptureInput = {
        walls: [{ id: "w1", start: { x: 0, y: 0 }, end: { x: 10, y: 10 }, thickness: 2, material: "wood" }],
        rooms: [{ id: "r1", name: "Room", points: [{ x: 0, y: 0 }], color: "red", opacity: 0.5 }],
        furniture: [{
          id: "f1", catalogId: "cat1", name: "Chair", category: "seating",
          x: 0, y: 0, width: 10, height: 10, rotation: 0, color: "blue", zIndex: 1, locked: true
        }],
        doors: [{ id: "d1", x: 0, y: 0, width: 10, rotation: 0, swing: "left", type: "single" }],
        windows: [{ id: "wi1", x: 0, y: 0, width: 10, rotation: 0, type: "fixed" }],
        zones: [{ id: "z1", name: "Zone", type: "A", points: [{ x: 0, y: 0 }], color: "green", opacity: 0.8 }],
        measurements: [{ id: "m1", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, label: "10m" }],
      };
      const options: CaptureOptions = {
        sourceEngine: "buddy",
        metadata: { name: "test", createdAt: "now", updatedAt: "now", unitSystem: "imperial" },
        extensions: { customData: true }
      };

      const doc = captureDocument(input, options);
      expect(doc.metadata.unitSystem).toBe("imperial");
      expect(doc.extensions).toEqual({ customData: true });
      expect(doc.workspace.walls[0]).toEqual({ id: "w1", start: { x: 0, y: 0 }, end: { x: 10, y: 10 }, thickness: 2, material: "wood" });
      expect(doc.workspace.rooms[0]).toEqual({ id: "r1", name: "Room", points: [{ x: 0, y: 0 }], color: "red", opacity: 0.5 });
      expect(doc.workspace.furniture[0]).toEqual({
        id: "f1", catalogId: "cat1", name: "Chair", category: "seating",
        x: 0, y: 0, width: 10, height: 10, rotation: 0, color: "blue", zIndex: 1, locked: true
      });
      expect(doc.workspace.doors[0]).toEqual({ id: "d1", x: 0, y: 0, width: 10, rotation: 0, swing: "left", type: "single" });
      expect(doc.workspace.windows[0]).toEqual({ id: "wi1", x: 0, y: 0, width: 10, rotation: 0, type: "fixed" });
      expect(doc.workspace.zones[0]).toEqual({ id: "z1", name: "Zone", type: "A", points: [{ x: 0, y: 0 }], color: "green", opacity: 0.8 });
      expect(doc.workspace.measurements[0]).toEqual({ id: "m1", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, label: "10m" });
    });
  });

  describe("restoreDocument", () => {
    it("restores valid document", () => {
      const doc = {
        version: "1.0.0",
        sourceEngine: "oando" as const,
        workspace: { walls: [], rooms: [], furniture: [], doors: [], windows: [], zones: [], measurements: [] },
        metadata: { name: "test", createdAt: "now", updatedAt: "now" },
        createdAt: "now",
        updatedAt: "now"
      };
      const res = restoreDocument(doc);
      expect(res.workspace).toBe(doc.workspace);
      expect(res.metadata).toBe(doc.metadata);
      expect(res.sourceEngine).toBe("oando");
    });

    it("throws error for missing version", () => {
      const doc = {
        sourceEngine: "oando" as const,
        workspace: { walls: [], rooms: [], furniture: [], doors: [], windows: [], zones: [], measurements: [] },
        metadata: { name: "test", createdAt: "now", updatedAt: "now" },
        createdAt: "now",
        updatedAt: "now"
      } as unknown as PlannerDocument;
      expect(() => restoreDocument(doc)).toThrow("Invalid PlannerDocument: missing version or workspace");
    });

    it("throws error for missing workspace", () => {
      const doc = {
        version: "1.0.0",
        sourceEngine: "oando" as const,
        metadata: { name: "test", createdAt: "now", updatedAt: "now" },
        createdAt: "now",
        updatedAt: "now"
      } as unknown as PlannerDocument;
      expect(() => restoreDocument(doc)).toThrow("Invalid PlannerDocument: missing version or workspace");
    });
  });

  describe("importFromOtherEngine", () => {
    it("imports document without warnings", () => {
      const doc = {
        version: "1.0.0",
        sourceEngine: "buddy" as const,
        workspace: { walls: [], rooms: [], furniture: [{ id: "f1", catalogId: "cat1", name: "Chair", category: "seating", x: 0, y: 0, width: 10, height: 10, rotation: 0 }], doors: [], windows: [], zones: [], measurements: [] },
        metadata: { name: "test", createdAt: "now", updatedAt: "now" },
        createdAt: "now",
        updatedAt: "now"
      };
      const res = importFromOtherEngine(doc, "oando");
      expect(res.warnings).toEqual([]);
      expect(res.workspace).toBe(doc.workspace);
    });

    it("adds warning for unsupported extensions", () => {
      const doc = {
        version: "1.0.0",
        sourceEngine: "buddy" as const,
        workspace: { walls: [], rooms: [], furniture: [], doors: [], windows: [], zones: [], measurements: [] },
        metadata: { name: "test", createdAt: "now", updatedAt: "now" },
        extensions: { test: true },
        createdAt: "now",
        updatedAt: "now"
      };
      const res = importFromOtherEngine(doc, "oando");
      expect(res.warnings).toEqual([
        {
          type: "unsupported_extension",
          message: "Document has buddy-specific extensions that will be ignored in oando",
        }
      ]);
    });

    it("adds warning for missing catalogId", () => {
      const doc = {
        version: "1.0.0",
        sourceEngine: "buddy" as const,
        workspace: { walls: [], rooms: [], furniture: [{ id: "f1", catalogId: "", name: "BadChair", category: "seating", x: 0, y: 0, width: 10, height: 10, rotation: 0 }], doors: [], windows: [], zones: [], measurements: [] },
        metadata: { name: "test", createdAt: "now", updatedAt: "now" },
        createdAt: "now",
        updatedAt: "now"
      };
      const res = importFromOtherEngine(doc, "oando");
      expect(res.warnings).toEqual([
        {
          type: "missing_catalog_id",
          message: 'Furniture item "BadChair" has no catalogId — it may not render correctly',
          elementId: "f1",
        }
      ]);
    });
  });

  describe("validateDocument", () => {
    it("returns false for non-objects", () => {
      expect(validateDocument(null)).toBe(false);
      expect(validateDocument("string")).toBe(false);
      expect(validateDocument(123)).toBe(false);
      expect(validateDocument(undefined)).toBe(false);
    });

    it("returns false for invalid version", () => {
      expect(validateDocument({ version: "2.0.0" })).toBe(false);
    });

    it("returns false for missing/invalid workspace", () => {
      expect(validateDocument({ version: "1.0.0" })).toBe(false);
      expect(validateDocument({ version: "1.0.0", workspace: "invalid" })).toBe(false);
    });

    it("returns false for missing/invalid metadata", () => {
      expect(validateDocument({ version: "1.0.0", workspace: {} })).toBe(false);
      expect(validateDocument({ version: "1.0.0", workspace: {}, metadata: "invalid" })).toBe(false);
    });

    it("returns false for invalid sourceEngine", () => {
      expect(validateDocument({ version: "1.0.0", workspace: {}, metadata: {}, sourceEngine: "invalid" })).toBe(false);
    });

    it("returns true for valid documents", () => {
      expect(validateDocument({ version: "1.0.0", workspace: {}, metadata: {}, sourceEngine: "oando" })).toBe(true);
      expect(validateDocument({ version: "1.0.0", workspace: {}, metadata: {}, sourceEngine: "buddy" })).toBe(true);
    });
  });
});

