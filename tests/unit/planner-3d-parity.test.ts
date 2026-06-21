import { describe, it, expect } from "vitest";
import { buildPlannerDocumentFromFabric } from "@/features/planner/lib/fabricDocumentBridge";
import fs from "fs";
import path from "path";

describe("WS3 — 3D parity coordinate contract", () => {
  it("converts 2D Fabric coordinates to 3D scene centerMm correctly", () => {
    const fixtureFile = path.join(__dirname, "../../fixtures/planner-3d-parity.json");
    const fixture = JSON.parse(fs.readFileSync(fixtureFile, "utf-8"));
    
    const doc = buildPlannerDocumentFromFabric(JSON.stringify(fixture), {
      documentId: "test-parity",
      unitSystem: "mm",
    });

    const items = doc.sceneJson.items;
    expect(items.length).toBeGreaterThanOrEqual(3);

    const desk1 = items.find((i) => i.name.includes("desk-1"));
    const desk2 = items.find((i) => i.name.includes("desk-2"));
    const desk3 = items.find((i) => i.name.includes("desk-3"));

    expect(desk1).toBeDefined();
    expect(desk2).toBeDefined();
    expect(desk3).toBeDefined();

    if (desk1 && desk2) {
      const dist = Math.hypot(
        desk2.centerMm.xMm - desk1.centerMm.xMm,
        desk2.centerMm.yMm - desk1.centerMm.yMm
      );
      expect(dist).toBeGreaterThan(0);
      expect(dist).toBeLessThan(5000);
    }
  });

  it("room bounds derived from wall extents when no room shape", () => {
    const fixture = {
      version: "7.0",
      objects: [
        {
          type: "line",
          left: 200,
          top: 200,
          x1: 0,
          y1: 0,
          x2: 400,
          y2: 0,
          stroke: "#000",
          strokeWidth: 2,
          originX: "center",
          originY: "center",
          name: "WALL:123",
        },
        {
          type: "line",
          left: 600,
          top: 200,
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 400,
          stroke: "#000",
          strokeWidth: 2,
          originX: "center",
          originY: "center",
          name: "WALL:456",
        },
      ],
    };

    const doc = buildPlannerDocumentFromFabric(JSON.stringify(fixture), {
      documentId: "test-walls",
      unitSystem: "mm",
    });

    expect(doc.sceneJson.room).toBeDefined();
    expect(doc.sceneJson.room.widthMm).toBeGreaterThan(0);
    expect(doc.sceneJson.room.depthMm).toBeGreaterThan(0);
  });

  it("furniture items have defined centerMm within bounds", () => {
    const fixtureFile = path.join(__dirname, "../../fixtures/planner-3d-parity.json");
    const fixture = JSON.parse(fs.readFileSync(fixtureFile, "utf-8"));
    
    const doc = buildPlannerDocumentFromFabric(JSON.stringify(fixture), {
      documentId: "test-parity",
      unitSystem: "mm",
    });

    doc.sceneJson.items.forEach((item) => {
      expect(item.centerMm).toBeDefined();
      expect(item.centerMm.xMm).toBeGreaterThan(0);
      expect(item.centerMm.yMm).toBeGreaterThan(0);
      expect(item.sizeMm).toBeDefined();
      expect(item.sizeMm.widthMm).toBeGreaterThan(0);
      expect(item.sizeMm.depthMm).toBeGreaterThan(0);
    });
  });
});
