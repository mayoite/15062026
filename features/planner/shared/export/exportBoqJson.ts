import type { BoqSummary } from "../boq/types";
import type { ExportLayout } from "./types";

export type BoqJsonExport = {
  type: "oando-boq-export";
  version: 1;
  layout: ExportLayout;
  boq: BoqSummary;
};

export function exportBoqToJson(
  boq: BoqSummary,
  layout: ExportLayout,
): BoqJsonExport {
  return {
    type: "oando-boq-export",
    version: 1,
    layout,
    boq,
  };
}

export function downloadJson(data: BoqJsonExport, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
