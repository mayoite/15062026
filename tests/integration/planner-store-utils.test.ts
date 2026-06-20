import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("uuid", () => ({ v4: () => "uuid-fixed-1" }));

import { floorTemplates } from "@/features/planner/store/floorTemplates";
import {
  buildClearedPlannerState,
  buildTemplateLoadedState,
  plannerHasContent,
  snapPointToGrid,
} from "@/features/planner/store/plannerStateUtils";
import {
  buildConnectedWallUpdates,
  applyConnectedWallUpdates,
  buildSplitWalls,
} from "@/features/planner/store/plannerWallEditUtils";
import {
  getSelectedItemTypeFromState,
  getSelectedItemFromState,
  getClipboardEntryFromState,
  getSelectAllTargetId,
  buildPastedClipboardEntry,
  buildPasteStatePatch,
} from "@/features/planner/store/plannerSelectionUtils";
import {
  sanitizeTags,
  validateTagAddition,
  removeTagCaseInsensitive,
} from "@/features/planner/store/plannerTagUtils";
import { buildUndoState, buildRedoState } from "@/features/planner/store/plannerHistoryUtils";
import {
  createMeasurementItem,
  createTextLabel,
  createStructuralElement,
  createZone,
} from "@/features/planner/store/plannerEntityFactories";
import { dist, projectT, isPointOnSegment, distance } from "@/features/planner/store/plannerStoreGeometry";
import { takeSnapshot, pushUndo, ROOM_COLORS } from "@/features/planner/store/plannerStoreSupport";
import {
  captureDebounceSnapshot,
  scheduleDebounceCommit,
  flushDebounce,
} from "@/features/planner/store/plannerDebouncedUndo";
import { buildRoomSetupTemplate } from "@/features/planner/store/roomSetup";
import type { PlannerState, Wall } from "@/features/planner/store/plannerTypes";
import { ZONE_COLORS } from "@/features/planner/store/plannerTypes";
import type { HistorySnapshot } from "@/features/planner/store/plannerStoreSupport";

function baseState(overrides: Partial<PlannerState> = {}): PlannerState {
  return {
    tool: "select",
    walls: [],
    rooms: [],
    furniture: [],
    doors: [],
    windows: [],
    measurements: [],
    zones: [],
    textLabels: [],
    structuralElements: [],
    selectedId: null,
    selectedIds: [],
    drawingWall: null,
    drawingRoom: [],
    drawingZone: [],
    cursorPosition: null,
    activeZoneType: "Open Plan",
    activeCatalogId: null,
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    gridSize: 10,
    showGrid: true,
    show3D: false,
    viewMode: "2d",
    sidebarCollapsed: false,
    undoStack: [],
    redoStack: [],
    clipboard: null,
    projectName: "Untitled",
    currentProjectKey: null,
    isDirty: false,
    lastSavedAt: null,
    isSaving: false,
    saveError: null,
    snapDistance: 10,
    wallDimensionUnit: "cm",
    backgroundImage: null,
    tags: [],
    lightingPreset: "day",
    setBackgroundImage: () => {},
    updateBackgroundImage: () => {},
    setTool: () => {},
    addWall: () => {},
    updateWall: () => {},
    moveWallEndpoint: () => {},
    addRoom: () => {},
    updateRoom: () => {},
    addFurniture: () => {},
    addDoor: () => {},
    addWindow: () => {},
    updateFurniture: () => {},
    updateFurnitureDebounced: () => {},
    updateDoor: () => {},
    updateDoorDebounced: () => {},
    updateWindow: () => {},
    updateWindowDebounced: () => {},
    updateWallDebounced: () => {},
    updateRoomDebounced: () => {},
    flushDebouncedUndo: () => {},
    deleteItem: () => {},
    setSelected: () => {},
    setDrawingWall: () => {},
    setCursorPosition: () => {},
    addDrawingRoomPoint: () => {},
    finishRoom: () => null,
    cancelDrawing: () => {},
    setZoom: () => {},
    setPanOffset: () => {},
    toggleGrid: () => {},
    toggle3D: () => {},
    toggleSidebar: () => {},
    setViewMode: () => {},
    setProjectName: () => {},
    setDirty: () => {},
    setSnapDistance: () => {},
    setWallDimensionUnit: () => {},
    setLightingPreset: () => {},
    setTags: () => {},
    addTag: () => {},
    removeTag: () => {},
    pushSnapshot: () => {},
    undo: () => null,
    redo: () => null,
    canUndo: () => false,
    canRedo: () => false,
    copySelected: () => {},
    paste: () => {},
    duplicateSelected: () => {},
    selectAll: () => {},
    saveProject: async () => ({ success: true }),
    saveAsCopy: () => ({ success: false, error: "Not implemented" }),
    loadProject: async () => ({ success: true }),
    getSavedProjects: () => [],
    newProject: () => {},
    duplicateProject: () => {},
    deleteProject: () => {},
    listProjects: () => [],
    importProject: () => {},
    exportProject: () => ({}),
    clearAll: () => {},
    hasContent: () => false,
    snapToGrid: (p) => p,
    loadTemplate: () => {},
    getSelectedItemType: () => null,
    getSelectedItem: () => null,
    addFurnitureBatch: () => {},
    updateFurnitureBatch: () => {},
    deleteFurniture: () => {},
    bringToFront: () => {},
    sendToBack: () => {},
    setActiveCatalogId: () => {},
    setSelectedIds: () => {},
    toggleSelectedId: () => {},
    deleteWall: () => {},
    deleteRoom: () => {},
    deleteDoor: () => {},
    deleteWindow: () => {},
    deleteZone: () => {},
    deleteMeasurement: () => {},
    deleteStructuralElement: () => {},
    moveConnectedWalls: () => {},
    splitWallAtPoint: () => {},
    addZone: () => {},
    updateZone: () => {},
    addDrawingZonePoint: () => {},
    finishZone: () => {},
    setActiveZoneType: () => {},
    addMeasurement: () => {},
    updateMeasurement: () => {},
    addStructuralElement: () => {},
    updateStructuralElement: () => {},
    addTextLabel: () => {},
    updateTextLabel: () => {},
    deleteTextLabel: () => {},
    ...overrides,
  };
}

describe("planner store utils", () => {
  describe("plannerStateUtils", () => {
    it("buildClearedPlannerState returns empty domain slices", () => {
      const cleared = buildClearedPlannerState();
      expect(cleared.geometry.walls).toEqual([]);
      expect(cleared.furniture.selectedId).toBeNull();
      expect(cleared.ui.viewMode).toBe("2d");
      expect(cleared.history.clipboard).toBeNull();
    });

    it("snapPointToGrid rounds to the snap distance", () => {
      expect(snapPointToGrid({ x: 23, y: 47 }, 10)).toEqual({ x: 20, y: 50 });
    });

    it("buildTemplateLoadedState instantiates a floor template", () => {
      const template = floorTemplates.find((t) => t.id === "single-room")!;
      const patch = buildTemplateLoadedState(template);
      expect(patch.walls).toHaveLength(template.walls.length);
      expect(patch.isDirty).toBe(true);
      expect(patch.selectedId).toBeNull();
    });

    it("plannerHasContent detects any drawable entity", () => {
      expect(plannerHasContent(baseState())).toBe(false);
      expect(plannerHasContent(baseState({ walls: [{ id: "w1", start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, thickness: 8, color: "#000" }] }))).toBe(true);
      expect(plannerHasContent(baseState({ textLabels: [{ id: "t1", x: 0, y: 0, text: "A", fontSize: 12, color: "#000", rotation: 0 }] }))).toBe(true);
    });
  });

  describe("plannerWallEditUtils", () => {
    const walls: Wall[] = [
      { id: "w1", start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, thickness: 8, color: "#000" },
      { id: "w2", start: { x: 100, y: 0 }, end: { x: 100, y: 100 }, thickness: 8, color: "#000" },
    ];

    it("buildConnectedWallUpdates returns null for unknown wall", () => {
      expect(buildConnectedWallUpdates(walls, "missing", "start", { x: 0, y: 0 })).toBeNull();
    });

    it("buildConnectedWallUpdates finds connected endpoints", () => {
      const plan = buildConnectedWallUpdates(walls, "w1", "end", { x: 110, y: 0 })!;
      expect(plan.wallUpdate.end).toEqual({ x: 110, y: 0 });
      expect(plan.connectedUpdates).toHaveLength(1);
      expect(plan.connectedUpdates[0].id).toBe("w2");
    });

    it("applyConnectedWallUpdates merges updates into wall list", () => {
      const plan = buildConnectedWallUpdates(walls, "w1", "start", { x: -5, y: 0 })!;
      const updated = applyConnectedWallUpdates(walls, "w1", plan.wallUpdate, plan.connectedUpdates);
      expect(updated.find((w) => w.id === "w1")?.start).toEqual({ x: -5, y: 0 });
    });

    it("buildSplitWalls creates two segments", () => {
      const [a, b] = buildSplitWalls(walls[0], { x: 50, y: 0 }, () => "seg-id");
      expect(a.end).toEqual({ x: 50, y: 0 });
      expect(b.start).toEqual({ x: 50, y: 0 });
      expect(b.end).toEqual(walls[0].end);
    });
  });

  describe("plannerSelectionUtils", () => {
    const furniture = {
      id: "f1",
      catalogId: "task-chair",
      name: "Chair",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      rotation: 0,
      color: "#000",
      shape: "task-chair",
      zIndex: 0,
    };

    it("resolves selected item type and entity", () => {
      const state = baseState({
        selectedId: "f1",
        furniture: [furniture],
      });
      expect(getSelectedItemTypeFromState(state)).toBe("furniture");
      expect(getSelectedItemFromState(state)?.id).toBe("f1");
    });

    it("resolves wall, room, door, and window selections", () => {
      const wall = { id: "w1", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, thickness: 8, color: "#000" };
      const room = { id: "r1", points: [{ x: 0, y: 0 }], name: "Room", color: "#fff" };
      const door = { id: "d1", x: 1, y: 2, rotation: 0, wallId: "w1", position: 10, width: 80, swing: 90, style: "single" as const };
      const window = { id: "win1", x: 3, y: 4, rotation: 0, wallId: "w1", position: 20, width: 100, style: "casement" as const };

      expect(getSelectedItemTypeFromState(baseState({ selectedId: "w1", walls: [wall] }))).toBe("wall");
      expect(getSelectedItemTypeFromState(baseState({ selectedId: "r1", rooms: [room] }))).toBe("room");
      expect(getSelectedItemTypeFromState(baseState({ selectedId: "d1", doors: [door] }))).toBe("door");
      expect(getSelectedItemTypeFromState(baseState({ selectedId: "win1", windows: [window] }))).toBe("window");
      expect(getSelectAllTargetId(baseState({ doors: [door], windows: [window], walls: [wall] }))).toBe("d1");
    });

    it("returns null when selection is missing or unknown", () => {
      expect(getSelectedItemTypeFromState(baseState())).toBeNull();
      expect(getSelectedItemFromState(baseState({ selectedId: "ghost" }))).toBeNull();
    });

    it("builds clipboard entries for furniture, doors, and windows", () => {
      const door = { id: "d1", x: 1, y: 2, rotation: 0, wallId: "w1", position: 10, width: 80, swing: 90, style: "single" as const };
      const window = { id: "win1", x: 3, y: 4, rotation: 0, wallId: "w1", position: 20, width: 100, style: "casement" as const };
      expect(getClipboardEntryFromState(baseState({ selectedId: "f1", furniture: [furniture] }))).toEqual({
        type: "furniture",
        data: furniture,
      });
      expect(getClipboardEntryFromState(baseState({ selectedId: "d1", doors: [door] }))?.type).toBe("door");
      expect(getClipboardEntryFromState(baseState({ selectedId: "win1", windows: [window] }))?.type).toBe("window");
      expect(getClipboardEntryFromState(baseState({ selectedId: "w1", walls: [{ id: "w1", start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, thickness: 8, color: "#000" }] }))).toBeNull();
    });

    it("getSelectAllTargetId prefers furniture then doors then windows then walls", () => {
      const wall = { id: "w1", start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, thickness: 8, color: "#000" };
      expect(getSelectAllTargetId(baseState({ walls: [wall] }))).toBe("w1");
      expect(getSelectAllTargetId(baseState({ furniture: [furniture], walls: [wall] }))).toBe("f1");
    });

    it("buildPastedClipboardEntry offsets and regenerates ids", () => {
      const pasted = buildPastedClipboardEntry(
        { type: "furniture", data: furniture },
        () => "new-id",
        15,
      );
      expect(pasted.data.id).toBe("new-id");
      expect(pasted.data.x).toBe(15);
      expect(pasted.data.y).toBe(15);

      const door = { id: "d1", x: 1, y: 2, rotation: 0, wallId: "w1", position: 10, width: 80, swing: 90, style: "single" as const };
      const window = { id: "win1", x: 3, y: 4, rotation: 0, wallId: "w1", position: 20, width: 100, style: "casement" as const };
      const pastedDoor = buildPastedClipboardEntry({ type: "door", data: door }, () => "door-new", 5);
      const pastedWindow = buildPastedClipboardEntry({ type: "window", data: window }, () => "win-new", 5);
      expect(pastedDoor.type).toBe("door");
      expect(pastedDoor.data.id).toBe("door-new");
      expect(pastedWindow.type).toBe("window");
      expect(pastedWindow.data.id).toBe("win-new");
    });

    it("buildPasteStatePatch returns domain patch per clipboard type", () => {
      const door = { id: "d1", x: 1, y: 2, rotation: 0, wallId: "w1", position: 10, width: 80, swing: 90, style: "single" as const };
      const window = { id: "win1", x: 3, y: 4, rotation: 0, wallId: "w1", position: 20, width: 100, style: "casement" as const };
      const furniturePatch = buildPasteStatePatch({ type: "furniture", data: furniture });
      expect(furniturePatch.selectedId).toBe("f1");
      expect(furniturePatch.isDirty).toBe(true);
      expect(buildPasteStatePatch({ type: "door", data: door }).doors).toHaveLength(1);
      expect(buildPasteStatePatch({ type: "window", data: window }).windows).toHaveLength(1);
    });
  });

  describe("plannerTagUtils", () => {
    it("sanitizeTags trims, dedupes case-insensitively, and caps count/length", () => {
      expect(sanitizeTags(["  Alpha ", "alpha", "toolongtagthatexceedslimit"], 2, 5)).toEqual(["Alpha"]);
    });

    it("validateTagAddition enforces empty, length, max, and duplicate rules", () => {
      expect(validateTagAddition([], "  ", 5, 10)).toEqual({ success: false, error: "Tag cannot be empty" });
      expect(validateTagAddition([], "abcdefghijk", 5, 10)).toEqual({
        success: false,
        error: "Tag must be 10 characters or less",
      });
      expect(validateTagAddition(["a", "b", "c"], "d", 3, 10)).toEqual({
        success: false,
        error: "Maximum 3 tags allowed",
      });
      expect(validateTagAddition(["Existing"], "existing", 5, 10)).toEqual({
        success: false,
        error: "Tag already exists",
      });
      expect(validateTagAddition(["One"], "Two", 5, 10)).toEqual({ success: true });
    });

    it("removeTagCaseInsensitive removes regardless of casing", () => {
      expect(removeTagCaseInsensitive(["Alpha", "Beta"], "alpha")).toEqual(["Beta"]);
    });
  });

  describe("plannerHistoryUtils", () => {
    const snapA: HistorySnapshot = { walls: [], rooms: [], furniture: [], doors: [], windows: [], measurements: [], zones: [], textLabels: [], structuralElements: [] };
    const snapB: HistorySnapshot = { ...snapA, furniture: [{ id: "f1", catalogId: "x", name: "X", x: 0, y: 0, width: 1, height: 1, rotation: 0, color: "#000", shape: "x", zIndex: 0 }] };

    it("buildUndoState moves snapshot between stacks", () => {
      const result = buildUndoState({ undoStack: [snapA], redoStack: [] }, snapB)!;
      expect(result.snapshot).toEqual(snapA);
      expect(result.redoStack).toEqual([snapB]);
      expect(buildUndoState({ undoStack: [], redoStack: [] }, snapB)).toBeNull();
    });

    it("buildRedoState restores from redo stack", () => {
      const result = buildRedoState({ undoStack: [], redoStack: [snapB] }, snapA)!;
      expect(result.snapshot).toEqual(snapB);
      expect(result.undoStack).toEqual([snapA]);
      expect(buildRedoState({ undoStack: [], redoStack: [] }, snapA)).toBeNull();
    });
  });

  describe("plannerEntityFactories", () => {
    it("creates measurement, label, structural, and zone entities", () => {
      expect(createMeasurementItem("m1", { x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({
        id: "m1",
        start: { x: 0, y: 0 },
        end: { x: 10, y: 0 },
      });
      expect(createTextLabel("t1", 5, 6, "Hi").text).toBe("Hi");
      expect(createStructuralElement("s1", "column", 1, 2).type).toBe("column");
      expect(createStructuralElement("s2", "stair", 1, 2).label).toBe("Stairs");
      expect(createStructuralElement("s3", "electrical", 1, 2).label).toBe("Outlet");
      expect(createStructuralElement("s4", "unknown" as "column", 1, 2).label).toBe("Column");
      expect(createZone("z1", [{ x: 0, y: 0 }], "Zone", "Meeting", ZONE_COLORS).color).toBe(
        ZONE_COLORS.Meeting,
      );
    });
  });

  describe("plannerStoreGeometry", () => {
    it("computes distance, projection, and segment proximity", () => {
      expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(projectT({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(0.5);
      expect(projectT({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
      expect(isPointOnSegment({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 1)).toBe(true);
      expect(isPointOnSegment({ x: 50, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 1)).toBe(false);
    });
  });

  describe("plannerStoreSupport", () => {
    it("takeSnapshot deep-clones drawable state", () => {
      const state = baseState({
        walls: [{ id: "w1", start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, thickness: 8, color: "#000" }],
      });
      const snap = takeSnapshot(state);
      snap.walls[0].start.x = 99;
      expect(state.walls[0].start.x).toBe(0);
      expect(ROOM_COLORS.length).toBeGreaterThan(0);
    });

    it("pushUndo appends and trims stack", () => {
      const state = baseState({ undoStack: Array.from({ length: 3 }, () => takeSnapshot(baseState())) });
      const result = pushUndo(state, 3);
      expect(result.undoStack).toHaveLength(3);
      expect(result.redoStack).toEqual([]);

      const trimmed = pushUndo(baseState({ undoStack: Array.from({ length: 3 }, () => takeSnapshot(baseState())) }), 3);
      expect(trimmed.undoStack).toHaveLength(3);
    });

    it("pushUndo keeps the stack when it remains within maxUndo", () => {
      const state = baseState({ undoStack: [takeSnapshot(baseState())] });
      const result = pushUndo(state, 3);
      expect(result.undoStack).toHaveLength(2);
    });
  });

  describe("plannerDebouncedUndo", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("captures one snapshot per burst and commits after debounce", () => {
      const state = baseState();
      const set = vi.fn();
      const get = vi.fn(() => state);
      captureDebounceSnapshot(state);
      captureDebounceSnapshot(state);
      scheduleDebounceCommit(get, set, 50);
      vi.advanceTimersByTime(500);
      expect(set).toHaveBeenCalledWith(expect.objectContaining({ redoStack: [] }));
    });

    it("flushDebounce commits immediately", () => {
      const state = baseState();
      const set = vi.fn();
      const get = vi.fn(() => state);
      captureDebounceSnapshot(state);
      scheduleDebounceCommit(get, set, 50);
      flushDebounce(get, set, 50);
      expect(set).toHaveBeenCalled();
    });

    it("no-ops when there is no pending snapshot", () => {
      const state = baseState();
      const set = vi.fn();
      const get = vi.fn(() => state);
      flushDebounce(get, set, 50);
      expect(set).not.toHaveBeenCalled();
    });
  });

  describe("roomSetup", () => {
    it("buildRoomSetupTemplate clamps dimensions and maps style materials", () => {
      const modern = buildRoomSetupTemplate({
        roomType: "meeting",
        widthM: 100,
        depthM: NaN,
        style: "Modern",
      });
      expect(modern.rooms[0].floorMaterial).toBe("default");
      expect(modern.walls).toHaveLength(4);

      const traditional = buildRoomSetupTemplate({
        roomType: "custom",
        widthM: 2,
        depthM: 2,
        style: "Traditional",
      });
      expect(traditional.rooms[0].floorMaterial).toBe("wood");

      const minimalist = buildRoomSetupTemplate({
        roomType: "unknown" as "office",
        widthM: 4,
        depthM: 4,
        style: "Minimalist",
      });
      expect(minimalist.rooms[0].floorMaterial).toBe("concrete");
    });
  });
});