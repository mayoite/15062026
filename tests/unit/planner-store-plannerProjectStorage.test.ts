import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getProjectIndex,
  saveProjectIndex,
  migrateOldProjects,
  validateImportedProject,
} from "@/features/planner/store/plannerProjectStorage";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      const value = store.get(key);
      return value === undefined ? null : value;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("plannerProjectStorage", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
  });

  it("reads and writes the project index", () => {
    saveProjectIndex([{ id: "p1", name: "Plan A" }]);
    expect(getProjectIndex()).toEqual([{ id: "p1", name: "Plan A" }]);
  });

  it("returns an empty index when storage is corrupt", () => {
    window.localStorage.setItem("planner_project_index", "{");
    expect(getProjectIndex()).toEqual([]);
  });

  it("migrates legacy project keys into the new index", () => {
    window.localStorage.setItem(
      "planner_projects",
      JSON.stringify(["legacy-key"]),
    );
    window.localStorage.setItem(
      "legacy-key",
      JSON.stringify({ projectName: "Legacy Office" }),
    );

    migrateOldProjects({
      generateId: () => "new-id",
      persist: (key, value) => {
        window.localStorage.setItem(key, value);
        return true;
      },
    });

    expect(getProjectIndex()).toEqual([{ id: "new-id", name: "Legacy Office" }]);
    expect(window.localStorage.getItem("legacy-key")).toBeNull();
    expect(window.localStorage.getItem("planner_projects")).toBeNull();
  });

  it("skips migration when legacy keys are absent or already migrated", () => {
    migrateOldProjects({
      generateId: () => "ignored",
      persist: () => true,
    });
    expect(getProjectIndex()).toEqual([]);

    saveProjectIndex([{ id: "legacy-key", name: "Already there" }]);
    window.localStorage.setItem("planner_projects", JSON.stringify(["legacy-key"]));
    window.localStorage.setItem("legacy-key", JSON.stringify({ projectName: "Legacy" }));
    migrateOldProjects({
      generateId: () => "new-id",
      persist: () => true,
    });
    expect(getProjectIndex()).toHaveLength(1);
  });

  it("validates imported project payloads and reports field errors", () => {
    expect(validateImportedProject(null)).toEqual({
      valid: false,
      errors: ["File does not contain a valid JSON object"],
    });

    const invalid = validateImportedProject({
      walls: "bad",
      rooms: [{ points: "nope" }],
      furniture: [{ x: "bad", y: 2 }],
      doors: {},
      windows: "bad",
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toEqual(
      expect.arrayContaining([
        "'walls' must be an array",
        "rooms[0].points is missing or not an array",
        "furniture[0] missing x/y coordinates",
        "'doors' must be an array",
        "'windows' must be an array",
      ]),
    );

    const valid = validateImportedProject({
      walls: [{ start: { x: 0, y: 0 }, end: { x: 10, y: 0 } }],
      furniture: [{ x: 1, y: 2 }],
    });
    expect(valid).toEqual({ valid: true, errors: [] });
  });

  it("swallows storage write failures", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => saveProjectIndex([{ id: "p1", name: "Plan" }])).not.toThrow();
  });

  it("returns an empty index when no index key exists", () => {
    expect(getProjectIndex()).toEqual([]);
  });

  it("reports missing required arrays and nested validation errors", () => {
    expect(validateImportedProject({ doors: [] })).toEqual({
      valid: false,
      errors: ["Missing required arrays: needs at least walls, rooms, or furniture"],
    });

    const nested = validateImportedProject({
      walls: [null, { start: null, end: { x: 1, y: 0 } }],
      rooms: ["bad", { points: "nope" }],
      furniture: [null, { x: "bad", y: 2 }],
    });
    expect(nested.valid).toBe(false);
    expect(nested.errors).toEqual(
      expect.arrayContaining([
        "walls[0] is not an object",
        "walls[1].start is missing or invalid",
        "rooms[0] is not an object",
        "rooms[1].points is missing or not an array",
        "furniture[0] is not an object",
        "furniture[1] missing x/y coordinates",
      ]),
    );
  });

  it("skips migration when legacy data is missing or persistence fails", () => {
    window.localStorage.setItem("planner_projects", JSON.stringify(["ghost-key"]));
    migrateOldProjects({
      generateId: () => "new-id",
      persist: () => true,
    });
    expect(getProjectIndex()).toEqual([]);

    window.localStorage.setItem(
      "planner_projects",
      JSON.stringify(["legacy-key"]),
    );
    window.localStorage.setItem(
      "legacy-key",
      JSON.stringify({ projectName: "Legacy" }),
    );
    migrateOldProjects({
      generateId: () => "blocked-id",
      persist: () => false,
    });
    expect(getProjectIndex()).toEqual([]);
    expect(window.localStorage.getItem("legacy-key")).not.toBeNull();
  });

  it("swallows corrupt legacy migration payloads", () => {
    window.localStorage.setItem("planner_projects", "{");
    expect(() =>
      migrateOldProjects({
        generateId: () => "ignored",
        persist: () => true,
      }),
    ).not.toThrow();
  });
});
