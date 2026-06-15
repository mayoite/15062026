// @ts-nocheck
/**
 * Door/Window Placement Utilities for OOFPL Planner
 *
 * Utility functions for placing doors and windows on walls with
 * automatic snapping, rotation alignment, and opening direction handling.
 */

import type { Editor, TLShape } from "@tldraw/editor";
import { Vec, createShapeId } from "@tldraw/editor";
import { DEFAULT_DOOR_PROPS } from "../shapes/DoorShape";
import { DEFAULT_WINDOW_PROPS } from "../shapes/WindowShape";
import { snapOpeningToWall } from "./tldrawSnap";

export type DoorType = "single" | "double" | "sliding" | "folding";
export type WindowType = "single" | "double" | "sliding" | "fixed" | "awning";
export type OpeningDirection = "left" | "right" | "both";

export interface DoorWindowPlacementOptions {
  snapToWalls: boolean;
  snapDistance: number;
  autoRotate: boolean;
  showPreview: boolean;
  defaultDirection: OpeningDirection;
}

export interface DoorWindowConfig {
  type: "door" | "window";
  doorType?: DoorType;
  windowType?: WindowType;
  widthMm: number;
  heightMm: number;
  direction: OpeningDirection;
  color: string;
}

export class DoorWindowPlacementUtils {
  private toPreviewId(id: string) {
    const baseId = id.startsWith("shape:") ? id.slice(6) : id;
    return createShapeId(`preview-${baseId}`);
  }

  private getWallEndpoints(shape: TLShape): { start: Vec; end: Vec } | null {
    if (shape.type !== "planner-wall") return null;

    const wall = shape as TLShape & {
      x: number;
      y: number;
      props?: { startX?: number; startY?: number; endX?: number; endY?: number };
    };

    const start = new Vec(
      wall.x + (wall.props?.startX ?? 0),
      wall.y + (wall.props?.startY ?? 0)
    );
    const end = new Vec(
      wall.x + (wall.props?.endX ?? 0),
      wall.y + (wall.props?.endY ?? 0)
    );

    return { start, end };
  }

  private options: DoorWindowPlacementOptions = {
    snapToWalls: true,
    snapDistance: 20,
    autoRotate: true,
    showPreview: true,
    defaultDirection: "left",
  };

  private currentPreview: unknown = null;
  private isDragging: boolean = false;

  constructor(private editor: Editor) { }

  // Standard door/window configurations
  private static readonly STANDARD_CONFIGS: Record<string, DoorWindowConfig> = {
    "door-single-800": {
      type: "door",
      doorType: "single",
      widthMm: 800,
      heightMm: 2100,
      direction: "left",
      color: "var(--border-soft)",
    },
    "door-single-900": {
      type: "door",
      doorType: "single",
      widthMm: 900,
      heightMm: 2100,
      direction: "left",
      color: "var(--border-soft)",
    },
    "door-double-1200": {
      type: "door",
      doorType: "double",
      widthMm: 1200,
      heightMm: 2100,
      direction: "both",
      color: "var(--border-soft)",
    },
    "door-sliding-1000": {
      type: "door",
      doorType: "sliding",
      widthMm: 1000,
      heightMm: 2100,
      direction: "both",
      color: "var(--border-soft)",
    },
    "window-single-600": {
      type: "window",
      windowType: "single",
      widthMm: 600,
      heightMm: 1200,
      direction: "both",
      color: "var(--border-soft)",
    },
    "window-double-1200": {
      type: "window",
      windowType: "double",
      widthMm: 1200,
      heightMm: 1200,
      direction: "both",
      color: "var(--border-soft)",
    },
    "window-sliding-1800": {
      type: "window",
      windowType: "sliding",
      widthMm: 1800,
      heightMm: 1200,
      direction: "both",
      color: "var(--border-soft)",
    },
  };

  // Get all available configurations
  getConfigs(): DoorWindowConfig[] {
    return Object.values(DoorWindowPlacementUtils.STANDARD_CONFIGS);
  }

  // Get configuration by key
  getConfig(key: string): DoorWindowConfig | undefined {
    return DoorWindowPlacementUtils.STANDARD_CONFIGS[key];
  }

  // Start placing door/window
  startPlacement(configKey: string, position: Vec): unknown | null {
    const config = this.getConfig(configKey);
    if (!config) return null;

    let snappedPosition = position;
    let rotation = 0;
    let snappedWallId: string | null = null;

    // Apply wall snapping if enabled
    if (this.options.snapToWalls) {
      const snapResult = this.snapToWall(position);
      if (snapResult) {
        snappedPosition = snapResult.position;
        rotation = snapResult.rotation;
        snappedWallId = snapResult.wallId;
      }
    }

    const placement = {
      id: createShapeId(),
      config,
      position: snappedPosition,
      rotation,
      snappedWallId,
    };

    this.currentPreview = placement;
    this.isDragging = true;

    // Show preview if enabled
    if (this.options.showPreview) {
      this.showPreview(placement);
    }

    return placement;
  }

  // Update placement during drag
  updatePlacement(position: Vec): unknown | null {
    if (!this.currentPreview || !this.isDragging) return null;

    let snappedPosition = position;
    let rotation = this.currentPreview.rotation;
    let snappedWallId = this.currentPreview.snappedWallId;

    // Apply wall snapping if enabled
    if (this.options.snapToWalls) {
      const snapResult = this.snapToWall(position);
      if (snapResult) {
        snappedPosition = snapResult.position;
        rotation = snapResult.rotation;
        snappedWallId = snapResult.wallId;
      }
    }

    this.currentPreview.position = snappedPosition;
    this.currentPreview.rotation = rotation;
    this.currentPreview.snappedWallId = snappedWallId;

    // Update preview
    if (this.options.showPreview) {
      this.updatePreview(this.currentPreview);
    }

    return this.currentPreview;
  }

  // Complete placement
  finishPlacement(): unknown | null {
    if (!this.currentPreview || !this.isDragging) return null;

    const shape = this.createShape(this.currentPreview);

    if (shape) {
      this.editor.createShape(shape as unknown);

      // Hide preview
      if (this.options.showPreview) {
        this.hidePreview();
      }
    }

    const result = this.currentPreview;
    this.currentPreview = null;
    this.isDragging = false;

    return result;
  }

  // Cancel placement
  cancelPlacement() {
    if (this.options.showPreview && this.currentPreview) {
      this.hidePreview();
    }
    this.currentPreview = null;
    this.isDragging = false;
  }

  // Snap position to nearest wall
  private snapToWall(position: Vec): { position: Vec; rotation: number; wallId: string } | null {
    return snapOpeningToWall(this.editor, position);
  }

  // Get closest point on a line segment
  private getClosestPointOnLine(point: Vec, lineStart: Vec, lineEnd: Vec): Vec {
    const lineVec = lineEnd.clone().sub(lineStart);
    const pointVec = point.clone().sub(lineStart);

    const lineLength = lineVec.len();
    if (lineLength === 0) return lineStart;

    // Manual dot product calculation
    const dotProduct = pointVec.x * lineVec.x + pointVec.y * lineVec.y;
    const t = Math.max(0, Math.min(1, dotProduct / (lineLength * lineLength)));

    return lineStart.clone().add(lineVec.mul(t));
  }

  // Get wall shapes from canvas
  private getWallShapes(): TLShape[] {
    const allShapes = this.editor.getCurrentPageShapes();
    return allShapes.filter(shape => (shape.type as string) === "planner-wall");
  }

  // Create shape from placement data
  private createShape(placement: unknown): unknown {
    const { config, position, rotation, snappedWallId } = placement;



    if (config.type === "door") {
      return {
        id: placement.id,
        type: "planner-door" as const,
        x: position.x,
        y: position.y,
        rotation: rotation,
        opacity: 1,
        isLocked: false,
        props: {
          ...DEFAULT_DOOR_PROPS,
          doorType: config.doorType,
          swingDirection: config.direction,
          swingAngle: 90,
          widthMm: config.widthMm,
          thicknessMm: DEFAULT_DOOR_PROPS.thicknessMm ?? 40,
          wallId: snappedWallId ?? "",
          wallPosition: 0.5,
          isAttached: snappedWallId !== null,
          color: config.color,
          fillColor: config.color,
          strokeColor: "var(--color-primary)",
          strokeWidth: 2,
        },
      };
    } else {
      return {
        id: placement.id,
        type: "planner-window" as const,
        x: position.x,
        y: position.y,
        rotation: rotation,
        opacity: 1,
        isLocked: false,
        props: {
          ...DEFAULT_WINDOW_PROPS,
          windowType: config.windowType,
          widthMm: config.widthMm,
          heightMm: config.heightMm,
          wallId: snappedWallId ?? "",
          wallPosition: 0.5,
          isAttached: snappedWallId !== null,
          color: config.color,
          fillColor: config.color,
          strokeColor: "var(--color-primary)",
          strokeWidth: 2,
        },
      };
    }
  }

  // Show preview
  private showPreview(placement: unknown) {
    const previewId = this.toPreviewId(String(placement.id));
    const previewShape = this.createShape({
      ...placement,
      id: previewId,
    });

    if (previewShape) {
      previewShape.opacity = 0.5;
      this.editor.createShape(previewShape as unknown);
    }
  }

  // Update preview
  private updatePreview(placement: unknown) {
    const previewId = this.toPreviewId(String(placement.id));
    const previewShape = this.createShape({
      ...placement,
      id: previewId,
    });

    if (previewShape) {
      previewShape.opacity = 0.5;
      this.editor.updateShape(previewShape as unknown);
    }
  }

  // Hide preview
  private hidePreview() {
    if (this.currentPreview) {
      const previewId = this.toPreviewId(String(this.currentPreview.id));
      try {
        this.editor.deleteShape(previewId);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // Shape might not exist
      }
    }
  }

  // Change opening direction
  changeDirection(shapeId: string, direction: OpeningDirection) {
    const shape = this.editor.getShape(shapeId as unknown);
    if (!shape) return;
    if (shape.type !== "planner-door") return;

    const currentProps = (shape as unknown).props ?? {};
    this.editor.updateShape({
      id: shapeId,
      type: "planner-door",
      props: {
        ...currentProps,
        swingDirection: direction,
      },
    } as unknown);
  }

  // Rotate door/window
  rotateShape(shapeId: string, angle: number) {
    const shape = this.editor.getShape(shapeId as unknown);
    if (shape) {
      this.editor.updateShape({
        id: shapeId,
        rotation: (shape.rotation || 0) + angle,
      } as unknown);
    }
  }

  // Delete door/window
  deleteShape(shapeId: string) {
    this.editor.deleteShape(shapeId as unknown);
  }

  // Get all doors/windows on canvas
  getDoorWindowShapes(): TLShape[] {
    const allShapes = this.editor.getCurrentPageShapes();
    return allShapes.filter(shape => {
      const type = shape.type as string;
      return type === "planner-door" || type === "planner-window";
    });
  }

  // Get doors/windows attached to a specific wall
  getShapesOnWall(wallId: string): TLShape[] {
    const allShapes = this.getDoorWindowShapes();
    return allShapes.filter(shape => {
      const s = shape as unknown;
      return s.props?.wallId === wallId;
    });
  }

  // Set placement options
  setOptions(options: Partial<DoorWindowPlacementOptions>) {
    this.options = { ...this.options, ...options };
  }

  // Get current options
  getOptions(): DoorWindowPlacementOptions {
    return { ...this.options };
  }

  // Check if currently placing
  isCurrentlyPlacing(): boolean {
    return this.isDragging && this.currentPreview !== null;
  }

  // Get current preview
  getCurrentPreview(): unknown | null {
    return this.currentPreview;
  }
}
