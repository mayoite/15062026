"use client";
import type { Point, Room } from "@/features/oando-planner/data/plannerStore";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import { useToastStore } from "@/features/oando-planner/data/toastStore";

type SuggestedFurniture = {
  catalogId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  shape: string;
};

type RoomPreset = {
  type: string;
  icon: string;
  description: string;
  minWidthCm?: number;
  minHeightCm?: number;
  targetSeats?: [number, number];
  suggestFurniture: (
    room: Room,
    roomWidth: number,
    roomHeight: number,
    center: Point,
  ) => SuggestedFurniture[];
};

function getRoomBounds(points: Point[]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
  };
}

const ROOM_PRESETS: RoomPreset[] = [
  {
    type: "Private Office",
    icon: "Office",
    description: "Desk, chair, bookshelf, visitor chairs",
    minWidthCm: 220,
    minHeightCm: 220,
    targetSeats: [1, 3],
    suggestFurniture: (_room, w, h, c) => [
      { catalogId: "desk", name: "Office Desk", x: c.x, y: c.y - h * 0.2, width: 60, height: 30, rotation: 0, color: "var(--color-bronze-300)", shape: "desk" },
      { catalogId: "office-chair", name: "Office Chair", x: c.x, y: c.y + 5, width: 22, height: 22, rotation: 0, color: "var(--color-dark-midnight-blue-800)", shape: "office-chair" },
      { catalogId: "bookcase", name: "Bookcase", x: c.x + w * 0.35, y: c.y - h * 0.35, width: 40, height: 16, rotation: 0, color: "var(--color-bronze-700)", shape: "bookcase" },
      { catalogId: "filing-cabinet", name: "Filing Cabinet", x: c.x - w * 0.3, y: c.y - h * 0.35, width: 20, height: 20, rotation: 0, color: "var(--color-dark-midnight-blue-300)", shape: "filing-cabinet" },
    ],
  },
  {
    type: "Open Plan Office",
    icon: "Open",
    description: "Multiple desks with chairs in rows",
    minWidthCm: 320,
    minHeightCm: 260,
    targetSeats: [4, 24],
    suggestFurniture: (_room, w, h, c) => {
      const items: SuggestedFurniture[] = [];
      const cols = Math.max(2, Math.floor(w / 80));
      const rows = Math.max(1, Math.floor(h / 80));
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const x = c.x - w * 0.35 + col * 75;
          const y = c.y - h * 0.3 + r * 75;
          items.push({ catalogId: "desk", name: "Office Desk", x, y, width: 60, height: 30, rotation: 0, color: "var(--color-bronze-300)", shape: "desk" });
          items.push({ catalogId: "office-chair", name: "Office Chair", x, y: y + 30, width: 22, height: 22, rotation: 0, color: "var(--color-dark-midnight-blue-800)", shape: "office-chair" });
        }
      }
      return items;
    },
  },
  {
    type: "Meeting Room",
    icon: "Meet",
    description: "Conference table with chairs",
    minWidthCm: 260,
    minHeightCm: 220,
    targetSeats: [4, 12],
    suggestFurniture: (_room, w, h, c) => {
      const items: SuggestedFurniture[] = [];
      items.push({ catalogId: "dining-table-rect", name: "Conference Table", x: c.x, y: c.y, width: Math.min(120, w * 0.6), height: Math.min(50, h * 0.4), rotation: 0, color: "var(--color-bronze-600)", shape: "dining-table-rect" });
      const chairs = Math.max(4, Math.floor(Math.min(w, h) / 25));
      const halfChairs = Math.floor(chairs / 2);
      for (let i = 0; i < halfChairs; i++) {
        const x = c.x - (halfChairs - 1) * 15 + i * 30;
        items.push({ catalogId: "dining-chair", name: "Chair", x, y: c.y - 35, width: 18, height: 18, rotation: 0, color: "var(--color-bronze-600)", shape: "dining-chair" });
        items.push({ catalogId: "dining-chair", name: "Chair", x, y: c.y + 35, width: 18, height: 18, rotation: 180, color: "var(--color-bronze-600)", shape: "dining-chair" });
      }
      return items;
    },
  },
  {
    type: "Reception",
    icon: "Front",
    description: "Reception desk, sofa, coffee table",
    minWidthCm: 280,
    minHeightCm: 220,
    targetSeats: [2, 6],
    suggestFurniture: (_room, w, h, c) => [
      { catalogId: "desk", name: "Reception Desk", x: c.x, y: c.y - h * 0.25, width: 80, height: 30, rotation: 0, color: "var(--color-bronze-300)", shape: "desk" },
      { catalogId: "office-chair", name: "Reception Chair", x: c.x, y: c.y - h * 0.25 + 30, width: 22, height: 22, rotation: 0, color: "var(--color-dark-midnight-blue-800)", shape: "office-chair" },
      { catalogId: "sofa-2", name: "Waiting Sofa", x: c.x - w * 0.2, y: c.y + h * 0.2, width: 70, height: 35, rotation: 0, color: "var(--color-bronze-600)", shape: "sofa" },
      { catalogId: "coffee-table", name: "Coffee Table", x: c.x - w * 0.2, y: c.y + h * 0.2 - 35, width: 40, height: 20, rotation: 0, color: "var(--color-bronze-200)", shape: "coffee-table" },
      { catalogId: "plant-large", name: "Plant", x: c.x + w * 0.35, y: c.y + h * 0.35, width: 20, height: 20, rotation: 0, color: "var(--color-sustain-500)", shape: "plant-large" },
    ],
  },
  {
    type: "Server Room",
    icon: "IT",
    description: "Server racks and utility setup",
    minWidthCm: 220,
    minHeightCm: 220,
    targetSeats: [1, 2],
    suggestFurniture: (_room, w, h, c) => {
      const items: SuggestedFurniture[] = [];
      const racks = Math.max(2, Math.floor(w / 50));
      for (let i = 0; i < racks; i++) {
        items.push({
          catalogId: "storage-shelf",
          name: "Server Rack",
          x: c.x - w * 0.35 + i * 45,
          y: c.y - h * 0.2,
          width: 30,
          height: 16,
          rotation: 0,
          color: "var(--color-dark-midnight-blue-800)",
          shape: "storage-shelf",
        });
      }
      items.push({ catalogId: "desk", name: "Admin Desk", x: c.x, y: c.y + h * 0.25, width: 60, height: 30, rotation: 0, color: "var(--color-dark-midnight-blue-400)", shape: "desk" });
      items.push({ catalogId: "office-chair", name: "Admin Chair", x: c.x, y: c.y + h * 0.25 + 30, width: 22, height: 22, rotation: 0, color: "var(--color-dark-midnight-blue-800)", shape: "office-chair" });
      return items;
    },
  },
  {
    type: "Break Room",
    icon: "Cafe",
    description: "Tables, chairs, kitchenette",
    minWidthCm: 260,
    minHeightCm: 240,
    targetSeats: [2, 8],
    suggestFurniture: (_room, w, h, c) => [
      { catalogId: "dining-table-round", name: "Break Table", x: c.x - w * 0.15, y: c.y, width: 50, height: 50, rotation: 0, color: "var(--color-bronze-200)", shape: "dining-table-round" },
      { catalogId: "dining-chair", name: "Chair", x: c.x - w * 0.15 - 30, y: c.y, width: 18, height: 18, rotation: 270, color: "var(--color-bronze-600)", shape: "dining-chair" },
      { catalogId: "dining-chair", name: "Chair", x: c.x - w * 0.15 + 30, y: c.y, width: 18, height: 18, rotation: 90, color: "var(--color-bronze-600)", shape: "dining-chair" },
      { catalogId: "dining-chair", name: "Chair", x: c.x - w * 0.15, y: c.y - 30, width: 18, height: 18, rotation: 0, color: "var(--color-bronze-600)", shape: "dining-chair" },
      { catalogId: "dining-chair", name: "Chair", x: c.x - w * 0.15, y: c.y + 30, width: 18, height: 18, rotation: 180, color: "var(--color-bronze-600)", shape: "dining-chair" },
      { catalogId: "kitchen-counter", name: "Kitchenette", x: c.x + w * 0.3, y: c.y - h * 0.35, width: 60, height: 25, rotation: 0, color: "var(--color-dark-midnight-blue-200)", shape: "counter" },
      { catalogId: "fridge", name: "Fridge", x: c.x + w * 0.35, y: c.y - h * 0.15, width: 30, height: 30, rotation: 0, color: "var(--color-dark-midnight-blue-100)", shape: "fridge" },
    ],
  },
];

function getPresetFit(
  preset: RoomPreset,
  roomWidth: number,
  roomHeight: number,
  itemCount: number,
): { tone: "strong" | "ok" | "tight"; label: string; detail: string } {
  const widthOk = !preset.minWidthCm || roomWidth >= preset.minWidthCm;
  const heightOk = !preset.minHeightCm || roomHeight >= preset.minHeightCm;

  if (widthOk && heightOk) {
    return {
      tone: "strong",
      label: "Good fit",
      detail: preset.targetSeats
        ? `Best for roughly ${preset.targetSeats[0]}-${preset.targetSeats[1]} people · ${itemCount} items`
        : `${itemCount} items in this preset`,
    };
  }

  if (
    roomWidth >= (preset.minWidthCm ?? 0) * 0.85 &&
    roomHeight >= (preset.minHeightCm ?? 0) * 0.85
  ) {
    return {
      tone: "ok",
      label: "Possible fit",
      detail: "This layout may need spacing cleanup after placement.",
    };
  }

  return {
    tone: "tight",
    label: "Tight fit",
    detail: `Recommended minimum ${preset.minWidthCm ?? roomWidth}x${preset.minHeightCm ?? roomHeight}cm`,
  };
}

interface Props {
  room: Room;
  onClose: () => void;
}

export function RoomTypeSuggestions({ room, onClose }: Props) {
  const addFurnitureBatch = usePlannerStore((s) => s.addFurnitureBatch);
  const addToast = useToastStore((s) => s.addToast);
  const bounds = getRoomBounds(room.points);

  const handleApply = (preset: RoomPreset) => {
    const items = preset.suggestFurniture(room, bounds.width, bounds.height, bounds.center);
    addFurnitureBatch(items);
    addToast("success", `Applied ${preset.type} layout (${items.length} items)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[80vh] w-[420px] overflow-hidden rounded-xl border border-white/10 bg-[var(--surface-inverse)] shadow-2xl">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-white">Room Type Presets</h2>
              <p className="mt-0.5 text-[11px] text-white/40">
                Auto-furnish &quot;{room.name}&quot; ({Math.round(bounds.width)}x{Math.round(bounds.height)}cm)
              </p>
            </div>
            <button onClick={onClose} className="text-xl text-white/40 hover:text-white">
              &times;
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto p-4">
          {ROOM_PRESETS.map((preset) => {
            const previewItems = preset.suggestFurniture(room, bounds.width, bounds.height, bounds.center);
            const fit = getPresetFit(preset, bounds.width, bounds.height, previewItems.length);

            return (
              <button
                key={preset.type}
                onClick={() => handleApply(preset)}
                className="flex w-full items-center gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-left transition-all hover:border-white/10 hover:bg-white/5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-semibold text-white/60">
                  {preset.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-white">{preset.type}</p>
                  <p className="text-[11px] text-white/40">{preset.description}</p>
                  <p className="mt-0.5 text-[10px] text-white/25">{previewItems.length} items will be placed</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      fit.tone === "strong"
                        ? "text-emerald-400/80"
                        : fit.tone === "ok"
                          ? "text-amber-300/80"
                          : "text-red-300/80"
                    }`}
                  >
                    {fit.label}: {fit.detail}
                  </p>
                </div>
                <span className="shrink-0 text-lg text-white/20">&var(--border-soft);</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
