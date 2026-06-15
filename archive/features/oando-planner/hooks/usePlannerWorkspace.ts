"use client";
/**
 * usePlannerWorkspace Hook
 *
 * Creates and manages canonical planner shapes instead of overloading geo.
 * This hook provides a unified interface for creating, updating, and managing
 * all planner shape types using the canonical shape system.
 */

import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  PlannerDoorShape,
  PlannerFurnitureShape,
  PlannerMeasurementShape,
  PlannerRoomShape,
  PlannerWallShape,
  PlannerWindowShape,
  PlannerZoneShape,
} from "../shapes";
import {
  DEFAULT_DOOR_PROPS,
  DEFAULT_FURNITURE_PROPS,
  DEFAULT_MEASUREMENT_PROPS,
  DEFAULT_ROOM_PROPS,
  DEFAULT_WALL_PROPS,
  DEFAULT_WINDOW_PROPS,
  DEFAULT_ZONE_PROPS,
} from "../shapes";

export interface PlannerWorkspace {
  walls: PlannerWallShape[];
  rooms: PlannerRoomShape[];
  furniture: PlannerFurnitureShape[];
  doors: PlannerDoorShape[];
  windows: PlannerWindowShape[];
  zones: PlannerZoneShape[];
  measurements: PlannerMeasurementShape[];
}

type PlannerShape = PlannerWorkspace[keyof PlannerWorkspace][number];
type WorkspaceKey = keyof PlannerWorkspace;
type ShapeForKey<K extends WorkspaceKey> = PlannerWorkspace[K][number];

const EMPTY_WORKSPACE: PlannerWorkspace = {
  walls: [],
  rooms: [],
  furniture: [],
  doors: [],
  windows: [],
  zones: [],
  measurements: [],
};

export interface UsePlannerWorkspaceReturn {
  workspace: PlannerWorkspace;
  addWall: (props: Partial<PlannerWallShape>) => PlannerWallShape;
  addRoom: (props: Partial<PlannerRoomShape>) => PlannerRoomShape;
  addFurniture: (props: Partial<PlannerFurnitureShape>) => PlannerFurnitureShape;
  addDoor: (props: Partial<PlannerDoorShape>) => PlannerDoorShape;
  addWindow: (props: Partial<PlannerWindowShape>) => PlannerWindowShape;
  addZone: (props: Partial<PlannerZoneShape>) => PlannerZoneShape;
  addMeasurement: (props: Partial<PlannerMeasurementShape>) => PlannerMeasurementShape;
  updateWall: (id: string, props: Partial<PlannerWallShape>) => void;
  updateRoom: (id: string, props: Partial<PlannerRoomShape>) => void;
  updateFurniture: (id: string, props: Partial<PlannerFurnitureShape>) => void;
  updateDoor: (id: string, props: Partial<PlannerDoorShape>) => void;
  updateWindow: (id: string, props: Partial<PlannerWindowShape>) => void;
  updateZone: (id: string, props: Partial<PlannerZoneShape>) => void;
  updateMeasurement: (id: string, props: Partial<PlannerMeasurementShape>) => void;
  removeWall: (id: string) => void;
  removeRoom: (id: string) => void;
  removeFurniture: (id: string) => void;
  removeDoor: (id: string) => void;
  removeWindow: (id: string) => void;
  removeZone: (id: string) => void;
  removeMeasurement: (id: string) => void;
  clearWorkspace: () => void;
  getShapeById: (id: string) => PlannerShape | undefined;
  getShapesByType: (type: string) => PlannerShape[];
}

export function usePlannerWorkspace(): UsePlannerWorkspaceReturn {
  const [workspace, setWorkspace] = useState<PlannerWorkspace>(EMPTY_WORKSPACE);

  const addShape = useCallback(
    <K extends WorkspaceKey>(
      key: K,
      defaultProps: Partial<ShapeForKey<K>>,
      props: Partial<ShapeForKey<K>>,
    ): ShapeForKey<K> => {
      const newShape = {
        id: uuidv4(),
        ...defaultProps,
        ...props,
      } as ShapeForKey<K>;

      setWorkspace((prev) => ({
        ...prev,
        [key]: [...prev[key], newShape] as PlannerWorkspace[K],
      }));

      return newShape;
    },
    [],
  );

  const updateShape = useCallback(
    <K extends WorkspaceKey>(key: K, id: string, props: Partial<ShapeForKey<K>>) => {
      setWorkspace((prev) => ({
        ...prev,
        [key]: prev[key].map((shape) =>
          shape.id === id ? { ...shape, ...props } : shape,
        ) as PlannerWorkspace[K],
      }));
    },
    [],
  );

  const removeShape = useCallback(<K extends WorkspaceKey>(key: K, id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      [key]: prev[key].filter((shape) => shape.id !== id) as PlannerWorkspace[K],
    }));
  }, []);

  const addWall = useCallback(
    (props: Partial<PlannerWallShape>) => addShape("walls", DEFAULT_WALL_PROPS, props),
    [addShape],
  );
  const updateWall = useCallback(
    (id: string, props: Partial<PlannerWallShape>) => updateShape("walls", id, props),
    [updateShape],
  );
  const removeWall = useCallback((id: string) => removeShape("walls", id), [removeShape]);

  const addRoom = useCallback(
    (props: Partial<PlannerRoomShape>) => addShape("rooms", DEFAULT_ROOM_PROPS, props),
    [addShape],
  );
  const updateRoom = useCallback(
    (id: string, props: Partial<PlannerRoomShape>) => updateShape("rooms", id, props),
    [updateShape],
  );
  const removeRoom = useCallback((id: string) => removeShape("rooms", id), [removeShape]);

  const addFurniture = useCallback(
    (props: Partial<PlannerFurnitureShape>) =>
      addShape("furniture", DEFAULT_FURNITURE_PROPS, props),
    [addShape],
  );
  const updateFurniture = useCallback(
    (id: string, props: Partial<PlannerFurnitureShape>) =>
      updateShape("furniture", id, props),
    [updateShape],
  );
  const removeFurniture = useCallback(
    (id: string) => removeShape("furniture", id),
    [removeShape],
  );

  const addDoor = useCallback(
    (props: Partial<PlannerDoorShape>) => addShape("doors", DEFAULT_DOOR_PROPS, props),
    [addShape],
  );
  const updateDoor = useCallback(
    (id: string, props: Partial<PlannerDoorShape>) => updateShape("doors", id, props),
    [updateShape],
  );
  const removeDoor = useCallback((id: string) => removeShape("doors", id), [removeShape]);

  const addWindow = useCallback(
    (props: Partial<PlannerWindowShape>) => addShape("windows", DEFAULT_WINDOW_PROPS, props),
    [addShape],
  );
  const updateWindow = useCallback(
    (id: string, props: Partial<PlannerWindowShape>) => updateShape("windows", id, props),
    [updateShape],
  );
  const removeWindow = useCallback(
    (id: string) => removeShape("windows", id),
    [removeShape],
  );

  const addZone = useCallback(
    (props: Partial<PlannerZoneShape>) => addShape("zones", DEFAULT_ZONE_PROPS, props),
    [addShape],
  );
  const updateZone = useCallback(
    (id: string, props: Partial<PlannerZoneShape>) => updateShape("zones", id, props),
    [updateShape],
  );
  const removeZone = useCallback((id: string) => removeShape("zones", id), [removeShape]);

  const addMeasurement = useCallback(
    (props: Partial<PlannerMeasurementShape>) =>
      addShape("measurements", DEFAULT_MEASUREMENT_PROPS, props),
    [addShape],
  );
  const updateMeasurement = useCallback(
    (id: string, props: Partial<PlannerMeasurementShape>) =>
      updateShape("measurements", id, props),
    [updateShape],
  );
  const removeMeasurement = useCallback(
    (id: string) => removeShape("measurements", id),
    [removeShape],
  );

  const clearWorkspace = useCallback(() => {
    setWorkspace(EMPTY_WORKSPACE);
  }, []);

  const getShapeById = useCallback(
    (id: string) => {
      const allShapes: PlannerShape[] = [
        ...workspace.walls,
        ...workspace.rooms,
        ...workspace.furniture,
        ...workspace.doors,
        ...workspace.windows,
        ...workspace.zones,
        ...workspace.measurements,
      ];

      return allShapes.find((shape) => shape.id === id);
    },
    [workspace],
  );

  const getShapesByType = useCallback(
    (type: string): PlannerShape[] => {
      switch (type) {
        case "planner-wall":
          return workspace.walls;
        case "planner-room":
          return workspace.rooms;
        case "planner-furniture":
          return workspace.furniture;
        case "planner-door":
          return workspace.doors;
        case "planner-window":
          return workspace.windows;
        case "planner-zone":
          return workspace.zones;
        case "planner-measurement":
          return workspace.measurements;
        default:
          return [];
      }
    },
    [workspace],
  );

  return {
    workspace,
    addWall,
    addRoom,
    addFurniture,
    addDoor,
    addWindow,
    addZone,
    addMeasurement,
    updateWall,
    updateRoom,
    updateFurniture,
    updateDoor,
    updateWindow,
    updateZone,
    updateMeasurement,
    removeWall,
    removeRoom,
    removeFurniture,
    removeDoor,
    removeWindow,
    removeZone,
    removeMeasurement,
    clearWorkspace,
    getShapeById,
    getShapesByType,
  };
}
