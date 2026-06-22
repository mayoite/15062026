import { describe, expect, it } from "vitest";
import {
  buildPlannerDocumentFromPortalPublishData,
  computePlannerPortalItemCount,
} from "@/features/planner/store/plannerPublish";

describe("plannerPublish", () => {
  it("counts portal publish items from the visible geometry collections", () => {
    expect(
      computePlannerPortalItemCount({
        projectName: "Showroom",
        walls: [{ id: "w1" }],
        rooms: [{ id: "r1" }, { id: "r2" }],
        furniture: [{ id: "f1" }, { id: "f2" }, { id: "f3" }],
        doors: [{ id: "d1" }],
        windows: [],
        measurements: [],
        zones: [],
        textLabels: [],
        structuralElements: [],
        backgroundImage: null,
      }),
    ).toBe(7);
  });

  it("builds a canonical PlannerDocument from portal publish data", () => {
    const now = "2026-06-12T10:30:00.000Z";
    const document = buildPlannerDocumentFromPortalPublishData(
      {
        projectName: "  Corporate Floor  ",
        walls: [{ id: "w1" }],
        rooms: [{ id: "r1" }],
        furniture: [{ id: "f1" }, { id: "f2" }],
        doors: [{ id: "d1" }],
        windows: [{ id: "win1" }],
        measurements: [],
        zones: [],
        textLabels: [],
        structuralElements: [],
        backgroundImage: null,
      },
      { status: "active", now },
    );

    expect(document).toMatchObject({
      schemaVersion: 1,
      title: "Corporate Floor",
      projectName: "Corporate Floor",
      roomWidthMm: 6000,
      roomDepthMm: 8000,
      seatTarget: 6,
      unitSystem: "metric",
      itemCount: 6,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    expect(document.sceneJson).toMatchObject({
      projectName: "  Corporate Floor  ",
      furniture: [{ id: "f1" }, { id: "f2" }],
      backgroundImage: null,
    });
  });

  it("falls back to a safe title when the project name is blank", () => {
    const document = buildPlannerDocumentFromPortalPublishData({
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

    expect(document.title).toBe("Untitled Project");
    expect(document.projectName).toBe("Untitled Project");
  });
});

