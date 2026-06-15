import { create } from "zustand";
import { v4 as uuid } from "uuid";
import { buildProjectSaveData, normalizeLoadedProjectData } from "./plannerProjectData";
import { buildClearedPlannerState } from "./plannerStateUtils";
import {
  getProjectIndex,
  migrateOldProjects,
  saveProjectIndex,
  validateImportedProject,
} from "./plannerProjectStorage";
import type { PlannerDocument } from "./plannerTypes";
import { usePlannerGeometryStore } from "./plannerGeometryStore";
import { usePlannerFurnitureStore } from "./plannerFurnitureStore";
import { usePlannerUIStore } from "./plannerUIStore";
import { usePlannerHistoryStore } from "./plannerHistoryStore";

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: unknown) {
    if (e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22)) {
      const usedKB = Math.round(JSON.stringify(localStorage).length / 1024);
      console.error(`Storage full (${usedKB}KB used). Delete old projects to free space.`);
    }
    return false;
  }
}

migrateOldProjects({
  generateId: uuid,
  persist: safeSetItem,
});

export { validateImportedProject };

interface ProjectState {
  projectName: string;
  currentProjectKey: string | null;
  isDirty: boolean;
  lastSavedAt: string | null;
  isSaving: boolean;
  saveError: string | null;

  saveProject: (thumbnail?: string) => Promise<void>;
  loadProject: (key: string) => Promise<void>;
  newProject: () => void;
  duplicateProject: () => void;
  deleteProject: (key: string) => Promise<void>;
  listProjects: () => Promise<Array<{ id: string; name: string; updatedAt: string }>>;
  importProject: (data: PlannerDocument) => void;
  exportProject: () => PlannerDocument;
  clearAll: () => void;
  hasContent: () => boolean;
}

export const usePlannerProjectStore = create<ProjectState>((set, get) => ({
  projectName: "Untitled Project",
  currentProjectKey: null,
  isDirty: false,
  lastSavedAt: null,
  isSaving: false,
  saveError: null,

  saveProject: async (thumbnail) => {
    set({ isSaving: true, saveError: null });
    try {
      const geometry = usePlannerGeometryStore.getState();
      const furniture = usePlannerFurnitureStore.getState();
      const ui = usePlannerUIStore.getState();
      const saveData = buildProjectSaveData({
        projectName: get().projectName,
        walls: geometry.walls,
        rooms: geometry.rooms,
        furniture: furniture.furniture,
        doors: geometry.doors,
        windows: geometry.windows,
        measurements: geometry.measurements,
        zones: geometry.zones,
        textLabels: [],
        structuralElements: geometry.structuralElements,
        selectedId: furniture.selectedId,
        selectedIds: furniture.selectedIds,
        zoom: ui.zoom,
        panOffset: ui.panOffset,
        gridSize: geometry.gridSize,
        showGrid: geometry.showGrid,
        viewMode: ui.viewMode,
        backgroundImage: ui.backgroundImage,
        tags: ui.tags,
        lightingPreset: ui.lightingPreset,
        thumbnail,
      });

      const projectKey = get().currentProjectKey || uuid();
      const index = getProjectIndex();
      const existing = index.find((p) => p.id === projectKey);

      if (existing) {
        existing.updatedAt = new Date().toISOString();
        existing.thumbnail = thumbnail;
        saveProjectIndex(index);
      } else {
        index.push({
          id: projectKey,
          name: get().projectName,
          updatedAt: new Date().toISOString(),
          thumbnail,
        });
        saveProjectIndex(index);
      }

      localStorage.setItem(`planner-project-${projectKey}`, JSON.stringify(saveData));
      set({ currentProjectKey: projectKey, isDirty: false, lastSavedAt: new Date().toISOString(), isSaving: false });
    } catch (error) {
      set({ isSaving: false, saveError: error instanceof Error ? error.message : "Save failed" });
      throw error;
    }
  },

  loadProject: async (key) => {
    const data = localStorage.getItem(`planner-project-${key}`);
    if (!data) throw new Error("Project not found");

    const parsed = JSON.parse(data);
    const normalized = normalizeLoadedProjectData(parsed);

    usePlannerGeometryStore.setState({
      walls: normalized.walls,
      rooms: normalized.rooms,
      doors: normalized.doors,
      windows: normalized.windows,
      measurements: normalized.measurements.map((m) => ({ ...m, label: m.label ?? "" })),
      zones: normalized.zones,
      structuralElements: normalized.structuralElements.map((s) => ({
        id: s.id,
        type: s.type,
        points: [{ x: s.x, y: s.y }],
      })),
      drawingWall: null,
      drawingRoom: [],
      drawingZone: [],
      gridSize: normalized.gridSize ?? 20,
      showGrid: normalized.showGrid ?? true,
    });

    usePlannerFurnitureStore.setState({
      furniture: normalized.furniture,
      selectedId: normalized.selectedId,
      selectedIds: normalized.selectedIds,
    });

    usePlannerUIStore.setState({
      zoom: normalized.zoom ?? 1,
      panOffset: normalized.panOffset ?? { x: 0, y: 0 },
      viewMode: normalized.viewMode ?? "2d",
      backgroundImage: normalized.backgroundImage ?? null,
      tags: normalized.tags ?? [],
      lightingPreset: normalized.lightingPreset ?? "day",
    });

    usePlannerHistoryStore.setState({
      undoStack: [],
      redoStack: [],
      clipboard: null,
    });

    set({
      projectName: normalized.projectName ?? "Untitled Project",
      currentProjectKey: key,
      isDirty: false,
      lastSavedAt: new Date().toISOString(),
    });
  },

  newProject: () => {
    const cleared = buildClearedPlannerState();
    usePlannerGeometryStore.setState(cleared.geometry);
    usePlannerFurnitureStore.setState(cleared.furniture);
    usePlannerUIStore.setState(cleared.ui);
    usePlannerHistoryStore.setState(cleared.history);
    set({
      projectName: "Untitled Project",
      currentProjectKey: null,
      isDirty: false,
      lastSavedAt: null,
    });
  },

  duplicateProject: () => {
    const currentKey = get().currentProjectKey;
    if (!currentKey) return;
    const data = localStorage.getItem(`planner-project-${currentKey}`);
    if (!data) return;
    const parsed = JSON.parse(data);
    const newKey = uuid();
    const index = getProjectIndex();
    index.push({
      id: newKey,
      name: `${parsed.projectName} (Copy)`,
      updatedAt: new Date().toISOString(),
      thumbnail: parsed.thumbnail,
    });
    saveProjectIndex(index);
    localStorage.setItem(`planner-project-${newKey}`, data);
    get().loadProject(newKey);
  },

  deleteProject: async (key) => {
    localStorage.removeItem(`planner-project-${key}`);
    const index = getProjectIndex().filter((p) => p.id !== key);
    saveProjectIndex(index);
    if (get().currentProjectKey === key) {
      get().newProject();
    }
  },

  listProjects: async () => {
    const index = getProjectIndex();
    return index.map((p) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt ?? new Date().toISOString() }));
  },

  importProject: (data) => {
    const normalized = normalizeLoadedProjectData(data as unknown as Record<string, unknown>);
    usePlannerGeometryStore.setState({
      walls: normalized.walls,
      rooms: normalized.rooms,
      doors: normalized.doors,
      windows: normalized.windows,
      measurements: normalized.measurements.map((m) => ({ ...m, label: m.label ?? "" })),
      zones: normalized.zones,
      structuralElements: normalized.structuralElements.map((s) => ({
        id: s.id,
        type: s.type,
        points: [{ x: s.x, y: s.y }],
      })),
      drawingWall: null,
      drawingRoom: [],
      drawingZone: [],
      gridSize: normalized.gridSize ?? 20,
      showGrid: normalized.showGrid ?? true,
    });
    usePlannerFurnitureStore.setState({
      furniture: normalized.furniture,
      selectedId: normalized.selectedId,
      selectedIds: normalized.selectedIds,
    });
    usePlannerUIStore.setState({
      zoom: normalized.zoom ?? 1,
      panOffset: normalized.panOffset ?? { x: 0, y: 0 },
      viewMode: normalized.viewMode ?? "2d",
      backgroundImage: normalized.backgroundImage ?? null,
      tags: normalized.tags ?? [],
      lightingPreset: normalized.lightingPreset ?? "day",
    });
    usePlannerHistoryStore.setState({
      undoStack: [],
      redoStack: [],
      clipboard: null,
    });
    set({
      projectName: normalized.projectName ?? "Imported Project",
      currentProjectKey: null,
      isDirty: true,
      lastSavedAt: null,
    });
  },

  exportProject: () => {
    const geometry = usePlannerGeometryStore.getState();
    const furniture = usePlannerFurnitureStore.getState();
    const ui = usePlannerUIStore.getState();
    return buildProjectSaveData({
      projectName: get().projectName,
      walls: geometry.walls,
      rooms: geometry.rooms,
      furniture: furniture.furniture,
      doors: geometry.doors,
      windows: geometry.windows,
      measurements: geometry.measurements,
      zones: geometry.zones,
      textLabels: [],
      structuralElements: geometry.structuralElements,
      selectedId: furniture.selectedId,
      selectedIds: furniture.selectedIds,
      zoom: ui.zoom,
      panOffset: ui.panOffset,
      gridSize: geometry.gridSize,
      showGrid: geometry.showGrid,
      viewMode: ui.viewMode,
      backgroundImage: ui.backgroundImage,
      tags: ui.tags,
      lightingPreset: ui.lightingPreset,
    }) as unknown as PlannerDocument;
  },

  clearAll: () => {
    const cleared = buildClearedPlannerState();
    usePlannerGeometryStore.setState(cleared.geometry);
    usePlannerFurnitureStore.setState(cleared.furniture);
    usePlannerUIStore.setState(cleared.ui);
    usePlannerHistoryStore.setState(cleared.history);
    set({
      projectName: "Untitled Project",
      currentProjectKey: null,
      isDirty: false,
      lastSavedAt: null,
    });
  },

  hasContent: () => {
    const geometry = usePlannerGeometryStore.getState();
    const furniture = usePlannerFurnitureStore.getState();
    return (
      geometry.walls.length > 0 ||
      geometry.rooms.length > 0 ||
      furniture.furniture.length > 0 ||
      geometry.doors.length > 0 ||
      geometry.windows.length > 0 ||
      geometry.measurements.length > 0 ||
      geometry.zones.length > 0 ||
      geometry.structuralElements.length > 0
    );
  },
}));
