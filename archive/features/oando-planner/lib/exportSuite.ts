export interface BoqExportItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  dimensions: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  areaSqm: number;
  imageUrl?: string;
  productSlug?: string;
  notes?: string;
}

export interface PlanExportMetadata {
  planName: string;
  clientName?: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
  roomWidthMm: number;
  roomDepthMm: number;
  roomAreaSqm: number;
  totalItems: number;
  unitSystem: "metric" | "imperial";
}

export function buildBoqFromShapes(
  shapes: Array<{
    id: string;
    name: string;
    category: string;
    widthMm: number;
    depthMm: number;
    heightMm?: number;
    imageUrl?: string;
    productSlug?: string;
  }>,
): BoqExportItem[] {
  const grouped = new Map<string, BoqExportItem>();

  for (const shape of shapes) {
    const key = `${shape.name}__${shape.category}__${shape.widthMm}x${shape.depthMm}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.quantity += 1;
    } else {
      grouped.set(key, {
        id: shape.id,
        name: shape.name,
        category: shape.category,
        quantity: 1,
        dimensions: `${shape.widthMm} x ${shape.depthMm} mm`,
        widthMm: shape.widthMm,
        depthMm: shape.depthMm,
        heightMm: shape.heightMm ?? 0,
        areaSqm: (shape.widthMm * shape.depthMm) / 1_000_000,
        imageUrl: shape.imageUrl,
        productSlug: shape.productSlug,
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const catCompare = a.category.localeCompare(b.category);
    if (catCompare !== 0) return catCompare;
    return a.name.localeCompare(b.name);
  });
}

export function exportBoqToCsv(
  items: BoqExportItem[],
  metadata: PlanExportMetadata,
): string {
  const lines: string[] = [];

  lines.push(`Plan Name,${escCsv(metadata.planName)}`);
  if (metadata.clientName) lines.push(`Client,${escCsv(metadata.clientName)}`);
  if (metadata.projectName) lines.push(`Project,${escCsv(metadata.projectName)}`);
  lines.push(`Room Size,"${metadata.roomWidthMm} x ${metadata.roomDepthMm} mm"`);
  lines.push(`Room Area,${metadata.roomAreaSqm.toFixed(1)} sqm`);
  lines.push(`Total Items,${metadata.totalItems}`);
  lines.push(`Generated,${metadata.createdAt}`);
  lines.push("");
  lines.push("Item,Category,Quantity,Dimensions,Width (mm),Depth (mm),Height (mm),Area (sqm),Product Slug");

  for (const item of items) {
    lines.push([
      escCsv(item.name),
      escCsv(item.category),
      item.quantity.toString(),
      escCsv(item.dimensions),
      item.widthMm.toString(),
      item.depthMm.toString(),
      item.heightMm.toString(),
      item.areaSqm.toFixed(3),
      escCsv(item.productSlug ?? ""),
    ].join(","));
  }

  return lines.join("\n");
}

export function exportBoqToJson(
  items: BoqExportItem[],
  metadata: PlanExportMetadata,
): string {
  return JSON.stringify(
    {
      type: "planner-boq-export",
      version: 1,
      metadata,
      items,
      summary: {
        totalLineItems: items.length,
        totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
        totalAreaSqm: items.reduce((sum, i) => sum + i.areaSqm * i.quantity, 0),
        categories: [...new Set(items.map((i) => i.category))],
      },
    },
    null,
    2,
  );
}

function escCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadBoqCsv(items: BoqExportItem[], metadata: PlanExportMetadata): void {
  const csv = exportBoqToCsv(items, metadata);
  const filename = `${slugify(metadata.planName)}-boq-${formatDateForFilename()}.csv`;
  downloadFile(csv, filename, "text/csv;charset=utf-8");
}

export function downloadBoqJson(items: BoqExportItem[], metadata: PlanExportMetadata): void {
  const json = exportBoqToJson(items, metadata);
  const filename = `${slugify(metadata.planName)}-boq-${formatDateForFilename()}.json`;
  downloadFile(json, filename, "application/json");
}

export function downloadPlannerSnapshot(svgContent: string, planName: string): void {
  const filename = `${slugify(planName)}-snapshot-${formatDateForFilename()}.svg`;
  downloadFile(svgContent, filename, "image/svg+xml");
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function formatDateForFilename(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
