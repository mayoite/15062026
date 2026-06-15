import type {
  Vec} from "@tldraw/editor";
import {
  StateNode,
  createShapeId,
  type TLPointerEventInfo,
  type TLShapeId,
  type TLStateNodeConstructor,
} from "@tldraw/editor";
import { canvasUnitsToMillimeters } from "@/features/planner/lib/calibrationScale";
import { RoomDetectionUtils } from "./RoomDetectionTool";
import type { PlannerRoomTLShape } from "../shapes/tldrawShapeTypes";
import { snapEditorPointOrGrid } from "./tldrawSnap";

/**
 * PlannerRoomTool - StateNode for room cycle detection and click-and-drag drawing.
 */
export class PlannerRoomTool extends StateNode {
  static override id = "planner-room";
  static override initial = "idle";
  static override isLockable = false;
  static override children(): TLStateNodeConstructor[] {
    return [PlannerRoomToolIdle, PlannerRoomToolDrawing];
  }
  override shapeType = "planner-room";
}

class PlannerRoomToolIdle extends StateNode {
  static override id = "idle";

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 });
  }

  override onCancel() {
    this.editor.setCurrentTool("select");
  }

  override onPointerDown(info: TLPointerEventInfo) {
    const utils = new RoomDetectionUtils(this.editor);
    const rooms = utils.detectAllRooms();

    if (rooms.length > 0) {
      // Cycle room(s) detected and created automatically by the utils.
      // After auto-detect magic fills the room, return to select mode.
      this.editor.setCurrentTool("select");
      return;
    }

    // If no enclosed walls were detected to fill, transition into manual drawing mode.
    this.parent.transition("drawing", info);
  }
}

class PlannerRoomToolDrawing extends StateNode {
  static override id = "drawing";

  private roomId: TLShapeId | null = null;
  private startPoint: Vec | null = null;

  override onEnter() {
    this.startPoint = snapEditorPointOrGrid(this.editor, this.editor.inputs.getCurrentPagePoint());
    const id = createShapeId();
    this.roomId = id;

    this.editor.createShape({
      id,
      type: "planner-room",
      x: this.startPoint.x,
      y: this.startPoint.y,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        points: [
          { x: 0, y: 0 },
          { x: 0.1, y: 0 },
          { x: 0.1, y: 0.1 },
          { x: 0, y: 0.1 },
        ],
        roomType: "office",
        areaSqm: 0,
        perimeterMm: 0,
        floorMaterial: "carpet",
        widthMm: 0.1,
        heightMm: 0.1,
        showArea: true,
        showPerimeter: false,
        fillOpacity: 0.3,
        label: "Room",
        showLabel: true,
        color: "var(--color-primary)",
        fillColor: "var(--surface-glass)",
        strokeColor: "var(--color-primary)",
        strokeWidth: 2,
      },
    });

    this.editor.select(id);
  }

  override onPointerMove() {
    if (!this.roomId || !this.startPoint) return;
    const currentPoint = snapEditorPointOrGrid(this.editor, this.editor.inputs.getCurrentPagePoint(), this.roomId);
    
    const dx = currentPoint.x - this.startPoint.x;
    const dy = currentPoint.y - this.startPoint.y;

    const widthUnits = Math.max(1, Math.abs(dx));
    const heightUnits = Math.max(1, Math.abs(dy));
    const widthMm = canvasUnitsToMillimeters(widthUnits);
    const heightMm = canvasUnitsToMillimeters(heightUnits);

    // Handle negative dragging (drawing up or to the left)
    const newX = dx < 0 ? currentPoint.x : this.startPoint.x;
    const newY = dy < 0 ? currentPoint.y : this.startPoint.y;

    this.editor.updateShape({
      id: this.roomId,
      type: "planner-room",
      x: newX,
      y: newY,
      props: {
        points: [
          { x: 0, y: 0 },
          { x: widthUnits, y: 0 },
          { x: widthUnits, y: heightUnits },
          { x: 0, y: heightUnits },
        ],
        widthMm: widthUnits,
        heightMm: heightUnits,
        areaSqm: (widthMm * heightMm) / 1000000,
        perimeterMm: Math.round((widthMm + heightMm) * 2),
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
    if (this.roomId && this.startPoint) {
      const shape = this.editor.getShape(this.roomId);
      if (shape && shape.type === "planner-room") {
        const roomShape = shape as PlannerRoomTLShape;
        const w = roomShape.props.widthMm;
        const h = roomShape.props.heightMm;
        
        // If the user just clicked without dragging, place a default 120x90 room
        if (w < 4 && h < 4) {
          const size = 120;
          const sizeMm = canvasUnitsToMillimeters(size);
          const depthMm = canvasUnitsToMillimeters(size * 0.75);
          this.editor.updateShape({
            id: this.roomId,
            type: "planner-room",
            x: this.startPoint.x,
            y: this.startPoint.y,
            props: {
               points: [
                { x: 0, y: 0 },
                { x: size, y: 0 },
                { x: size, y: size * 0.75 },
                { x: 0, y: size * 0.75 },
              ],
              widthMm: size,
              heightMm: size * 0.75,
              areaSqm: (sizeMm * depthMm) / 1000000,
              perimeterMm: Math.round((sizeMm + depthMm) * 2),
            }
          });
        }
      }
    }
    
    this.roomId = null;
    this.startPoint = null;
    this.editor.setCurrentTool("select");
  }

  private cancel() {
    if (this.roomId) {
      this.editor.deleteShape(this.roomId);
    }
    this.roomId = null;
    this.startPoint = null;
    this.editor.setCurrentTool("select");
  }
}
