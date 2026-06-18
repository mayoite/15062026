import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { getPlannerFabricRuntime } from "@/features/planner/canvas-fabric";
import { resolveRoomMmFromFabricSnapshot } from "@/features/planner/canvas-fabric/fabricSceneUtils";
import { buildPlannerDocumentFromEditor } from "@/features/planner/document/plannerDocumentBridge";
import { buildSessionEnvelope } from "@/features/planner/persistence/plannerSession";
import { getExportPreset, type ExportPresetId } from "@/features/planner/lib/exportPresets";
import {
  catalogMmToCanvasCm,
  normalizeCatalogMm,
} from "@/features/planner/catalog/catalogBlockBridge";
import { buildBoq, type PlacedItemLike } from "@/features/planner/shared/boq/buildBoq";
import type { PdfBoqRow } from "@/features/planner/shared/export/pdfExport";
import type { CatalogItem } from "@/features/planner/shared/catalog/types";
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

function readFabricSnapshot(): unknown {
  const serialized = getPlannerFabricRuntime()?.exportDraft() ?? null;
  if (!serialized) return null;
  try {
    return JSON.parse(serialized);
  } catch {
    return null;
  }
}

function shapesToPlacedItems(): PlacedItemLike[] {
  const snapshot = readFabricSnapshot() as { objects?: Array<Record<string, unknown>> } | null;
  if (!snapshot?.objects?.length) return [];
  return snapshot.objects.map((obj, index) => ({
    catalogId: String(obj.name ?? `fabric-item-${index}`),
    name: String(obj.name ?? "Furniture"),
    category: "furniture",
    widthCm: catalogMmToCanvasCm((Number(obj.width) || 60) * 10),
    depthCm: catalogMmToCanvasCm((Number(obj.height) || 60) * 10),
    heightCm: 75,
  }));
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

function resolveExportRoomMm(): { widthMm: number; depthMm: number } {
  const serialized = getPlannerFabricRuntime()?.exportDraft() ?? null;
  return resolveRoomMmFromFabricSnapshot(serialized);
}

function buildPdfRows(): PdfBoqRow[] {
  const boq = buildBoq(shapesToPlacedItems(), catalogMap());
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

export function getExportShapeIds(_editor?: null): string[] {
  const snapshot = readFabricSnapshot() as { objects?: unknown[] } | null;
  return (snapshot?.objects ?? []).map((_, index) => `fabric-${index}`);
}

export function getVectorExportShapeIds(_editor?: null): string[] {
  return getExportShapeIds(null);
}

export function getExportScope(_editor?: null): PlannerExportMeta["scope"] {
  return "page";
}

export function describeExportScope(_editor?: null): string {
  const ids = getExportShapeIds(null);
  if (ids.length === 0) return "No shapes on the canvas yet.";
  return `Exporting the full plan (${ids.length} shape${ids.length === 1 ? "" : "s"}).`;
}

export function getSafePngPixelRatio(width: number, height: number): number {
  const area = Math.max(1, width) * Math.max(1, height);
  const maxRatio = Math.sqrt(MAX_PNG_EXPORT_PIXELS / area);
  return Math.max(0.25, Math.min(2, maxRatio));
}

export function buildExportMeta(_editor?: null): PlannerExportMeta {
  const room = resolveExportRoomMm();
  const ids = getExportShapeIds(null);

  return {
    canonicalUnit: "mm",
    exportedAt: new Date().toISOString(),
    scope: getExportScope(null),
    shapeCount: ids.length,
    room: room.widthMm > 0 && room.depthMm > 0 ? room : null,
    furniture: shapesToPlacedItems().map(placedItemToExportFurniture),
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

export function downloadPlannerJson(_editor?: null, fileName = "workspace-plan.json") {
  const plannerDoc = buildPlannerDocumentFromEditor(null);
  const envelope = {
    ...buildSessionEnvelope(readFabricSnapshot()),
    document: plannerDoc,
    exportMeta: buildExportMeta(null),
  };
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
  triggerDownload(blob, fileName);
}

export async function downloadPlannerBoqPdf(
  _editor?: null,
  projectName = "Workspace Plan",
  preset?: ExportPresetId,
) {
  const rows = buildPdfRows();
  const room = resolveExportRoomMm();
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

export async function downloadPlannerSvg(_editor?: null, _shapeIds?: string[]) {
  const svg = getPlannerFabricRuntime()?.exportSvg() ?? null;
  if (!svg?.trim()) {
    throw new PlannerExportError("SVG export requires a room shell on the canvas.");
  }
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, "workspace-plan.svg");
}

export async function downloadPlannerPng(_editor?: null, _shapeIds?: string[]) {
  const blob = await getPlannerFabricRuntime()?.exportPngBlob() ?? null;
  if (!blob) {
    throw new PlannerExportError("PNG export requires a room shell on the canvas.");
  }
  triggerDownload(blob, "workspace-plan.png");
}
