/**
 * Door/Window Placement Utilities for OOFPL Planner
 *
 * Utility functions for placing doors and windows on walls with
 * automatic snapping, rotation alignment, and opening direction handling.
 */

import type { Editor, TLShape, TLShapeId } from "@tldraw/editor";
import { Vec, createShapeId } from "@tldraw/editor";
import {
  checkOpeningPlacementOnWall,
  clampOpeningAlong,
  collectOpeningCandidates,
  pointAlongWall,
  wallSegmentFromEditorShape,
} from "@/features/planner/lib/geometry/openingCollision";
import { doorPlanSize, wallLength, windowPlanSize } from "@/features/planner/lib/geometry/wallOpenings";
import type { PlannerDoorTLShape, PlannerWindowTLShape } from "../shapes/tldrawShapeTypes";
import { DEFAULT_DOOR_PROPS } from "../shapes/DoorShape";
import { DEFAULT_WINDOW_PROPS } from "../shapes/WindowShape";
import { snapOpeningToWall, type OpeningSnapResult } from "./tldrawSnap";

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

export interface PlacementState {
  config: DoorWindowConfig;
  /** Center of the opening in page coordinates (on the wall axis when snapped). */
  position: Vec;
  /** Rotation in radians (tldraw convention), aligned to the wall when snapped. */
  rotation: number;
  snappedWallId: string | null;
  /** Normalized position along the snapped wall, 0..1. */
  wallT: number;
  previewId: TLShapeId | null;
  opacity: number;
  id: TLShapeId;
  placementBlocked: boolean;
  blockReason?: "overlap" | "wall-end" | "off-wall";
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

  private currentPreview: PlacementState | null = null;
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

    const placement: PlacementState = {
      id: createShapeId(),
      config,
      position,
      rotation: 0,
      snappedWallId: null,
      wallT: 0.5,
      previewId: null,
      opacity: 1,
      placementBlocked: false,
    };

    const snappedPlacement = this.applySnapState(placement, position);

    this.currentPreview = snappedPlacement;
    this.isDragging = true;

    // Show preview if enabled
    if (this.options.showPreview) {
      this.showPreview(snappedPlacement);
    }

    return snappedPlacement;
  }

  // Update placement during drag
  updatePlacement(position: Vec): unknown | null {
    if (!this.currentPreview || !this.isDragging) return null;

    const previewId = this.currentPreview.previewId ?? this.toPreviewId(String(this.currentPreview.id));
    this.currentPreview = this.applySnapState(this.currentPreview, position, previewId);

    // Update preview
    if (this.options.showPreview) {
      this.updatePreview(this.currentPreview);
    }

    return this.currentPreview;
  }

  // Complete placement
  finishPlacement(): unknown | null {
    if (!this.currentPreview || !this.isDragging) return null;
    if (this.currentPreview.placementBlocked) return null;

    const shape = this.createShape(this.currentPreview);

    if (shape) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.editor.createShape(shape as any);

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

  private openingWidthCanvas(config: DoorWindowConfig): number {
    if (config.type === "door") {
      return doorPlanSize({
        widthMm: config.widthMm,
        thicknessMm: DEFAULT_DOOR_PROPS.thicknessMm ?? 40,
      }).width;
    }
    return windowPlanSize({
      widthMm: config.widthMm,
      frameThicknessMm: DEFAULT_WINDOW_PROPS.frameThicknessMm,
    }).width;
  }

  private evaluatePlacement(
    config: DoorWindowConfig,
    snap: OpeningSnapResult | null,
    excludePreviewId?: TLShapeId,
  ): Pick<PlacementState, "position" | "rotation" | "snappedWallId" | "wallT" | "placementBlocked" | "blockReason"> {
    if (!snap) {
      return {
        position: new Vec(0, 0),
        rotation: 0,
        snappedWallId: null,
        wallT: 0.5,
        placementBlocked: true,
        blockReason: "off-wall",
      };
    }

    const wallShape = this.editor.getShape(snap.wallId as TLShapeId);
    const wall = wallShape ? wallSegmentFromEditorShape(wallShape) : null;
    if (!wall) {
      return {
        position: snap.position,
        rotation: snap.angleRad,
        snappedWallId: snap.wallId,
        wallT: snap.t,
        placementBlocked: true,
        blockReason: "off-wall",
      };
    }

    const openingWidth = this.openingWidthCanvas(config);
    const length = wallLength(wall);
    const along = clampOpeningAlong(length, snap.t * length, openingWidth);
    const clampedT = length > 0 ? along / length : snap.t;
    const center = pointAlongWall(wall, along);
    const existing = collectOpeningCandidates(this.editor, wall, excludePreviewId);
    const check = checkOpeningPlacementOnWall(
      wall,
      center,
      openingWidth,
      existing,
      excludePreviewId ? String(excludePreviewId) : null,
    );

    return {
      position: new Vec(center.x, center.y),
      rotation: snap.angleRad,
      snappedWallId: snap.wallId,
      wallT: clampedT,
      placementBlocked: check.blocked,
      blockReason: check.reason,
    };
  }

  private applySnapState(
    placement: PlacementState,
    position: Vec,
    excludePreviewId?: TLShapeId,
  ): PlacementState {
    const rawSnap = this.options.snapToWalls ? snapOpeningToWall(this.editor, position) : null;
    if (!rawSnap) {
      return {
        ...placement,
        position,
        rotation: 0,
        snappedWallId: null,
        wallT: 0.5,
        placementBlocked: this.options.snapToWalls,
        blockReason: this.options.snapToWalls ? "off-wall" : undefined,
      };
    }

    const evaluated = this.evaluatePlacement(placement.config, rawSnap, excludePreviewId);
    return {
      ...placement,
      ...evaluated,
    };
  }

  // Snap position to nearest wall
  private snapToWall(position: Vec): OpeningSnapResult | null {
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

  /**
   * Anchor (local origin) so the opening's plan rectangle is centered on
   * `center` — on the wall axis when snapped, straddling the wall body.
   */
  private anchorFromCenter(center: Vec, rotation: number, width: number, depth: number): Vec {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return new Vec(
      center.x - (width / 2) * cos + (depth / 2) * sin,
      center.y - (width / 2) * sin - (depth / 2) * cos,
    );
  }

  // Create shape from placement data
  private createShape(placement: PlacementState): unknown {
    const { config, position, rotation, snappedWallId, wallT } = placement;

    if (config.type === "door") {
      const thicknessMm = DEFAULT_DOOR_PROPS.thicknessMm ?? 40;
      const { width, depth } = doorPlanSize({ widthMm: config.widthMm, thicknessMm });
      const anchor = this.anchorFromCenter(position, rotation, width, depth);
      return {
        id: placement.id,
        type: "planner-door" as const,
        x: anchor.x,
        y: anchor.y,
        rotation: rotation,
        opacity: 1,
        isLocked: false,
        props: {
          ...DEFAULT_DOOR_PROPS,
          doorType: config.doorType,
          swingDirection: config.direction,
          swingAngle: 90,
          widthMm: config.widthMm,
          thicknessMm,
          wallId: snappedWallId ?? "",
          wallPosition: wallT,
          isAttached: snappedWallId !== null,
          color: config.color,
          fillColor: config.color,
          strokeColor: "var(--color-primary)",
          strokeWidth: 2,
        },
      };
    } else {
      const { width, depth } = windowPlanSize({
        widthMm: config.widthMm,
        frameThicknessMm: DEFAULT_WINDOW_PROPS.frameThicknessMm,
      });
      const anchor = this.anchorFromCenter(position, rotation, width, depth);
      return {
        id: placement.id,
        type: "planner-window" as const,
        x: anchor.x,
        y: anchor.y,
        rotation: rotation,
        opacity: 1,
        isLocked: false,
        props: {
          ...DEFAULT_WINDOW_PROPS,
          windowType: config.windowType,
          widthMm: config.widthMm,
          heightMm: config.heightMm,
          wallId: snappedWallId ?? "",
          wallPosition: wallT,
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
  private showPreview(placement: PlacementState) {
    const previewId = this.toPreviewId(String(placement.id));
    const previewShape = this.createShape({
      ...placement,
      id: previewId,
    }) as { opacity?: number } | null;

    if (previewShape) {
      previewShape.opacity = placement.placementBlocked ? 0.38 : 0.55;
      if (placement.placementBlocked && typeof previewShape === "object" && previewShape && "props" in previewShape) {
        (previewShape as { props: { strokeColor?: string } }).props.strokeColor = "var(--color-danger)";
      }
      placement.previewId = (previewShape as { id?: TLShapeId }).id ?? previewId;
      this.editor.createShape(previewShape as Parameters<Editor["createShape"]>[0]);
    }
  }

  // Update preview
  private updatePreview(placement: PlacementState) {
    const previewId = this.toPreviewId(String(placement.id));
    const previewShape = this.createShape({
      ...placement,
      id: previewId,
    }) as { opacity?: number; id?: TLShapeId } | null;

    if (previewShape) {
      previewShape.opacity = placement.placementBlocked ? 0.38 : 0.55;
      if (typeof previewShape === "object" && previewShape && "props" in previewShape) {
        (previewShape as { props: { strokeColor?: string } }).props.strokeColor = placement.placementBlocked
          ? "var(--color-danger)"
          : "var(--color-primary)";
      }
      this.editor.updateShape(previewShape as Parameters<Editor["updateShape"]>[0]);
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
    const shape = this.editor.getShape(shapeId as TLShapeId);
    if (!shape) return;
    if (shape.type !== "planner-door") return;

    const doorShape = shape as PlannerDoorTLShape;
    this.editor.updateShape({
      id: shapeId as TLShapeId,
      type: "planner-door",
      props: {
        ...doorShape.props,
        swingDirection: direction,
      },
    });
  }

  // Rotate door/window
  rotateShape(shapeId: string, angle: number) {
    const shape = this.editor.getShape(shapeId as TLShapeId);
    if (shape) {
      this.editor.updateShape({
        id: shapeId as TLShapeId,
        type: shape.type,
        rotation: (shape.rotation || 0) + angle,
      });
    }
  }

  // Delete door/window
  deleteShape(shapeId: string) {
    this.editor.deleteShape(shapeId as TLShapeId);
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
      if (shape.type === "planner-door") {
        return (shape as PlannerDoorTLShape).props.wallId === wallId;
      }
      if (shape.type === "planner-window") {
        return (shape as PlannerWindowTLShape).props.wallId === wallId;
      }
      return false;
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

  isPlacementBlocked(): boolean {
    return Boolean(this.currentPreview?.placementBlocked);
  }
}
