/**
 * Room Detection and Labeling Utilities for OOFPL Planner
 *
 * Utility functions for detecting enclosed spaces formed by walls,
 * calculating room dimensions, and creating room labels with names and dimensions.
 */

import type { Editor, TLShape, TLShapeId } from "@tldraw/editor";
import { Box, Vec, createShapeId } from "@tldraw/editor";
import type { PlannerWallTLShape, PlannerRoomTLShape } from "../shapes/tldrawShapeTypes";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DEFAULT_ROOM_PROPS } from "../shapes/RoomShape";

export interface DetectedRoom {
  id: string;
  name: string;
  area: number; // in square meters
  perimeter: number; // in meters
  boundingBox: Box;
  wallIds: string[];
  centerPoint: Vec;
}

export interface RoomDetectionOptions {
  minArea: number; // Minimum room area in square meters
  autoLabel: boolean; // Automatically create labels
  labelFormat: "name" | "dimensions" | "both";
}

export class RoomDetectionUtils {
  private options: RoomDetectionOptions = {
    minArea: 2.0, // Minimum 2 square meters
    autoLabel: true,
    labelFormat: "both",
  };

  constructor(private editor: Editor) { }

  detectAllRooms(): DetectedRoom[] {
    const walls = this.getWallShapes();
    if (walls.length < 3) return []; // Need at least 3 walls to form a room

    const rooms: DetectedRoom[] = [];
    const processedWalls = new Set<string>();

    // Find cycles in the wall graph
    for (const wall of walls) {
      if (processedWalls.has(wall.id)) continue;

      const room = this.detectRoomFromWall(wall, walls);
      if (room && room.area >= this.options.minArea) {
        rooms.push(room);
        room.wallIds.forEach(id => processedWalls.add(id));
      }
    }

    // Create labels if auto-labeling is enabled
    if (this.options.autoLabel) {
      this.createRoomLabels(rooms);
    }

    return rooms;
  }

  private getWallShapes(): TLShape[] {
    const allShapes = this.editor.getCurrentPageShapes();
    return allShapes.filter(shape => (shape.type as string) === "planner-wall");
  }

  private getWallEndpoints(shape: TLShape): { start: Vec; end: Vec } | null {
    if (shape.type !== "planner-wall") return null;
    const wall = shape as PlannerWallTLShape;
    const start = new Vec(
      wall.x + (wall.props.startX ?? 0),
      wall.y + (wall.props.startY ?? 0)
    );
    const end = new Vec(
      wall.x + (wall.props.endX ?? 0),
      wall.y + (wall.props.endY ?? 0)
    );
    return { start, end };
  }

  private detectRoomFromWall(startWall: TLShape, allWalls: TLShape[]): DetectedRoom | null {
    const graph = this.buildWallGraph(allWalls);
    const cycle = this.findCycle(graph, startWall.id);
    if (!cycle || cycle.length < 3) return null;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const wallsInRoom = cycle.map(id => allWalls.find(w => w.id === id)!);
    const boundingBox = this.calculateBoundingBox(wallsInRoom);
    const area = this.calculateArea(wallsInRoom);
    const perimeter = this.calculatePerimeter(wallsInRoom);
    const centerPoint = this.calculateCenterPoint(boundingBox);

    const name = this.generateRoomName(area);

    return {
      id: createShapeId(),
      name,
      area,
      perimeter,
      boundingBox,
      wallIds: cycle,
      centerPoint,
    };
  }

  private buildWallGraph(walls: TLShape[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    const tolerance = 20;

    for (const wall of walls) {
      graph.set(wall.id, []);
    }

    for (let i = 0; i < walls.length; i++) {
      for (let j = i + 1; j < walls.length; j++) {
        const wall1 = walls[i];
        const wall2 = walls[j];

        if (this.wallsConnect(wall1, wall2, tolerance)) {
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          graph.get(wall1.id)!.push(wall2.id);
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          graph.get(wall2.id)!.push(wall1.id);
        }
      }
    }

    return graph;
  }

  private wallsConnect(wall1: TLShape, wall2: TLShape, tolerance: number): boolean {
    const pts1 = this.getWallEndpoints(wall1);
    const pts2 = this.getWallEndpoints(wall2);
    if (!pts1 || !pts2) return false;

    const distStartToStart = pts1.start.dist(pts2.start);
    const distStartToEnd = pts1.start.dist(pts2.end);
    const distEndToStart = pts1.end.dist(pts2.start);
    const distEndToEnd = pts1.end.dist(pts2.end);

    return distStartToStart < tolerance || distStartToEnd < tolerance ||
      distEndToStart < tolerance || distEndToEnd < tolerance;
  }

  private findCycle(graph: Map<string, string[]>, startId: string): string[] | null {
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (currentId: string): boolean => {
      visited.add(currentId);
      path.push(currentId);

      const neighbors = graph.get(currentId) || [];
      for (const neighborId of neighbors) {
        if (neighborId === startId && path.length >= 3) {
          return true;
        }
        if (!visited.has(neighborId)) {
          if (dfs(neighborId)) {
            return true;
          }
        }
      }

      path.pop();
      return false;
    };

    if (dfs(startId)) {
      return path;
    }

    return null;
  }

  private calculateBoundingBox(walls: TLShape[]): Box {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const wall of walls) {
      const pts = this.getWallEndpoints(wall);
      if (!pts) continue;
      minX = Math.min(minX, pts.start.x, pts.end.x);
      minY = Math.min(minY, pts.start.y, pts.end.y);
      maxX = Math.max(maxX, pts.start.x, pts.end.x);
      maxY = Math.max(maxY, pts.start.y, pts.end.y);
    }

    return new Box(minX, minY, maxX - minX, maxY - minY);
  }

  private calculateArea(walls: TLShape[]): number {
    const points = this.extractPolygonPoints(walls);
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    area = Math.abs(area) / 2;
    const areaInMeters = area * 0.0001; // pixels is in cm, area is in cm^2, 1 m^2 = 10000 cm^2
    return areaInMeters;
  }

  private extractPolygonPoints(walls: TLShape[]): Vec[] {
    const points: Vec[] = [];
    const tolerance = 20;

    const pts0 = this.getWallEndpoints(walls[0]);
    if (!pts0) return [];
    points.push(pts0.start);
    points.push(pts0.end);

    const remainingWalls = [...walls.slice(1)];
    let currentPoint = pts0.end;

    while (remainingWalls.length > 0) {
      let found = false;

      for (let i = 0; i < remainingWalls.length; i++) {
        const wall = remainingWalls[i];
        const pts = this.getWallEndpoints(wall);
        if (!pts) continue;

        if (currentPoint.dist(pts.start) < tolerance) {
          points.push(pts.end);
          currentPoint = pts.end;
          remainingWalls.splice(i, 1);
          found = true;
          break;
        } else if (currentPoint.dist(pts.end) < tolerance) {
          points.push(pts.start);
          currentPoint = pts.start;
          remainingWalls.splice(i, 1);
          found = true;
          break;
        }
      }

      if (!found) break;
    }

    return points;
  }

  private calculatePerimeter(walls: TLShape[]): number {
    let perimeter = 0;

    for (const wall of walls) {
      const pts = this.getWallEndpoints(wall);
      if (!pts) continue;
      perimeter += pts.start.dist(pts.end);
    }

    return perimeter * 0.01; // cm to m
  }

  private calculateCenterPoint(box: Box): Vec {
    return new Vec(box.x + box.width / 2, box.y + box.height / 2);
  }

  private generateRoomName(area: number): string {
    if (area < 5) return "Closet";
    if (area < 8) return "Meeting Room";
    if (area < 15) return "Office";
    if (area < 25) return "Conference Room";
    if (area < 40) return "Lobby";
    return "Cafeteria";
  }

  private createRoomLabels(rooms: DetectedRoom[]) {
    for (const room of rooms) {
      const points = this.extractPolygonPointsFromWallIds(room.wallIds);
      
      const allShapes = this.editor.getCurrentPageShapes();
      const duplicate = allShapes.some(s => {
        if (s.type !== "planner-room") return false;
        const roomShape = s as PlannerRoomTLShape;
        const sCenter = new Vec(s.x + roomShape.props.widthMm / 2, s.y + roomShape.props.heightMm / 2);
        return sCenter.dist(room.centerPoint) < 30;
      });

      if (duplicate) continue;

      this.editor.createShape({
        id: room.id as TLShapeId,
        type: "planner-room",
        x: room.boundingBox.x,
        y: room.boundingBox.y,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        props: {
          points: points.map(p => ({ x: p.x - room.boundingBox.x, y: p.y - room.boundingBox.y })),
          roomType: "office",
          areaSqm: room.area,
          perimeterMm: Math.round(room.perimeter * 1000),
          floorMaterial: "carpet",
          widthMm: room.boundingBox.width,
          heightMm: room.boundingBox.height,
          showArea: true,
          showPerimeter: false,
          fillOpacity: 0.3,
          label: room.name,
          showLabel: true,
          color: "var(--color-primary)",
          fillColor: "var(--surface-glass)",
          strokeColor: "var(--color-primary)",
          strokeWidth: 2,
        }
      });
    }
  }

  private extractPolygonPointsFromWallIds(wallIds: string[]): Vec[] {
    const allWalls = this.getWallShapes();
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const walls = wallIds.map(id => allWalls.find(w => w.id === id)!).filter(Boolean);
    return this.extractPolygonPoints(walls);
  }

  private formatLabel(room: DetectedRoom): string {
    switch (this.options.labelFormat) {
      case "name":
        return room.name;
      case "dimensions":
// eslint-disable-next-line no-case-declarations
        const widthM = Math.sqrt(room.area);
// eslint-disable-next-line no-case-declarations
        const lengthM = room.area / widthM;
        return `${widthM.toFixed(1)}m × ${lengthM.toFixed(1)}m`;
      case "both":
        return `${room.name}\n${room.area.toFixed(1)}m²`;
      default:
        return room.name;
    }
  }

  setOptions(options: Partial<RoomDetectionOptions>) {
    this.options = { ...this.options, ...options };
  }

  getOptions(): RoomDetectionOptions {
    return { ...this.options };
  }

  labelArea(box: Box, name: string) {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    const centerPoint = new Vec(box.x + box.width / 2, box.y + box.height / 2);
    const area = (box.width * box.height) * 0.0001;

    this.editor.createShape({
      id: createShapeId(),
      type: "planner-room",
      x: box.x,
      y: box.y,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        points: [
          { x: 0, y: 0 },
          { x: box.width, y: 0 },
          { x: box.width, y: box.height },
          { x: 0, y: box.height }
        ],
        roomType: "office",
        areaSqm: area,
        perimeterMm: Math.round((box.width + box.height) * 2 * 10),
        floorMaterial: "carpet",
        widthMm: box.width,
        heightMm: box.height,
        showArea: true,
        showPerimeter: false,
        fillOpacity: 0.3,
        label: name,
        showLabel: true,
        color: "var(--color-primary)",
        fillColor: "var(--surface-glass)",
        strokeColor: "var(--color-primary)",
        strokeWidth: 2,
      }
    });
  }

  updateRoomLabel(roomId: string, newName: string) {
    const shape = this.editor.getShape(roomId as TLShapeId);
    if (shape && shape.type === "planner-room") {
      this.editor.updateShape({
        id: roomId as TLShapeId,
        type: "planner-room",
        props: {
          label: newName
        }
      });
    }
  }
}
