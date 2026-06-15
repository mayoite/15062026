import type { FloorTemplate } from "./floorTemplates";

export const ROOM_SETUP_TYPES = [
  { id: "office", label: "Office", color: "var(--surface-glass)" },
  { id: "meeting", label: "Meeting", color: "var(--surface-glass)" },
  { id: "conference", label: "Conference", color: "var(--surface-glass)" },
  { id: "lobby", label: "Reception", color: "var(--surface-glass)" },
  { id: "cafeteria", label: "Cafeteria", color: "var(--surface-glass)" },
  { id: "custom", label: "Custom", color: "var(--surface-glass)" },
] as const;

export const ROOM_SETUP_STYLES = ["Modern", "Traditional", "Minimalist"] as const;

export type RoomSetupType = (typeof ROOM_SETUP_TYPES)[number]["id"];
export type RoomSetupStyle = (typeof ROOM_SETUP_STYLES)[number];

export interface RoomSetupInput {
  roomType: RoomSetupType;
  widthM: number;
  depthM: number;
  style: RoomSetupStyle;
}

function clampDimensionM(value: number): number {
  if (!Number.isFinite(value)) return 4;
  return Math.min(60, Math.max(1.5, value));
}

export function buildRoomSetupTemplate(input: RoomSetupInput): FloorTemplate {
  const roomType = ROOM_SETUP_TYPES.find((type) => type.id === input.roomType) ?? ROOM_SETUP_TYPES[0];
  const widthM = clampDimensionM(input.widthM);
  const depthM = clampDimensionM(input.depthM);
  const widthPx = Math.round(widthM * 100);
  const depthPx = Math.round(depthM * 100);
  const x = 160;
  const y = 160;
  const name = `${input.style} ${roomType.label}`;

  return {
    id: `room-setup-${roomType.id}`,
    name,
    description: `${widthM.toFixed(1)}m x ${depthM.toFixed(1)}m ${roomType.label.toLowerCase()}`,
    icon: "□",
    size: `${widthM.toFixed(1)}m x ${depthM.toFixed(1)}m`,
    walls: [
      { start: { x, y }, end: { x: x + widthPx, y }, thickness: 8, color: "var(--border-soft)" },
      { start: { x: x + widthPx, y }, end: { x: x + widthPx, y: y + depthPx }, thickness: 8, color: "var(--border-soft)" },
      { start: { x: x + widthPx, y: y + depthPx }, end: { x, y: y + depthPx }, thickness: 8, color: "var(--border-soft)" },
      { start: { x, y: y + depthPx }, end: { x, y }, thickness: 8, color: "var(--border-soft)" },
    ],
    rooms: [
      {
        points: [
          { x, y },
          { x: x + widthPx, y },
          { x: x + widthPx, y: y + depthPx },
          { x, y: y + depthPx },
        ],
        name,
        color: roomType.color,
        floorMaterial: input.style === "Traditional" ? "wood" : input.style === "Minimalist" ? "concrete" : "default",
      },
    ],
    doors: [{ x: x + widthPx / 2, y: y + depthPx, width: 90, rotation: 0, swing: "left", openAngle: 90 }],
    windows: [{ x: x + widthPx / 2, y, width: 120, rotation: 0, style: "single" }],
    furniture: [],
  };
}
