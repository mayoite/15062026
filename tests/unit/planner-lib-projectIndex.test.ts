import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteSavedPlan,
  duplicateSavedPlan,
  getProjectIdFromKey,
  getProjectIndex,
  getSavedPlanById,
  getSavedPlanByKey,
  getSavedPlans,
  getSavedPlanSnapshots,
  readSavedProjectPayload,
  renameSavedPlan,
  saveProjectIndex,
  updateSavedPlanMetadata,
} from "@/features/planner/lib/projectIndex";
import { createPlannerDocument } from "@/features/planner/model";
import { appendSnapshot } from "@/features/planner/lib/versioning";

const PROJECT_ID = "11111111-1111-1111-1111-111111111111";
const PROJECT_KEY = `planner_${PROJECT_ID}`;

function seedProject(name = "Seed Plan") {
  localStorage.setItem(
    PROJECT_KEY,
    JSON.stringify({
      projectName: name,
      savedAt: "2026-06-14T10:00:00.000Z",
      thumbnail: "/thumb.png",
      clientName: "Contoso",
      description: "Pilot rollout",
      walls: [{ id: "wall-1" }],
      rooms: [{ id: "room-1", name: "Focus", points: [] }],
      furniture: [{ id: "desk-1", catalogId: "desk", x: 0, y: 0, width: 120, height: 80, rotation: 0, name: "Desk" }],
      doors: [],
      windows: [],
      measurements: [],
      zones: [],
      textLabels: [],
      structuralElements: [],
    }),
  );
  saveProjectIndex([{ id: PROJECT_ID, key: PROJECT_KEY, name }]);
}

describe("planner project index", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads project ids and saved plan records from localStorage", () => {
    seedProject();
    appendSnapshot(PROJECT_ID, createPlannerDocument({ name: "Seed Plan" }));

    expect(getProjectIdFromKey(PROJECT_KEY)).toBe(PROJECT_ID);
    expect(getProjectIndex()).toHaveLength(1);

    const plan = getSavedPlanByKey(PROJECT_KEY);
    expect(plan?.name).toBe("Seed Plan");
    expect(plan?.furniture[0]?.zIndex).toBe(0);
    expect(plan?.snapshotCount).toBe(1);

    const byId = getSavedPlanById(PROJECT_ID);
    expect(byId?.clientName).toBe("Contoso");
    expect(getSavedPlans()).toHaveLength(1);
    expect(getSavedPlanSnapshots()[0]?.rooms).toHaveLength(1);
    expect(readSavedProjectPayload(PROJECT_KEY)?.projectName).toBe("Seed Plan");
  });

  it("renames plans and updates project metadata", () => {
    seedProject();
    expect(renameSavedPlan(PROJECT_KEY, "Renamed Plan")).toBe(true);
    expect(renameSavedPlan(PROJECT_KEY, "   ")).toBe(false);
    expect(readSavedProjectPayload(PROJECT_KEY)?.projectName).toBe("Renamed Plan");
    expect(getProjectIndex()[0]?.name).toBe("Renamed Plan");

    expect(updateSavedPlanMetadata(PROJECT_KEY, { clientName: "Fabrikam", description: "Phase 2" })).toBe(true);
    expect(readSavedProjectPayload(PROJECT_KEY)?.clientName).toBe("Fabrikam");
  });

  it("duplicates and deletes saved plans", () => {
    seedProject();
    const duplicate = duplicateSavedPlan(PROJECT_KEY, "Copy Plan", "/copy.png");
    expect(duplicate?.key).toMatch(/^planner_/);
    expect(getSavedPlans()).toHaveLength(2);

    expect(deleteSavedPlan(PROJECT_KEY)).toBe(true);
    expect(getSavedPlanByKey(PROJECT_KEY)).toBeNull();
    expect(getProjectIndex()).toHaveLength(1);
  });

  it("rejects duplicate and metadata updates for missing projects", () => {
    expect(duplicateSavedPlan(PROJECT_KEY, "   ")).toBeNull();
    expect(updateSavedPlanMetadata("missing", { clientName: "Nobody" })).toBe(false);
  });

  it("returns empty results for missing or invalid storage", () => {
    localStorage.setItem("planner_project_index", "[]");
    expect(getSavedPlans()).toEqual([]);
    expect(getSavedPlanById("missing")).toBeNull();
    expect(readSavedProjectPayload("missing")).toBeNull();
    expect(renameSavedPlan("missing", "Nope")).toBe(false);
  });

  it("normalizes malformed saved payloads and handles storage write failures", () => {
    const malformedId = "22222222-2222-2222-2222-222222222222";
    const malformedKey = `planner_${malformedId}`;
    localStorage.setItem(
      malformedKey,
      JSON.stringify({
        projectName: "Malformed",
        walls: "not-an-array",
        furniture: "also-bad",
        rooms: null,
      }),
    );
    saveProjectIndex([{ id: malformedId, key: malformedKey, name: "Malformed" }]);

    const record = getSavedPlanByKey(malformedKey);
    expect(record?.walls).toEqual([]);
    expect(record?.furniture).toEqual([]);
    expect(record?.rooms).toEqual([]);
    expect(getSavedPlanSnapshots()[0]?.name).toBe("Malformed");
  });

  it("covers id/key fallbacks and duplicate metadata branches", () => {
    expect(getProjectIdFromKey("raw-project-id")).toBe("raw-project-id");

    const fallbackId = "33333333-3333-3333-3333-333333333333";
    const fallbackKey = `planner_${fallbackId}`;
    localStorage.setItem(
      fallbackKey,
      JSON.stringify({
        savedAt: "2026-06-14T12:00:00.000Z",
        furniture: [{ id: "chair-1", catalogId: "chair", x: 0, y: 0, width: 50, height: 50, rotation: 0, name: "Chair" }],
      }),
    );
    saveProjectIndex([{ id: fallbackId, key: fallbackKey, name: "Indexed Name" }]);

    const record = getSavedPlanById(fallbackId);
    expect(record?.name).toBe("Indexed Name");
    expect(record?.furniture[0]?.zIndex).toBe(0);
    expect(getSavedPlanByKey(`planner_${fallbackId}`)?.savedAt).toBe("2026-06-14T12:00:00.000Z");

    seedProject("Source Plan");
    const duplicate = duplicateSavedPlan(PROJECT_KEY, "Copied Plan");
    expect(duplicate?.key).toMatch(/^planner_/);
    expect(readSavedProjectPayload(duplicate!.key)?.thumbnail).toBe("/thumb.png");

    localStorage.setItem("planner_project_index", "{bad");
    expect(getProjectIndex()).toEqual([]);
  });

  it("renames orphaned payloads even when the project index has no matching entry", () => {
    localStorage.setItem(
      PROJECT_KEY,
      JSON.stringify({
        projectName: "Orphan",
        savedAt: "2026-06-14T10:00:00.000Z",
      }),
    );

    expect(renameSavedPlan(PROJECT_KEY, "Renamed Orphan")).toBe(true);
    expect(readSavedProjectPayload(PROJECT_KEY)?.projectName).toBe("Renamed Orphan");
    expect(getProjectIndex()).toEqual([]);
  });

  it("swallows storage failures when renaming, duplicating, deleting, or updating metadata", () => {
    seedProject();

    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(renameSavedPlan(PROJECT_KEY, "Blocked Rename")).toBe(false);
    expect(updateSavedPlanMetadata(PROJECT_KEY, { description: "Nope" })).toBe(false);
    expect(duplicateSavedPlan(PROJECT_KEY, "Blocked Copy")).toBeNull();

    vi.spyOn(localStorage, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(deleteSavedPlan(PROJECT_KEY)).toBe(false);
  });
});
