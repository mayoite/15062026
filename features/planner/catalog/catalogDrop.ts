import type { DragEvent } from "react";

import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { plannerCanvasUnits } from "@/features/planner/catalog/catalogBlockBridge";

/** Canvas footprint (cm) used when placing a catalog item. */
export function catalogFootprintCanvasCm(item: CatalogItem): { w: number; h: number } {
  return {
    w: Math.max(1, plannerCanvasUnits(item.widthMm, item.heightMm)),
    h: Math.max(1, plannerCanvasUnits(item.heightMm, item.widthMm)),
  };
}

/** Screen-pixel footprint — fabric-era fixed ghost size. */
export function catalogDropScreenFootprint(
  _editor: null,
  item: CatalogItem,
): { w: number; h: number } {
  const { w, h } = catalogFootprintCanvasCm(item);
  return { w: Math.max(28, w * 0.5), h: Math.max(20, h * 0.5) };
}

/** Page point for catalog drop — fabric uses screen coords via placement helper. */
export function centeredCatalogDropPagePoint(
  _editor: null,
  clientX: number,
  clientY: number,
  item: CatalogItem,
): { x: number; y: number } {
  const { w, h } = catalogFootprintCanvasCm(item);
  return { x: clientX - w / 2, y: clientY - h / 2 };
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