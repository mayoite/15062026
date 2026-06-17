import { describe, expect, it } from "vitest";

import {
  captureDocument,
  restoreDocument,
  importFromOtherEngine,
  validateDocument,
} from "@/features/planner/shared/document/documentbridge";

describe("documentbridge", () => {
  it("captureDocument returns basic structure from input", () => {
    const input = {
      walls: [],
      rooms: [],
      furniture: [],
      doors: [],
      windows: [],
      zones: [],
      measurements: [],
    };
    const options = {
      sourceEngine: "oando" as const,
      metadata: { name: "test", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    };
    const doc = captureDocument(input as any, options as any);
    expect(doc).toHaveProperty("version", "1.0.0");
    expect(doc.sourceEngine).toBe("oando");
  });

  it("validateDocument accepts minimal valid doc", () => {
    const valid = {
      version: "1.0.0",
      sourceEngine: "oando",
      id: "p1",
      workspace: { walls: [], rooms: [], furniture: [], doors: [], windows: [], zones: [], measurements: [] },
      metadata: { name: "test", createdAt: Date.now(), updatedAt: Date.now() },
    };
    expect(validateDocument(valid)).toBe(true);
  });

  it("restoreDocument handles basic doc", () => {
    const doc = {
      version: "1.0.0",
      sourceEngine: "oando" as const,
      id: "p1",
      workspace: { walls: [], rooms: [], furniture: [], doors: [], windows: [], zones: [], measurements: [] },
      metadata: { name: "test", createdAt: Date.now(), updatedAt: Date.now() },
    };
    const res = restoreDocument(doc);
    expect(res).toHaveProperty("workspace");
  });

  it("importFromOtherEngine handles missing catalogId", () => {
    const badDoc = {
      version: "1.0.0",
      sourceEngine: "buddy",
      id: "p1",
      workspace: { walls: [], rooms: [], furniture: [{ id: "f1", name: "bad", x: 0, y: 0, width: 10, height: 10, rotation: 0 }], doors: [], windows: [], zones: [], measurements: [] },
      metadata: { name: "test", createdAt: Date.now(), updatedAt: Date.now() },
    };
    const res = importFromOtherEngine(badDoc as any, "oando");
    expect(res).toHaveProperty("warnings");
    // it processes the doc even with warnings for missing catalogId
  });
});
