import { beforeEach, describe, expect, it, vi } from "vitest";

let uuidCounter = 0;
vi.mock("uuid", () => ({
  v4: () => `project-uuid-${++uuidCounter}`,
}));

import { usePlannerGeometryStore } from "@/features/planner/store/plannerGeometryStore";
import { usePlannerFurnitureStore } from "@/features/planner/store/plannerFurnitureStore";
import { usePlannerHistoryStore } from "@/features/planner/store/plannerHistoryStore";
import {
  usePlannerProjectStore,
  validateImportedProject,
} from "@/features/planner/store/plannerProjectStore";
import { usePlannerUIStore } from "@/features/planner/store/plannerUIStore";
import type { FurnitureItem } from "@/features/planner/store/plannerTypes";

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

function resetDomainStores() {
  usePlannerGeometryStore.setState({
    walls: [],
    rooms: [],
    doors: [],
    windows: [],
    zones: [],
    measurements: [],
    structuralElements: [],
    drawingWall: null,
    drawingRoom: [],
    drawingZone: [],
    gridSize: 20,
    showGrid: true,
  });
  usePlannerFurnitureStore.setState({
    furniture: [],
    selectedId: null,
    selectedIds: [],
  });
  usePlannerUIStore.setState({
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    viewMode: "2d",
    backgroundImage: null,
    tags: [],
    lightingPreset: "day",
  });
  usePlannerHistoryStore.setState({
    undoStack: [],
    redoStack: [],
    clipboard: null,
  });
  usePlannerProjectStore.setState({
    projectName: "Untitled Project",
    currentProjectKey: null,
    isDirty: false,
    lastSavedAt: null,
    isSaving: false,
    saveError: null,
  });
}

const baseFurniture: Omit<FurnitureItem, "id" | "zIndex"> = {
  catalogId: "task-chair",
  name: "Task Chair",
  x: 100,
  y: 200,
  width: 50,
  height: 50,
  rotation: 0,
  color: "#333",
  shape: "task-chair",
};

describe("plannerProjectStore", () => {
  beforeEach(() => {
    uuidCounter = 0;
    Object.defineProperty(window, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    resetDomainStores();
  });

  describe("validateImportedProject", () => {
    it("accepts valid project payloads and rejects invalid ones", () => {
      expect(
        validateImportedProject({
          walls: [{ start: { x: 0, y: 0 }, end: { x: 10, y: 0 } }],
          rooms: [{ points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }] }],
        }),
      ).toEqual({ valid: true, errors: [] });

      const invalid = validateImportedProject({ furniture: "nope" });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);
    });
  });

  describe("saveProject and loadProject", () => {
    it("saves a new project to localStorage and the index", async () => {
      usePlannerProjectStore.setState({ projectName: "HQ Layout" });

      await usePlannerProjectStore.getState().saveProject("thumb-data");

      const state = usePlannerProjectStore.getState();
      expect(state.currentProjectKey).toBe("project-uuid-1");
      expect(state.isDirty).toBe(false);
      expect(state.isSaving).toBe(false);
      expect(state.lastSavedAt).toBeTruthy();

      const index = JSON.parse(window.localStorage.getItem("planner_project_index") ?? "[]");
      expect(index).toHaveLength(1);
      expect(index[0]).toMatchObject({ id: "project-uuid-1", name: "HQ Layout", thumbnail: "thumb-data" });
    });

    it("updates an existing project entry on subsequent saves", async () => {
      usePlannerProjectStore.setState({ currentProjectKey: "existing-key", projectName: "Existing" });
      window.localStorage.setItem(
        "planner_project_index",
        JSON.stringify([{ id: "existing-key", name: "Existing", updatedAt: "2026-01-01T00:00:00.000Z" }]),
      );
      window.localStorage.setItem(
        "planner-project-existing-key",
        JSON.stringify({ projectName: "Existing", walls: [], rooms: [], furniture: [] }),
      );

      await usePlannerProjectStore.getState().saveProject();

      const index = JSON.parse(window.localStorage.getItem("planner_project_index") ?? "[]");
      expect(index).toHaveLength(1);
      expect(index[0].id).toBe("existing-key");
      expect(index[0].updatedAt).not.toBe("2026-01-01T00:00:00.000Z");
    });

    it("loads a saved project into domain stores", async () => {
      const saved = {
        projectName: "Loaded Plan",
        walls: [{ id: "wall-1", start: { x: 0, y: 0 }, end: { x: 50, y: 0 }, thickness: 8 }],
        rooms: [],
        furniture: [],
        doors: [],
        windows: [],
        measurements: [{ id: "m-1", start: { x: 0, y: 0 }, end: { x: 10, y: 0 } }],
        zones: [],
        structuralElements: [{ id: "s-1", type: "column", x: 5, y: 5 }],
        selectedId: null,
        selectedIds: [],
        zoom: 2,
        panOffset: { x: 12, y: 8 },
        gridSize: 15,
        showGrid: false,
        viewMode: "3d",
        backgroundImage: null,
        tags: ["alpha"],
        lightingPreset: "evening",
        savedAt: "2026-06-01T00:00:00.000Z",
      };

      window.localStorage.setItem("planner-project-load-key", JSON.stringify(saved));
      await usePlannerProjectStore.getState().loadProject("load-key");

      expect(usePlannerProjectStore.getState().projectName).toBe("Loaded Plan");
      expect(usePlannerProjectStore.getState().currentProjectKey).toBe("load-key");
      expect(usePlannerGeometryStore.getState().walls).toHaveLength(1);
      expect(usePlannerGeometryStore.getState().measurements[0].label).toBe("");
      expect(usePlannerGeometryStore.getState().structuralElements[0].points[0]).toEqual({ x: 5, y: 5 });
      expect(usePlannerUIStore.getState().zoom).toBe(2);
      expect(usePlannerUIStore.getState().viewMode).toBe("3d");
      expect(usePlannerUIStore.getState().tags).toEqual(["alpha"]);
      expect(usePlannerHistoryStore.getState().undoStack).toEqual([]);
    });

    it("throws when loading a missing project", async () => {
      await expect(usePlannerProjectStore.getState().loadProject("missing")).rejects.toThrow(
        "Project not found",
      );
    });

    it("records save errors when persistence fails", async () => {
      const storage = window.localStorage as Storage & { setItem: (key: string, value: string) => void };
      vi.spyOn(storage, "setItem").mockImplementation(() => {
        throw new Error("disk full");
      });

      await expect(usePlannerProjectStore.getState().saveProject()).rejects.toThrow("disk full");
      expect(usePlannerProjectStore.getState().saveError).toBe("disk full");
      expect(usePlannerProjectStore.getState().isSaving).toBe(false);
    });
  });

  describe("newProject, duplicateProject, deleteProject", () => {
    it("clears domain stores on newProject", () => {
      usePlannerGeometryStore.getState().addWall({ x: 0, y: 0 }, { x: 40, y: 0 });
      usePlannerFurnitureStore.getState().addFurniture(baseFurniture);
      usePlannerProjectStore.setState({ projectName: "Dirty", currentProjectKey: "key-1", isDirty: true });

      usePlannerProjectStore.getState().newProject();

      expect(usePlannerGeometryStore.getState().walls).toHaveLength(0);
      expect(usePlannerFurnitureStore.getState().furniture).toHaveLength(0);
      expect(usePlannerProjectStore.getState()).toMatchObject({
        projectName: "Untitled Project",
        currentProjectKey: null,
        isDirty: false,
        lastSavedAt: null,
      });
    });

    it("duplicates the current project and loads the copy", async () => {
      const payload = {
        projectName: "Original",
        walls: [],
        rooms: [],
        furniture: [],
        thumbnail: "thumb",
      };
      window.localStorage.setItem("planner-project-src-key", JSON.stringify(payload));
      window.localStorage.setItem(
        "planner_project_index",
        JSON.stringify([{ id: "src-key", name: "Original", updatedAt: "2026-06-01T00:00:00.000Z" }]),
      );
      usePlannerProjectStore.setState({ currentProjectKey: "src-key", projectName: "Original" });

      usePlannerProjectStore.getState().duplicateProject();

      const state = usePlannerProjectStore.getState();
      expect(state.currentProjectKey).toBe("project-uuid-1");
      expect(state.projectName).toBe("Original");

      const index = JSON.parse(window.localStorage.getItem("planner_project_index") ?? "[]");
      expect(index).toHaveLength(2);
      expect(window.localStorage.getItem("planner-project-project-uuid-1")).toBe(JSON.stringify(payload));
    });

    it("no-ops duplicate when there is no current project", () => {
      usePlannerProjectStore.getState().duplicateProject();
      expect(usePlannerProjectStore.getState().currentProjectKey).toBeNull();
    });

    it("deletes projects and resets when deleting the active project", async () => {
      window.localStorage.setItem(
        "planner_project_index",
        JSON.stringify([
          { id: "keep-key", name: "Keep", updatedAt: "2026-06-01T00:00:00.000Z" },
          { id: "drop-key", name: "Drop", updatedAt: "2026-06-02T00:00:00.000Z" },
        ]),
      );
      window.localStorage.setItem("planner-project-drop-key", JSON.stringify({ projectName: "Drop" }));
      usePlannerGeometryStore.getState().addWall({ x: 0, y: 0 }, { x: 10, y: 0 });
      usePlannerProjectStore.setState({ currentProjectKey: "drop-key", projectName: "Drop" });

      await usePlannerProjectStore.getState().deleteProject("drop-key");

      expect(window.localStorage.getItem("planner-project-drop-key")).toBeNull();
      const index = JSON.parse(window.localStorage.getItem("planner_project_index") ?? "[]");
      expect(index).toEqual([{ id: "keep-key", name: "Keep", updatedAt: "2026-06-01T00:00:00.000Z" }]);
      expect(usePlannerProjectStore.getState().currentProjectKey).toBeNull();
      expect(usePlannerGeometryStore.getState().walls).toHaveLength(0);
    });
  });

  describe("import, export, list, clear, hasContent", () => {
    it("imports project data into domain stores", () => {
      usePlannerProjectStore.getState().importProject({
        projectName: "Imported",
        walls: [{ id: "w-1", start: { x: 0, y: 0 }, end: { x: 20, y: 0 }, thickness: 8 }],
        rooms: [],
        furniture: [],
        tags: ["imported"],
        zoom: 1.25,
        viewMode: "split",
      } as never);

      expect(usePlannerProjectStore.getState()).toMatchObject({
        projectName: "Imported",
        currentProjectKey: null,
        isDirty: true,
        lastSavedAt: null,
      });
      expect(usePlannerGeometryStore.getState().walls).toHaveLength(1);
      expect(usePlannerUIStore.getState().viewMode).toBe("split");
    });

    it("exports the current planner snapshot", () => {
      usePlannerGeometryStore.getState().addWall({ x: 0, y: 0 }, { x: 30, y: 0 });
      usePlannerFurnitureStore.getState().addFurniture(baseFurniture);
      usePlannerUIStore.getState().setZoom(1.5);
      usePlannerProjectStore.setState({ projectName: "Export Me" });

      const exported = usePlannerProjectStore.getState().exportProject();
      expect(exported).toMatchObject({
        projectName: "Export Me",
        zoom: 1.5,
      });
      expect((exported as { walls: unknown[] }).walls).toHaveLength(1);
      expect((exported as { furniture: unknown[] }).furniture).toHaveLength(1);
    });

    it("lists projects from the index", async () => {
      window.localStorage.setItem(
        "planner_project_index",
        JSON.stringify([
          { id: "a", name: "Alpha", updatedAt: "2026-06-01T00:00:00.000Z" },
          { id: "b", name: "Beta" },
        ]),
      );

      const projects = await usePlannerProjectStore.getState().listProjects();
      expect(projects).toEqual([
        { id: "a", name: "Alpha", updatedAt: "2026-06-01T00:00:00.000Z" },
        { id: "b", name: "Beta", updatedAt: expect.any(String) },
      ]);
    });

    it("clears all planner state", () => {
      usePlannerGeometryStore.getState().addWall({ x: 0, y: 0 }, { x: 10, y: 0 });
      usePlannerProjectStore.setState({ projectName: "Reset", isDirty: true, currentProjectKey: "x" });

      usePlannerProjectStore.getState().clearAll();

      expect(usePlannerGeometryStore.getState().walls).toHaveLength(0);
      expect(usePlannerProjectStore.getState()).toMatchObject({
        projectName: "Untitled Project",
        currentProjectKey: null,
        isDirty: false,
        lastSavedAt: null,
      });
    });

    it("loads sparse projects and detects furniture content", async () => {
      window.localStorage.setItem(
        "planner-project-sparse",
        JSON.stringify({ walls: [], rooms: [], furniture: [] }),
      );
      await usePlannerProjectStore.getState().loadProject("sparse");
      expect(usePlannerProjectStore.getState().projectName).toBe("Untitled");

      usePlannerFurnitureStore.getState().addFurniture(baseFurniture);
      expect(usePlannerProjectStore.getState().hasContent()).toBe(true);
    });

    it("detects whether the canvas has content", () => {
      expect(usePlannerProjectStore.getState().hasContent()).toBe(false);

      usePlannerGeometryStore.getState().addRoom(
        [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }],
        "Room",
      );
      expect(usePlannerProjectStore.getState().hasContent()).toBe(true);
    });

    it("detects doors, windows, measurements, zones, and structural content", () => {
      const geometry = usePlannerGeometryStore.getState();
      geometry.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;
      geometry.addDoor(wallId, 20, 80);
      expect(usePlannerProjectStore.getState().hasContent()).toBe(true);

      resetDomainStores();
      usePlannerGeometryStore.getState().addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      const windowWallId = usePlannerGeometryStore.getState().walls[0].id;
      usePlannerGeometryStore.getState().addWindow(windowWallId, 40, 100);
      expect(usePlannerProjectStore.getState().hasContent()).toBe(true);

      resetDomainStores();
      usePlannerGeometryStore.getState().addMeasurement({ x: 0, y: 0 }, { x: 10, y: 0 });
      expect(usePlannerProjectStore.getState().hasContent()).toBe(true);

      resetDomainStores();
      usePlannerGeometryStore.getState().addZone(
        [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }],
        "Z",
        "Meeting",
      );
      expect(usePlannerProjectStore.getState().hasContent()).toBe(true);

      resetDomainStores();
      usePlannerGeometryStore.getState().addStructuralElement("column", [{ x: 1, y: 1 }]);
      expect(usePlannerProjectStore.getState().hasContent()).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("no-ops duplicate when source data is missing", () => {
      usePlannerProjectStore.setState({ currentProjectKey: "missing-src" });
      usePlannerProjectStore.getState().duplicateProject();
      expect(usePlannerProjectStore.getState().currentProjectKey).toBe("missing-src");
    });

    it("deletes a project without resetting when it is not active", async () => {
      window.localStorage.setItem(
        "planner_project_index",
        JSON.stringify([{ id: "other-key", name: "Other", updatedAt: "2026-06-01T00:00:00.000Z" }]),
      );
      window.localStorage.setItem("planner-project-other-key", JSON.stringify({ projectName: "Other" }));
      usePlannerProjectStore.setState({ currentProjectKey: "active-key", projectName: "Active" });

      await usePlannerProjectStore.getState().deleteProject("other-key");

      expect(usePlannerProjectStore.getState().currentProjectKey).toBe("active-key");
      expect(window.localStorage.getItem("planner-project-other-key")).toBeNull();
    });

    it("loads projects with sparse optional fields", async () => {
      window.localStorage.setItem(
        "planner-project-sparse-fields",
        JSON.stringify({
          walls: [],
          rooms: [],
          furniture: [],
          measurements: [{ id: "m-1", start: { x: 0, y: 0 }, end: { x: 10, y: 0 } }],
          structuralElements: [{ id: "s-1", type: "column", x: 4, y: 6 }],
        }),
      );
      await usePlannerProjectStore.getState().loadProject("sparse-fields");
      expect(usePlannerGeometryStore.getState().measurements[0].label).toBe("");
      expect(usePlannerGeometryStore.getState().gridSize).toBe(20);
      expect(usePlannerGeometryStore.getState().showGrid).toBe(true);
      expect(usePlannerUIStore.getState().zoom).toBe(1);
      expect(usePlannerUIStore.getState().lightingPreset).toBe("day");
    });

    it("records non-error save failures with a fallback message", async () => {
      vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
        throw "disk full";
      });

      await expect(usePlannerProjectStore.getState().saveProject()).rejects.toBe("disk full");
      expect(usePlannerProjectStore.getState().saveError).toBe("Save failed");
    });
  });
});