import type { Wall, Room, FurnitureItem, DoorItem, WindowItem } from "@/features/oando-planner/data/plannerStore";
import { generateSVGString } from "./exportSVG";

const DEFAULT_MIN_WIDTH = 1920;

/**
 * Export floor plan as a PNG image (minimum 1920px width).
 * Renders SVG to a canvas then triggers a download.
 * Returns true if the export succeeded.
 */
export async function exportPNG(
  projectName: string,
  walls: Wall[],
  rooms: Room[],
  furniture: FurnitureItem[],
  doors: DoorItem[],
  windows: WindowItem[],
  minWidth: number = DEFAULT_MIN_WIDTH
): Promise<boolean> {
  const svgString = generateSVGString(projectName, walls, rooms, furniture, doors, windows);
  if (!svgString) return false;

  // Parse SVG to get natural dimensions from the viewBox
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  const svgEl = svgDoc.documentElement;
  const viewBox = svgEl.getAttribute("viewBox");
  let naturalW = parseFloat(svgEl.getAttribute("width") || "800");
  let naturalH = parseFloat(svgEl.getAttribute("height") || "600");

  if (viewBox) {
    const parts = viewBox.split(/\s+/).map(Number);
    if (parts.length === 4) {
      naturalW = parts[2];
      naturalH = parts[3];
    }
  }

  // Scale up to minimum width
  const scale = Math.max(1, minWidth / naturalW);
  const canvasW = Math.round(naturalW * scale);
  const canvasH = Math.round(naturalH * scale);

  // Encode SVG as data URL
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        resolve(false);
        return;
      }

      // White background
      ctx.fillStyle = "var(--surface-panel)";
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Draw SVG image
      ctx.drawImage(img, 0, 0, canvasW, canvasH);

      URL.revokeObjectURL(svgUrl);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${projectName.replace(/\s+/g, "-")}-floorplan.png`;
          a.click();
          URL.revokeObjectURL(url);
          resolve(true);
        },
        "image/png",
        1.0
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      resolve(false);
    };
    img.src = svgUrl;
  });
}
