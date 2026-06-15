import type { Editor } from "tldraw";
import { getSnapshot } from "tldraw";

import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { buildPlannerDocumentFromEditor } from "@/features/planner/document/plannerDocumentBridge";
import { buildSessionEnvelope } from "@/features/planner/persistence/plannerSession";
import { isShapeLayerHidden } from "@/features/planner/editor/layerVisibility";
import { plannerCanvasUnits } from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";
import { buildBoq, type PlacedItemLike } from "@/features/planner/shared/boq/buildBoq";
import type { CatalogItem } from "@/features/planner/shared/catalog/types";
import { getExportPreset, type ExportPresetId } from "@/features/planner/lib/exportPresets";

function catalogMap(): Map<string, CatalogItem> {
  const map = new Map<string, CatalogItem>();
  for (const item of PLANNER_CATALOG_ITEMS) {
    map.set(item.id, {
      id: item.id,
      name: item.name,
      category: item.category,
      dimensions: {
        widthMm: plannerCanvasUnits(item.widthMm) * 10,
        depthMm: plannerCanvasUnits(item.heightMm) * 10,
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
    const widthMm = typeof props.widthMm === "number" ? props.widthMm : 120;
    const heightMm = typeof props.heightMm === "number" ? props.heightMm : 80;
    const wCm = plannerCanvasUnits(widthMm);
    const dCm = plannerCanvasUnits(heightMm);
    return [{
      catalogId,
      name,
      category: "furniture",
      widthCm: wCm,
      depthCm: dCm,
      heightCm: 75,
    }];
  });
}

export function downloadPlannerJson(editor: Editor, fileName = "workspace-plan.json") {
  const plannerDoc = buildPlannerDocumentFromEditor(editor);
  const envelope = {
    ...buildSessionEnvelope(getSnapshot(editor.store)),
    document: plannerDoc,
  };
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPlannerBoqPdf(
  editor: Editor,
  projectName = "Workspace Plan",
  preset?: ExportPresetId,
) {
  const boq = buildBoq(shapesToPlacedItems(editor), catalogMap());
  const rows = boq.lineItems.map((item) => ({
    sku: item.sku,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    widthCm: item.dimensions.widthMm / 10,
    depthCm: item.dimensions.depthMm / 10,
    heightCm: item.dimensions.heightMm / 10,
    unitPriceInr: item.unitPriceInr,
    spec: `${item.dimensions.widthMm}×${item.dimensions.depthMm}×${item.dimensions.heightMm} mm`,
  }));

  const canvasEl = document.querySelector(".pw-canvas-surface") as HTMLElement | null;

  const { exportBoqToPdf } = await import("@/features/planner/shared/export/pdfExport");
  await exportBoqToPdf({
    layout: {
      projectName,
      clientName: "",
      roomWidthMm: 0,
      roomDepthMm: 0,
      unitSystem: "metric",
      generatedAt: new Date().toISOString(),
    },
    rows,
    canvasElement: canvasEl,
    preset: preset ? getExportPreset(preset) : undefined,
    fileName: `workspace-${projectName.toLowerCase().replace(/\s+/g, "-")}-boq.pdf`,
  });
}
