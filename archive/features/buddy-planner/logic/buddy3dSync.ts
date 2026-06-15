// @ts-nocheck
/**
 * Buddy Planner - 3D Sync Bridge
 *
 * Reads Tldraw document store and converts Buddy shapes
 * into 3D-renderable data for PlannerViewer3D.
 *
 * View-only: no editing in 3D mode.
 */

import type { Editor } from "tldraw";

export interface Wall3DData {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  height: number;
  thickness: number;
  wallType: "solid" | "glass" | "half-height";
  color: string;
}

export interface Furniture3DData {
  id: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  rotation: number;
  type: string;
  label: string;
  color: string;
  seatCount?: number;
}

export interface Zone3DData {
  id: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  label: string;
  color: string;
  zoneType: string;
}

/**
 * Extract 3D render data from Tldraw editor for Buddy shapes.
 * Called reactively whenever Tldraw store changes.
 */
export function extractBuddy3DData(editor: Editor): {
  walls: Wall3DData[];
  furniture: Furniture3DData[];
  zones: Zone3DData[];
} {
  const walls: Wall3DData[] = [];
  const furniture: Furniture3DData[] = [];
  const zones: Zone3DData[] = [];

  const allShapes = editor.getCurrentPageShapes();

  for (const shape of allShapes) {
    const props = shape.props as Record<string, unknown>;

    switch (shape.type) {
      case "buddy-wall": {
        walls.push({
          id: shape.id,
          startX: (props.startX as number) || 0,
          startY: (props.startY as number) || 0,
          endX: (props.endX as number) || 0,
          endY: (props.endY as number) || 0,
          height: (props.wallType as string) === "half-height" ? 150 : 280,
          thickness: (props.thickness as number) || 8,
          wallType: (props.wallType as Wall3DData["wallType"]) || "solid",
          color: (props.color as string) || "#666",
        });
        break;
      }

      case "buddy-desk":
      case "buddy-bench": {
        furniture.push({
          id: shape.id,
          x: shape.x,
          y: shape.y,
          width: (props.widthMm as number) || 120,
          depth: (props.heightMm as number) || 60,
          height: 75, // standard desk height in cm
          rotation: shape.rotation || 0,
          type: shape.type,
          label: (props.label as string) || "",
          color: (props.color as string) || "var(--color-accent)",
          seatCount: (props.seatCount as number) || 1,
        });
        break;
      }

      case "buddy-conference": {
        furniture.push({
          id: shape.id,
          x: shape.x,
          y: shape.y,
          width: (props.widthMm as number) || 300,
          depth: (props.heightMm as number) || 200,
          height: 75,
          rotation: shape.rotation || 0,
          type: "conference-table",
          label: (props.label as string) || "",
          color: "#8b5e3c",
          seatCount: (props.capacity as number) || 8,
        });
        break;
      }

      case "buddy-phone-booth": {
        furniture.push({
          id: shape.id,
          x: shape.x,
          y: shape.y,
          width: (props.widthMm as number) || 120,
          depth: (props.heightMm as number) || 120,
          height: 220, // full height pod
          rotation: shape.rotation || 0,
          type: "phone-booth",
          label: (props.label as string) || "",
          color: (props.color as string) || "#059669",
        });
        break;
      }

      case "buddy-zone": {
        zones.push({
          id: shape.id,
          x: shape.x,
          y: shape.y,
          width: (props.widthMm as number) || 400,
          depth: (props.heightMm as number) || 300,
          label: (props.label as string) || "",
          color: (props.color as string) || "#4f46e5",
          zoneType: (props.zoneType as string) || "collaborative",
        });
        break;
      }

      case "buddy-room": {
        // Rooms render as elevated floor planes in 3D
        zones.push({
          id: shape.id,
          x: shape.x,
          y: shape.y,
          width: (props.widthMm as number) || 300,
          depth: (props.heightMm as number) || 250,
          label: (props.label as string) || "",
          color: (props.color as string) || "#7c3aed",
          zoneType: "room",
        });
        break;
      }
    }
  }

  return { walls, furniture, zones };
}
