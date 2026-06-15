import jsPDF from "jspdf";
import type { Wall, Room, DoorItem, WindowItem, Point, FurnitureItem } from "@/features/oando-planner/data/plannerStore";
import { generateBOQ } from "./boqGenerator";

const EXPORT_BRAND = "One&Only Space Planner";

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function polygonArea(pts: Point[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

function polygonCentroid(pts: Point[]): Point {
  const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  return { x: cx, y: cy };
}

function drawTitleBlock(
  pdf: jsPDF,
  projectName: string,
  pageW: number,
  pageH: number,
  scale: string,
  pageNum: number,
  totalPages: number
) {
  const margin = 10;
  const blockH = 14;
  const blockY = pageH - margin - blockH;

  // Title block border
  pdf.setDrawColor(80, 80, 80);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, blockY, pageW - margin * 2, blockH);

  // Dividers
  pdf.line(margin + 80, blockY, margin + 80, blockY + blockH);
  pdf.line(margin + 160, blockY, margin + 160, blockY + blockH);
  pdf.line(pageW - margin - 50, blockY, pageW - margin - 50, blockY + blockH);

  pdf.setFontSize(7);
  pdf.setTextColor(50, 50, 50);
  pdf.setFont("helvetica", "bold");
  pdf.text(EXPORT_BRAND, margin + 4, blockY + 5);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.text(projectName, margin + 4, blockY + 10);

  pdf.text(`Scale: ${scale}`, margin + 84, blockY + 5);
  pdf.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, margin + 84, blockY + 10);

  pdf.text("Drawing: Floor Plan Blueprint", margin + 164, blockY + 5);
  pdf.text("Units: mm / m", margin + 164, blockY + 10);

  pdf.text(`Page ${pageNum} of ${totalPages}`, pageW - margin - 46, blockY + 7);
}

function drawNorthArrow(pdf: jsPDF, x: number, y: number) {
  const size = 8;

  // Arrow body
  pdf.setDrawColor(80, 80, 80);
  pdf.setFillColor(80, 80, 80);
  pdf.setLineWidth(0.4);

  // Triangle pointing up
  const points: [number, number][] = [
    [x, y - size],
    [x - size * 0.3, y + size * 0.3],
    [x + size * 0.3, y + size * 0.3],
  ];
  pdf.triangle(
    points[0][0], points[0][1],
    points[1][0], points[1][1],
    points[2][0], points[2][1],
    "F"
  );

  // "N" label
  pdf.setFontSize(6);
  pdf.setTextColor(80, 80, 80);
  pdf.setFont("helvetica", "bold");
  pdf.text("N", x, y - size - 2, { align: "center" });
}

function drawLegend(pdf: jsPDF, x: number, y: number) {
  pdf.setFontSize(6);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(50, 50, 50);
  pdf.text("LEGEND", x, y);

  const items = [
    { label: "Wall", color: [60, 60, 60] },
    { label: "Door", color: [139, 90, 43] },
    { label: "Window", color: [100, 160, 220] },
    { label: "Furniture", color: [120, 120, 120] },
  ];

  pdf.setFont("helvetica", "normal");
  items.forEach((item, i) => {
    const iy = y + 5 + i * 5;
    pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
    pdf.rect(x, iy - 2, 8, 2, "F");
    pdf.setTextColor(50, 50, 50);
    pdf.text(item.label, x + 10, iy);
  });
}

function drawFloorPlanPage(
  pdf: jsPDF,
  projectName: string,
  walls: Wall[],
  rooms: Room[],
  furniture: FurnitureItem[],
  doors: DoorItem[],
  windows: WindowItem[],
  pageNum: number,
  totalPages: number
) {
  const pageW = 297;
  const pageH = 210;
  const margin = 12;
  const titleBlockH = 16;

  // Drawing border
  pdf.setDrawColor(60, 60, 60);
  pdf.setLineWidth(0.8);
  pdf.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);

  // Inner border
  pdf.setLineWidth(0.3);
  pdf.rect(margin + 2, margin + 2, pageW - margin * 2 - 4, pageH - margin * 2 - 4);

  const drawAreaX = margin + 5;
  const drawAreaY = margin + 5;
  const drawAreaW = pageW - margin * 2 - 10;
  const drawAreaH = pageH - margin * 2 - titleBlockH - 10;

  // Gather all coordinates
  const allX: number[] = [];
  const allY: number[] = [];
  walls.forEach((w) => {
    allX.push(w.start.x, w.end.x);
    allY.push(w.start.y, w.end.y);
  });
  rooms.forEach((r) => r.points.forEach((p) => { allX.push(p.x); allY.push(p.y); }));
  furniture.forEach((f) => { allX.push(f.x); allY.push(f.y); });
  doors.forEach((d) => { allX.push(d.x); allY.push(d.y); });
  windows.forEach((w) => { allX.push(w.x); allY.push(w.y); });

  if (allX.length === 0) {
    pdf.setFontSize(12);
    pdf.setTextColor(120, 120, 120);
    pdf.text("No floor plan data to display", pageW / 2, pageH / 2, { align: "center" });
    drawTitleBlock(pdf, projectName, pageW, pageH, "N/A", pageNum, totalPages);
    return;
  }

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const planW = maxX - minX || 1;
  const planH = maxY - minY || 1;

  const padFactor = 0.1;
  const padX = planW * padFactor;
  const padY = planH * padFactor;

  const scaleX = drawAreaW / (planW + padX * 2);
  const scaleY = drawAreaH / (planH + padY * 2);
  const scale = Math.min(scaleX, scaleY);

  const offsetX = drawAreaX + (drawAreaW - (planW + padX * 2) * scale) / 2 + padX * scale;
  const offsetY = drawAreaY + (drawAreaH - (planH + padY * 2) * scale) / 2 + padY * scale;

  const tx = (x: number) => offsetX + (x - minX) * scale;
  const ty = (y: number) => offsetY + (y - minY) * scale;

  // Compute scale notation (approximate)
  const realWidthMm = planW * 10; // planner units → mm (1 unit = 10mm)
  const drawnWidthMm = drawAreaW;
  const scaleRatio = Math.round(realWidthMm / drawnWidthMm);
  const scaleNotation = `1:${scaleRatio > 0 ? scaleRatio : 50}`;

  // Draw rooms (filled)
  rooms.forEach((room) => {
    if (room.points.length < 3) return;
    const rgbaMatch = room.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const r = rgbaMatch ? parseInt(rgbaMatch[1]) : 200;
    const g = rgbaMatch ? parseInt(rgbaMatch[2]) : 220;
    const b = rgbaMatch ? parseInt(rgbaMatch[3]) : 240;

    pdf.setFillColor(r, g, b);
    const pts = room.points.map((p) => [tx(p.x), ty(p.y)] as [number, number]);
    const xArr = pts.map((p) => p[0]);
    const yArr = pts.map((p) => p[1]);
    pdf.rect(
      Math.min(...xArr),
      Math.min(...yArr),
      Math.max(...xArr) - Math.min(...xArr),
      Math.max(...yArr) - Math.min(...yArr),
      "F"
    );

    // Room outline
    pdf.setDrawColor(r, g, b);
    pdf.setLineWidth(0.3);
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      pdf.line(pts[i][0], pts[i][1], pts[j][0], pts[j][1]);
    }

    // Room label
    const center = polygonCentroid(room.points);
    const area = polygonArea(room.points) / 10000;
    pdf.setFontSize(7);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont("helvetica", "bold");
    pdf.text(room.name, tx(center.x), ty(center.y) - 2, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.5);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${area.toFixed(2)} m²`, tx(center.x), ty(center.y) + 3, { align: "center" });
  });

  // Draw walls
  pdf.setDrawColor(60, 60, 60);
  pdf.setLineWidth(0.8);
  walls.forEach((wall) => {
    pdf.line(tx(wall.start.x), ty(wall.start.y), tx(wall.end.x), ty(wall.end.y));
  });

  // Draw wall dimensions
  walls.forEach((wall) => {
    const len = distance(wall.start, wall.end);
    const lenM = (len / 100).toFixed(2);
    const mx = (wall.start.x + wall.end.x) / 2;
    const my = (wall.start.y + wall.end.y) / 2;
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const wallAngle = Math.atan2(dy, dx);
    const perpX = -Math.sin(wallAngle);
    const perpY = Math.cos(wallAngle);
    const dimOffset = 5;

    const labelX = tx(mx) + perpX * dimOffset;
    const labelY = ty(my) + perpY * dimOffset;

    pdf.setFontSize(4.5);
    pdf.setTextColor(80, 80, 80);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${lenM}m`, labelX, labelY, { align: "center" });
  });

  // Draw doors
  pdf.setDrawColor(139, 90, 43);
  pdf.setLineWidth(0.5);
  doors.forEach((door) => {
    const doorRadius = (door.width / 2) * scale;
    const dxPdf = tx(door.x);
    const dyPdf = ty(door.y);
    const angle = (door.rotation * Math.PI) / 180;
    const swing = door.swing || "right";
    const startAngle = swing === "left" ? angle : angle - Math.PI / 2;
    const arcPts = 12;
    for (let i = 0; i < arcPts; i++) {
      const a1 = startAngle + (i / arcPts) * (Math.PI / 2);
      const a2 = startAngle + ((i + 1) / arcPts) * (Math.PI / 2);
      pdf.line(
        dxPdf + Math.cos(a1) * doorRadius,
        dyPdf + Math.sin(a1) * doorRadius,
        dxPdf + Math.cos(a2) * doorRadius,
        dyPdf + Math.sin(a2) * doorRadius
      );
    }
    // Door leaf line
    pdf.setLineWidth(0.7);
    pdf.line(dxPdf, dyPdf, dxPdf + Math.cos(startAngle) * doorRadius, dyPdf + Math.sin(startAngle) * doorRadius);
    pdf.setLineWidth(0.5);
  });

  // Draw windows
  pdf.setDrawColor(100, 160, 220);
  pdf.setLineWidth(0.7);
  windows.forEach((win) => {
    const wPdf = (win.width / 2) * scale;
    const wxPdf = tx(win.x);
    const wyPdf = ty(win.y);
    const angle = (win.rotation * Math.PI) / 180;
    const dx1 = Math.cos(angle) * wPdf;
    const dy1 = Math.sin(angle) * wPdf;
    pdf.line(wxPdf - dx1, wyPdf - dy1, wxPdf + dx1, wyPdf + dy1);
    pdf.setLineWidth(0.3);
    const perpDx = Math.cos(angle + Math.PI / 2) * 1.5;
    const perpDy = Math.sin(angle + Math.PI / 2) * 1.5;
    pdf.line(wxPdf - dx1 + perpDx, wyPdf - dy1 + perpDy, wxPdf + dx1 + perpDx, wyPdf + dy1 + perpDy);
    pdf.line(wxPdf - dx1 - perpDx, wyPdf - dy1 - perpDy, wxPdf + dx1 - perpDx, wyPdf + dy1 - perpDy);
    pdf.setLineWidth(0.7);
  });

  // Draw furniture
  pdf.setDrawColor(120, 120, 120);
  pdf.setLineWidth(0.4);
  furniture.forEach((item) => {
    const hw = (item.width / 2) * scale;
    const hh = (item.height / 2) * scale;
    const angle = (item.rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const corners = [
      [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh],
    ].map(([lx, ly]) => ({
      x: tx(item.x) + lx * cos - ly * sin,
      y: ty(item.y) + lx * sin + ly * cos,
    }));

    for (let i = 0; i < corners.length; i++) {
      const j = (i + 1) % corners.length;
      pdf.line(corners[i].x, corners[i].y, corners[j].x, corners[j].y);
    }

    // Furniture label
    pdf.setFontSize(3.5);
    pdf.setTextColor(100, 100, 100);
    pdf.text(item.name, tx(item.x), ty(item.y) + 1, { align: "center" });
  });

  // Scale bar
  const scaleBarY = drawAreaY + drawAreaH + 3;
  const scaleBar1m = 100 * scale;
  const scaleBarX = drawAreaX + 5;
  pdf.setDrawColor(60, 60, 60);
  pdf.setLineWidth(0.4);
  pdf.line(scaleBarX, scaleBarY, scaleBarX + scaleBar1m, scaleBarY);
  pdf.line(scaleBarX, scaleBarY - 1.5, scaleBarX, scaleBarY + 1.5);
  pdf.line(scaleBarX + scaleBar1m, scaleBarY - 1.5, scaleBarX + scaleBar1m, scaleBarY + 1.5);
  pdf.setFontSize(5);
  pdf.setTextColor(60, 60, 60);
  pdf.text("0", scaleBarX, scaleBarY + 4, { align: "center" });
  pdf.text("1m", scaleBarX + scaleBar1m, scaleBarY + 4, { align: "center" });

  // Scale notation
  pdf.setFontSize(6);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Scale ${scaleNotation}`, scaleBarX + scaleBar1m + 8, scaleBarY + 1);
  pdf.setFont("helvetica", "normal");

  // North arrow (top-right of drawing area)
  drawNorthArrow(pdf, drawAreaX + drawAreaW - 10, drawAreaY + 12);

  // Legend (bottom-right of drawing area)
  drawLegend(pdf, drawAreaX + drawAreaW - 30, drawAreaY + drawAreaH - 28);

  // Title block
  drawTitleBlock(pdf, projectName, pageW, pageH, scaleNotation, pageNum, totalPages);
}

function drawBOQPages(
  pdf: jsPDF,
  projectName: string,
  walls: Wall[],
  rooms: Room[],
  furniture: FurnitureItem[],
  doors: DoorItem[],
  windows: WindowItem[],
  startPage: number,
  totalPages: number
) {
  const pageW = 297;
  const pageH = 210;
  const margin = 12;
  const headerH = 10;
  const rowH = 6;
  const maxY = pageH - margin - 18; // Leave room for title block

  const boq = generateBOQ(furniture, doors, windows, walls, rooms);

  // Column definitions: Item, Category, Qty, Dimensions (W×D×H mm), Unit Price (₹), Line Total
  const colDefs = [
    { header: "Item", width: 60, align: "left" as const },
    { header: "Category", width: 35, align: "left" as const },
    { header: "Qty", width: 18, align: "center" as const },
    { header: "Dimensions (W×D×H mm)", width: 55, align: "center" as const },
    { header: "Unit Price (₹)", width: 35, align: "right" as const },
    { header: "Line Total", width: 35, align: "right" as const },
  ];

  const tableX = margin + 5;
  let currentPage = startPage;

  function drawPageHeader(y: number): number {
    // Page header
    pdf.setFontSize(9);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont("helvetica", "bold");
    pdf.text("BILL OF QUANTITIES", tableX, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text(projectName, tableX + 55, y);

    y += 6;

    // Table header
    pdf.setFillColor(240, 240, 240);
    const tableW = colDefs.reduce((sum, c) => sum + c.width, 0);
    pdf.rect(tableX, y, tableW, headerH, "F");
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.rect(tableX, y, tableW, headerH);

    let cx = tableX;
    pdf.setFontSize(6);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont("helvetica", "bold");
    colDefs.forEach((col) => {
      if (col.align === "center") {
        pdf.text(col.header, cx + col.width / 2, y + 6.5, { align: "center" });
      } else if (col.align === "right") {
        pdf.text(col.header, cx + col.width - 2, y + 6.5, { align: "right" });
      } else {
        pdf.text(col.header, cx + 2, y + 6.5);
      }
      cx += col.width;
    });

    return y + headerH;
  }

  // Drawing border
  pdf.setDrawColor(60, 60, 60);
  pdf.setLineWidth(0.8);
  pdf.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);

  let y = drawPageHeader(margin + 5);

  let rowIdx = 0;
  for (const cat of boq.categories) {
    // Category sub-header
    if (y + rowH > maxY) {
      drawTitleBlock(pdf, projectName, pageW, pageH, "N/A", currentPage, totalPages);
      pdf.addPage();
      currentPage++;
      pdf.setDrawColor(60, 60, 60);
      pdf.setLineWidth(0.8);
      pdf.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);
      y = drawPageHeader(margin + 5);
    }

    pdf.setFillColor(230, 235, 245);
    const tableW = colDefs.reduce((sum, c) => sum + c.width, 0);
    pdf.rect(tableX, y, tableW, rowH, "F");
    pdf.setFontSize(6);
    pdf.setTextColor(50, 70, 120);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${cat.category.toUpperCase()} (${cat.totalItems} items)`, tableX + 2, y + 4.2);
    y += rowH;

    for (const item of cat.items) {
      if (y + rowH > maxY) {
        drawTitleBlock(pdf, projectName, pageW, pageH, "N/A", currentPage, totalPages);
        pdf.addPage();
        currentPage++;
        pdf.setDrawColor(60, 60, 60);
        pdf.setLineWidth(0.8);
        pdf.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);
        y = drawPageHeader(margin + 5);
      }

      // Alternating row background
      if (rowIdx % 2 === 0) {
        pdf.setFillColor(248, 248, 250);
        pdf.rect(tableX, y, tableW, rowH, "F");
      }

      pdf.setFontSize(5.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(50, 50, 50);

      let cx = tableX;

      // Item name
      pdf.text(item.name, cx + 2, y + 4.2);
      cx += colDefs[0].width;

      // Category
      pdf.setTextColor(100, 100, 100);
      pdf.text(cat.category, cx + 2, y + 4.2);
      cx += colDefs[1].width;

      // Qty
      pdf.setTextColor(50, 50, 50);
      pdf.setFont("helvetica", "bold");
      pdf.text(String(item.quantity), cx + colDefs[2].width / 2, y + 4.2, { align: "center" });
      cx += colDefs[2].width;
      pdf.setFont("helvetica", "normal");

      // Dimensions W×D×H mm
      const dimStr = `${item.widthMm}×${item.depthMm}×${item.heightMm}`;
      pdf.text(dimStr, cx + colDefs[3].width / 2, y + 4.2, { align: "center" });
      cx += colDefs[3].width;

      // Unit Price
      const priceStr = item.unitPriceInr > 0 ? `₹${item.unitPriceInr.toLocaleString("en-IN")}` : "—";
      pdf.text(priceStr, cx + colDefs[4].width - 2, y + 4.2, { align: "right" });
      cx += colDefs[4].width;

      // Line Total
      const totalStr = item.lineTotal > 0 ? `₹${item.lineTotal.toLocaleString("en-IN")}` : "—";
      pdf.text(totalStr, cx + colDefs[5].width - 2, y + 4.2, { align: "right" });

      // Row border
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.1);
      pdf.line(tableX, y + rowH, tableX + tableW, y + rowH);

      y += rowH;
      rowIdx++;
    }
  }

  // Summary section
  if (y + 20 > maxY) {
    drawTitleBlock(pdf, projectName, pageW, pageH, "N/A", currentPage, totalPages);
    pdf.addPage();
    currentPage++;
    pdf.setDrawColor(60, 60, 60);
    pdf.setLineWidth(0.8);
    pdf.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);
    y = margin + 10;
  }

  y += 4;
  pdf.setFillColor(240, 245, 250);
  pdf.roundedRect(tableX, y, 80, 22, 2, 2, "F");
  pdf.setDrawColor(180, 200, 220);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(tableX, y, 80, 22, 2, 2, "S");

  pdf.setFontSize(7);
  pdf.setTextColor(50, 50, 50);
  pdf.setFont("helvetica", "bold");
  pdf.text("SUMMARY", tableX + 4, y + 5);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);

  const summaryItems = [
    { label: "Total Items", value: String(boq.totalFurnitureItems) },
    { label: "Unique Types", value: String(boq.totalUniqueItems) },
    { label: "Grand Total", value: boq.grandTotal > 0 ? `₹${boq.grandTotal.toLocaleString("en-IN")}` : "—" },
  ];
  summaryItems.forEach((s, i) => {
    pdf.setTextColor(80, 80, 80);
    pdf.text(s.label, tableX + 4, y + 10 + i * 4);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont("helvetica", "bold");
    pdf.text(s.value, tableX + 76, y + 10 + i * 4, { align: "right" });
    pdf.setFont("helvetica", "normal");
  });

  drawTitleBlock(pdf, projectName, pageW, pageH, "N/A", currentPage, totalPages);
}

/**
 * Export a multi-page PDF blueprint with:
 * - Floor plan pages with title block, north arrow, legend, scale notation
 * - BOQ table pages with Item, Category, Qty, Dimensions, Unit Price, Line Total
 */
export async function exportPDF(
  projectName: string,
  walls: Wall[],
  rooms: Room[],
  furniture: FurnitureItem[],
  doors: DoorItem[],
  windows: WindowItem[]
): Promise<void> {
  // Determine total pages: 1 floor plan + estimated BOQ pages
  const boq = generateBOQ(furniture, doors, windows, walls, rooms);
  const totalBOQItems = boq.categories.reduce((sum, cat) => sum + cat.items.length + 1, 0);
  const itemsPerPage = Math.floor((210 - 12 * 2 - 18 - 16) / 6);
  const boqPages = Math.max(1, Math.ceil(totalBOQItems / itemsPerPage));
  const totalPages = 1 + boqPages;

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Page 1: Floor plan
  drawFloorPlanPage(pdf, projectName, walls, rooms, furniture, doors, windows, 1, totalPages);

  // Final pages: BOQ
  pdf.addPage();
  drawBOQPages(pdf, projectName, walls, rooms, furniture, doors, windows, 2, totalPages);

  const date = new Date().toISOString().split("T")[0];
  pdf.save(`${projectName.replace(/\s+/g, "_")}_Blueprint_${date}.pdf`);
}
