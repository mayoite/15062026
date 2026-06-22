import {
  collectPlanner3DSceneWarnings,
  validatePlanner3DSceneDocument,
} from "@/features/planner/model/planner3dScene";
import { createPlannerDocument } from "@/features/planner/model/plannerDocument";

describe("planner 3d scene model", () => {
  it("validates the canonical 3d scene document contract", () => {
    const scene = validatePlanner3DSceneDocument({
      type: "cad-suite-planner-3d-scene",
      version: 1,
      id: "planner-preview",
      title: "North Bay",
      note: "HQ Refresh",
      room: {
        widthMm: 7200,
        depthMm: 5400,
        wallHeightMm: 2100,
        wallThicknessMm: 120,
        floorThicknessMm: 40,
      },
      items: [
        {
          id: "desk-1",
          name: "Desk 1",
          category: "Desk",
          centerMm: { xMm: 1200, yMm: 900 },
          sizeMm: { widthMm: 1400, depthMm: 700, heightMm: 750 },
          rotationDeg: 15,
          color: "var(--border-soft)",
        },
      ],
    });

    expect(scene).toMatchObject({
      type: "cad-suite-planner-3d-scene",
      version: 1,
      id: "planner-preview",
      title: "North Bay",
      room: {
        widthMm: 7200,
        depthMm: 5400,
        wallHeightMm: 2100,
        wallThicknessMm: 120,
        floorThicknessMm: 40,
      },
      items: [
        {
          id: "desk-1",
          name: "Desk 1",
          category: "Desk",
        },
      ],
    });
  });

  it("rejects malformed 3d scene documents", () => {
    expect(() =>
      validatePlanner3DSceneDocument({
        type: "cad-suite-planner-3d-scene",
        version: 1,
        id: "planner-preview",
        title: "Broken",
        room: {
          widthMm: 0,
          depthMm: 5400,
          wallHeightMm: 2100,
          wallThicknessMm: 120,
          floorThicknessMm: 40,
        },
        items: [],
      }),
    ).toThrow();
  });

  it("reports unsupported scene payloads instead of dropping them silently", () => {
    const document = {
      ...createPlannerDocument({ name: "Warning Plan", sceneJson: { shapes: [] } }),
      sceneJson: {
        plannerScene: {
          type: "cad-suite-planner-scene",
          version: 1,
          room: {
            widthMm: 7200,
            depthMm: 5400,
          },
          items: [
            null,
            {
              id: "",
              name: "",
              category: "",
            },
          ],
        },
      },
    };

    const result = collectPlanner3DSceneWarnings(document);

    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "planner-3d-item-unsupported",
          severity: "warning",
        }),
        expect.objectContaining({
          code: "planner-3d-item-missing-id",
          severity: "warning",
        }),
        expect.objectContaining({
          code: "planner-3d-item-missing-name",
          severity: "warning",
        }),
        expect.objectContaining({
          code: "planner-3d-item-missing-category",
          severity: "warning",
        }),
      ]),
    );
  });
});

