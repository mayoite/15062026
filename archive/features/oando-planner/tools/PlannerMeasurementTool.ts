// @ts-nocheck
import {
  StateNode,
  Vec,
  createShapeId,
  type TLPointerEventInfo,
  type TLShapeId,
  type TLStateNodeConstructor,
} from "@tldraw/editor";
import { SnapManager } from "../lib/snapManager";

/**
 * PlannerMeasurementTool
 * Integrates precise SnapManager wall/furniture snapping and Shift-key orthogonal snapping.
 */
export class PlannerMeasurementTool extends StateNode {
  static override id = "planner-measurement";
  static override initial = "idle";
  static override isLockable = false;
  static override children(): TLStateNodeConstructor[] {
    return [PlannerMeasurementToolIdle, PlannerMeasurementToolDrawing];
  }
  override shapeType = "planner-measurement";
}

class PlannerMeasurementToolIdle extends StateNode {
  static override id = "idle";

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 });
  }

  override onCancel() {
    this.editor.setCurrentTool("select");
  }

  override onPointerDown(info: TLPointerEventInfo) {
    this.parent.transition("drawing", info);
  }
}

class PlannerMeasurementToolDrawing extends StateNode {
  static override id = "drawing";
  private measureId: TLShapeId | null = null;
  private startPoint: Vec | null = null;
  private snapManager: SnapManager | null = null;

  override onEnter() {
    // Initialize snap manager
    this.snapManager = new SnapManager({ snapThreshold: 15 });
    const allShapes = this.editor.getCurrentPageShapes();
    const walls = allShapes.filter((s) => s.type === "planner-wall").map(s => ({...s, ...s.props}));
    const rooms = allShapes.filter((s) => s.type === "planner-room").map(s => ({...s, ...s.props}));
    const furniture = allShapes.filter((s) => s.type === "planner-furniture").map(s => ({...s, ...s.props}));
    
    const snapPoints = SnapManager.generateWorkspaceSnapPoints({
      walls,
      rooms,
      furniture,
      doors: [],
      windows: [],
      zones: [],
      measurements: []
    });
    this.snapManager.addSnapPoints(snapPoints);

    // Get and snap the start point
    const rawStartPoint = this.editor.inputs.getCurrentPagePoint();
    let finalStart = rawStartPoint;
    
    if (this.snapManager && !this.editor.inputs.shiftKey) {
      const result = this.snapManager.findSnap(rawStartPoint.x, rawStartPoint.y);
      if (result.snapped) {
        finalStart = new Vec(result.point.x, result.point.y);
      }
    }

    this.startPoint = finalStart;
    const id = createShapeId();
    this.measureId = id;

    this.editor.createShape({
      id,
      type: "planner-measurement",
      x: this.startPoint.x,
      y: this.startPoint.y,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        startX: 0,
        startY: 0,
        endX: 0.1,
        endY: 0.1,
        lengthMm: 1,
        unit: "mm",
        orientation: "diagonal",
        offset: 0,
        showValue: true,
        showUnit: true,
        precision: 0,
        showArrows: true,
        arrowSize: 8,
        arrowStyle: "filled",
        showExtensionLines: true,
        extensionLength: 10,
        referenceIds: [],
        referenceType: "custom",
        color: "var(--color-accent)",
        fillColor: "var(--color-accent)",
        strokeColor: "var(--color-accent)",
        strokeWidth: 1,
        textColor: "var(--color-primary)",
        lineColor: "var(--color-accent)",
        fontSize: 12,
      },
    });

    this.editor.select(id);
  }

  override onPointerMove() {
    if (!this.measureId || !this.startPoint) return;
    const rawCurrentPoint = this.editor.inputs.getCurrentPagePoint();
    let finalPoint = rawCurrentPoint;

    // Apply Snapping
    if (this.snapManager && !this.editor.inputs.shiftKey) {
      const result = this.snapManager.findSnap(rawCurrentPoint.x, rawCurrentPoint.y);
      if (result.snapped) {
        finalPoint = new Vec(result.point.x, result.point.y);
      }
    }

    // Apply Orthogonal (Shift) Snapping overrides
    if (this.editor.inputs.shiftKey) {
      const dxRaw = rawCurrentPoint.x - this.startPoint.x;
      const dyRaw = rawCurrentPoint.y - this.startPoint.y;
      if (Math.abs(dxRaw) > Math.abs(dyRaw)) {
        // Snap horizontal
        finalPoint = new Vec(rawCurrentPoint.x, this.startPoint.y);
      } else {
        // Snap vertical
        finalPoint = new Vec(this.startPoint.x, rawCurrentPoint.y);
      }
    }

    const dx = finalPoint.x - this.startPoint.x;
    const dy = finalPoint.y - this.startPoint.y;
    const len = Math.hypot(dx, dy);

    this.editor.updateShape({
      id: this.measureId,
      type: "planner-measurement",
      props: {
        endX: dx,
        endY: dy,
        lengthMm: Math.round(len * 10),
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
    if (this.measureId && this.startPoint) {
      const shape = this.editor.getShape(this.measureId);
      if (shape && shape.type === "planner-measurement") {
        const dx = (shape.props as unknown).endX;
        const dy = (shape.props as unknown).endY;
        if (Math.hypot(dx, dy) < 4) {
          this.editor.deleteShape(this.measureId);
        }
      }
    }
    this.measureId = null;
    this.startPoint = null;
    this.snapManager = null;
    this.parent.transition("idle", {});
  }

  private cancel() {
    if (this.measureId) {
      this.editor.deleteShape(this.measureId);
    }
    this.measureId = null;
    this.startPoint = null;
    this.snapManager = null;
    this.editor.setCurrentTool("select");
  }
}
