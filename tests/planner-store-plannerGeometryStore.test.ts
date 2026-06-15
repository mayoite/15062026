import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("uuid", () => ({ v4: () => "mock-uuid-" + Math.random().toString(36).slice(2, 8) }));

import { usePlannerGeometryStore } from "@/features/planner/store/plannerGeometryStore";

function resetStore() {
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
  });
}

describe("plannerGeometryStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("addWall", () => {
    it("adds a wall with start and end points", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });

      const { walls } = usePlannerGeometryStore.getState();
      expect(walls).toHaveLength(1);
      expect(walls[0].start).toEqual({ x: 0, y: 0 });
      expect(walls[0].end).toEqual({ x: 100, y: 0 });
      expect(walls[0].thickness).toBe(8);
      expect(typeof walls[0].id).toBe("string");
    });

    it("adds multiple walls", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      store.addWall({ x: 100, y: 0 }, { x: 100, y: 100 });

      const { walls } = usePlannerGeometryStore.getState();
      expect(walls).toHaveLength(2);
    });
  });

  describe("deleteWall", () => {
    it("removes the wall by id", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;

      store.deleteWall(wallId);
      expect(usePlannerGeometryStore.getState().walls).toHaveLength(0);
    });

    it("also removes doors and windows attached to the deleted wall", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 200, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;

      store.addDoor(wallId, 50, 80);
      store.addWindow(wallId, 120, 60);
      expect(usePlannerGeometryStore.getState().doors).toHaveLength(1);
      expect(usePlannerGeometryStore.getState().windows).toHaveLength(1);

      store.deleteWall(wallId);
      expect(usePlannerGeometryStore.getState().doors).toHaveLength(0);
      expect(usePlannerGeometryStore.getState().windows).toHaveLength(0);
    });
  });

  describe("updateWall", () => {
    it("updates wall properties", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;

      store.updateWall(wallId, { thickness: 12 });
      expect(usePlannerGeometryStore.getState().walls[0].thickness).toBe(12);
    });
  });

  describe("addRoom", () => {
    it("adds a room with points and name", () => {
      const store = usePlannerGeometryStore.getState();
      const points = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
      store.addRoom(points, "Office");

      const { rooms } = usePlannerGeometryStore.getState();
      expect(rooms).toHaveLength(1);
      expect(rooms[0].name).toBe("Office");
      expect(rooms[0].points).toEqual(points);
      expect(typeof rooms[0].id).toBe("string");
      expect(typeof rooms[0].color).toBe("string");
    });
  });

  describe("deleteRoom", () => {
    it("removes the room by id", () => {
      const store = usePlannerGeometryStore.getState();
      store.addRoom([{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }], "Room A");
      const roomId = usePlannerGeometryStore.getState().rooms[0].id;

      store.deleteRoom(roomId);
      expect(usePlannerGeometryStore.getState().rooms).toHaveLength(0);
    });
  });

  describe("addDoor / deleteDoor", () => {
    it("updates door properties", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 200, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;
      store.addDoor(wallId, 50, 80);
      const doorId = usePlannerGeometryStore.getState().doors[0].id;
      store.updateDoor(doorId, { width: 100 });
      expect(usePlannerGeometryStore.getState().doors[0].width).toBe(100);
    });

    it("adds and removes a door", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 200, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;

      store.addDoor(wallId, 50, 80);
      const { doors } = usePlannerGeometryStore.getState();
      expect(doors).toHaveLength(1);
      expect(doors[0].wallId).toBe(wallId);
      expect(doors[0].width).toBe(80);

      store.deleteDoor(doors[0].id);
      expect(usePlannerGeometryStore.getState().doors).toHaveLength(0);
    });
  });

  describe("addWindow / deleteWindow", () => {
    it("updates window properties", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 200, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;
      store.addWindow(wallId, 80, 100);
      const windowId = usePlannerGeometryStore.getState().windows[0].id;
      store.updateWindow(windowId, { width: 140 });
      expect(usePlannerGeometryStore.getState().windows[0].width).toBe(140);
    });

    it("adds and removes a window", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 200, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;

      store.addWindow(wallId, 80, 100);
      const { windows } = usePlannerGeometryStore.getState();
      expect(windows).toHaveLength(1);
      expect(windows[0].wallId).toBe(wallId);
      expect(windows[0].width).toBe(100);

      store.deleteWindow(windows[0].id);
      expect(usePlannerGeometryStore.getState().windows).toHaveLength(0);
    });
  });

  describe("measurements", () => {
    it("adds and deletes a measurement", () => {
      const store = usePlannerGeometryStore.getState();
      store.addMeasurement({ x: 0, y: 0 }, { x: 100, y: 0 });

      const { measurements } = usePlannerGeometryStore.getState();
      expect(measurements).toHaveLength(1);
      expect(measurements[0].start).toEqual({ x: 0, y: 0 });
      expect(measurements[0].end).toEqual({ x: 100, y: 0 });

      store.deleteMeasurement(measurements[0].id);
      expect(usePlannerGeometryStore.getState().measurements).toHaveLength(0);
    });
  });

  describe("settings", () => {
    it("setSnapDistance updates both snapDistance and gridSize", () => {
      const store = usePlannerGeometryStore.getState();
      store.setSnapDistance(20);
      const state = usePlannerGeometryStore.getState();
      expect(state.snapDistance).toBe(20);
      expect(state.gridSize).toBe(20);
    });

    it("setGridSize updates both gridSize and snapDistance", () => {
      const store = usePlannerGeometryStore.getState();
      store.setGridSize(25);
      expect(usePlannerGeometryStore.getState().gridSize).toBe(25);
      expect(usePlannerGeometryStore.getState().snapDistance).toBe(25);
    });

    it("setShowGrid toggles grid visibility", () => {
      const store = usePlannerGeometryStore.getState();
      store.setShowGrid(false);
      expect(usePlannerGeometryStore.getState().showGrid).toBe(false);
      store.setShowGrid(true);
      expect(usePlannerGeometryStore.getState().showGrid).toBe(true);
    });

    it("setWallDimensionUnit changes the unit", () => {
      const store = usePlannerGeometryStore.getState();
      store.setWallDimensionUnit("mm");
      expect(usePlannerGeometryStore.getState().wallDimensionUnit).toBe("mm");
    });
  });

  describe("wall editing", () => {
    it("skips door and window repositioning when openings lack positions", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;
      usePlannerGeometryStore.setState({
        doors: [
          {
            id: "door-no-pos",
            x: 0,
            y: 0,
            rotation: 0,
            wallId,
            width: 80,
            swing: 90,
            style: "single",
          },
        ],
        windows: [
          {
            id: "window-no-pos",
            x: 0,
            y: 0,
            rotation: 0,
            wallId,
            width: 100,
            style: "casement",
          },
        ],
      });

      store.moveWallEndpoint(wallId, "end", { x: 140, y: 0 });
      const state = usePlannerGeometryStore.getState();
      expect(state.doors[0].position).toBeUndefined();
      expect(state.windows[0].position).toBeUndefined();
    });

    it("no-ops moveWallEndpoint for missing or zero-length walls", () => {
      const store = usePlannerGeometryStore.getState();
      store.moveWallEndpoint("missing", "start", { x: 1, y: 1 });
      store.addWall({ x: 5, y: 5 }, { x: 5, y: 5 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;
      store.addDoor(wallId, 10, 80);
      store.moveWallEndpoint(wallId, "end", { x: 6, y: 5 });
      expect(usePlannerGeometryStore.getState().walls[0].end).toEqual({ x: 6, y: 5 });
      expect(usePlannerGeometryStore.getState().doors[0].position).toBe(10);
    });

    it("moveWallEndpoint updates connected walls and opening positions", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      store.addWall({ x: 100, y: 0 }, { x: 100, y: 100 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;
      store.addDoor(wallId, 50, 80);
      store.addWindow(wallId, 80, 100);

      store.moveWallEndpoint(wallId, "end", { x: 120, y: 0 });
      const state = usePlannerGeometryStore.getState();
      expect(state.walls[0].end).toEqual({ x: 120, y: 0 });
      expect(state.walls[1].start).toEqual({ x: 120, y: 0 });
      expect(state.doors[0].position).toBeGreaterThan(50);
      expect(state.windows[0].position).toBeGreaterThan(80);
    });

    it("updates connected wall ends when moving a shared endpoint", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      store.addWall({ x: 200, y: 0 }, { x: 100, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;
      store.moveWallEndpoint(wallId, "end", { x: 120, y: 0 });
      const state = usePlannerGeometryStore.getState();
      expect(state.walls[0].end).toEqual({ x: 120, y: 0 });
      expect(state.walls[1].end).toEqual({ x: 120, y: 0 });
    });

    it("updates connected wall ends when moving a shared start endpoint", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      store.addWall({ x: 0, y: 0 }, { x: 0, y: 80 });
      const sharedWallId = usePlannerGeometryStore.getState().walls[1].id;
      store.moveWallEndpoint(sharedWallId, "start", { x: -5, y: 0 });
      const state = usePlannerGeometryStore.getState();
      expect(state.walls[0].start).toEqual({ x: -5, y: 0 });
      expect(state.walls[1].start).toEqual({ x: -5, y: 0 });
    });

    it("moveWallEndpoint from the start endpoint updates connected start points", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      store.addWall({ x: 0, y: 0 }, { x: 0, y: 80 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;
      store.addDoor(wallId, 25, 80);

      store.moveWallEndpoint(wallId, "start", { x: -20, y: 0 });
      const state = usePlannerGeometryStore.getState();
      expect(state.walls[0].start).toEqual({ x: -20, y: 0 });
      expect(state.walls[1].start).toEqual({ x: -20, y: 0 });
      expect(state.doors[0].position).toBeGreaterThan(0);
    });

    it("moveConnectedWalls and splitWallAtPoint mutate the wall graph", () => {
      const store = usePlannerGeometryStore.getState();
      store.addWall({ x: 0, y: 0 }, { x: 100, y: 0 });
      const wallId = usePlannerGeometryStore.getState().walls[0].id;

      store.moveConnectedWalls(wallId, "start", { x: -10, y: 0 });
      expect(usePlannerGeometryStore.getState().walls[0].start).toEqual({ x: -10, y: 0 });

      store.splitWallAtPoint(wallId, { x: 40, y: 0 });
      expect(usePlannerGeometryStore.getState().walls).toHaveLength(2);
    });
  });

  describe("zones and drawing helpers", () => {
    it("adds, updates, and deletes zones", () => {
      const store = usePlannerGeometryStore.getState();
      store.addZone(
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
        ],
        "Collaboration",
        "Meeting",
      );
      const zoneId = usePlannerGeometryStore.getState().zones[0].id;
      store.updateZone(zoneId, { name: "Updated Zone" });
      expect(usePlannerGeometryStore.getState().zones[0].name).toBe("Updated Zone");
      store.deleteZone(zoneId);
      expect(usePlannerGeometryStore.getState().zones).toHaveLength(0);
    });

    it("tracks drawing zone points and finishes valid polygons", () => {
      const store = usePlannerGeometryStore.getState();
      store.setActiveZoneType("Reception");
      store.addDrawingZonePoint({ x: 0, y: 0 });
      store.addDrawingZonePoint({ x: 50, y: 0 });
      store.addDrawingZonePoint({ x: 50, y: 50 });
      store.finishZone();
      expect(usePlannerGeometryStore.getState().zones).toHaveLength(1);
      expect(usePlannerGeometryStore.getState().drawingZone).toEqual([]);
    });

    it("clears drawing zone without creating a zone when fewer than three points", () => {
      const store = usePlannerGeometryStore.getState();
      store.addDrawingZonePoint({ x: 0, y: 0 });
      store.addDrawingZonePoint({ x: 40, y: 0 });
      store.finishZone();
      expect(usePlannerGeometryStore.getState().zones).toHaveLength(0);
      expect(usePlannerGeometryStore.getState().drawingZone).toEqual([]);
    });
  });

  describe("structural elements and cursor", () => {
    it("adds, updates, and deletes structural elements", () => {
      const store = usePlannerGeometryStore.getState();
      store.addStructuralElement("column", [{ x: 10, y: 10 }]);
      const elementId = usePlannerGeometryStore.getState().structuralElements[0].id;
      store.updateStructuralElement(elementId, { type: "stair" });
      expect(usePlannerGeometryStore.getState().structuralElements[0].type).toBe("stair");
      store.deleteStructuralElement(elementId);
      expect(usePlannerGeometryStore.getState().structuralElements).toHaveLength(0);
    });

    it("updates measurements and tracks cursor position", () => {
      const store = usePlannerGeometryStore.getState();
      store.addMeasurement({ x: 0, y: 0 }, { x: 10, y: 0 });
      const measurementId = usePlannerGeometryStore.getState().measurements[0].id;
      store.updateMeasurement(measurementId, { label: "10 cm" });
      expect(usePlannerGeometryStore.getState().measurements[0].label).toBe("10 cm");

      store.setDrawingWall({ start: { x: 1, y: 1 } });
      store.setDrawingRoom([{ x: 2, y: 2 }]);
      store.addDrawingRoomPoint({ x: 3, y: 3 });
      store.setCursorPosition({ x: 4, y: 4 });
      expect(usePlannerGeometryStore.getState().drawingWall).toEqual({ start: { x: 1, y: 1 } });
      expect(usePlannerGeometryStore.getState().drawingRoom).toHaveLength(2);
      expect(usePlannerGeometryStore.getState().cursorPosition).toEqual({ x: 4, y: 4 });
    });
  });
});
