import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { usePlannerProjectStore } from "@/features/planner/store/plannerProjectStore";
import { usePlannerGeometryStore } from "@/features/planner/store/plannerGeometryStore";
import { usePlannerUIStore } from "@/features/planner/store/plannerUIStore";
import type { PlannerDocument } from "@/features/planner/store/plannerTypes";

vi.mock("uuid", () => ({
  v4: () => "mock-uuid"
}));

describe("plannerProjectStore", () => {
  beforeEach(() => {
    localStorage.clear();
    
    // Reset all stores to their defaults
    usePlannerProjectStore.getState().clearAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles newProject by clearing state", () => {
    const store = usePlannerProjectStore.getState();
    const geoStore = usePlannerGeometryStore.getState();
    
    geoStore.addWall({ x: 0, y: 0 }, { x: 100, y: 100 });
    usePlannerProjectStore.setState({ currentProjectKey: "some-key", isDirty: true });
    
    store.newProject();
    
    const state = usePlannerProjectStore.getState();
    expect(state.currentProjectKey).toBeNull();
    expect(state.isDirty).toBe(false);
    expect(usePlannerGeometryStore.getState().walls).toHaveLength(0);
  });

  it("saves a new project to localStorage", async () => {
    const store = usePlannerProjectStore.getState();
    
    // Add some geometry to verify it saves
    usePlannerGeometryStore.getState().addWall({ x: 0, y: 0 }, { x: 10, y: 10 });
    
    await store.saveProject("thumb.png");
    
    const state = usePlannerProjectStore.getState();
    expect(state.currentProjectKey).toBe("mock-uuid");
    expect(state.isSaving).toBe(false);
    expect(state.saveError).toBeNull();

    const storedData = localStorage.getItem(`planner-project-mock-uuid`);
    expect(storedData).toBeDefined();
    expect(JSON.parse(storedData as string).walls).toHaveLength(1);
    
    const index = JSON.parse(localStorage.getItem("planner_project_index") || "[]");
    expect(index).toHaveLength(1);
    expect(index[0].thumbnail).toBe("thumb.png");
  });

  it("saves an existing project and updates the index", async () => {
    // Setup an existing project
    usePlannerProjectStore.setState({ currentProjectKey: "existing-key" });
    localStorage.setItem("planner_project_index", JSON.stringify([{ id: "existing-key", name: "Old", updatedAt: "" }]));
    
    const store = usePlannerProjectStore.getState();
    await store.saveProject("new-thumb.png");
    
    const state = usePlannerProjectStore.getState();
    expect(state.currentProjectKey).toBe("existing-key");

    const index = JSON.parse(localStorage.getItem("planner_project_index") || "[]");
    expect(index[0].thumbnail).toBe("new-thumb.png");
  });

  it("catches and stores save errors", async () => {
    const spy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("Quota Exceeded");
    });
    const store = usePlannerProjectStore.getState();
    
    await expect(store.saveProject()).rejects.toThrow("Quota Exceeded");
    const state = usePlannerProjectStore.getState();
    expect(state.saveError).toBe("Quota Exceeded");
    spy.mockRestore();
  });

  it("catches and handles non-Error objects gracefully", async () => {
    const spy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw "String Error"; // Throwing a string directly
    });
    const store = usePlannerProjectStore.getState();
    
    await expect(store.saveProject()).rejects.toThrow("String Error");
    const state = usePlannerProjectStore.getState();
    expect(state.saveError).toBe("Save failed");
    spy.mockRestore();
  });

  it("loads a valid project from localStorage", async () => {
    const projectData = {
      version: 1,
      projectName: "Loaded Project",
      walls: [{ id: "w1", start: {x:0, y:0}, end: {x:100, y:100}, thickness: 8, color: "red" }],
      rooms: [], doors: [], windows: [], measurements: [{ id: "1", start: {x:0, y:0}, end: {x:0, y:0}, label: "label" }],
      zones: [], furniture: [], textLabels: [], structuralElements: [{ id: "1", type: "beam", x: 0, y: 0, points: [{x:0, y:0}] }],
      gridSize: 30, showGrid: false, zoom: 2, panOffset: {x: 10, y: 10}, viewMode: "3d",
      backgroundImage: null, tags: [], lightingPreset: "night"
    };
    localStorage.setItem(`planner-project-my-key`, JSON.stringify(projectData));

    const store = usePlannerProjectStore.getState();
    await store.loadProject("my-key");

    const state = usePlannerProjectStore.getState();
    expect(state.projectName).toBe("Loaded Project");
    expect(state.currentProjectKey).toBe("my-key");

    const geoState = usePlannerGeometryStore.getState();
    expect(geoState.gridSize).toBe(30);
    expect(geoState.showGrid).toBe(false);
    expect(geoState.walls).toHaveLength(1);
    
    const uiState = usePlannerUIStore.getState();
    expect(uiState.zoom).toBe(2);
    expect(uiState.viewMode).toBe("3d");
  });

  it("throws when loading a non-existent project", async () => {
    const store = usePlannerProjectStore.getState();
    await expect(store.loadProject("missing-key")).rejects.toThrow("Project not found");
  });

  it("duplicates the current project", () => {
    usePlannerProjectStore.setState({ currentProjectKey: "key-1", projectName: "Base Project" });
    const projectData = usePlannerProjectStore.getState().exportProject();
    localStorage.setItem(`planner-project-key-1`, JSON.stringify(projectData));

    const store = usePlannerProjectStore.getState();
    store.duplicateProject();

    const index = JSON.parse(localStorage.getItem("planner_project_index") || "[]");
    expect(index).toHaveLength(1);
    expect(index[0].name).toBe("Base Project (Copy)");
    expect(usePlannerProjectStore.getState().currentProjectKey).toBe("mock-uuid");
  });

  it("safely ignores duplication if no current project exists", () => {
    const store = usePlannerProjectStore.getState();
    store.duplicateProject();
    expect(usePlannerProjectStore.getState().currentProjectKey).toBeNull();
  });

  it("deletes a project and its index entry", async () => {
    localStorage.setItem(`planner-project-key-1`, "{}");
    localStorage.setItem("planner_project_index", JSON.stringify([{ id: "key-1" }]));
    
    // Set it as current project to verify newProject is triggered
    usePlannerProjectStore.setState({ currentProjectKey: "key-1" });

    const store = usePlannerProjectStore.getState();
    await store.deleteProject("key-1");

    expect(localStorage.getItem(`planner-project-key-1`)).toBeNull();
    const index = JSON.parse(localStorage.getItem("planner_project_index") || "[]");
    expect(index).toHaveLength(0);
    
    expect(usePlannerProjectStore.getState().currentProjectKey).toBeNull();
  });

  it("lists all saved projects from the index", async () => {
    localStorage.setItem("planner_project_index", JSON.stringify([
      { id: "1", name: "P1", updatedAt: "date" },
      { id: "2", name: "P2" }
    ]));
    const store = usePlannerProjectStore.getState();
    const list = await store.listProjects();
    
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe("1");
    expect(list[1].name).toBe("P2");
  });

  it("imports a raw project payload and populates all stores", () => {
    const projectData = {
      projectName: "Imported Payload",
      walls: [], rooms: [], doors: [], windows: [], measurements: [{ id: "m1", start: {x:0,y:0}, end: {x:1,y:1} }],
      zones: [], furniture: [], textLabels: [], structuralElements: [{ id: "1", type: "beam", x: 0, y: 0, points: [{x:0, y:0}] }],
      zoom: 3, viewMode: "3d", showGrid: false
    };
    
    const store = usePlannerProjectStore.getState();
    store.importProject(projectData as unknown as PlannerDocument);

    const state = usePlannerProjectStore.getState();
    expect(state.projectName).toBe("Imported Payload");
    expect(state.isDirty).toBe(true);
    expect(state.currentProjectKey).toBeNull();
    
    const uiState = usePlannerUIStore.getState();
    expect(uiState.zoom).toBe(3);
    expect(uiState.viewMode).toBe("3d");
  });

  it("identifies if the workspace has content", () => {
    const store = usePlannerProjectStore.getState();
    expect(store.hasContent()).toBe(false);
    
    usePlannerGeometryStore.getState().addWall({ x:0, y:0 }, { x:10, y:10 });
    expect(store.hasContent()).toBe(true);
  });
});

