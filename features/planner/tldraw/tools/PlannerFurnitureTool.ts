import {
  StateNode,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  createShapeId,
  type TLStateNodeConstructor,
} from "@tldraw/editor";
import { FurniturePlacementUtils } from "./FurniturePlacementTool";
import { usePlannerStore } from "@/features/planner/store/plannerStore";

/**
 * PlannerFurnitureTool — StateNode for placing furniture on canvas.
 *
 * When a catalog item is selected in the FurnitureCatalog panel, the planner
 * store triggers placement. This tool handles the preview and wall-snapping
 * placement workflow.
 */
export class PlannerFurnitureTool extends StateNode {
  static override id = "planner-furniture";
  static override initial = "idle";
  static override isLockable = false;
  static override children(): TLStateNodeConstructor[] {
    return [PlannerFurnitureToolIdle];
  }
  override shapeType = "planner-furniture";
}

class PlannerFurnitureToolIdle extends StateNode {
  static override id = "idle";

  private placementUtils?: FurniturePlacementUtils;

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 });
    this.placementUtils = new FurniturePlacementUtils(this.editor);
    
    // Attempt an immediate preview start if we already have an ID and pointer coordinates
    const activeCatalogId = usePlannerStore.getState().activeCatalogId;
    if (activeCatalogId) {
      const p = this.editor.inputs.getCurrentPagePoint();
      this.placementUtils.startPlacement(activeCatalogId, p);
    }
  }

  override onCancel() {
    this.placementUtils?.cancelPlacement();
    usePlannerStore.getState().setActiveCatalogId(null);
    this.editor.setCurrentTool("select");
  }

  override onPointerMove() {
    const activeCatalogId = usePlannerStore.getState().activeCatalogId;
    if (!activeCatalogId || !this.placementUtils) return;
    
    const p = this.editor.inputs.getCurrentPagePoint();
    
    if (!this.placementUtils.isCurrentlyPlacing()) {
      this.placementUtils.startPlacement(activeCatalogId, p);
    } else {
      this.placementUtils.updatePlacement(p);
    }
  }

  override onPointerDown() {
    const activeCatalogId = usePlannerStore.getState().activeCatalogId;
    if (!activeCatalogId || !this.placementUtils) return;
    
    if (this.placementUtils.isCurrentlyPlacing()) {
      this.placementUtils.finishPlacement();
    } else {
      // Fallback if they click instantly before the move event fires
      const p = this.editor.inputs.getCurrentPagePoint();
      this.placementUtils.startPlacement(activeCatalogId, p);
      this.placementUtils.finishPlacement();
    }

    usePlannerStore.getState().setActiveCatalogId(null);
    this.editor.setCurrentTool("select");
  }
}

