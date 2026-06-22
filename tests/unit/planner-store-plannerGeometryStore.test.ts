import { describe, expect, it, beforeEach } from "vitest";
import { usePlannerGeometryStore } from "@/features/planner/store/plannerGeometryStore";

describe("plannerGeometryStore", () => {
  beforeEach(() => {
    usePlannerGeometryStore.setState({
      walls: [], rooms: [], doors: [], windows: [], zones: [], measurements: [], structuralElements: [],
      drawingWall: null, drawingRoom: [], drawingZone: [], activeZoneType: "Open Plan",
      snapDistance: 10, gridSize: 20, showGrid: true, wallDimensionUnit: "cm", cursorPosition: null
    });
  });

  it("adds, updates, and deletes a wall", () => {
    const store = usePlannerGeometryStore.getState();
    store.addWall({ x: 0, y: 0 }, { x: 100, y: 100 });
    
    let state = usePlannerGeometryStore.getState();
    expect(state.walls).toHaveLength(1);
    
    const wallId = state.walls[0].id;
    store.updateWall(wallId, { thickness: 15 });
    
    state = usePlannerGeometryStore.getState();
    expect(state.walls[0].thickness).toBe(15);
    
    store.deleteWall(wallId);
    state = usePlannerGeometryStore.getState();
    expect(state.walls).toHaveLength(0);
  });

  it("cascades deletion of wall to its doors and windows", () => {
    const store = usePlannerGeometryStore.getState();
    store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
    const wallId = usePlannerGeometryStore.getState().walls[0].id;

    store.addDoor(wallId, 50, 90);
    store.addWindow(wallId, 25, 60);

    let state = usePlannerGeometryStore.getState();
    expect(state.doors).toHaveLength(1);
    expect(state.windows).toHaveLength(1);

    store.deleteWall(wallId);
    state = usePlannerGeometryStore.getState();
    expect(state.doors).toHaveLength(0);
    expect(state.windows).toHaveLength(0);
  });

  it("moves a wall endpoint and adjusts door/window positions proportionally", () => {
    const store = usePlannerGeometryStore.getState();
    store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
    const wallId = usePlannerGeometryStore.getState().walls[0].id;

    store.addDoor(wallId, 50, 90); // middle of the wall

    // Move the end point from x=100 to x=200
    store.moveWallEndpoint(wallId, "end", { x: 200, y: 0 });

    const state = usePlannerGeometryStore.getState();
    expect(state.walls[0].end.x).toBe(200);
    expect(state.doors[0].position).toBe(100); // 50 / 100 * 200 = 100
  });

  it("moves connected walls", () => {
    const store = usePlannerGeometryStore.getState();
    store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
    store.addWall({ x: 100, y: 0 }, { x: 100, y: 100 });
    
    const state = usePlannerGeometryStore.getState();
    const w1 = state.walls[0].id;
    const w2 = state.walls[1].id;

    // move w1 end to 150,0
    store.moveConnectedWalls(w1, "end", { x: 150, y: 0 });

    const newState = usePlannerGeometryStore.getState();
    const newW1 = newState.walls.find(w => w.id === w1);
    const newW2 = newState.walls.find(w => w.id === w2);
    
    expect(newW1?.end.x).toBe(150);
    expect(newW2?.start.x).toBe(150); // w2 start was connected to w1 end
  });

  it("splits a wall at a given point", () => {
    const store = usePlannerGeometryStore.getState();
    store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
    const wallId = usePlannerGeometryStore.getState().walls[0].id;

    store.splitWallAtPoint(wallId, { x: 50, y: 0 });

    const state = usePlannerGeometryStore.getState();
    expect(state.walls).toHaveLength(2);
    
    const endpoints = state.walls.flatMap(w => [w.start.x, w.end.x]);
    expect(endpoints).toContain(0);
    expect(endpoints).toContain(50);
    expect(endpoints).toContain(100);
  });

  it("adds, updates, and deletes a room", () => {
    const store = usePlannerGeometryStore.getState();
    store.addRoom([{x:0,y:0}, {x:10,y:0}, {x:10,y:10}, {x:0,y:10}], "Test Room");

    const state = usePlannerGeometryStore.getState();
    expect(state.rooms).toHaveLength(1);
    const roomId = state.rooms[0].id;

    store.updateRoom(roomId, { name: "Bedroom" });
    expect(usePlannerGeometryStore.getState().rooms[0].name).toBe("Bedroom");

    store.deleteRoom(roomId);
    expect(usePlannerGeometryStore.getState().rooms).toHaveLength(0);
  });

  it("adds, updates, and deletes zones", () => {
    const store = usePlannerGeometryStore.getState();
    store.setActiveZoneType("Living");
    store.addDrawingZonePoint({ x: 0, y: 0 });
    store.addDrawingZonePoint({ x: 10, y: 0 });
    store.addDrawingZonePoint({ x: 10, y: 10 });

    expect(usePlannerGeometryStore.getState().drawingZone).toHaveLength(3);

    store.finishZone();
    
    const state = usePlannerGeometryStore.getState();
    expect(state.zones).toHaveLength(1);
    expect(state.drawingZone).toHaveLength(0);

    const zoneId = state.zones[0].id;
    store.updateZone(zoneId, { name: "Living Area" });
    expect(usePlannerGeometryStore.getState().zones[0].name).toBe("Living Area");

    store.deleteZone(zoneId);
    expect(usePlannerGeometryStore.getState().zones).toHaveLength(0);
  });

  it("does not create a zone if finishZone is called with less than 3 points", () => {
    const store = usePlannerGeometryStore.getState();
    store.addDrawingZonePoint({ x: 0, y: 0 });
    store.finishZone();

    expect(usePlannerGeometryStore.getState().zones).toHaveLength(0);
    expect(usePlannerGeometryStore.getState().drawingZone).toHaveLength(0);
  });

  it("manages doors and windows standalone", () => {
    const store = usePlannerGeometryStore.getState();
    store.addDoor("wall-1", 10, 80);
    const doorId = usePlannerGeometryStore.getState().doors[0].id;

    store.updateDoor(doorId, { width: 90 });
    expect(usePlannerGeometryStore.getState().doors[0].width).toBe(90);

    store.deleteDoor(doorId);
    expect(usePlannerGeometryStore.getState().doors).toHaveLength(0);

    store.addWindow("wall-2", 20, 60);
    const windowId = usePlannerGeometryStore.getState().windows[0].id;

    store.updateWindow(windowId, { width: 100 });
    expect(usePlannerGeometryStore.getState().windows[0].width).toBe(100);

    store.deleteWindow(windowId);
    expect(usePlannerGeometryStore.getState().windows).toHaveLength(0);
  });

  it("manages measurements", () => {
    const store = usePlannerGeometryStore.getState();
    store.addMeasurement({ x: 0, y: 0 }, { x: 10, y: 10 });
    
    const measurementId = usePlannerGeometryStore.getState().measurements[0].id;
    store.updateMeasurement(measurementId, { label: "10m" });
    expect(usePlannerGeometryStore.getState().measurements[0].label).toBe("10m");

    store.deleteMeasurement(measurementId);
    expect(usePlannerGeometryStore.getState().measurements).toHaveLength(0);
  });

  it("manages structural elements", () => {
    const store = usePlannerGeometryStore.getState();
    store.addStructuralElement("column", [{ x: 5, y: 5 }]);
    
    const structId = usePlannerGeometryStore.getState().structuralElements[0].id;
    store.updateStructuralElement(structId, { type: "beam" });
    expect(usePlannerGeometryStore.getState().structuralElements[0].type).toBe("beam");

    store.deleteStructuralElement(structId);
    expect(usePlannerGeometryStore.getState().structuralElements).toHaveLength(0);
  });

  it("updates miscellaneous UI geometry states", () => {
    const store = usePlannerGeometryStore.getState();
    store.setSnapDistance(15);
    store.setWallDimensionUnit("mm");
    store.setShowGrid(false);
    store.setGridSize(25);
    store.setDrawingWall({ start: { x: 5, y: 5 } });
    store.setDrawingRoom([{ x: 1, y: 1 }]);
    store.addDrawingRoomPoint({ x: 2, y: 2 });
    store.setCursorPosition({ x: 100, y: 100 });

    const state = usePlannerGeometryStore.getState();
    expect(state.snapDistance).toBe(25); // setGridSize sets snapDistance to gridSize
    expect(state.wallDimensionUnit).toBe("mm");
    expect(state.showGrid).toBe(false);
    expect(state.gridSize).toBe(25);
    expect(state.drawingWall).toEqual({ start: { x: 5, y: 5 } });
    expect(state.drawingRoom).toEqual([{ x: 1, y: 1 }, { x: 2, y: 2 }]);
    expect(state.cursorPosition).toEqual({ x: 100, y: 100 });
  });
});

