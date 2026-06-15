import type { BOQData } from "./boqGenerator";


/**
 * Export BOQ as structured JSON with categories, items, and totals.
 */
export function exportBOQJSON(projectName: string, boq: BOQData): void {
  const structured = {
    project: projectName,
    generatedAt: new Date().toISOString(),
    summary: {
      totalFurnitureItems: boq.totalFurnitureItems,
      totalUniqueItems: boq.totalUniqueItems,
      grandTotal: boq.grandTotal,
      doors: boq.doors,
      windows: boq.windows,
      walls: boq.walls,
      rooms: boq.rooms,
    },
    categories: boq.categories.map((cat) => ({
      category: cat.category,
      totalItems: cat.totalItems,
      categoryTotal: cat.categoryTotal,
      items: cat.items.map((item) => ({
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        dimensions: {
          widthMm: item.widthMm,
          depthMm: item.depthMm,
          heightMm: item.heightMm,
        },
        unitPriceInr: item.unitPriceInr,
        lineTotal: item.lineTotal,
      })),
    })),
  };

  const jsonStr = JSON.stringify(structured, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().split("T")[0];
  a.download = `${projectName.replace(/\s+/g, "_")}_BOQ_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
