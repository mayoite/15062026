/**
 * Room shell presets.
 * One-click office layouts with optional multi-zone partitions.
 */

export interface RoomPresetZone {
  label: string;
  widthMm: number;
}

export interface RoomPreset {
  id: string;
  name: string;
  summary: string;
  widthMm: number;
  heightMm: number;
  zones?: RoomPresetZone[];
}

export const ROOM_PRESETS: RoomPreset[] = [
  {
    id: "cabin",
    name: "Cabin",
    summary: "Private enclosed office for 1–2 people.",
    widthMm: 3000,
    heightMm: 3000,
    zones: [{ label: "Cabin", widthMm: 3000 }],
  },
  {
    id: "meeting-room",
    name: "Meeting Room",
    summary: "Balanced conference room shell.",
    widthMm: 4800,
    heightMm: 3600,
    zones: [{ label: "Meeting Room", widthMm: 4800 }],
  },
  {
    id: "workspace",
    name: "Workspace",
    summary: "Open-plan workspace for 6–8 workstations.",
    widthMm: 6000,
    heightMm: 4800,
    zones: [{ label: "Workspace", widthMm: 6000 }],
  },
  {
    id: "cabin-workspace",
    name: "Cabin + Workspace",
    summary: "Private cabin and open workstation bay side by side.",
    widthMm: 9000,
    heightMm: 4800,
    zones: [
      { label: "Cabin", widthMm: 3000 },
      { label: "Workspace", widthMm: 6000 },
    ],
  },
  {
    id: "cabin-workspace-meeting",
    name: "Cabin + Workspace + Meeting",
    summary: "Three-zone office: private, open-plan, and conference.",
    widthMm: 13800,
    heightMm: 5400,
    zones: [
      { label: "Cabin", widthMm: 3000 },
      { label: "Workspace", widthMm: 6000 },
      { label: "Meeting Room", widthMm: 4800 },
    ],
  },
  {
    id: "full-office-suite",
    name: "Full Office Suite",
    summary: "Cabin · Workspace · Meeting · Pantry · Reception — 5 zones.",
    widthMm: 18000,
    heightMm: 7200,
    zones: [
      { label: "Cabin", widthMm: 3000 },
      { label: "Workspace", widthMm: 6000 },
      { label: "Meeting Room", widthMm: 4800 },
      { label: "Pantry", widthMm: 2100 },
      { label: "Reception", widthMm: 2100 },
    ],
  },
  {
    id: "executive-floor",
    name: "Executive Floor",
    summary: "Two cabins, boardroom, lounge, and support — 5 zones.",
    widthMm: 21600,
    heightMm: 9000,
    zones: [
      { label: "Cabin A", widthMm: 3600 },
      { label: "Cabin B", widthMm: 3600 },
      { label: "Boardroom", widthMm: 7200 },
      { label: "Lounge", widthMm: 4200 },
      { label: "Support", widthMm: 3000 },
    ],
  },
];
