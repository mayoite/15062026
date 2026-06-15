import type { DragEvent } from "react";
import type { Editor } from "tldraw";

import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { plannerCanvasUnits } from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";

/** Canvas footprint (cm) used when placing a catalog item. */
export function catalogFootprintCanvasCm(item: CatalogItem): { w: number; h: number } {
  return {
    w: Math.max(1, plannerCanvasUnits(item.widthMm, item.heightMm)),
    h: Math.max(1, plannerCanvasUnits(item.heightMm, item.widthMm)),
  };
}

/** Screen-pixel footprint at the current editor zoom — for drag ghost sizing. */
export function catalogDropScreenFootprint(
  editor: Editor,
  item: CatalogItem,
): { w: number; h: number } {
  const { w, h } = catalogFootprintCanvasCm(item);
  const origin = editor.pageToScreen({ x: 0, y: 0 });
  const corner = editor.pageToScreen({ x: w, y: h });
  return {
    w: Math.max(28, Math.abs(corner.x - origin.x)),
    h: Math.max(20, Math.abs(corner.y - origin.y)),
  };
}

/** Page point for top-left corner so the item footprint is centered on the cursor. */
export function centeredCatalogDropPagePoint(
  editor: Editor,
  clientX: number,
  clientY: number,
  item: CatalogItem,
): { x: number; y: number } {
  const page = editor.screenToPage({ x: clientX, y: clientY });
  const { w, h } = catalogFootprintCanvasCm(item);
  return { x: page.x - w / 2, y: page.y - h / 2 };
}

let transparentDragImage: HTMLCanvasElement | null = null;

function getTransparentDragImage(): HTMLCanvasElement {
  if (!transparentDragImage && typeof document !== "undefined") {
    transparentDragImage = document.createElement("canvas");
    transparentDragImage.width = 1;
    transparentDragImage.height = 1;
  }
  return transparentDragImage ?? document.createElement("canvas");
}

/** Hide the browser's default drag preview so the custom ghost is the only cue. */
export function hideNativeDragPreview(event: DragEvent): void {
  event.dataTransfer.setDragImage(getTransparentDragImage(), 0, 0);
}