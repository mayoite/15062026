import {
  buildProjectCopyData,
  buildProjectSaveData,
  normalizeLoadedProjectData,
} from "@/features/planner/store/plannerProjectData";

describe("plannerProjectData", () => {
  it("normalizes obsolete saved tool ids back to select", () => {
    const loaded = normalizeLoadedProjectData(
      {
        projectName: "Legacy Plan",
        tool: "text",
      },
      "planner_legacy",
    );

    expect(loaded.tool).toBe("select");
  });

  it("preserves live saved tool ids", () => {
    const loaded = normalizeLoadedProjectData(
      {
        projectName: "Current Plan",
        tool: "pan",
      },
      "planner_current",
    );

    expect(loaded.tool).toBe("pan");
  });

  it("builds save and copy payloads with defaults", () => {
    const snapshot = {
      projectName: "HQ",
      walls: [{ id: "w1", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, thickness: 8, color: "#000" }],
      rooms: [],
      furniture: [],
      doors: [],
      windows: [],
      measurements: [],
      zones: [],
      textLabels: [],
      structuralElements: [],
      tags: ["alpha"],
      backgroundImage: null,
      lightingPreset: "day" as const,
      thumbnail: "thumb.png",
    };

    const saved = buildProjectSaveData(snapshot);
    expect(saved.projectName).toBe("HQ");
    expect(saved.thumbnail).toBe("thumb.png");
    expect(saved.tags).toEqual(["alpha"]);

    const copied = buildProjectCopyData(snapshot, "Copy", "2026-06-15T00:00:00.000Z");
    expect(copied.projectName).toBe("Copy");
    expect(copied.walls[0].id).toBe("w1");
    expect(copied.walls).not.toBe(snapshot.walls);
  });

  it("normalizes sparse loaded project payloads", () => {
    const loaded = normalizeLoadedProjectData({
      furniture: [{ id: "f1", catalogId: "x", name: "X", x: 0, y: 0, width: 1, height: 1, rotation: 0, color: "#000", shape: "x" }],
      backgroundImage: { url: "bg.png", x: 0, y: 0, width: 10, height: 10, scale: 1, opacity: 1, isCalibrating: false },
      viewMode: "split",
      zoom: 1.5,
    });

    expect(loaded.projectName).toBe("Untitled");
    expect(loaded.furniture[0].zIndex).toBe(0);
    expect(loaded.backgroundImage?.isLocked).toBe(false);
    expect(loaded.viewMode).toBe("split");
    expect(loaded.zoom).toBe(1.5);
  });
});
