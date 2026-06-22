import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlannerDocument } from "@/features/planner/model";
import {
  appendSnapshot,
  deleteSnapshotsFor,
  getLatestSnapshot,
  getSnapshot,
  getSnapshotCount,
  hasVersionHistory,
  listSnapshots,
  MAX_VERSIONS,
  pruneSnapshots,
  restoreSnapshot,
  updateSnapshotLabel,
} from "@/features/planner/lib/versioning";

const PROJECT_ID = "project-versioning-test";

describe("planner versioning", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("appends, lists, and restores snapshots newest-first", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const first = createPlannerDocument({ name: "First" });
    const second = createPlannerDocument({ name: "Second" });

    const snapshotA = appendSnapshot(PROJECT_ID, first, "save", "Baseline");
    vi.setSystemTime(new Date("2026-01-02T00:00:00.000Z"));
    const snapshotB = appendSnapshot(PROJECT_ID, second, "restore");
    vi.useRealTimers();

    expect(snapshotA?.label).toBe("Baseline");
    expect(snapshotB?.projectId).toBe(PROJECT_ID);

    const listed = listSnapshots(PROJECT_ID);
    expect(listed[0]?.document.name).toBe("Second");
    expect(getSnapshot(PROJECT_ID, snapshotA!.id)?.document.name).toBe("First");
    expect(restoreSnapshot(PROJECT_ID, snapshotB!.id)?.name).toBe("Second");
    expect(getSnapshotCount(PROJECT_ID)).toBe(2);
    expect(hasVersionHistory(PROJECT_ID)).toBe(true);
    expect(getLatestSnapshot(PROJECT_ID)?.id).toBe(snapshotB?.id);
  });

  it("evicts oldest snapshots beyond MAX_VERSIONS", () => {
    for (let index = 0; index < MAX_VERSIONS + 2; index += 1) {
      appendSnapshot(PROJECT_ID, createPlannerDocument({ name: `Plan ${index}` }));
    }

    expect(getSnapshotCount(PROJECT_ID)).toBe(MAX_VERSIONS);
    const names = listSnapshots(PROJECT_ID).map((snapshot) => snapshot.document.name);
    expect(names).not.toContain("Plan 0");
    expect(names).not.toContain("Plan 1");
    expect(names.some((name) => name === "Plan 10" || name === "Plan 11")).toBe(true);
  });

  it("updates labels and prunes stored snapshots", () => {
    const snapshot = appendSnapshot(PROJECT_ID, createPlannerDocument({ name: "Label Me" }));
    expect(updateSnapshotLabel(PROJECT_ID, snapshot!.id, "Milestone")).toBe(true);
    expect(getSnapshot(PROJECT_ID, snapshot!.id)?.label).toBe("Milestone");
    expect(updateSnapshotLabel(PROJECT_ID, "missing", "Nope")).toBe(false);

    for (let index = 0; index < MAX_VERSIONS + 3; index += 1) {
      appendSnapshot(PROJECT_ID, createPlannerDocument({ name: `Overflow ${index}` }));
    }
    pruneSnapshots(PROJECT_ID);
    expect(getSnapshotCount(PROJECT_ID)).toBe(MAX_VERSIONS);
  });

  it("returns null when restore is requested for a missing snapshot", () => {
    expect(restoreSnapshot(PROJECT_ID, "missing-snapshot")).toBeNull();
  });

  it("removes labels and reports missing snapshots on label updates", () => {
    const snapshot = appendSnapshot(PROJECT_ID, createPlannerDocument({ name: "Label Me" }), "save", "Milestone");
    expect(updateSnapshotLabel(PROJECT_ID, snapshot!.id, undefined)).toBe(true);
    expect(getSnapshot(PROJECT_ID, snapshot!.id)?.label).toBeUndefined();
    expect(updateSnapshotLabel(PROJECT_ID, "missing", "Nope")).toBe(false);
  });

  it("deletes all snapshots for a project", () => {
    appendSnapshot(PROJECT_ID, createPlannerDocument({ name: "Delete Me" }));
    deleteSnapshotsFor(PROJECT_ID);
    expect(getSnapshotCount(PROJECT_ID)).toBe(0);
    expect(hasVersionHistory(PROJECT_ID)).toBe(false);
  });

  it("ignores corrupted localStorage payloads", () => {
    localStorage.setItem(`planner.versions.${PROJECT_ID}`, "{not-json");
    expect(listSnapshots(PROJECT_ID)).toEqual([]);
  });

  it("no-ops prune when snapshot count is within the limit", () => {
    appendSnapshot(PROJECT_ID, createPlannerDocument({ name: "Only One" }));
    pruneSnapshots(PROJECT_ID);
    expect(getSnapshotCount(PROJECT_ID)).toBe(1);
    expect(listSnapshots(PROJECT_ID)[0]?.document.name).toBe("Only One");
  });

  it("retries snapshot persistence after evicting the oldest snapshot on quota errors", () => {
    const retryProject = "project-versioning-retry";
    appendSnapshot(retryProject, createPlannerDocument({ name: "First" }));
    appendSnapshot(retryProject, createPlannerDocument({ name: "Second" }));

    const originalSetItem = localStorage.setItem.bind(localStorage);
    let failNextWrite = true;
    vi.spyOn(localStorage, "setItem").mockImplementation((key, value) => {
      if (failNextWrite) {
        failNextWrite = false;
        throw new DOMException("quota", "QuotaExceededError");
      }
      originalSetItem(key, value);
    });

    const third = appendSnapshot(retryProject, createPlannerDocument({ name: "Third" }));
    expect(third?.document.name).toBe("Third");
    expect(getSnapshotCount(retryProject)).toBe(2);
    expect(listSnapshots(retryProject).map((snapshot) => snapshot.document.name)).toEqual([
      "Third",
      "Second",
    ]);
  });
});
