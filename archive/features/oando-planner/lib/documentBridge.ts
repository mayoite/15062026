/**
 * Document Bridge
 * 
 * Handles capture and restore operations for planner documents while preserving
 * all canonical shape properties. This ensures that shapes can be serialized
 * and deserialized without losing any planner-specific data.
 */

import type {
  PlannerWallShape,
  PlannerRoomShape,
  PlannerFurnitureShape,
  PlannerDoorShape,
  PlannerWindowShape,
  PlannerZoneShape,
  PlannerMeasurementShape,
} from "../shapes";

export interface PlannerDocument {
  version: string;
  createdAt: number;
  updatedAt: number;
  workspace: {
    walls: PlannerWallShape[];
    rooms: PlannerRoomShape[];
    furniture: PlannerFurnitureShape[];
    doors: PlannerDoorShape[];
    windows: PlannerWindowShape[];
    zones: PlannerZoneShape[];
    measurements: PlannerMeasurementShape[];
  };
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    tags?: string[];
  };
}

export interface DocumentBridgeOptions {
  includeMetadata?: boolean;
  validateOnRestore?: boolean;
}

export class DocumentBridge {
  private static readonly CURRENT_VERSION = "1.0.0";

  /**
   * Capture the current workspace state into a serializable document
   */
  static capture(
    workspace: PlannerDocument["workspace"],
    metadata?: PlannerDocument["metadata"],
    options: DocumentBridgeOptions = {}
  ): PlannerDocument {
    const { includeMetadata = true } = options;

    const document: PlannerDocument = {
      version: this.CURRENT_VERSION,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      workspace: this.cloneWorkspace(workspace),
      metadata: includeMetadata ? metadata || {} : undefined,
    };

    return document;
  }

  /**
   * Restore a workspace from a serialized document
   */
  static restore(
    document: PlannerDocument,
    options: DocumentBridgeOptions = {}
  ): PlannerDocument["workspace"] {
    const { validateOnRestore = true } = options;

    if (validateOnRestore) {
      this.validateDocument(document);
    }

    // Clone the workspace to avoid reference issues
    return this.cloneWorkspace(document.workspace);
  }

  /**
   * Validate a document structure
   */
  private static validateDocument(document: PlannerDocument): void {
    if (!document.version) {
      throw new Error("Document version is required");
    }

    if (!document.workspace) {
      throw new Error("Document workspace is required");
    }

    // Validate workspace structure
    if (!Array.isArray(document.workspace.walls)) {
      throw new Error("Invalid walls array in workspace");
    }

    if (!Array.isArray(document.workspace.rooms)) {
      throw new Error("Invalid rooms array in workspace");
    }

    if (!Array.isArray(document.workspace.furniture)) {
      throw new Error("Invalid furniture array in workspace");
    }

    if (!Array.isArray(document.workspace.doors)) {
      throw new Error("Invalid doors array in workspace");
    }

    if (!Array.isArray(document.workspace.windows)) {
      throw new Error("Invalid windows array in workspace");
    }

    if (!Array.isArray(document.workspace.zones)) {
      throw new Error("Invalid zones array in workspace");
    }

    if (!Array.isArray(document.workspace.measurements)) {
      throw new Error("Invalid measurements array in workspace");
    }

    // Validate individual shapes
    this.validateShapes(document.workspace);
  }

  /**
   * Validate individual shapes in the workspace
   */
  private static validateShapes(workspace: PlannerDocument["workspace"]): void {
    // Validate walls
    workspace.walls.forEach((wall, index) => {
      this.validateWallShape(wall, index);
    });

    // Validate rooms
    workspace.rooms.forEach((room, index) => {
      this.validateRoomShape(room, index);
    });

    // Validate furniture
    workspace.furniture.forEach((item, index) => {
      this.validateFurnitureShape(item, index);
    });

    // Validate doors
    workspace.doors.forEach((door, index) => {
      this.validateDoorShape(door, index);
    });

    // Validate windows
    workspace.windows.forEach((window, index) => {
      this.validateWindowShape(window, index);
    });

    // Validate zones
    workspace.zones.forEach((zone, index) => {
      this.validateZoneShape(zone, index);
    });

    // Validate measurements
    workspace.measurements.forEach((measurement, index) => {
      this.validateMeasurementShape(measurement, index);
    });
  }

  private static validateWallShape(wall: PlannerWallShape, index: number): void {
    if (!wall.id || typeof wall.id !== "string") {
      throw new Error(`Invalid wall at index ${index}: missing or invalid id`);
    }

    if (wall.type !== "planner-wall") {
      throw new Error(`Invalid wall at index ${index}: wrong type ${wall.type}`);
    }

    if (typeof wall.thickness !== "number" || wall.thickness <= 0) {
      throw new Error(`Invalid wall at index ${index}: invalid thickness`);
    }

    if (typeof wall.lengthMm !== "number" || wall.lengthMm < 0) {
      throw new Error(`Invalid wall at index ${index}: invalid length`);
    }
  }

  private static validateRoomShape(room: PlannerRoomShape, index: number): void {
    if (!room.id || typeof room.id !== "string") {
      throw new Error(`Invalid room at index ${index}: missing or invalid id`);
    }

    if (room.type !== "planner-room") {
      throw new Error(`Invalid room at index ${index}: wrong type ${room.type}`);
    }

    if (!Array.isArray(room.points) || room.points.length < 3) {
      throw new Error(`Invalid room at index ${index}: must have at least 3 points`);
    }

    if (typeof room.areaSqm !== "number" || room.areaSqm < 0) {
      throw new Error(`Invalid room at index ${index}: invalid area`);
    }
  }

  private static validateFurnitureShape(furniture: PlannerFurnitureShape, index: number): void {
    if (!furniture.id || typeof furniture.id !== "string") {
      throw new Error(`Invalid furniture at index ${index}: missing or invalid id`);
    }

    if (furniture.type !== "planner-furniture") {
      throw new Error(`Invalid furniture at index ${index}: wrong type ${furniture.type}`);
    }

    if (typeof furniture.widthMm !== "number" || furniture.widthMm <= 0) {
      throw new Error(`Invalid furniture at index ${index}: invalid width`);
    }

    if (typeof furniture.heightMm !== "number" || furniture.heightMm <= 0) {
      throw new Error(`Invalid furniture at index ${index}: invalid height`);
    }

    if (!furniture.catalogId || typeof furniture.catalogId !== "string") {
      throw new Error(`Invalid furniture at index ${index}: missing catalogId`);
    }
  }

  private static validateDoorShape(door: PlannerDoorShape, index: number): void {
    if (!door.id || typeof door.id !== "string") {
      throw new Error(`Invalid door at index ${index}: missing or invalid id`);
    }

    if (door.type !== "planner-door") {
      throw new Error(`Invalid door at index ${index}: wrong type ${door.type}`);
    }

    if (typeof door.widthMm !== "number" || door.widthMm <= 0) {
      throw new Error(`Invalid door at index ${index}: invalid width`);
    }

    if (typeof door.swingAngle !== "number" || door.swingAngle < 0 || door.swingAngle > 180) {
      throw new Error(`Invalid door at index ${index}: invalid swing angle`);
    }
  }

  private static validateWindowShape(window: PlannerWindowShape, index: number): void {
    if (!window.id || typeof window.id !== "string") {
      throw new Error(`Invalid window at index ${index}: missing or invalid id`);
    }

    if (window.type !== "planner-window") {
      throw new Error(`Invalid window at index ${index}: wrong type ${window.type}`);
    }

    if (typeof window.widthMm !== "number" || window.widthMm <= 0) {
      throw new Error(`Invalid window at index ${index}: invalid width`);
    }

    if (typeof window.heightMm !== "number" || window.heightMm <= 0) {
      throw new Error(`Invalid window at index ${index}: invalid height`);
    }

    if (typeof window.sillHeightMm !== "number" || window.sillHeightMm < 0) {
      throw new Error(`Invalid window at index ${index}: invalid sill height`);
    }
  }

  private static validateZoneShape(zone: PlannerZoneShape, index: number): void {
    if (!zone.id || typeof zone.id !== "string") {
      throw new Error(`Invalid zone at index ${index}: missing or invalid id`);
    }

    if (zone.type !== "planner-zone") {
      throw new Error(`Invalid zone at index ${index}: wrong type ${zone.type}`);
    }

    if (!Array.isArray(zone.points) || zone.points.length < 3) {
      throw new Error(`Invalid zone at index ${index}: must have at least 3 points`);
    }

    if (typeof zone.areaSqm !== "number" || zone.areaSqm < 0) {
      throw new Error(`Invalid zone at index ${index}: invalid area`);
    }

    if (typeof zone.capacity !== "number" || zone.capacity < 0) {
      throw new Error(`Invalid zone at index ${index}: invalid capacity`);
    }
  }

  private static validateMeasurementShape(measurement: PlannerMeasurementShape, index: number): void {
    if (!measurement.id || typeof measurement.id !== "string") {
      throw new Error(`Invalid measurement at index ${index}: missing or invalid id`);
    }

    if (measurement.type !== "planner-measurement") {
      throw new Error(`Invalid measurement at index ${index}: wrong type ${measurement.type}`);
    }

    if (typeof measurement.lengthMm !== "number" || measurement.lengthMm < 0) {
      throw new Error(`Invalid measurement at index ${index}: invalid length`);
    }
  }

  /**
   * Deep clone workspace to avoid reference issues
   */
  private static cloneWorkspace(workspace: PlannerDocument["workspace"]): PlannerDocument["workspace"] {
    return {
      walls: workspace.walls.map(wall => ({ ...wall })),
      rooms: workspace.rooms.map(room => ({ ...room, points: room.points.map(p => ({ ...p })) })),
      furniture: workspace.furniture.map(item => ({ ...item })),
      doors: workspace.doors.map(door => ({ ...door })),
      windows: workspace.windows.map(window => ({ ...window })),
      zones: workspace.zones.map(zone => ({ ...zone, points: zone.points.map(p => ({ ...p })) })),
      measurements: workspace.measurements.map(measurement => ({ ...measurement, referenceIds: [...measurement.referenceIds] })),
    };
  }

  /**
   * Serialize document to JSON string
   */
  static serialize(document: PlannerDocument): string {
    return JSON.stringify(document, null, 2);
  }

  /**
   * Deserialize document from JSON string
   */
  static deserialize(jsonString: string, options: DocumentBridgeOptions = {}): PlannerDocument {
    try {
      const document = JSON.parse(jsonString) as PlannerDocument;
      if (options.validateOnRestore ?? true) {
        this.validateDocument(document);
      }
      return document;
    } catch (error) {
      throw new Error(`Failed to deserialize document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Export document to file (browser only)
   */
  static exportToFile(doc: PlannerDocument, filename: string = "planner-document.json"): void {
    if (typeof window === "undefined") {
      throw new Error("exportToFile is only available in browser environment");
    }

    const jsonString = this.serialize(doc);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import document from file (browser only)
   */
  static async importFromFile(file: File, options: DocumentBridgeOptions = {}): Promise<PlannerDocument> {
    if (typeof window === "undefined") {
      throw new Error("importFromFile is only available in browser environment");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result as string;
          const document = this.deserialize(jsonString, options);
          resolve(document);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Create a minimal template document
   */
  static createTemplate(): PlannerDocument {
    return {
      version: this.CURRENT_VERSION,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      workspace: {
        walls: [],
        rooms: [],
        furniture: [],
        doors: [],
        windows: [],
        zones: [],
        measurements: [],
      },
      metadata: {
        title: "New Plan",
        description: "A new office plan",
        tags: [],
      },
    };
  }
}
