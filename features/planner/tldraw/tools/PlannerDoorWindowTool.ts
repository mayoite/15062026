import { StateNode, type TLPointerEventInfo, type TLStateNodeConstructor } from "@tldraw/editor";
import { DoorWindowPlacementUtils } from "./DoorWindowPlacementTool";
import { usePlannerStore } from "@/features/planner/store/plannerStore";

/**
 * PlannerDoorWindowTool - StateNode for interactive door and window placement.
 */
export class PlannerDoorWindowTool extends StateNode {
  static override id = "planner-door-window";
  static override initial = "idle";
  static override isLockable = false;
  static override children(): TLStateNodeConstructor[] {
    return [PlannerDoorWindowToolIdle, PlannerDoorWindowToolPlacing];
  }
}

class PlannerDoorWindowToolIdle extends StateNode {
  static override id = "idle";

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 });
  }

  override onCancel() {
    this.editor.setCurrentTool("select");
  }

  override onPointerDown(info: TLPointerEventInfo) {
    this.parent.transition("placing", info);
  }
}

class PlannerDoorWindowToolPlacing extends StateNode {
  static override id = "placing";
  private utils!: DoorWindowPlacementUtils;

  override onEnter() {
    this.utils = new DoorWindowPlacementUtils(this.editor);
    const p = this.editor.inputs.getCurrentPagePoint();

    const activeTool = usePlannerStore.getState().tool;
    const configKey = activeTool === "window" ? "window-single-600" : "door-single-900";
    this.utils.startPlacement(configKey, p);
  }

  override onPointerMove() {
    const p = this.editor.inputs.getCurrentPagePoint();
    this.utils.updatePlacement(p);
  }

  override onPointerUp() {
    if (this.utils.isPlacementBlocked()) return;
    this.utils.finishPlacement();
    this.parent.transition("idle", {});
  }

  override onCancel() {
    this.utils.cancelPlacement();
    this.editor.setCurrentTool("select");
  }
}

