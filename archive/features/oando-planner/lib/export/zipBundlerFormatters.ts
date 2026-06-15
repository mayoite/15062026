import type { PlannerDocument } from "../documentBridge";
import { generateBOQ } from "./boqGenerator";

export function generateBOQCSVContent(projectName: string, plan: PlannerDocument): string {
  const furniture = plan.workspace.furniture.map((f) => ({
    id: f.id,
    name: f.productName || f.furnitureType || "Furniture",
    catalogId: f.catalogId,
    x: f.x,
    y: f.y,
    width: f.widthMm / 10,
    height: f.heightMm / 10,
    rotation: f.rotation,
    color: f.color || "var(--border-soft)",
    shape: "rect",
    zIndex: 0,
  }));

  const doors = plan.workspace.doors.map((d) => ({
    id: d.id,
    x: d.x,
    y: d.y,
    width: d.widthMm / 10,
    rotation: d.rotation,
    swing: (d.swingDirection === "left" ? "left" : d.swingDirection === "both" ? "double" : "right") as "left" | "right" | "double",
    openAngle: d.swingAngle || 90,
  }));

  const windows = plan.workspace.windows.map((w) => ({
    id: w.id,
    x: w.x,
    y: w.y,
    width: w.widthMm / 10,
    rotation: w.rotation,
    style: (w.windowType === "sliding" ? "sliding" : w.windowType === "double" ? "double" : "single") as "single" | "double" | "sliding",
  }));

  const walls = plan.workspace.walls.map((w) => ({
    id: w.id,
    start: { x: w.x, y: w.y },
    end: { x: w.x + w.lengthMm / 10, y: w.y },
    thickness: w.thickness,
  }));

  const rooms = plan.workspace.rooms.map((r) => ({
    id: r.id,
    name: r.label || r.roomType || "Room",
    points: r.points,
    color: r.fillColor || r.color || "var(--surface-glass)",
  }));

  const boq = generateBOQ(
    furniture as Parameters<typeof generateBOQ>[0],
    doors as Parameters<typeof generateBOQ>[1],
    windows as Parameters<typeof generateBOQ>[2],
    walls as Parameters<typeof generateBOQ>[3],
    rooms as Parameters<typeof generateBOQ>[4]
  );

  const rows: string[] = [];
  rows.push(`"OOFP Planner - Bill of Quantities"`);
  rows.push(`"Project: ${projectName}"`);
  rows.push(`"Generated: ${new Date().toLocaleDateString()}"`);
  rows.push("");
  rows.push(
    `"Product Name","SKU","Category","Qty","Width(mm)","Depth(mm)","Height(mm)","Unit Price (₹)","Line Total (₹)"`
  );

  for (const cat of boq.categories) {
    for (const item of cat.items) {
      const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
      rows.push(
        [
          esc(item.name),
          esc(item.sku),
          esc(cat.category),
          String(item.quantity),
          String(item.widthMm),
          String(item.depthMm),
          String(item.heightMm),
          String(item.unitPriceInr),
          String(item.lineTotal),
        ].join(",")
      );
    }
  }

  rows.push("");
  rows.push(`"Total Furniture Items","${boq.totalFurnitureItems}"`);
  rows.push(`"Total Unique Types","${boq.totalUniqueItems}"`);
  rows.push(`"Grand Total (₹)","${boq.grandTotal}"`);
  rows.push(`"Doors","${boq.doors}"`);
  rows.push(`"Windows","${boq.windows}"`);
  rows.push(`"Walls","${boq.walls}"`);
  rows.push(`"Rooms","${boq.rooms}"`);

  return rows.join("\n");
}

export function generatePlanJSON(plan: PlannerDocument): string {
  return JSON.stringify(plan, null, 2);
}
