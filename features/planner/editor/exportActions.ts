import type { Editor, TLShapeId } from "tldraw";
import { getSnapshot } from "tldraw";

import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { buildPlannerDocumentFromEditor } from "@/features/planner/document/plannerDocumentBridge";
import { isShapeLayerHidden } from "@/features/planner/editor/layerVisibility";
import { buildSessionEnvelope } from "@/features/planner/persistence/plannerSession";
import { getExportPreset, type ExportPresetId } from "@/features/planner/lib/exportPresets";
import {
  catalogMmToCanvasCm,
  normalizeCatalogMm,
  plannerCanvasUnits,
  shapePropsToCanvasCm,
} from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";
import { buildBoq, type PlacedItemLike } from "@/features/planner/shared/boq/buildBoq";
import type { PdfBoqRow } from "@/features/planner/shared/export/pdfExport";
import type { CatalogItem } from "@/features/planner/shared/catalog/types";
import { finalizePlannerExportSvg } from "@/features/planner/lib/plannerSvgExportColors";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

const MAX_PNG_EXPORT_PIXELS = 16_000_000;

export const VECTOR_EXPORT_OPTIONS = {
  background: false,
  padding: 32,
  scale: 1,
  darkMode: false,
} as const;

export class PlannerExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlannerExportError";
  }
}

export type PlannerExportMeta = {
  canonicalUnit: "mm";
  exportedAt: string;
  scope: "selection" | "page";
  shapeCount: number;
  room: { widthMm: number; depthMm: number } | null;
  furniture: Array<{
    catalogId: string;
    name: string;
    widthMm: number;
    depthMm: number;
    heightMm: number;
    spec: string;
  }>;
};

function catalogMap(): Map<string, CatalogItem> {
  const map = new Map<string, CatalogItem>();
  for (const item of PLANNER_CATALOG_ITEMS) {
    map.set(item.id, {
      id: item.id,
      name: item.name,
      category: item.category,
      dimensions: {
        widthMm: normalizeCatalogMm(item.widthMm, item.heightMm),
        depthMm: normalizeCatalogMm(item.heightMm, item.widthMm),
        heightMm: 750,
      },
    });
  }
  return map;
}

function shapesToPlacedItems(editor: Editor): PlacedItemLike[] {
  return editor.getCurrentPageShapes().flatMap((shape) => {
    if (shape.type !== "planner-furniture" || isShapeLayerHidden(shape)) return [];
    const props = shape.props as unknown as Record<string, unknown>;
    const catalogId = typeof props.catalogId === "string" ? props.catalogId : String(shape.id);
    const name =
      (typeof props.productName === "string" && props.productName) ||
      (typeof props.label === "string" && props.label) ||
      "Furniture";
    const widthProp = typeof props.widthMm === "number" ? props.widthMm : 120;
    const depthProp = typeof props.heightMm === "number" ? props.heightMm : 80;
    const { widthCm, depthCm } = shapePropsToCanvasCm(widthProp, depthProp);
    return [{
      catalogId,
      name,
      category: "furniture",
      widthCm,
      depthCm,
      heightCm: 75,
    }];
  });
}

function placedItemToExportFurniture(item: PlacedItemLike): PlannerExportMeta["furniture"][number] {
  const widthMm = normalizeCatalogMm(item.widthCm ?? 60, item.depthCm);
  const depthMm = normalizeCatalogMm(item.depthCm ?? 60, item.widthCm);
  const heightMm = normalizeCatalogMm(item.heightCm ?? 75);
  return {
    catalogId: item.catalogId,
    name: item.name,
    widthMm,
    depthMm,
    heightMm,
    spec: `${widthMm}×${depthMm}×${heightMm} mm`,
  };
}

function resolveExportRoomMm(editor: Editor): { widthMm: number; depthMm: number } {
  const rooms = editor
    .getCurrentPageShapes()
    .filter((shape) => shape.type === "planner-room" && !isShapeLayerHidden(shape));

  if (rooms.length === 0) return { widthMm: 0, depthMm: 0 };

  const props = rooms[0].props as Record<string, unknown>;
  const widthCm = plannerCanvasUnits(
    typeof props.widthMm === "number" ? props.widthMm : 0,
    typeof props.heightMm === "number" ? props.heightMm : 0,
  );
  const depthCm = plannerCanvasUnits(
    typeof props.heightMm === "number" ? props.heightMm : 0,
    typeof props.widthMm === "number" ? props.widthMm : 0,
  );

  return {
    widthMm: normalizeCatalogMm(widthCm, depthCm),
    depthMm: normalizeCatalogMm(depthCm, widthCm),
  };
}

function buildPdfRows(editor: Editor): PdfBoqRow[] {
  const boq = buildBoq(shapesToPlacedItems(editor), catalogMap());
  return boq.lineItems.map((item) => ({
    sku: item.sku,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    widthCm: catalogMmToCanvasCm(item.dimensions.widthMm, item.dimensions.depthMm),
    depthCm: catalogMmToCanvasCm(item.dimensions.depthMm, item.dimensions.widthMm),
    heightCm: catalogMmToCanvasCm(item.dimensions.heightMm),
    unitPriceInr: item.unitPriceInr,
    spec: `${item.dimensions.widthMm}×${item.dimensions.depthMm}×${item.dimensions.heightMm} mm`,
  }));
}

/** Selected shapes when any are selected; otherwise the full current page. */
export function getExportShapeIds(editor: Editor): TLShapeId[] {
  const selectedIds = editor.getSelectedShapeIds();
  if (selectedIds.length > 0) return selectedIds;
  return [...editor.getCurrentPageShapeIds()];
}

/** Vector export skips layer-hidden shapes (same rule as BOQ furniture rows). */
export function getVectorExportShapeIds(editor: Editor): TLShapeId[] {
  return getExportShapeIds(editor).filter((id) => {
    const shape = editor.getShape(id);
    return shape && !isShapeLayerHidden(shape);
  });
}

export function getExportScope(editor: Editor): PlannerExportMeta["scope"] {
  return editor.getSelectedShapeIds().length > 0 ? "selection" : "page";
}

export function describeExportScope(editor: Editor): string {
  const ids = getExportShapeIds(editor);
  const scope = getExportScope(editor);
  if (ids.length === 0) return "No shapes on the canvas yet.";
  if (scope === "selection") {
    return `Exporting ${ids.length} selected shape${ids.length === 1 ? "" : "s"}.`;
  }
  return `Exporting the full plan (${ids.length} shape${ids.length === 1 ? "" : "s"}).`;
}

/** Cap PNG rasterization so very large plans stay within browser canvas limits. */
export function getSafePngPixelRatio(width: number, height: number): number {
  const area = Math.max(1, width) * Math.max(1, height);
  const maxRatio = Math.sqrt(MAX_PNG_EXPORT_PIXELS / area);
  return Math.max(0.25, Math.min(2, maxRatio));
}

export function buildExportMeta(editor: Editor): PlannerExportMeta {
  const room = resolveExportRoomMm(editor);
  const ids = getExportShapeIds(editor);

  return {
    canonicalUnit: "mm",
    exportedAt: new Date().toISOString(),
    scope: getExportScope(editor),
    shapeCount: ids.length,
    room: room.widthMm > 0 && room.depthMm > 0 ? room : null,
    furniture: shapesToPlacedItems(editor).map(placedItemToExportFurniture),
  };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPlannerJson(editor: Editor, fileName = "workspace-plan.json") {
  const plannerDoc = buildPlannerDocumentFromEditor(editor);
  const envelope = {
    ...buildSessionEnvelope(getSnapshot(editor.store)),
    document: plannerDoc,
    exportMeta: buildExportMeta(editor),
  };
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
  triggerDownload(blob, fileName);
}

export async function downloadPlannerBoqPdf(
  editor: Editor,
  projectName = "Workspace Plan",
  preset?: ExportPresetId,
) {
  const rows = buildPdfRows(editor);
  const room = resolveExportRoomMm(editor);
  const unitSystem = usePlannerWorkspaceStore.getState().unitSystem;
  const canvasEl = document.querySelector(".pw-canvas-surface") as HTMLElement | null;

  const { exportBoqToPdf } = await import("@/features/planner/shared/export/pdfExport");
  await exportBoqToPdf({
    layout: {
      projectName,
      clientName: "",
      roomWidthMm: room.widthMm,
      roomDepthMm: room.depthMm,
      unitSystem: unitSystem === "imperial" ? "imperial" : "metric",
      generatedAt: new Date().toISOString(),
    },
    rows,
    canvasElement: canvasEl,
    preset: preset ? getExportPreset(preset) : undefined,
    fileName: `workspace-${projectName.toLowerCase().replace(/\s+/g, "-")}-boq.pdf`,
  });
}

export async function downloadPlannerSvg(
  editor: Editor,
  shapeIds: TLShapeId[] = getVectorExportShapeIds(editor),
) {
  if (shapeIds.length === 0) {
    throw new PlannerExportError("Add shapes to the canvas before exporting.");
  }

  const svgExport = await editor.getSvgString(shapeIds, VECTOR_EXPORT_OPTIONS);
  if (!svgExport?.svg) {
    throw new PlannerExportError("SVG export failed. Try again or reload the canvas.");
  }

  const svg = finalizePlannerExportSvg(svgExport.svg);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, "workspace-plan.svg");
}

export async function downloadPlannerPng(
  editor: Editor,
  shapeIds: TLShapeId[] = getVectorExportShapeIds(editor),
) {
  if (shapeIds.length === 0) {
    throw new PlannerExportError("Add shapes to the canvas before exporting.");
  }

  const svgExport = await editor.getSvgString(shapeIds, VECTOR_EXPORT_OPTIONS);
  if (!svgExport) {
    throw new PlannerExportError("PNG export failed. Try again or reload the canvas.");
  }

  const pixelRatio = getSafePngPixelRatio(svgExport.width, svgExport.height);
  const imageExport = await editor.toImage(shapeIds, {
    format: "png",
    ...VECTOR_EXPORT_OPTIONS,
    pixelRatio,
  });

  if (!imageExport?.blob) {
    throw new PlannerExportError("PNG export failed. The plan may be too large to rasterize.");
  }

  triggerDownload(imageExport.blob, "workspace-plan.png");
}