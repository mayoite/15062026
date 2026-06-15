// @ts-nocheck
/**
 * Wall Drawing Utilities for OOFPL Planner
 *
 * Utility functions for wall drawing with snapping, T-junctions,
 * and L-junctions. These work with tldraw's editor APIs.
 */

import {
  StateNode,
  Vec,
  createShapeId,
  type Editor,
  type TLPointerEventInfo,
  type TLShape,
  type TLShapeId,
  type TLStateNodeConstructor,
} from "@tldraw/editor";
import type { WallMaterial } from "../shapes/sharedTypes";
import type { PlannerWallTLShape } from "../shapes/tldrawShapeTypes";
import { STANDARD_WALL_THICKNESSES } from "../shapes/WallShape";
import { getEditorSnapThreshold, snapEditorPointOrGrid } from "./tldrawSnap";

export interface WallDrawingState {
  startPoint: Vec | null;
  endPoint: Vec | null;
  isDrawing: boolean;
  thickness: number;
  material: WallMaterial;
  snapEnabled: boolean;
}

function isWallShape(shape: TLShape): shape is PlannerWallTLShape {
  return shape.type === "planner-wall";
}

export class WallDrawingUtils {
  private state: WallDrawingState = {
    startPoint: null,
    endPoint: null,
    isDrawing: false,
    thickness: STANDARD_WALL_THICKNESSES.drywall,
    material: "drywall",
    snapEnabled: true,
  };

  constructor(private editor: Editor) { }

  startDrawing(point: Vec) {
    this.state.startPoint = point;
    this.state.endPoint = point;
    this.state.isDrawing = true;
  }

  updateDrawing(point: Vec) {
    if (!this.state.isDrawing) return;
    this.state.endPoint = this.state.snapEnabled ? this.applySnapping(point) : point;
  }

  finishDrawing() {
    if (!this.state.isDrawing || !this.state.startPoint || !this.state.endPoint) {
      this.reset();
      return null;
    }

    const wall = this.createWall(this.state.startPoint, this.state.endPoint);
    this.reset();
    return wall;
  }

  cancelDrawing() {
    this.reset();
  }

  private reset() {
    this.state = {
      startPoint: null,
      endPoint: null,
      isDrawing: false,
      thickness: STANDARD_WALL_THICKNESSES.drywall,
      material: "drywall",
      snapEnabled: true,
    };
  }

  private applySnapping(point: Vec): Vec {
    return snapEditorPointOrGrid(this.editor, point);
  }

  private getSnapCandidates(): Vec[] {
    const candidates: Vec[] = [];
    const allShapes = this.editor.getCurrentPageShapes();

    for (const shape of allShapes) {
      if (isWallShape(shape)) {
        candidates.push(new Vec(shape.x + shape.props.startX, shape.y + shape.props.startY));
        candidates.push(new Vec(shape.x + shape.props.endX, shape.y + shape.props.endY));
      }
    }

    return candidates;
  }

  private createWall(startPoint: Vec, endPoint: Vec) {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const lengthPx = Math.hypot(dx, dy);
    const lengthMm = Math.round(lengthPx * 10);

    if (lengthMm < 100) return null;

    this.editor.createShape({
      type: "planner-wall",
      x: startPoint.x,
      y: startPoint.y,
      rotation: 0,
      isLocked: false,
      opacity: 1,
      props: {
        startX: 0,
        startY: 0,
        endX: dx,
        endY: dy,
        lengthMm,
        thickness: this.state.thickness,
        material: this.state.material,
        color: "var(--color-primary)",
        fillColor: "var(--color-primary)",
        strokeColor: "var(--color-primary)",
        strokeWidth: 2,
        hasJunctionStart: false,
        hasJunctionEnd: false,
        isLoadBearing: false,
        isExterior: false,
        showDimensions: true,
        showMaterial: false,
      },
    });

    return { startPoint, endPoint, lengthMm };
  }

  setThickness(thickness: number) {
    this.state.thickness = thickness;
  }

  setMaterial(material: WallMaterial) {
    this.state.material = material;
    this.state.thickness = STANDARD_WALL_THICKNESSES[material] || 100;
  }

  toggleSnapping() {
    this.state.snapEnabled = !this.state.snapEnabled;
  }

  getState(): WallDrawingState {
    return { ...this.state };
  }

  isCurrentlyDrawing(): boolean {
    return this.state.isDrawing;
  }
}

/**
 * PlannerWallTool - minimal StateNode wall tool baseline for Phase B migration.
 */
export class PlannerWallTool extends StateNode {
  static override id = "planner-wall";
  static override initial = "idle";
  static override isLockable = false;
  static override children(): TLStateNodeConstructor[] {
    return [PlannerWallToolIdle, PlannerWallToolDrawing];
  }
  override shapeType = "planner-wall";
}

class PlannerWallToolIdle extends StateNode {
  static override id = "idle";

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 });
  }

  override onPointerDown(info: TLPointerEventInfo) {
    this.parent.transition("drawing", info);
  }

  override onCancel() {
    this.editor.setCurrentTool("select");
  }
}

class PlannerWallToolDrawing extends StateNode {
  static override id = "drawing";

  private wallId: TLShapeId | null = null;
  private startPoint: Vec | null = null;

  override onEnter() {
    this.startPoint = this.editor.inputs.getCurrentPagePoint();
    const snapStart = this.applySnapping(this.startPoint);
    const id = createShapeId();
    this.wallId = id;

    this.editor.createShape({
      id,
      type: "planner-wall",
      x: snapStart.x,
      y: snapStart.y,
      rotation: 0,
      isLocked: false,
      opacity: 1,
      props: {
        startX: 0,
        startY: 0,
        endX: 0.1,
        endY: 0.1,
        lengthMm: 1,
        thickness: STANDARD_WALL_THICKNESSES.drywall,
        material: "drywall",
        color: "var(--color-primary)",
        fillColor: "var(--color-primary)",
        strokeColor: "var(--color-primary)",
        strokeWidth: 2,
        hasJunctionStart: false,
        hasJunctionEnd: false,
        isLoadBearing: false,
        isExterior: false,
        showDimensions: true,
        showMaterial: false,
      },
    });

    this.editor.select(id);
  }

  override onPointerMove() {
    if (!this.wallId || !this.startPoint) return;
    const currentPoint = this.editor.inputs.getCurrentPagePoint();
    const snapStart = this.applySnapping(this.startPoint);
    const snapEnd = this.applySnapping(currentPoint);
    const dx = snapEnd.x - snapStart.x;
    const dy = snapEnd.y - snapStart.y;
    const length = Math.hypot(dx, dy);

    this.editor.updateShape({
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: this.wallId!,
      type: "planner-wall",
      x: snapStart.x,
      y: snapStart.y,
      props: {
        endX: dx,
        endY: dy,
        lengthMm: Math.round(length * 10),
      },
    });
  }

  override onPointerUp() {
    this.complete();
  }

  override onCancel() {
    this.cancel();
  }

  private complete() {
    if (!this.wallId || !this.startPoint) {
      this.parent.transition("idle", {});
      return;
    }

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const shape = this.editor.getShape(this.wallId!);
    if (shape && shape.type === "planner-wall") {
      const dx = (shape.props as unknown).endX;
      const dy = (shape.props as unknown).endY;
      const length = Math.hypot(dx, dy);

      if (length < 4) {
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.editor.deleteShape(this.wallId!);
      } else {
        const snapStart = this.applySnapping(this.startPoint);
        const currentPoint = this.editor.inputs.getCurrentPagePoint();
        const snapEnd = this.applySnapping(currentPoint);

        const jStart = this.getJunction(snapStart, this.wallId);
        const jEnd = this.getJunction(snapEnd, this.wallId);

        this.editor.updateShape({
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          id: this.wallId!,
          type: "planner-wall",
          props: {
            hasJunctionStart: jStart.hasJunction,
            junctionTypeStart: jStart.type,
            hasJunctionEnd: jEnd.hasJunction,
            junctionTypeEnd: jEnd.type,
          },
        });
      }
    }

    this.wallId = null;
    this.startPoint = null;
    this.parent.transition("idle", {});
  }

  private cancel() {
    if (this.wallId) {
      this.editor.deleteShape(this.wallId);
    }
    this.wallId = null;
    this.startPoint = null;
    this.editor.setCurrentTool("select");
  }

  private applySnapping(point: Vec): Vec {
    return snapEditorPointOrGrid(this.editor, point, this.wallId);
  }

  private getJunction(point: Vec, excludeId?: string): { hasJunction: boolean; type?: "L" | "T" | "cross" } {
    const allShapes = this.editor.getCurrentPageShapes();
    const threshold = getEditorSnapThreshold();
    let endpointHits = 0;
    let interiorHits = 0;

    for (const shape of allShapes) {
      if (shape.type === "planner-wall" && shape.id !== excludeId) {
        const start = new Vec(shape.x + (shape.props as unknown).startX, shape.y + (shape.props as unknown).startY);
        const end = new Vec(shape.x + (shape.props as unknown).endX, shape.y + (shape.props as unknown).endY);

        if (point.dist(start) < threshold || point.dist(end) < threshold) {
          endpointHits++;
          continue;
        }

        const closest = this.getClosestPointOnLine(point, start, end);
        if (point.dist(closest) < threshold) {
          interiorHits++;
        }
      }
    }

    if (endpointHits > 0 && interiorHits > 0) {
      return { hasJunction: true, type: "cross" };
    }
    if (interiorHits > 1) {
      return { hasJunction: true, type: "cross" };
    }
    if (endpointHits > 0) {
      return { hasJunction: true, type: "L" };
    }
    if (interiorHits === 1) {
      return { hasJunction: true, type: "T" };
    }

    return { hasJunction: false };
  }

  private getClosestPointOnLine(point: Vec, lineStart: Vec, lineEnd: Vec): Vec {
    const lineVec = lineEnd.clone().sub(lineStart);
    const pointVec = point.clone().sub(lineStart);
    const lineLength = lineVec.len();
    if (lineLength === 0) return lineStart;
    const dotProduct = pointVec.x * lineVec.x + pointVec.y * lineVec.y;
    const t = Math.max(0, Math.min(1, dotProduct / (lineLength * lineLength)));
    return lineStart.clone().add(lineVec.mul(t));
  }
}
