import type { BoqSummary } from "../boq/types";
import type { ExportLayout } from "./types";

function escapeField(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function exportBoqToCsv(boq: BoqSummary, layout: ExportLayout): string {
  const lines: string[] = [];

  lines.push(`Project,${escapeField(layout.projectName)}`);
  if (layout.clientName) lines.push(`Client,${escapeField(layout.clientName)}`);
  if (layout.preparedBy) lines.push(`Prepared By,${escapeField(layout.preparedBy)}`);
  lines.push(`Room,${layout.roomWidthMm}mm x ${layout.roomDepthMm}mm`);
  lines.push(`Generated,${layout.generatedAt}`);
  lines.push("");

  lines.push("Category,Item,Qty,Width (mm),Depth (mm),Height (mm)");

  for (const li of boq.lineItems) {
    lines.push(
      [
        escapeField(li.category),
        escapeField(li.name),
        li.quantity,
        li.dimensions.widthMm,
        li.dimensions.depthMm,
        li.dimensions.heightMm,
      ].join(","),
    );
  }

  lines.push("");
  lines.push(`Total Items,${boq.totalItems}`);

  return lines.join("\n");
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
