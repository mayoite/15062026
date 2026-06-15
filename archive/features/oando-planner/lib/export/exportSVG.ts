import type { Wall, Room, FurnitureItem, DoorItem, WindowItem, Point } from "@/features/oando-planner/data/plannerStore";

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

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Generate SVG markup string of the floor plan.
 * Returns null if there's no data to render.
 */
export function generateSVGString(
  projectName: string,
  walls: Wall[],
  rooms: Room[],
  furniture: FurnitureItem[],
  doors: DoorItem[],
  windows: WindowItem[]
): string | null {
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

  if (allX.length === 0) return null;

  const pad = 60;
  const minX = Math.min(...allX) - pad;
  const maxX = Math.max(...allX) + pad;
  const minY = Math.min(...allY) - pad;
  const maxY = Math.max(...allY) + pad;
  const svgW = maxX - minX;
  const svgH = maxY - minY;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${svgW} ${svgH}" width="${svgW}" height="${svgH}">\n`;
  svg += `  <title>${escapeXml(projectName)} - Floor Plan</title>\n`;
  svg += `  <desc>${escapeXml(EXPORT_BRAND)} export</desc>\n`;
  svg += `  <defs>\n`;
  svg += `    <style>\n`;
  svg += `      .wall { stroke: var(--border-soft); stroke-linecap: round; fill: none; }\n`;
  svg += `      .room-fill { opacity: 0.3; }\n`;
  svg += `      .room-label { font-family: Arial, sans-serif; font-size: 14px; fill: var(--border-soft); text-anchor: middle; font-weight: bold; }\n`;
  svg += `      .room-area { font-family: Arial, sans-serif; font-size: 10px; fill: var(--border-soft); text-anchor: middle; }\n`;
  svg += `      .dim-text { font-family: Arial, sans-serif; font-size: 8px; fill: var(--border-soft); text-anchor: middle; }\n`;
  svg += `      .dim-line { stroke: var(--border-soft); stroke-width: 0.5; fill: none; }\n`;
  svg += `      .furniture { stroke: var(--border-soft); stroke-width: 1; fill: none; }\n`;
  svg += `      .furniture-label { font-family: Arial, sans-serif; font-size: 7px; fill: var(--border-soft); text-anchor: middle; }\n`;
  svg += `      .door { stroke: var(--border-soft); stroke-width: 1.5; fill: none; }\n`;
  svg += `      .window { stroke: var(--border-soft); stroke-width: 2; fill: none; }\n`;
  svg += `    </style>\n`;
  svg += `  </defs>\n`;

  svg += `  <g id="rooms">\n`;
  rooms.forEach((room) => {
    if (room.points.length < 3) return;
    const pathD = room.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

    const rgbaMatch = room.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const fillColor = rgbaMatch ? `var(--surface-glass)` : "var(--surface-panel)";

    svg += `    <path d="${pathD}" class="room-fill" fill="${fillColor}" />\n`;
  });
  svg += `  </g>\n`;

  svg += `  <g id="walls">\n`;
  walls.forEach((wall) => {
    const thick = Math.max(wall.thickness * 0.5, 3);
    svg += `    <line x1="${wall.start.x}" y1="${wall.start.y}" x2="${wall.end.x}" y2="${wall.end.y}" class="wall" stroke-width="${thick}" />\n`;
  });
  svg += `  </g>\n`;

  svg += `  <g id="dimensions">\n`;
  walls.forEach((wall) => {
    const len = distance(wall.start, wall.end);
    const lenM = (len / 100).toFixed(2);
    const mx = (wall.start.x + wall.end.x) / 2;
    const my = (wall.start.y + wall.end.y) / 2;
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const angle = Math.atan2(dy, dx);
    const perpX = -Math.sin(angle) * 15;
    const perpY = Math.cos(angle) * 15;

    svg += `    <line x1="${wall.start.x + perpX}" y1="${wall.start.y + perpY}" x2="${wall.end.x + perpX}" y2="${wall.end.y + perpY}" class="dim-line" />\n`;
    svg += `    <text x="${mx + perpX}" y="${my + perpY - 3}" class="dim-text">${lenM}m</text>\n`;
  });
  svg += `  </g>\n`;

  svg += `  <g id="doors">\n`;
  doors.forEach((door) => {
    const r = door.width / 2;
    const angle = (door.rotation * Math.PI) / 180;
    const swing = door.swing || "right";
    const startAngle = swing === "left" ? angle : angle - Math.PI / 2;

    let arcPath = "";
    const arcPts = 16;
    for (let i = 0; i <= arcPts; i++) {
      const a = startAngle + (i / arcPts) * (Math.PI / 2);
      const ax = door.x + Math.cos(a) * r;
      const ay = door.y + Math.sin(a) * r;
      arcPath += `${i === 0 ? "M" : "L"} ${ax.toFixed(1)} ${ay.toFixed(1)} `;
    }
    svg += `    <path d="${arcPath}" class="door" />\n`;
  });
  svg += `  </g>\n`;

  svg += `  <g id="windows">\n`;
  windows.forEach((win) => {
    const hw = win.width / 2;
    const angle = (win.rotation * Math.PI) / 180;
    const dx1 = Math.cos(angle) * hw;
    const dy1 = Math.sin(angle) * hw;
    const perpDx = Math.cos(angle + Math.PI / 2) * 4;
    const perpDy = Math.sin(angle + Math.PI / 2) * 4;

    svg += `    <line x1="${win.x - dx1}" y1="${win.y - dy1}" x2="${win.x + dx1}" y2="${win.y + dy1}" class="window" />\n`;
    svg += `    <line x1="${(win.x - dx1 + perpDx).toFixed(1)}" y1="${(win.y - dy1 + perpDy).toFixed(1)}" x2="${(win.x + dx1 + perpDx).toFixed(1)}" y2="${(win.y + dy1 + perpDy).toFixed(1)}" stroke="var(--border-soft)" stroke-width="0.8" />\n`;
    svg += `    <line x1="${(win.x - dx1 - perpDx).toFixed(1)}" y1="${(win.y - dy1 - perpDy).toFixed(1)}" x2="${(win.x + dx1 - perpDx).toFixed(1)}" y2="${(win.y + dy1 - perpDy).toFixed(1)}" stroke="var(--border-soft)" stroke-width="0.8" />\n`;
  });
  svg += `  </g>\n`;

  svg += `  <g id="furniture">\n`;
  furniture.forEach((item) => {
    const hw = item.width / 2;
    const hh = item.height / 2;
    const angle = (item.rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const corners = [
      [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]
    ].map(([lx, ly]) => ({
      x: item.x + lx * cos - ly * sin,
      y: item.y + lx * sin + ly * cos,
    }));

    const pathD = corners.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ") + " Z";
    svg += `    <path d="${pathD}" class="furniture" fill="${item.color}" fill-opacity="0.2" />\n`;
    svg += `    <text x="${item.x}" y="${item.y + 3}" class="furniture-label">${escapeXml(item.name)}</text>\n`;
  });
  svg += `  </g>\n`;

  svg += `  <g id="room-labels">\n`;
  rooms.forEach((room) => {
    if (room.points.length < 3) return;
    const center = polygonCentroid(room.points);
    const area = polygonArea(room.points) / 10000;
    svg += `    <text x="${center.x}" y="${center.y - 5}" class="room-label">${escapeXml(room.name)}</text>\n`;
    svg += `    <text x="${center.x}" y="${center.y + 10}" class="room-area">${area.toFixed(2)} m²</text>\n`;
  });
  svg += `  </g>\n`;

  svg += `</svg>\n`;

  return svg;
}

/**
 * Export floor plan as SVG file download.
 * Returns true if the export succeeded.
 */
export function exportSVG(
  projectName: string,
  walls: Wall[],
  rooms: Room[],
  furniture: FurnitureItem[],
  doors: DoorItem[],
  windows: WindowItem[]
): boolean {
  const svg = generateSVGString(projectName, walls, rooms, furniture, doors, windows);
  if (!svg) return false;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName.replace(/\s+/g, "-")}-floorplan.svg`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
