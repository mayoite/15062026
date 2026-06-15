// @ts-nocheck

import type { PlannerDocument } from "../model";
import { buildPlanner3DSceneDocument, summarizePlannerDocument } from "./types";

function makePlannerDocument(
  overrides: Partial<PlannerDocument> & Pick<PlannerDocument, "name" | "roomWidthMm" | "roomDepthMm" | "sceneJson">,
): PlannerDocument {
  return {
    schemaVersion: 1,
    id: "550e8400-e29b-41d4-a716-446655440001",
    projectName: null,
    clientName: null,
    preparedBy: null,
    seatTarget: 10,
    unitSystem: "metric",
    itemCount: 0,
    thumbnailUrl: null,
    createdAt: "2026-04-10T00:00:00.000Z",
    updatedAt: "2026-04-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("planner 3d scene document", () => {
  it("sanitizes malformed scene envelope geometry", () => {
    const document = makePlannerDocument({
      name: "Focus room",
      roomWidthMm: 7200,
      roomDepthMm: 5400,
      sceneJson: {
        plannerScene: {
          type: "cad-suite-planner-scene",
          version: 1,
          measurement: {
            canonicalUnit: "mm",
            displayUnit: "mm",
            sourceUnit: "mm",
          },
          room: {
            widthMm: -1,
            depthMm: 0,
            wallHeightMm: null,
            wallThicknessMm: -20,
            floorThicknessMm: null,
            originMm: { xMm: 0, yMm: 0 },
          },
          items: [
            {
              id: "   ",
              name: "",
              category: "",
              centerMm: { xMm: "bad", yMm: null },
              sizeMm: { widthMm: -120, depthMm: 0, heightMm: null },
              rotationDeg: "bad",
            },
          ],
        },
      } as PlannerDocument["sceneJson"],
    });

    const scene = buildPlanner3DSceneDocument(document);

    expect(scene.room).toEqual({
      widthMm: 7200,
      depthMm: 5400,
      wallHeightMm: 2100,
      wallThicknessMm: 120,
      floorThicknessMm: 40,
    });
    expect(scene.items).toEqual([
      {
        id: "planner-item-1",
        name: "Planner item 1",
        category: "Workstations",
        centerMm: { xMm: 3600, yMm: 2700 },
        sizeMm: { widthMm: 1200, depthMm: 1200, heightMm: 900 },
        rotationDeg: 0,
        color: "var(--border-soft)",
      },
    ]);
  });

  it("summarizes using safe scene dimensions when envelope data is incomplete", () => {
    const document = makePlannerDocument({
      name: "War room",
      roomWidthMm: 6000,
      roomDepthMm: 4000,
      sceneJson: {
        plannerScene: {
          type: "cad-suite-planner-scene",
          version: 1,
          measurement: {
            canonicalUnit: "mm",
            displayUnit: "mm",
            sourceUnit: "mm",
          },
          room: {
            widthMm: 6000,
            depthMm: 4000,
            wallHeightMm: 3000,
            wallThicknessMm: 120,
            floorThicknessMm: 40,
            originMm: { xMm: 0, yMm: 0 },
          },
          items: [
            {
              id: "desk-a",
              name: "Desk A",
              category: "Desk",
              centerMm: { xMm: 1200, yMm: 900 },
              sizeMm: { widthMm: 1400, depthMm: 700, heightMm: 750 },
              rotationDeg: 15,
            },
            {
              id: "storage-1",
              name: "Storage",
              category: "Storage",
              centerMm: { xMm: 4200, yMm: 900 },
              sizeMm: { widthMm: 1000, depthMm: 500, heightMm: 2100 },
              rotationDeg: 0,
            },
          ],
        },
      } as PlannerDocument["sceneJson"],
    });

    expect(summarizePlannerDocument(document)).toEqual({
      roomAreaSqm: 24,
      totalFootprintSqm: 1.48,
      itemCount: 2,
      largestItemName: "Desk A",
    });
  });
});
