/**
 * Compatibility facade over the domain stores.
 *
 * `tool` is the only state owned here — no domain store tracks the active
 * editor tool. Fabric canvas owns its own toolbar; this field is legacy state
 * for step bindings and keyboard shortcuts.
 *
 * @deprecated Prefer domain stores directly where possible.
 */

import { create } from "zustand";
import { usePlannerGeometryStore } from "./plannerGeometryStore";
import { usePlannerFurnitureStore } from "./plannerFurnitureStore";
import { usePlannerUIStore } from "./plannerUIStore";
import { usePlannerHistoryStore } from "./plannerHistoryStore";
import { usePlannerProjectStore } from "./plannerProjectStore";
import type { PlannerState, Tool, FurnitureItem, StructuralElementDraft, BackgroundImage, StructuralType, Point, DoorItem, WindowItem, Zone, ZoneType, MeasurementItem, TextLabel, Wall, Room, ViewMode, LoadedProjectData } from "./plannerTypes";
import type { HistorySnapshot } from "./plannerStoreSupport";
import type { LightingPreset } from "@/features/planner/lib/lightingPresets";
import type { FloorTemplate } from "./floorTemplates";

export * from "./plannerTypes";
export { validateImportedProject } from "./plannerProjectStore";

export { usePlannerGeometryStore } from "./plannerGeometryStore";
export { usePlannerFurnitureStore } from "./plannerFurnitureStore";
export { usePlannerUIStore } from "./plannerUIStore";
export { usePlannerHistoryStore } from "./plannerHistoryStore";
export { usePlannerProjectStore } from "./plannerProjectStore";

// ── Toast ref ─────────────────────────────────────────────────────────────────

let toastStoreRef: { addToast: (type: string, message: string) => void } | null = null;
export function setToastStoreRef(store: { addToast: (type: string, message: string) => void }) {
  if (toastStoreRef === store) return;
  toastStoreRef = store;
}

// ── History helper ────────────────────────────────────────────────────────────

function emptySnap(): HistorySnapshot {
  return {
    walls: [], rooms: [], furniture: [], doors: [], windows: [],
    measurements: [], zones: [], textLabels: [], structuralElements: [],
  };
}

// ── Facade store ──────────────────────────────────────────────────────────────

export const usePlannerStore = create<PlannerState>((set) => ({
  // ── Geometry getters ─────────────────────────────────────────────────────
  get walls()              { return usePlannerGeometryStore.getState().walls; },
  get rooms()              { return usePlannerGeometryStore.getState().rooms; },
  get doors()              { return usePlannerGeometryStore.getState().doors; },
  get windows()            { return usePlannerGeometryStore.getState().windows; },
  get zones()              { return usePlannerGeometryStore.getState().zones; },
  get measurements()       { return usePlannerGeometryStore.getState().measurements; },
  get structuralElements() { return usePlannerGeometryStore.getState().structuralElements; },
  get textLabels()         { return [] as TextLabel[]; },
  get drawingWall()        { return usePlannerGeometryStore.getState().drawingWall; },
  get drawingRoom()        { return usePlannerGeometryStore.getState().drawingRoom; },
  get drawingZone()        { return usePlannerGeometryStore.getState().drawingZone; },
  get activeZoneType()     { return usePlannerGeometryStore.getState().activeZoneType; },
  get snapDistance()       { return usePlannerGeometryStore.getState().snapDistance; },
  get gridSize()           { return usePlannerGeometryStore.getState().gridSize; },
  get showGrid()           { return usePlannerGeometryStore.getState().showGrid; },
  get wallDimensionUnit()  { return usePlannerGeometryStore.getState().wallDimensionUnit; },
  get cursorPosition()     { return usePlannerGeometryStore.getState().cursorPosition; },

  // ── Furniture getters ────────────────────────────────────────────────────
  get furniture()       { return usePlannerFurnitureStore.getState().furniture; },
  get activeCatalogId() { return usePlannerFurnitureStore.getState().activeCatalogId; },
  get selectedId()      { return usePlannerFurnitureStore.getState().selectedId; },
  get selectedIds()     { return usePlannerFurnitureStore.getState().selectedIds; },

  // ── UI getters ───────────────────────────────────────────────────────────
  get zoom()             { return usePlannerUIStore.getState().zoom; },
  get panOffset()        { return usePlannerUIStore.getState().panOffset; },
  get sidebarCollapsed() { return usePlannerUIStore.getState().sidebarCollapsed; },
  get viewMode()         { return usePlannerUIStore.getState().viewMode; },
  get show3D()           { return usePlannerUIStore.getState().show3D; },
  get backgroundImage()  { return usePlannerUIStore.getState().backgroundImage as BackgroundImage | null; },
  get lightingPreset()   { return usePlannerUIStore.getState().lightingPreset; },
  get tags()             { return usePlannerUIStore.getState().tags; },

  // ── History getters ──────────────────────────────────────────────────────
  get undoStack()  { return usePlannerHistoryStore.getState().undoStack; },
  get redoStack()  { return usePlannerHistoryStore.getState().redoStack; },
  get clipboard()  { return usePlannerHistoryStore.getState().clipboard; },

  // ── Project getters ──────────────────────────────────────────────────────
  get projectName()       { return usePlannerProjectStore.getState().projectName; },
  get currentProjectKey() { return usePlannerProjectStore.getState().currentProjectKey; },
  get isDirty()           { return usePlannerProjectStore.getState().isDirty; },
  get lastSavedAt()       { return usePlannerProjectStore.getState().lastSavedAt; },
  get isSaving()          { return usePlannerProjectStore.getState().isSaving; },
  get saveError()         { return usePlannerProjectStore.getState().saveError; },

  // ── Tool — legacy planner step / shortcut state ────────────────────────────
  tool: "select" as Tool,
  setTool: (tool) => set({ tool }),


  // ── Geometry mutations ─────────────────────────────────────────────────────
  setBackgroundImage:    (bg: BackgroundImage | null) => usePlannerUIStore.getState().setBackgroundImage(bg as Parameters<ReturnType<typeof usePlannerUIStore.getState>["setBackgroundImage"]>[0]),
  updateBackgroundImage: (u: Partial<BackgroundImage>) => usePlannerUIStore.getState().updateBackgroundImage(u),
  addWall:             (s: Point, e: Point) => usePlannerGeometryStore.getState().addWall(s, e),
  updateWall:          (id: string, u: Partial<Wall>) => usePlannerGeometryStore.getState().updateWall(id, u),
  updateWallDebounced: (id: string, u: Partial<Wall>) => usePlannerGeometryStore.getState().updateWall(id, u),
  moveWallEndpoint:    (wid: string, ep: "start" | "end", p: Point) => usePlannerGeometryStore.getState().moveWallEndpoint(wid, ep, p),
  moveConnectedWalls:  (wid: string, ep: "start" | "end", p: Point) => usePlannerGeometryStore.getState().moveConnectedWalls(wid, ep, p),
  splitWallAtPoint:    (wid: string, p: Point) => usePlannerGeometryStore.getState().splitWallAtPoint(wid, p),
  addRoom:             (pts: Point[], n: string) => usePlannerGeometryStore.getState().addRoom(pts, n),
  updateRoom:          (id: string, u: Partial<Room>) => usePlannerGeometryStore.getState().updateRoom(id, u),
  updateRoomDebounced: (id: string, u: Partial<Room>) => usePlannerGeometryStore.getState().updateRoom(id, u),
  deleteRoom:          (id: string) => usePlannerGeometryStore.getState().deleteRoom(id),
  finishRoom: () => {
    const rooms = usePlannerGeometryStore.getState().rooms;
    return rooms.length > 0 ? rooms[rooms.length - 1].id : null;
  },
  addDoor:             (x: number, y: number, _r: number) => usePlannerGeometryStore.getState().addDoor("", x, y),
  updateDoor:          (id: string, u: Partial<DoorItem>) => usePlannerGeometryStore.getState().updateDoor(id, u),
  updateDoorDebounced: (id: string, u: Partial<DoorItem>) => usePlannerGeometryStore.getState().updateDoor(id, u),
  deleteDoor:          (id: string) => usePlannerGeometryStore.getState().deleteDoor(id),
  addWindow:             (x: number, y: number, _r: number) => usePlannerGeometryStore.getState().addWindow("", x, y),
  updateWindow:          (id: string, u: Partial<WindowItem>) => usePlannerGeometryStore.getState().updateWindow(id, u),
  updateWindowDebounced: (id: string, u: Partial<WindowItem>) => usePlannerGeometryStore.getState().updateWindow(id, u),
  deleteWindow:          (id: string) => usePlannerGeometryStore.getState().deleteWindow(id),

  addZone:             (pts: Point[], n: string, t: ZoneType) => usePlannerGeometryStore.getState().addZone(pts, n, t),
  updateZone:          (id: string, u: Partial<Zone>) => usePlannerGeometryStore.getState().updateZone(id, u),
  deleteZone:          (id: string) => usePlannerGeometryStore.getState().deleteZone(id),
  addDrawingZonePoint: (p: Point) => usePlannerGeometryStore.getState().addDrawingZonePoint(p),
  finishZone:          () => usePlannerGeometryStore.getState().finishZone(),
  setActiveZoneType:   (t: ZoneType) => usePlannerGeometryStore.getState().setActiveZoneType(t),
  addMeasurement:      (s: Point, e: Point) => usePlannerGeometryStore.getState().addMeasurement(s, e),
  updateMeasurement:   (id: string, u: Partial<MeasurementItem>) => usePlannerGeometryStore.getState().updateMeasurement(id, u),
  deleteMeasurement:   (id: string) => usePlannerGeometryStore.getState().deleteMeasurement(id),
  addStructuralElement:    (type: StructuralType, x: number, y: number) => usePlannerGeometryStore.getState().addStructuralElement(type, [{ x, y }]),
  updateStructuralElement: (id: string, u: Partial<StructuralElementDraft>) => usePlannerGeometryStore.getState().updateStructuralElement(id, u),
  deleteStructuralElement: (id: string) => usePlannerGeometryStore.getState().deleteStructuralElement(id),
  setDrawingWall:      (w: { start: Point } | null) => usePlannerGeometryStore.getState().setDrawingWall(w),
  addDrawingRoomPoint: (p: Point) => usePlannerGeometryStore.getState().addDrawingRoomPoint(p),
  setCursorPosition:   (pos: Point | null) => usePlannerGeometryStore.getState().setCursorPosition(pos),
  cancelDrawing: () => {
    usePlannerGeometryStore.getState().setDrawingWall(null);
    usePlannerGeometryStore.getState().setDrawingRoom([]);
    usePlannerGeometryStore.getState().finishZone();
  },
  addTextLabel:    (_x: number, _y: number, _t: string) => {},
  updateTextLabel: (_id: string, _u: Partial<TextLabel>) => {},
  deleteTextLabel: (_id: string) => {},

  // ── Furniture mutations ──────────────────────────────────────────────────
  addFurniture:             (item: Omit<FurnitureItem, "id" | "zIndex">) => usePlannerFurnitureStore.getState().addFurniture(item),
  addFurnitureBatch:        (items: Omit<FurnitureItem, "id" | "zIndex">[]) => usePlannerFurnitureStore.getState().addFurnitureBatch(items),
  updateFurniture:          (id: string, u: Partial<FurnitureItem>) => usePlannerFurnitureStore.getState().updateFurniture(id, u),
  updateFurnitureDebounced: (id: string, u: Partial<FurnitureItem>) => usePlannerFurnitureStore.getState().updateFurniture(id, u),
  updateFurnitureBatch:     (updates: { id: string; changes: Partial<FurnitureItem> }[]) => {
    // Map from facade signature (changes) to domain store signature (updates)
    usePlannerFurnitureStore.getState().updateFurnitureBatch(
      updates.map((u) => ({ id: u.id, updates: u.changes }))
    );
  },
  deleteFurniture:          (id: string) => usePlannerFurnitureStore.getState().deleteFurniture(id),
  bringToFront:             (id: string) => usePlannerFurnitureStore.getState().bringToFront(id),
  sendToBack:               (id: string) => usePlannerFurnitureStore.getState().sendToBack(id),
  setActiveCatalogId:       (id: string | null) => usePlannerFurnitureStore.getState().setActiveCatalogId(id),
  setSelectedIds:           (ids: string[]) => usePlannerFurnitureStore.getState().setSelectedIds(ids),
  toggleSelectedId:         (id: string) => usePlannerFurnitureStore.getState().toggleSelectedId(id),
  setSelected:              (id: string | null) => usePlannerFurnitureStore.getState().setSelectedId(id),
  deleteItem: (id: string) => {
    const f = usePlannerFurnitureStore.getState();
    if (f.furniture.some((x) => x.id === id)) { f.deleteFurniture(id); return; }
    const g = usePlannerGeometryStore.getState();
    if (g.walls.some((x) => x.id === id))              { g.deleteWall(id); return; }
    if (g.rooms.some((x) => x.id === id))              { g.deleteRoom(id); return; }
    if (g.doors.some((x) => x.id === id))              { g.deleteDoor(id); return; }
    if (g.windows.some((x) => x.id === id))            { g.deleteWindow(id); return; }
    if (g.zones.some((x) => x.id === id))              { g.deleteZone(id); return; }
    if (g.measurements.some((x) => x.id === id))       { g.deleteMeasurement(id); return; }
    if (g.structuralElements.some((x) => x.id === id)) { g.deleteStructuralElement(id); return; }
  },
  // ── UI / project / history mutations ────────────────────────────────────
  setZoom:             (z) => usePlannerUIStore.getState().setZoom(z),
  setPanOffset:        (p) => usePlannerUIStore.getState().setPanOffset(p),
  toggleGrid:          () => usePlannerUIStore.getState().toggleGrid(),
  toggle3D: () => {
    const cur = usePlannerUIStore.getState().viewMode;
    usePlannerUIStore.getState().setViewMode(cur === "3d" ? "2d" : "3d");
  },
  toggleSidebar:       () => usePlannerUIStore.getState().toggleSidebar(),
  setViewMode:         (m: ViewMode) => usePlannerUIStore.getState().setViewMode(m),
  setProjectName:      (n: string) => usePlannerProjectStore.setState({ projectName: n }),
  setDirty:            (d: boolean) => usePlannerProjectStore.setState({ isDirty: d }),
  setSnapDistance:     (d: number) => usePlannerGeometryStore.getState().setSnapDistance(d),
  setWallDimensionUnit:(u: "cm" | "mm" | "m" | "ft" | "in") => usePlannerGeometryStore.getState().setWallDimensionUnit(u),
  setLightingPreset:   (p: LightingPreset) => usePlannerUIStore.getState().setLightingPreset(p),
  setTags:   (t: string[]) => usePlannerUIStore.getState().setTags(t),
  addTag:    (t: string) => usePlannerUIStore.getState().addTag(t),
  removeTag: (t: string) => usePlannerUIStore.getState().removeTag(t),

  pushSnapshot:       () => usePlannerHistoryStore.getState().pushSnapshot(emptySnap()),
  flushDebouncedUndo: () => {},
  undo:    () => usePlannerHistoryStore.getState().undo(emptySnap()),
  redo:    () => usePlannerHistoryStore.getState().redo(emptySnap()),
  canUndo: () => usePlannerHistoryStore.getState().canUndo(),
  canRedo: () => usePlannerHistoryStore.getState().canRedo(),
  copySelected:      () => usePlannerHistoryStore.getState().setClipboard(null),
  paste:             () => {},
  duplicateSelected: () => {},
  selectAll:         () => {},

  saveProject:      (thumb?: string) => usePlannerProjectStore.getState().saveProject(thumb),
  saveAsCopy:       (_n: string) => ({ success: false, error: "Not implemented" }),
  loadProject:      (k: string) => usePlannerProjectStore.getState().loadProject(k),
  getSavedProjects: () => [],
  newProject:       () => usePlannerProjectStore.getState().newProject(),
  duplicateProject: () => usePlannerProjectStore.getState().duplicateProject(),
  deleteProject:    (k: string) => usePlannerProjectStore.getState().deleteProject(k),
  listProjects:     () => usePlannerProjectStore.getState().listProjects(),
  importProject:    (d: LoadedProjectData) => usePlannerProjectStore.getState().importProject(d),
  exportProject:    () => usePlannerProjectStore.getState().exportProject(),
  clearAll:         () => usePlannerProjectStore.getState().clearAll(),
  hasContent:       () => usePlannerProjectStore.getState().hasContent(),

  snapToGrid: (p: Point) => {
    const g = usePlannerGeometryStore.getState().gridSize;
    return { x: Math.round(p.x / g) * g, y: Math.round(p.y / g) * g };
  },
  loadTemplate: (_t: FloorTemplate) => {},

  getSelectedItemType: () => {
    const sel = usePlannerFurnitureStore.getState().selectedId;
    if (!sel) return null;
    const g = usePlannerGeometryStore.getState();
    if (g.walls.some((w) => w.id === sel)) return "wall";
    if (g.rooms.some((r) => r.id === sel)) return "room";
    if (g.doors.some((d) => d.id === sel)) return "door";
    if (g.windows.some((w) => w.id === sel)) return "window";
    if (usePlannerFurnitureStore.getState().furniture.some((f) => f.id === sel)) return "furniture";
    return null;
  },
  getSelectedItem: () => {
    const sel = usePlannerFurnitureStore.getState().selectedId;
    if (!sel) return null;
    const g = usePlannerGeometryStore.getState();
    return (
      g.walls.find((w) => w.id === sel) ??
      g.rooms.find((r) => r.id === sel) ??
      g.doors.find((d) => d.id === sel) ??
      g.windows.find((w) => w.id === sel) ??
      usePlannerFurnitureStore.getState().furniture.find((f) => f.id === sel) ??
      null
    );
  },
}));
