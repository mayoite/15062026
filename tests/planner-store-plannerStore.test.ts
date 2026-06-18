import { beforeEach, describe, expect, it, vi } from "vitest";

let uuidCounter = 0;
vi.mock("uuid", () => ({
  v4: () => `furniture-uuid-${++uuidCounter}`,
}));

import {
  setToastStoreRef,
  usePlannerStore,
  usePlannerFurnitureStore,
  usePlannerGeometryStore,
  usePlannerHistoryStore,
  usePlannerProjectStore,
  usePlannerUIStore,
} from "@/features/planner/store/plannerStore";
import type { FurnitureItem } from "@/features/planner/store/plannerTypes";

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
    activeZoneType: "collaboration",
    snapDistance: 10,
    gridSize: 10,
    showGrid: true,
    wallDimensionUnit: "cm",
    cursorPosition: null,
  });
  usePlannerFurnitureStore.setState({
    furniture: [],
    instancedFurniture: [],
    activeCatalogId: null,
    selectedId: null,
    selectedIds: [],
  });
  usePlannerUIStore.setState({
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    sidebarCollapsed: false,
    viewMode: "2d",
    show3D: false,
    showGrid: true,
    backgroundImage: null,
    lightingPreset: "day",
    tags: [],
  });
  usePlannerHistoryStore.setState({
    undoStack: [],
    redoStack: [],
    clipboard: null,
  });
  usePlannerProjectStore.setState({
    projectName: "Untitled",
    currentProjectKey: null,
    isDirty: false,
    lastSavedAt: null,
    isSaving: false,
    saveError: null,
  });
}

function facade() {
  return usePlannerStore.getState();
}

describe("plannerStore facade", () => {
  beforeEach(() => {
    uuidCounter = 0;
    resetDomainStores();
    // Do not call setTool / usePlannerStore.setState here — Zustand merge drops facade getters.
  });

  describe("setToastStoreRef", () => {
    it("accepts a toast store ref without throwing", () => {
      const toast = { addToast: vi.fn() };
      expect(() => setToastStoreRef(toast)).not.toThrow();
      expect(() => setToastStoreRef(toast)).not.toThrow();
    });
  });

  describe("domain getters", () => {
    it("reads geometry from the geometry store", () => {
      usePlannerGeometryStore.getState().addWall({ x: 0, y: 0 }, { x: 50, y: 0 });
      expect(facade().walls).toHaveLength(1);
      expect(facade().textLabels).toEqual([]);
    });

    it("reads furniture and UI state from domain stores", () => {
      usePlannerFurnitureStore.getState().addFurniture(baseFurniture);
      usePlannerUIStore.getState().setZoom(1.5);
      expect(facade().furniture).toHaveLength(1);
      expect(facade().zoom).toBe(1.5);
    });

    it("reads project and history state from domain stores", () => {
      usePlannerProjectStore.setState({ projectName: "HQ", isDirty: true });
      usePlannerHistoryStore.setState({ undoStack: [{ walls: [] }] });
      expect(facade().projectName).toBe("HQ");
      expect(facade().isDirty).toBe(true);
      expect(facade().undoStack).toHaveLength(1);
    });
  });

  describe("setTool", () => {
    it("updates the local tool when no fabric editor bridge is available", () => {
      facade().setTool("wall");
      expect(usePlannerStore.getState().tool).toBe("wall");
    });

  });

  describe("geometry mutations", () => {
    it("delegates addWall to the geometry store", () => {
      facade().addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      expect(usePlannerGeometryStore.getState().walls).toHaveLength(1);
    });

    it("finishRoom returns the last room id or null", () => {
      expect(facade().finishRoom()).toBeNull();
      facade().addRoom(
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
        ],
        "Office",
      );
      const roomId = facade().finishRoom();
      expect(roomId).toBe(usePlannerGeometryStore.getState().rooms.at(-1)?.id ?? null);
    });

    it("cancelDrawing clears in-progress geometry drafts", () => {
      facade().setDrawingWall({ start: { x: 0, y: 0 } });
      facade().addDrawingRoomPoint({ x: 10, y: 10 });
      facade().cancelDrawing();
      expect(usePlannerGeometryStore.getState().drawingWall).toBeNull();
      expect(usePlannerGeometryStore.getState().drawingRoom).toEqual([]);
    });
  });

  describe("furniture mutations", () => {
    it("delegates addFurniture to the furniture store", () => {
      facade().addFurniture(baseFurniture);
      expect(usePlannerFurnitureStore.getState().furniture).toHaveLength(1);
    });

    it("maps updateFurnitureBatch changes to domain updates", () => {
      facade().addFurniture(baseFurniture);
      const id = usePlannerFurnitureStore.getState().furniture[0].id;
      facade().updateFurnitureBatch([{ id, changes: { name: "Renamed" } }]);
      expect(usePlannerFurnitureStore.getState().furniture[0].name).toBe("Renamed");
    });

    it("delegates updateFurnitureDebounced and deleteFurniture", () => {
      facade().addFurniture(baseFurniture);
      const id = usePlannerFurnitureStore.getState().furniture[0].id;
      facade().updateFurnitureDebounced(id, { name: "Debounced" });
      expect(usePlannerFurnitureStore.getState().furniture[0].name).toBe("Debounced");
      facade().deleteFurniture(id);
      expect(usePlannerFurnitureStore.getState().furniture).toHaveLength(0);
    });
  });

  describe("deleteItem", () => {
    it("deletes furniture when the id matches furniture", () => {
      facade().addFurniture(baseFurniture);
      const id = usePlannerFurnitureStore.getState().furniture[0].id;
      facade().deleteItem(id);
      expect(usePlannerFurnitureStore.getState().furniture).toHaveLength(0);
    });

    it("deletes walls when the id matches geometry", () => {
      facade().addWall({ x: 0, y: 0 }, { x: 40, y: 0 });
      const id = usePlannerGeometryStore.getState().walls[0].id;
      facade().deleteItem(id);
      expect(usePlannerGeometryStore.getState().walls).toHaveLength(0);
    });
  });

  describe("UI and project mutations", () => {
    it("delegates setZoom and setProjectName", () => {
      facade().setZoom(2);
      facade().setProjectName("North wing");
      expect(usePlannerUIStore.getState().zoom).toBe(2);
      expect(usePlannerProjectStore.getState().projectName).toBe("North wing");
    });

    it("toggle3D switches between 2d and 3d view modes", () => {
      expect(usePlannerUIStore.getState().viewMode).toBe("2d");
      facade().toggle3D();
      expect(usePlannerUIStore.getState().viewMode).toBe("3d");
      facade().toggle3D();
      expect(usePlannerUIStore.getState().viewMode).toBe("2d");
    });
  });

  describe("selection helpers", () => {
    it("returns the selected furniture type and item", () => {
      facade().addFurniture(baseFurniture);
      const id = usePlannerFurnitureStore.getState().furniture[0].id;
      facade().setSelected(id);
      expect(facade().getSelectedItemType()).toBe("furniture");
      expect(facade().getSelectedItem()?.id).toBe(id);
    });

    it("returns null when nothing is selected", () => {
      expect(facade().getSelectedItemType()).toBeNull();
      expect(facade().getSelectedItem()).toBeNull();
    });

    it("returns null for unknown selection ids", () => {
      facade().setSelected("unknown-selection-id");
      expect(facade().getSelectedItemType()).toBeNull();
      expect(facade().getSelectedItem()).toBeNull();
    });
  });

  describe("snapToGrid", () => {
    it("snaps a point to the geometry grid size", () => {
      usePlannerGeometryStore.getState().setSnapDistance(10);
      expect(facade().snapToGrid({ x: 23, y: 47 })).toEqual({ x: 20, y: 50 });
    });
  });

  describe("stubs", () => {
    it("saveAsCopy reports not implemented", () => {
      expect(facade().saveAsCopy("Copy")).toEqual({
        success: false,
        error: "Not implemented",
      });
    });

    it("exercises noop history and selection helpers", () => {
      facade().copySelected();
      facade().paste();
      facade().duplicateSelected();
      facade().selectAll();
      facade().flushDebouncedUndo();
      facade().addTextLabel(0, 0, "label");
      facade().updateTextLabel("id", { text: "x" });
      facade().deleteTextLabel("id");
      expect(usePlannerHistoryStore.getState().clipboard).toBeNull();
    });
  });

  describe("extended facade coverage", () => {
    it("delegates zone, measurement, and structural mutations", () => {
      facade().addZone(
        [
          { x: 0, y: 0 },
          { x: 40, y: 0 },
          { x: 40, y: 40 },
        ],
        "Zone A",
        "Meeting",
      );
      const zoneId = usePlannerGeometryStore.getState().zones[0].id;
      facade().updateZone(zoneId, { name: "Renamed" });
      facade().addMeasurement({ x: 0, y: 0 }, { x: 20, y: 0 });
      facade().addStructuralElement("column", 10, 10);
      expect(usePlannerGeometryStore.getState().zones[0].name).toBe("Renamed");
      expect(usePlannerGeometryStore.getState().measurements).toHaveLength(1);
      expect(usePlannerGeometryStore.getState().structuralElements).toHaveLength(1);
    });

    it("deleteItem removes rooms, zones, measurements, doors, windows, and structural elements", () => {
      facade().addRoom(
        [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 50, y: 50 },
        ],
        "Room",
      );
      const roomId = usePlannerGeometryStore.getState().rooms[0].id;
      facade().deleteItem(roomId);
      expect(usePlannerGeometryStore.getState().rooms).toHaveLength(0);

      facade().addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;
      facade().addDoor(0, 0, 0);
      facade().addWindow(0, 0, 0);
      const doorId = usePlannerGeometryStore.getState().doors[0].id;
      const windowId = usePlannerGeometryStore.getState().windows[0].id;
      facade().deleteItem(doorId);
      facade().deleteItem(windowId);
      facade().addZone(
        [
          { x: 0, y: 0 },
          { x: 20, y: 0 },
          { x: 20, y: 20 },
        ],
        "Zone",
        "Meeting",
      );
      facade().deleteItem(usePlannerGeometryStore.getState().zones[0].id);
      facade().addMeasurement({ x: 0, y: 0 }, { x: 10, y: 0 });
      facade().deleteItem(usePlannerGeometryStore.getState().measurements[0].id);
      facade().addStructuralElement("column", 5, 5);
      facade().deleteItem(usePlannerGeometryStore.getState().structuralElements[0].id);
      expect(usePlannerGeometryStore.getState().doors).toHaveLength(0);
      expect(usePlannerGeometryStore.getState().windows).toHaveLength(0);
      expect(usePlannerGeometryStore.getState().zones).toHaveLength(0);
      expect(usePlannerGeometryStore.getState().measurements).toHaveLength(0);
      expect(usePlannerGeometryStore.getState().structuralElements).toHaveLength(0);
      expect(usePlannerGeometryStore.getState().walls[0].id).toBe(wallId);
    });

    it("delegates furniture batching, ordering, and multi-select helpers", () => {
      facade().addFurnitureBatch([baseFurniture, { ...baseFurniture, name: "Desk" }]);
      const ids = usePlannerFurnitureStore.getState().furniture.map((item) => item.id);
      facade().setSelectedIds(ids);
      facade().toggleSelectedId(ids[0]);
      facade().bringToFront(ids[1]);
      facade().sendToBack(ids[1]);
      facade().setActiveCatalogId("task-chair");
      expect(usePlannerFurnitureStore.getState().furniture).toHaveLength(2);
      expect(usePlannerFurnitureStore.getState().activeCatalogId).toBe("task-chair");
    });

    it("delegates UI, project, history, and drawing helpers", () => {
      facade().setPanOffset({ x: 5, y: 6 });
      facade().toggleGrid();
      facade().toggleSidebar();
      facade().setViewMode("split");
      facade().setDirty(true);
      facade().setLightingPreset("evening");
      facade().addTag("alpha");
      facade().removeTag("alpha");
      facade().pushSnapshot();
      facade().canUndo();
      facade().canRedo();
      facade().setCursorPosition({ x: 1, y: 2 });
      expect(usePlannerUIStore.getState().panOffset).toEqual({ x: 5, y: 6 });
      expect(usePlannerProjectStore.getState().isDirty).toBe(true);
      expect(usePlannerHistoryStore.getState().undoStack).toHaveLength(1);
      expect(usePlannerGeometryStore.getState().cursorPosition).toEqual({ x: 1, y: 2 });
    });

    it("resolves selected geometry types through the facade", () => {
      facade().addWall({ x: 0, y: 0 }, { x: 30, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;
      facade().setSelected(wallId);
      expect(facade().getSelectedItemType()).toBe("wall");
      expect(facade().getSelectedItem()?.id).toBe(wallId);
    });

    it("resolves room, door, and window selections through the facade", () => {
      facade().addRoom(
        [
          { x: 0, y: 0 },
          { x: 40, y: 0 },
          { x: 40, y: 40 },
        ],
        "Room",
      );
      const roomId = usePlannerGeometryStore.getState().rooms[0].id;
      facade().setSelected(roomId);
      expect(facade().getSelectedItemType()).toBe("room");

      facade().addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;
      usePlannerGeometryStore.getState().addDoor(wallId, 20, 80);
      const doorId = usePlannerGeometryStore.getState().doors[0].id;
      facade().setSelected(doorId);
      expect(facade().getSelectedItemType()).toBe("door");

      usePlannerGeometryStore.getState().addWindow(wallId, 60, 100);
      const windowId = usePlannerGeometryStore.getState().windows[0].id;
      facade().setSelected(windowId);
      expect(facade().getSelectedItemType()).toBe("window");
      expect(facade().getSelectedItem()?.id).toBe(windowId);
    });

    it("delegates geometry settings and project helpers", () => {
      facade().setSnapDistance(25);
      facade().setWallDimensionUnit("mm");
      expect(usePlannerGeometryStore.getState().snapDistance).toBe(25);
      expect(usePlannerGeometryStore.getState().wallDimensionUnit).toBe("mm");

      facade().setProjectName("Facade Plan");
      facade().setDirty(true);
      expect(usePlannerProjectStore.getState().projectName).toBe("Facade Plan");
      expect(usePlannerProjectStore.getState().isDirty).toBe(true);
      expect(facade().hasContent()).toBe(false);
      expect(facade().getSavedProjects()).toEqual([]);
    });

    it("delegates project lifecycle, undo/redo, and noop template load", async () => {
      const storage = new Map<string, string>();
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            storage.set(key, value);
          },
          removeItem: (key: string) => {
            storage.delete(key);
          },
          key: (index: number) => Array.from(storage.keys())[index] ?? null,
          get length() {
            return storage.size;
          },
          clear: () => storage.clear(),
        },
        configurable: true,
      });

      usePlannerProjectStore.setState({ projectName: "Lifecycle Plan" });
      await facade().saveProject();
      const key = usePlannerProjectStore.getState().currentProjectKey!;
      await facade().loadProject(key);
      expect(usePlannerProjectStore.getState().projectName).toBe("Lifecycle Plan");

      usePlannerHistoryStore.getState().pushSnapshot({
        walls: [],
        rooms: [],
        furniture: [],
        doors: [],
        windows: [],
        measurements: [],
        zones: [],
        textLabels: [],
        structuralElements: [],
      });
      facade().undo();
      facade().redo();
      expect(facade().canUndo()).toBe(true);

      const exported = facade().exportProject();
      expect((exported as { projectName: string }).projectName).toBe("Lifecycle Plan");
      facade().importProject({ projectName: "Imported via facade", walls: [], rooms: [], furniture: [] } as never);
      expect(usePlannerProjectStore.getState().projectName).toBe("Imported via facade");

      await facade().listProjects();
      await facade().deleteProject(key);
      facade().clearAll();
      facade().loadTemplate({ id: "noop" } as never);
      expect(usePlannerProjectStore.getState().currentProjectKey).toBeNull();
    });

    it("delegates newProject and duplicateProject through the facade", () => {
      usePlannerGeometryStore.getState().addWall({ x: 0, y: 0 }, { x: 20, y: 0 });
      usePlannerProjectStore.setState({ currentProjectKey: "src-key", projectName: "Source" });
      window.localStorage.setItem(
        "planner-project-src-key",
        JSON.stringify({ projectName: "Source", walls: [], rooms: [], furniture: [] }),
      );
      window.localStorage.setItem(
        "planner_project_index",
        JSON.stringify([{ id: "src-key", name: "Source", updatedAt: "2026-06-01T00:00:00.000Z" }]),
      );

      facade().newProject();
      expect(usePlannerGeometryStore.getState().walls).toHaveLength(0);
      expect(usePlannerProjectStore.getState().currentProjectKey).toBeNull();

      usePlannerProjectStore.setState({ currentProjectKey: "src-key", projectName: "Source" });
      facade().duplicateProject();
      const duplicatedKey = usePlannerProjectStore.getState().currentProjectKey;
      expect(duplicatedKey).not.toBe("src-key");
      expect(window.localStorage.getItem(`planner-project-${duplicatedKey}`)).toBeTruthy();
    });

    it("delegates background image and remaining geometry updates", () => {
      const bg = {
        url: "/bg.png",
        width: 100,
        height: 100,
        scale: 1,
        opacity: 1,
        x: 0,
        y: 0,
        isCalibrating: false,
        isLocked: false,
      };
      facade().setBackgroundImage(bg);
      facade().updateBackgroundImage({ opacity: 0.5 });
      expect(usePlannerUIStore.getState().backgroundImage).toMatchObject({ opacity: 0.5 });

      facade().addWall({ x: 0, y: 0 }, { x: 50, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;
      facade().updateWall(wallId, { thickness: 12 });
      facade().updateWallDebounced(wallId, { thickness: 14 });
      facade().moveWallEndpoint(wallId, "end", { x: 60, y: 0 });
      facade().moveConnectedWalls(wallId, "end", { x: 70, y: 0 });
      facade().splitWallAtPoint(wallId, { x: 25, y: 0 });
      facade().updateRoom(
        usePlannerGeometryStore.getState().rooms[0]?.id ?? "missing",
        { name: "Renamed" },
      );
      facade().updateDoor(usePlannerGeometryStore.getState().doors[0]?.id ?? "missing", { width: 90 });
      facade().updateWindow(usePlannerGeometryStore.getState().windows[0]?.id ?? "missing", { width: 120 });
      facade().addDrawingZonePoint({ x: 5, y: 5 });
      facade().finishZone();
      facade().setActiveZoneType("Meeting");
      facade().setTags(["tag-a"]);
      expect(usePlannerUIStore.getState().tags).toEqual(["tag-a"]);
    });
  });
});
