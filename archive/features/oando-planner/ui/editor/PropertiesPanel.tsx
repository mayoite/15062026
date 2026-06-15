"use client";
import { useMemo, useState } from "react";
import type { Wall, Room, FurnitureItem, DoorItem, WindowItem, Point} from "@/features/oando-planner/data/plannerStore";
import { usePlannerStore, type FloorMaterial } from "@/features/oando-planner/data/plannerStore";
import { useAIStore } from "@/features/oando-planner/data/aiStore";
import {
  categoryLabels,
  getCatalogItemById,
  rankCatalogReplacementOptions,
  type CatalogItem,
} from "@/features/oando-planner/data/catalogData";
import { TagEditor } from "./TagEditor";
import { RoomTypeSuggestions } from "./RoomTypeSuggestions";
import { Lock, RotateCcw, Users } from "lucide-react";

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

function polygonPerimeter(pts: Point[]): number {
  let perimeter = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    perimeter += distance(pts[i], pts[j]);
  }
  return perimeter;
}

const inputClass = "w-full bg-white/[0.06] text-white text-[12px] px-2.5 py-1.5 rounded-lg border border-white/[0.08] focus:border-[var(--color-accent)] outline-none transition-colors";
const labelClass = "text-[10px] uppercase tracking-wider text-[var(--color-accent)] block mb-1.5 font-semibold";
const smallLabelClass = "text-[10px] text-white/30 block mb-1";

function WallProperties({ wall }: { wall: Wall }) {
  const updateWall = usePlannerStore((s) => s.updateWall);
  const updateWallDebounced = usePlannerStore((s) => s.updateWallDebounced);
  const deleteItem = usePlannerStore((s) => s.deleteItem);
  const len = distance(wall.start, wall.end);

  const handleLengthChange = (newLen: number) => {
    if (newLen <= 0) return;
    const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
    const newEnd = {
      x: wall.start.x + Math.cos(angle) * newLen,
      y: wall.start.y + Math.sin(angle) * newLen,
    };
    updateWall(wall.id, { end: newEnd });
  };

  return (
    <div className="flex flex-col h-full bg-[#1e2330] text-slate-300">
      <div className="p-4 border-b border-white/5">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Properties</p>
        <div className="flex items-start justify-between">
          <div className="min-w-0 pr-2">
            <h2 className="text-white text-[15px] font-bold leading-tight truncate">Wall Segment</h2>
            <p className="text-blue-500 text-[11px] font-bold uppercase tracking-wider mt-0.5 truncate">STRUCTURAL</p>
          </div>
          <button className="w-8 h-8 shrink-0 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <Lock size={14} />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-white/5">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Dimensions & Styling</p>
        
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative flex items-center">
            <span className="absolute left-3 text-[10px] font-bold text-slate-500">L</span>
            <input 
              type="number" 
              className="w-full bg-[#151923] border border-white/5 rounded-lg h-9 pl-8 pr-7 text-sm text-white focus:outline-none focus:border-blue-500" 
              value={Math.round(len)} 
              onChange={(e) => handleLengthChange(Number(e.target.value))}
            />
            <span className="absolute right-3 text-[10px] text-slate-500">cm</span>
          </div>
          <div className="flex-1 relative flex items-center">
            <span className="absolute left-3 text-[10px] font-bold text-slate-500">T</span>
            <input 
              type="number" 
              className="w-full bg-[#151923] border border-white/5 rounded-lg h-9 pl-8 pr-7 text-sm text-white focus:outline-none focus:border-blue-500" 
              value={wall.thickness} 
              onChange={(e) => updateWallDebounced(wall.id, { thickness: Number(e.target.value) })}
            />
            <span className="absolute right-3 text-[10px] text-slate-500">px</span>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-16">Color</label>
          <input
            type="color"
            value={wall.color || "var(--color-dark-midnight-blue-800)"}
            onChange={(e) => updateWall(wall.id, { color: e.target.value })}
            className="w-full h-8 rounded-lg border border-white/5 bg-[#151923] cursor-pointer p-1"
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className={labelClass}>Start Point</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className={smallLabelClass}>X</span>
              <input type="number" value={Math.round(wall.start.x)} onChange={(e) => updateWall(wall.id, { start: { ...wall.start, x: Number(e.target.value) } })} className={inputClass} />
            </div>
            <div>
              <span className={smallLabelClass}>Y</span>
              <input type="number" value={Math.round(wall.start.y)} onChange={(e) => updateWall(wall.id, { start: { ...wall.start, y: Number(e.target.value) } })} className={inputClass} />
            </div>
          </div>
        </div>
        <div>
          <label className={labelClass}>End Point</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className={smallLabelClass}>X</span>
              <input type="number" value={Math.round(wall.end.x)} onChange={(e) => updateWall(wall.id, { end: { ...wall.end, x: Number(e.target.value) } })} className={inputClass} />
            </div>
            <div>
              <span className={smallLabelClass}>Y</span>
              <input type="number" value={Math.round(wall.end.y)} onChange={(e) => updateWall(wall.id, { end: { ...wall.end, y: Number(e.target.value) } })} className={inputClass} />
            </div>
          </div>
        </div>
        <DeleteButton onDelete={() => deleteItem(wall.id)} />
      </div>
    </div>
  );
}

function RoomProperties({ room }: { room: Room }) {
  const updateRoom = usePlannerStore((s) => s.updateRoom);
  const updateRoomDebounced = usePlannerStore((s) => s.updateRoomDebounced);
  const deleteItem = usePlannerStore((s) => s.deleteItem);
  const addZone = usePlannerStore((s) => s.addZone);
  const zones = usePlannerStore((s) => s.zones);
  const furniture = usePlannerStore((s) => s.furniture);
  const area = polygonArea(room.points) / 10000;
  const perimeter = polygonPerimeter(room.points) / 100;
  const { setOpen: setAIOpen } = useAIStore();
  const isEmpty = furniture.length === 0;
  const [showRoomSuggestions, setShowRoomSuggestions] = useState(false);
  const roomZoneName = `${room.name} Zone`;
  const hasMatchingZone = zones.some((zone) => zone.name === roomZoneName);

  const handleCreateZone = () => {
    if (hasMatchingZone) return;
    addZone(room.points, roomZoneName, "Custom");
  };

  return (
    <div className="flex flex-col h-full bg-[#1e2330] text-slate-300">
      <div className="p-4 border-b border-white/5">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Properties</p>
        <div className="flex items-start justify-between">
          <div className="min-w-0 pr-2">
            <h2 className="text-white text-[15px] font-bold leading-tight truncate">{room.name || "Room"}</h2>
            <p className="text-blue-500 text-[11px] font-bold uppercase tracking-wider mt-0.5 truncate">ENCLOSURE</p>
          </div>
          <button className="w-8 h-8 shrink-0 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <Lock size={14} />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-white/5 space-y-4">
        <div className="rounded-xl border border-[var(--color-accent)]/12 bg-[var(--color-accent)]/8 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-white">Room Workflow</p>
              <p className="mt-1 text-[11px] text-white/45">
                Use presets to furnish this room, then create a matching zone for review and handoff.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-[10px] text-white/45">
              {area.toFixed(1)} m²
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowRoomSuggestions(true)}
              className="rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/14 px-3 py-2 text-[11px] text-white transition-all hover:bg-[var(--color-accent)]/20"
            >
              Preset Layout
            </button>
            <button
              onClick={handleCreateZone}
              disabled={hasMatchingZone}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] text-white/75 transition-all hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {hasMatchingZone ? "Zone Added" : "Create Zone"}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Name</label>
          <input
            type="text"
            value={room.name}
            onChange={(e) => updateRoom(room.id, { name: e.target.value })}
            className="w-full bg-[#151923] border border-white/5 rounded-lg h-9 px-3 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Area</label>
            <div className="h-9 bg-[#151923] border border-white/5 rounded-lg px-3 flex items-center text-sm text-white">
              {area.toFixed(2)} m²
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Perimeter</label>
            <div className="h-9 bg-[#151923] border border-white/5 rounded-lg px-3 flex items-center text-sm text-white">
              {perimeter.toFixed(2)} m
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Fill Color</label>
          <div className="flex gap-2 flex-wrap">
            {[
              "var(--surface-glass)", "var(--surface-glass)", "var(--surface-glass)",
              "var(--surface-glass)", "var(--surface-glass)", "var(--surface-glass)",
              "var(--surface-glass)", "var(--surface-glass)",
            ].map((c, i) => (
              <button
                key={`${c}-${i}`}
                onClick={() => updateRoomDebounced(room.id, { color: c })}
                className={`w-6 h-6 rounded-lg border-2 transition-all ${room.color === c ? "border-[var(--color-accent)] shadow-sm" : "border-white/[0.12]"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        
        <div className="flex gap-3 items-center">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-24">Wall Color</label>
          <input
            type="color"
            value={room.wallColor || "var(--color-bronze-50)"}
            onChange={(e) => updateRoom(room.id, { wallColor: e.target.value })}
            className="w-full h-8 rounded-lg border border-white/5 bg-[#151923] cursor-pointer p-1"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Floor Material</label>
          <div className="grid grid-cols-1 gap-1.5">
            {([
              { value: "default" as FloorMaterial, label: "Default", preview: "bg-gradient-to-br from-blue-200/30 to-blue-100/30" },
              { value: "wood" as FloorMaterial, label: "Wood Planks", preview: "bg-gradient-to-br from-amber-600 to-amber-700" },
              { value: "tile" as FloorMaterial, label: "Ceramic Tile", preview: "bg-gradient-to-br from-stone-200 to-stone-300" },
              { value: "marble" as FloorMaterial, label: "Marble", preview: "bg-gradient-to-br from-gray-100 to-gray-200" },
              { value: "concrete" as FloorMaterial, label: "Concrete", preview: "bg-gradient-to-br from-gray-400 to-gray-500" },
            ]).map((mat) => (
              <button
                key={mat.value}
                onClick={() => updateRoom(room.id, { floorMaterial: mat.value })}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] transition-all ${
                  (room.floorMaterial || "default") === mat.value
                    ? "bg-[#1e2738] text-white border border-blue-500/50"
                    : "bg-[#151923] text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"
                }`}
              >
                <span className={`w-5 h-5 rounded-md ${mat.preview} border border-white/10 shrink-0`} />
                {mat.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setAIOpen(true)}
          className="w-full h-10 rounded-lg border border-blue-500/30 bg-blue-500/10 flex items-center justify-center px-3 hover:bg-blue-500/20 transition-colors mt-2"
          title="Open AI assistant to auto-furnish this room"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 mr-2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          <span className="text-sm text-blue-400 font-medium">{isEmpty ? "Auto-furnish with AI" : "Get AI suggestions"}</span>
        </button>

        <DeleteButton onDelete={() => deleteItem(room.id)} />
      </div>

      {showRoomSuggestions && (
        <RoomTypeSuggestions room={room} onClose={() => setShowRoomSuggestions(false)} />
      )}
    </div>
  );
}
function DoorProperties({ door }: { door: DoorItem }) {
  const updateDoor = usePlannerStore((s) => s.updateDoor);
  const updateDoorDebounced = usePlannerStore((s) => s.updateDoorDebounced);
  const deleteItem = usePlannerStore((s) => s.deleteItem);

  return (
    <div className="flex flex-col h-full bg-[#1e2330] text-slate-300">
      <div className="p-4 border-b border-white/5">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Properties</p>
        <div className="flex items-start justify-between">
          <div className="min-w-0 pr-2">
            <h2 className="text-white text-[15px] font-bold leading-tight truncate">Door</h2>
            <p className="text-blue-500 text-[11px] font-bold uppercase tracking-wider mt-0.5 truncate">OPENING</p>
          </div>
          <button className="w-8 h-8 shrink-0 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <Lock size={14} />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-white/5 space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Width</label>
          <div className="flex items-center relative">
            <span className="absolute left-3 text-[10px] font-bold text-slate-500">W</span>
            <input
              type="number"
              min="30"
              max="120"
              value={door.width}
              onChange={(e) => updateDoor(door.id, { width: Number(e.target.value) })}
              className="w-full bg-[#151923] border border-white/5 rounded-lg h-9 pl-8 pr-7 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <span className="absolute right-3 text-[10px] text-slate-500">cm</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Swing Direction</label>
          <div className="flex gap-1 bg-[#151923] p-1 rounded-lg border border-white/5">
            {(["left", "right", "double"] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => updateDoor(door.id, { swing: dir })}
                className={`flex-1 px-2 py-1.5 rounded-md text-[11px] capitalize transition-all ${
                  (door.swing || "right") === dir
                    ? "bg-[#1e2738] text-white border border-blue-500/50 shadow-sm"
                    : "text-slate-400 hover:text-white border border-transparent"
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Opening Angle</label>
            <span className="text-[10px] text-white/50">{door.openAngle || 90}°</span>
          </div>
          <input
            type="range"
            min="30"
            max="180"
            value={door.openAngle || 90}
            onChange={(e) => updateDoor(door.id, { openAngle: Number(e.target.value) })}
            className="w-full accent-blue-500"
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Position</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">X</span>
              <input type="number" value={Math.round(door.x)} onChange={(e) => updateDoor(door.id, { x: Number(e.target.value) })} className="w-full bg-[#151923] border border-white/5 rounded-lg h-9 pl-8 pr-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">Y</span>
              <input type="number" value={Math.round(door.y)} onChange={(e) => updateDoor(door.id, { y: Number(e.target.value) })} className="w-full bg-[#151923] border border-white/5 rounded-lg h-9 pl-8 pr-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Rotation</label>
            <span className="text-[10px] text-white/50">{Math.round(door.rotation)}°</span>
          </div>
          <div className="flex gap-3">
            <input
              type="range"
              min="0"
              max="360"
              value={door.rotation}
              onChange={(e) => updateDoorDebounced(door.id, { rotation: Number(e.target.value) })}
              className="w-full accent-blue-500 flex-1"
            />
            <button 
              onClick={() => updateDoor(door.id, { rotation: 0 })}
              className="w-8 h-8 shrink-0 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors -mt-2"
              title="Reset Rotation"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        <DeleteButton onDelete={() => deleteItem(door.id)} />
      </div>
    </div>
  );
}

function WindowProperties({ win }: { win: WindowItem }) {
  const updateWindow = usePlannerStore((s) => s.updateWindow);
  const updateWindowDebounced = usePlannerStore((s) => s.updateWindowDebounced);
  const deleteItem = usePlannerStore((s) => s.deleteItem);

  return (
    <div className="flex flex-col h-full bg-[#1e2330] text-slate-300">
      <div className="p-4 border-b border-white/5">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Properties</p>
        <div className="flex items-start justify-between">
          <div className="min-w-0 pr-2">
            <h2 className="text-white text-[15px] font-bold leading-tight truncate">Window</h2>
            <p className="text-blue-500 text-[11px] font-bold uppercase tracking-wider mt-0.5 truncate">OPENING</p>
          </div>
          <button className="w-8 h-8 shrink-0 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <Lock size={14} />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-white/5 space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Width</label>
          <div className="flex items-center relative">
            <span className="absolute left-3 text-[10px] font-bold text-slate-500">W</span>
            <input
              type="number"
              min="20"
              max="200"
              value={win.width}
              onChange={(e) => updateWindow(win.id, { width: Number(e.target.value) })}
              className="w-full bg-[#151923] border border-white/5 rounded-lg h-9 pl-8 pr-7 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <span className="absolute right-3 text-[10px] text-slate-500">cm</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Style</label>
          <div className="relative">
            <select
              value={win.style || "single"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "single" || val === "double" || val === "sliding") {
                  updateWindow(win.id, { style: val });
                }
              }}
              className="w-full bg-[#151923] border border-white/5 rounded-lg h-9 px-3 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="single">Single Pane</option>
              <option value="double">Double Pane</option>
              <option value="sliding">Sliding</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Position</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">X</span>
              <input type="number" value={Math.round(win.x)} onChange={(e) => updateWindow(win.id, { x: Number(e.target.value) })} className="w-full bg-[#151923] border border-white/5 rounded-lg h-9 pl-8 pr-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">Y</span>
              <input type="number" value={Math.round(win.y)} onChange={(e) => updateWindow(win.id, { y: Number(e.target.value) })} className="w-full bg-[#151923] border border-white/5 rounded-lg h-9 pl-8 pr-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Rotation</label>
            <span className="text-[10px] text-white/50">{Math.round(win.rotation)}°</span>
          </div>
          <div className="flex gap-3">
            <input
              type="range"
              min="0"
              max="360"
              value={win.rotation}
              onChange={(e) => updateWindowDebounced(win.id, { rotation: Number(e.target.value) })}
              className="w-full accent-blue-500 flex-1"
            />
            <button 
              onClick={() => updateWindow(win.id, { rotation: 0 })}
              className="w-8 h-8 shrink-0 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors -mt-2"
              title="Reset Rotation"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        <DeleteButton onDelete={() => deleteItem(win.id)} />
      </div>
    </div>
  );
}

function FurnitureProperties({ item }: { item: FurnitureItem }) {
  const updateFurniture = usePlannerStore((s) => s.updateFurniture);
  const updateFurnitureDebounced = usePlannerStore((s) => s.updateFurnitureDebounced);
  const deleteItem = usePlannerStore((s) => s.deleteItem);
  const duplicateSelected = usePlannerStore((s) => s.duplicateSelected);
  const bringToFront = usePlannerStore((s) => s.bringToFront);
  const sendToBack = usePlannerStore((s) => s.sendToBack);
  const [replacementSearch, setReplacementSearch] = useState("");
  const currentCatalogItem = useMemo(() => getCatalogItemById(item.catalogId), [item.catalogId]);
  const replacementOptions = useMemo(
    () => rankCatalogReplacementOptions(currentCatalogItem, replacementSearch).slice(0, 6),
    [currentCatalogItem, replacementSearch],
  );

  const applyReplacement = (catalogItem: CatalogItem) => {
    updateFurniture(item.id, {
      catalogId: catalogItem.id,
      name: catalogItem.name,
      width: catalogItem.widthMm / 10,
      height: catalogItem.depthMm / 10,
      shape: catalogItem.shape,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#1e2330] text-slate-300">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 pr-2">
            <h2 className="text-white text-[15px] font-bold leading-tight truncate">{item.name || "Team B"}</h2>
            <p className="text-blue-500 text-[11px] font-bold uppercase tracking-wider mt-0.5 truncate">{(item.name || "TEAM-B").toUpperCase()}</p>
          </div>
          <button className="w-8 h-8 shrink-0 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <Lock size={14} />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-white/5">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Dimensions & Positioning</p>
        
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative flex items-center">
            <span className="absolute left-3 text-[10px] font-bold text-slate-500">W</span>
            <input 
              type="number" 
              className="w-full bg-[#151923] border border-white/5 rounded-lg h-9 pl-8 pr-7 text-sm text-white focus:outline-none focus:border-blue-500" 
              value={Math.round(item.width)} 
              onChange={(e) => updateFurnitureDebounced(item.id, { width: Number(e.target.value) })}
            />
            <span className="absolute right-3 text-[10px] text-slate-500">mm</span>
          </div>
          <div className="flex-1 relative flex items-center">
            <span className="absolute left-3 text-[10px] font-bold text-slate-500">H</span>
            <input 
              type="number" 
              className="w-full bg-[#151923] border border-white/5 rounded-lg h-9 pl-8 pr-7 text-sm text-white focus:outline-none focus:border-blue-500" 
              value={Math.round(item.height)} 
              onChange={(e) => updateFurnitureDebounced(item.id, { height: Number(e.target.value) })}
            />
            <span className="absolute right-3 text-[10px] text-slate-500">mm</span>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative flex items-center">
            <span className="absolute left-3 text-[10px] font-bold text-slate-500">Rot.</span>
            <input 
              type="number" 
              className="w-full bg-[#151923] border border-white/5 rounded-lg h-9 pl-10 pr-6 text-sm text-white focus:outline-none focus:border-blue-500" 
              value={Math.round(item.rotation)} 
              onChange={(e) => updateFurnitureDebounced(item.id, { rotation: Number(e.target.value) })}
            />
            <span className="absolute right-3 text-[10px] text-slate-500">°</span>
          </div>
          <button 
            onClick={() => updateFurniture(item.id, { rotation: 0 })}
            className="w-9 h-9 shrink-0 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Reset Rotation"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-white/5">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Team Assignment</p>
        <button className="w-full h-10 rounded-lg border border-white/5 bg-[#151923] flex items-center px-3 hover:bg-white/5 transition-colors">
          <Users size={16} className="text-blue-500 mr-2" />
          <span className="text-sm text-slate-400">Assign team...</span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className={labelClass}>Position</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className={smallLabelClass}>X</span>
              <input type="number" value={Math.round(item.x)} onChange={(e) => updateFurniture(item.id, { x: Number(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <span className={smallLabelClass}>Y</span>
              <input type="number" value={Math.round(item.y)} onChange={(e) => updateFurniture(item.id, { y: Number(e.target.value) })} className={inputClass} />
            </div>
          </div>
        </div>
        
        <div>
          <label className={labelClass}>Color</label>
          <input
            type="color"
            value={item.color.startsWith("rgba") ? "var(--color-bronze-600)" : item.color}
            onChange={(e) => updateFurnitureDebounced(item.id, { color: e.target.value })}
            className="w-8 h-8 rounded-lg border border-white/[0.12] bg-transparent cursor-pointer"
          />
        </div>
        
        <div className="space-y-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <label className={labelClass}>Replace Item</label>
              <p className="text-[11px] text-white/40">
                Swap the selected piece without losing its placement.
              </p>
            </div>
            {currentCatalogItem && (
              <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-white/45">
                {categoryLabels[currentCatalogItem.category]}
              </span>
            )}
          </div>
          <input
            type="text"
            value={replacementSearch}
            onChange={(e) => setReplacementSearch(e.target.value)}
            placeholder="Search similar furniture..."
            className={inputClass}
          />
          {currentCatalogItem && !replacementSearch && (
            <p className="text-[10px] text-white/30">
              Showing closest matches to {currentCatalogItem.name}.
            </p>
          )}
          <div className="space-y-1.5">
            {replacementOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => applyReplacement(option)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left transition-all hover:border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/8"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] text-white/80">{option.name}</p>
                  <p className="text-[10px] text-white/35">
                    {categoryLabels[option.category]} · {option.widthMm}x{option.depthMm}mm
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-[var(--color-accent)]">Replace</span>
              </button>
            ))}
            {replacementOptions.length === 0 && (
              <p className="rounded-lg border border-dashed border-white/[0.08] px-3 py-2 text-[11px] text-white/35">
                No matching replacement items found.
              </p>
            )}
          </div>
        </div>
        <div>
          <label className={labelClass}>Layer Order</label>
          <div className="flex gap-1">
            <button
              onClick={() => bringToFront(item.id)}
              className="flex-1 px-2 py-1.5 rounded-lg text-[11px] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-all border border-white/[0.04]"
            >
              Bring to Front
            </button>
            <button
              onClick={() => sendToBack(item.id)}
              className="flex-1 px-2 py-1.5 rounded-lg text-[11px] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-all border border-white/[0.04]"
            >
              Send to Back
            </button>
          </div>
        </div>
        <button
          onClick={duplicateSelected}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[var(--color-bronze-300)] bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/15 transition-all border border-[var(--color-accent)]/15"
        >
          Duplicate (Ctrl+D)
        </button>
        <DeleteButton onDelete={() => deleteItem(item.id)} />
      </div>
    </div>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <button
      onClick={onDelete}
      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] text-red-400 bg-red-500/10 hover:bg-red-500/15 transition-all mt-2 border border-red-500/10"
    >
      Delete Item
    </button>
  );
}

export function PropertiesPanel() {
  const selectedId = usePlannerStore((s) => s.selectedId);
  const walls = usePlannerStore((s) => s.walls);
  const rooms = usePlannerStore((s) => s.rooms);
  const furniture = usePlannerStore((s) => s.furniture);
  const doors = usePlannerStore((s) => s.doors);
  const windows = usePlannerStore((s) => s.windows);

  if (!selectedId) {
    return (
      <div
        className="h-full flex flex-col text-white border-l bg-[#1e2330]"
        style={{
          borderColor: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
        }}
      >
        <div
          className="p-4 border-b border-white/5"
        >
          <h3 className="text-[13px] font-semibold text-[var(--color-accent)]">Properties</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[12px] text-white/25 text-center mb-6">Select an item on the canvas to view its properties</p>
          
          {/* Project-level TagEditor */}
          <div className="border-t border-white/[0.08] pt-4">
            <TagEditor />
          </div>
        </div>
      </div>
    );
  }

  const furnitureItem = furniture.find((f) => f.id === selectedId);
  const wallItem = walls.find((w) => w.id === selectedId);
  const roomItem = rooms.find((r) => r.id === selectedId);
  const doorItem = doors.find((d) => d.id === selectedId);
  const windowItem = windows.find((w) => w.id === selectedId);

  return (
    <div
      className="h-full flex flex-col text-white border-l bg-[#1e2330]"
      style={{
        borderColor: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
      }}
    >
      <div className="flex-1 overflow-y-auto">
        {wallItem && <WallProperties wall={wallItem} />}
        {roomItem && <RoomProperties room={roomItem} />}
        {furnitureItem && <FurnitureProperties item={furnitureItem} />}
        {doorItem && <DoorProperties door={doorItem} />}
        {windowItem && <WindowProperties win={windowItem} />}
        {!wallItem && !roomItem && !furnitureItem && !doorItem && !windowItem && (
          <p className="text-[12px] text-white/30 text-center">Item not found</p>
        )}
      </div>
    </div>
  );
}
