/**
 * Snap Manager
 * 
 * Implements snap functionality for grid, wall centerline, corners, and edge alignment.
 * This provides consistent snapping behavior across the planner editor.
 */

interface WallShape {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface RoomShape {
  id: string;
  points: Array<{ x: number; y: number }>;
}

interface RectShape {
  id: string;
  x: number;
  y: number;
  widthMm: number;
  heightMm: number;
}

interface PolygonShape {
  id: string;
  points?: Array<{ x: number; y: number }>;
}

interface MeasurementShape {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface WorkspaceShape {
  walls?: WallShape[];
  rooms?: RoomShape[];
  furniture?: RectShape[];
  doors?: RectShape[];
  windows?: RectShape[];
  zones?: PolygonShape[];
  measurements?: MeasurementShape[];
}

export interface SnapPoint {
  x: number;
  y: number;
  type: "grid" | "corner" | "centerline" | "edge" | "midpoint";
  source?: string; // ID of the shape that generated this snap point
}


export interface SnapResult {
  snapped: boolean;
  point: { x: number; y: number };
  snapPoint?: SnapPoint;
  distance: number;
}

export interface SnapOptions {
  enabled: boolean;
  gridEnabled: boolean;
  gridSpacing: number;
  snapToGrid: boolean;
  snapToWalls: boolean;
  snapToCorners: boolean;
  snapToEdges: boolean;
  snapToMidpoints: boolean;
  snapThreshold: number; // Distance in mm to trigger snap
}

export class SnapManager {
  private snapPoints: SnapPoint[] = [];
  private options: SnapOptions;

  constructor(options: Partial<SnapOptions> = {}) {
    this.options = {
      enabled: true,
      gridEnabled: true,
      gridSpacing: 50, // 50mm grid spacing
      snapToGrid: true,
      snapToWalls: true,
      snapToCorners: true,
      snapToEdges: true,
      snapToMidpoints: true,
      snapThreshold: 15, // 15mm snap threshold
      ...options,
    };
  }

  /**
   * Update snap options
   */
  setOptions(options: Partial<SnapOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Add snap points from shapes
   */
  addSnapPoints(points: SnapPoint[]): void {
    this.snapPoints.push(...points);
  }

  /**
   * Clear all snap points
   */
  clearSnapPoints(): void {
    this.snapPoints = [];
  }

  /**
   * Find the nearest snap point for a given position
   */
  findSnap(x: number, y: number): SnapResult {
    if (!this.options.enabled) {
      return { snapped: false, point: { x, y }, distance: 0 };
    }

    let bestResult: SnapResult = {
      snapped: false,
      point: { x, y },
      distance: Infinity,
    };

    // Check grid snap
    if (this.options.snapToGrid && this.options.gridEnabled) {
      const gridSnap = this.snapToGrid(x, y);
      if (gridSnap.snapped && gridSnap.distance < bestResult.distance) {
        bestResult = gridSnap;
      }
    }

    // Check shape snap points
    if (this.options.snapToWalls || this.options.snapToCorners || this.options.snapToEdges || this.options.snapToMidpoints) {
      for (const snapPoint of this.snapPoints) {
        // Filter by type based on options
        if (!this.shouldSnapToPoint(snapPoint)) {
          continue;
        }

        const distance = Math.sqrt(
          Math.pow(x - snapPoint.x, 2) + Math.pow(y - snapPoint.y, 2)
        );

        if (distance < this.options.snapThreshold && distance < bestResult.distance) {
          bestResult = {
            snapped: true,
            point: { x: snapPoint.x, y: snapPoint.y },
            snapPoint,
            distance,
          };
        }
      }
    }

    return bestResult;
  }

  /**
   * Snap position to grid
   */
  private snapToGrid(x: number, y: number): SnapResult {
    const spacing = this.options.gridSpacing;
    
    const snappedX = Math.round(x / spacing) * spacing;
    const snappedY = Math.round(y / spacing) * spacing;
    
    const distance = Math.sqrt(
      Math.pow(x - snappedX, 2) + Math.pow(y - snappedY, 2)
    );

    if (distance <= this.options.snapThreshold) {
      return {
        snapped: true,
        point: { x: snappedX, y: snappedY },
        distance,
      };
    }

    return { snapped: false, point: { x, y }, distance };
  }

  /**
   * Check if a snap point should be considered based on options
   */
  private shouldSnapToPoint(point: SnapPoint): boolean {
    switch (point.type) {
      case "grid":
        return this.options.gridEnabled;
      case "centerline":
        return this.options.snapToWalls;
      case "corner":
        return this.options.snapToCorners;
      case "edge":
        return this.options.snapToEdges;
      case "midpoint":
        return this.options.snapToMidpoints;
      default:
        return true;
    }
  }

  /**
   * Generate snap points from a wall shape
   */
  static generateWallSnapPoints(wall: WallShape): SnapPoint[] {
    const points: SnapPoint[] = [];
    
    // Endpoints (corners)
    points.push({
      x: wall.startX,
      y: wall.startY,
      type: "corner",
      source: wall.id,
    });
    
    points.push({
      x: wall.endX,
      y: wall.endY,
      type: "corner",
      source: wall.id,
    });
    
    // Centerline (midpoint)
    points.push({
      x: (wall.startX + wall.endX) / 2,
      y: (wall.startY + wall.endY) / 2,
      type: "centerline",
      source: wall.id,
    });
    
    // Edge points (along the wall)
    const numEdgePoints = 5;
    for (let i = 1; i < numEdgePoints; i++) {
      const t = i / numEdgePoints;
      points.push({
        x: wall.startX + (wall.endX - wall.startX) * t,
        y: wall.startY + (wall.endY - wall.startY) * t,
        type: "edge",
        source: wall.id,
      });
    }
    
    return points;
  }

  /**
   * Generate snap points from a room shape
   */
  static generateRoomSnapPoints(room: RoomShape): SnapPoint[] {
    const points: SnapPoint[] = [];
    
    // All vertices (corners)
    for (const point of room.points) {
      points.push({
        x: point.x,
        y: point.y,
        type: "corner",
        source: room.id,
      });
    }
    
    // Edge midpoints
    for (let i = 0; i < room.points.length; i++) {
      const j = (i + 1) % room.points.length;
      points.push({
        x: (room.points[i].x + room.points[j].x) / 2,
        y: (room.points[i].y + room.points[j].y) / 2,
        type: "midpoint",
        source: room.id,
      });
    }
    
    return points;
  }

  /**
   * Generate snap points from a rectangle shape (furniture, doors, windows)
   */
  static generateRectangleSnapPoints(shape: RectShape): SnapPoint[] {
    const points: SnapPoint[] = [];
    const { x, y, widthMm, heightMm } = shape;
    
    // Corners
    points.push({ x, y, type: "corner", source: shape.id });
    points.push({ x: x + widthMm, y, type: "corner", source: shape.id });
    points.push({ x: x + widthMm, y: y + heightMm, type: "corner", source: shape.id });
    points.push({ x, y: y + heightMm, type: "corner", source: shape.id });
    
    // Edge midpoints
    points.push({ x: x + widthMm / 2, y, type: "midpoint", source: shape.id });
    points.push({ x: x + widthMm, y: y + heightMm / 2, type: "midpoint", source: shape.id });
    points.push({ x: x + widthMm / 2, y: y + heightMm, type: "midpoint", source: shape.id });
    points.push({ x, y: y + heightMm / 2, type: "midpoint", source: shape.id });
    
    // Center
    points.push({ x: x + widthMm / 2, y: y + heightMm / 2, type: "centerline", source: shape.id });
    
    return points;
  }

  /**
   * Generate snap points from a polygon shape (zones)
   */
  static generatePolygonSnapPoints(shape: PolygonShape): SnapPoint[] {
    const points: SnapPoint[] = [];
    
    if (shape.points && Array.isArray(shape.points)) {
      // All vertices
      for (const point of shape.points) {
        points.push({
          x: point.x,
          y: point.y,
          type: "corner",
          source: shape.id,
        });
      }
      
      // Edge midpoints
      for (let i = 0; i < shape.points.length; i++) {
        const j = (i + 1) % shape.points.length;
        points.push({
          x: (shape.points[i].x + shape.points[j].x) / 2,
          y: (shape.points[i].y + shape.points[j].y) / 2,
          type: "midpoint",
          source: shape.id,
        });
      }
    }
    
    return points;
  }

  /**
   * Generate snap points from measurement shape
   */
  static generateMeasurementSnapPoints(measurement: MeasurementShape): SnapPoint[] {
    const points: SnapPoint[] = [];
    
    // Endpoints
    points.push({
      x: measurement.startX,
      y: measurement.startY,
      type: "corner",
      source: measurement.id,
    });
    
    points.push({
      x: measurement.endX,
      y: measurement.endY,
      type: "corner",
      source: measurement.id,
    });
    
    // Midpoint
    points.push({
      x: (measurement.startX + measurement.endX) / 2,
      y: (measurement.startY + measurement.endY) / 2,
      type: "midpoint",
      source: measurement.id,
    });
    
    return points;
  }

  /**
   * Generate snap points from workspace
   */
  static generateWorkspaceSnapPoints(workspace: WorkspaceShape): SnapPoint[] {
    const allPoints: SnapPoint[] = [];
    
    // Walls
    if (workspace.walls) {
      for (const wall of workspace.walls) {
        allPoints.push(...this.generateWallSnapPoints(wall));
      }
    }
    
    // Rooms
    if (workspace.rooms) {
      for (const room of workspace.rooms) {
        allPoints.push(...this.generateRoomSnapPoints(room));
      }
    }
    
    // Furniture
    if (workspace.furniture) {
      for (const item of workspace.furniture) {
        allPoints.push(...this.generateRectangleSnapPoints(item));
      }
    }
    
    // Doors
    if (workspace.doors) {
      for (const door of workspace.doors) {
        allPoints.push(...this.generateRectangleSnapPoints(door));
      }
    }
    
    // Windows
    if (workspace.windows) {
      for (const window of workspace.windows) {
        allPoints.push(...this.generateRectangleSnapPoints(window));
      }
    }
    
    // Zones
    if (workspace.zones) {
      for (const zone of workspace.zones) {
        allPoints.push(...this.generatePolygonSnapPoints(zone));
      }
    }
    
    // Measurements
    if (workspace.measurements) {
      for (const measurement of workspace.measurements) {
        allPoints.push(...this.generateMeasurementSnapPoints(measurement));
      }
    }
    
    return allPoints;
  }
}

