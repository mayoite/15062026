import type { Vec} from "@tldraw/editor";
import { StateNode, createShapeId, type TLPointerEventInfo, type TLShapeId, type TLStateNodeConstructor } from "@tldraw/editor";
import type { PlannerZoneTLShape } from "../shapes/tldrawShapeTypes";

/**
 * PlannerZoneTool - StateNode for interactive zone overlay placement and sizing.
 */
export class PlannerZoneTool extends StateNode {
  static override id = "planner-zone";
  static override initial = "idle";
  static override isLockable = false;
  static override children(): TLStateNodeConstructor[] {
    return [PlannerZoneToolIdle, PlannerZoneToolDrawing];
  }
  override shapeType = "planner-zone";
}

class PlannerZoneToolIdle extends StateNode {
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

class PlannerZoneToolDrawing extends StateNode {
  static override id = "drawing";

  private zoneId: TLShapeId | null = null;
  private startPoint: Vec | null = null;

  override onEnter() {
    this.startPoint = this.editor.inputs.getCurrentPagePoint();
    const id = createShapeId();
    this.zoneId = id;

    this.editor.createShape({
      id,
      type: "planner-zone",
      x: this.startPoint.x,
      y: this.startPoint.y,
      rotation: 0,
      opacity: 0.6,
      isLocked: false,
      props: {
        points: [
          { x: 0, y: 0 },
          { x: 0.1, y: 0 },
          { x: 0.1, y: 0.1 },
          { x: 0, y: 0.1 },
        ],
        zoneType: "focus",
        areaSqm: 0,
        capacity: 0,
        currentOccupancy: 0,
        widthMm: 0.1,
        heightMm: 0.1,
        areaPerPerson: 10,
        maxCapacity: 0,
        showBoundary: true,
        showFill: true,
        showCapacity: true,
        showOccupancy: false,
        fillPattern: "solid",
        dashArray: [],
        zoneColor: "var(--color-ocean-boat-blue-500)",
        fillColor: "var(--surface-glass)",
        label: "Zone",
        showLabel: true,
        color: "var(--color-primary)",
        strokeColor: "var(--color-primary)",
        strokeWidth: 2,
      },
    });

    this.editor.select(id);
  }

  override onPointerMove() {
    if (!this.zoneId || !this.startPoint) return;
    const currentPoint = this.editor.inputs.getCurrentPagePoint();
    const dx = currentPoint.x - this.startPoint.x;
    const dy = currentPoint.y - this.startPoint.y;

    this.editor.updateShape({
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: this.zoneId!,
      type: "planner-zone",
      props: {
        points: [
          { x: 0, y: 0 },
          { x: dx, y: 0 },
          { x: dx, y: dy },
          { x: 0, y: dy },
        ],
        widthMm: Math.max(1, Math.abs(dx)),
        heightMm: Math.max(1, Math.abs(dy)),
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
    if (this.zoneId && this.startPoint) {
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const shape = this.editor.getShape(this.zoneId!);
      if (shape && shape.type === "planner-zone") {
        const zoneShape = shape as PlannerZoneTLShape;
        const w = zoneShape.props.widthMm;
        const h = zoneShape.props.heightMm;
        if (w < 4 || h < 4) {
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.editor.deleteShape(this.zoneId!);
        }
      }
    }
    this.zoneId = null;
    this.startPoint = null;
    this.parent.transition("idle", {});
  }

  private cancel() {
    if (this.zoneId) {
      this.editor.deleteShape(this.zoneId);
    }
    this.zoneId = null;
    this.startPoint = null;
    this.editor.setCurrentTool("select");
  }
}
