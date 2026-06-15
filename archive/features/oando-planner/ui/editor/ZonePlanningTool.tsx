"use client";
import { useState } from "react";
import type { ZoneType, Zone } from "@/features/oando-planner/data/plannerStore";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import { useToastStore } from "@/features/oando-planner/data/toastStore";

const ZONE_TYPES: { type: ZoneType; icon: string; desc: string }[] = [
  { type: "Open Plan", icon: "🏢", desc: "Open workstation area" },
  { type: "Executive", icon: "👔", desc: "Private offices" },
  { type: "Meeting", icon: "🤝", desc: "Conference rooms" },
  { type: "Reception", icon: "🛎️", desc: "Entry & waiting area" },
  { type: "Cafeteria", icon: "☕", desc: "Break & dining area" },
  { type: "Server Room", icon: "🖥️", desc: "IT infrastructure" },
  { type: "Custom", icon: "🏷️", desc: "Custom zone type" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const ZONE_OCCUPANCY_DENSITY: Record<ZoneType, number> = {
  "Open Plan": 4.5,
  "Executive": 12,
  "Meeting": 2.5,
  "Reception": 3.5,
  "Cafeteria": 1.8,
  "Server Room": 18,
  "Custom": 5,
};

function getPolygonAreaSqm(points: Zone["points"]): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    area += points[i].x * points[next].y;
    area -= points[next].x * points[i].y;
  }

  return Math.abs(area) / 2 / 10000;
}

function getZoneOccupancyHint(zone: Zone): { area: string; capacity: number | string; isInfrastructure: boolean } {
  const areaSqm = getPolygonAreaSqm(zone.points);
  const density = ZONE_OCCUPANCY_DENSITY[zone.type];
  const capacity = Math.max(1, Math.floor(areaSqm / density));

  if (zone.type === "Server Room") {
    return { area: areaSqm.toFixed(1), capacity: "Infrastructure", isInfrastructure: true };
  }

  return { area: areaSqm.toFixed(1), capacity, isInfrastructure: false };
}

export function ZonePlanningPanel({ open, onClose }: Props) {
  const zones = usePlannerStore((s) => s.zones);
  const rooms = usePlannerStore((s) => s.rooms);
  const activeZoneType = usePlannerStore((s) => s.activeZoneType);
  const setActiveZoneType = usePlannerStore((s) => s.setActiveZoneType);
  const setTool = usePlannerStore((s) => s.setTool);
  const tool = usePlannerStore((s) => s.tool);
  const addZone = usePlannerStore((s) => s.addZone);
  const updateZone = usePlannerStore((s) => s.updateZone);
  const deleteZone = usePlannerStore((s) => s.deleteZone);
  const addToast = useToastStore((s) => s.addToast);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  if (!open) return null;

  const handleStartDrawing = (type: ZoneType) => {
    setActiveZoneType(type);
    setTool("zone");
    addToast("info", `Click on canvas to draw ${type} zone. Close shape to finish.`);
  };

  const handleRenameStart = (zone: Zone) => {
    setEditingId(zone.id);
    setEditName(zone.name);
  };

  const handleRenameConfirm = () => {
    if (editingId && editName.trim()) {
      updateZone(editingId, { name: editName.trim() });
    }
    setEditingId(null);
  };

  const handleCreateZonesFromRooms = () => {
    const roomsWithoutZones = rooms.filter((room) => !zones.some((zone) => zone.name === `${room.name} Zone`));
    if (roomsWithoutZones.length === 0) {
      addToast("info", "All rooms already have matching zones.");
      return;
    }

    roomsWithoutZones.forEach((room) => {
      addZone(room.points, `${room.name} Zone`, "Custom");
    });
    addToast("success", `Created ${roomsWithoutZones.length} review zone${roomsWithoutZones.length === 1 ? "" : "s"} from rooms.`);
  };

  return (
    <div 
      className="fixed inset-y-0 right-0 z-[80] w-[320px] flex flex-col shadow-2xl transition-all duration-300"
      style={{ 
        background: "var(--surface-panel)", 
        borderLeft: "1px solid var(--border-soft)",
        backdropFilter: "blur(var(--blur-lg))",
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-soft)" }}>
        <div>
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--text-strong)" }}>Zone Planning</h2>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Define departmental zones & capacities</p>
        </div>
        <button onClick={onClose} className="text-xl transition-colors hover:scale-110" style={{ color: "var(--text-muted)" }}>&times;</button>
      </div>

      <div className="p-4 border-b" style={{ borderColor: "var(--border-soft)", background: "var(--surface-hover)" }}>
        <p className="text-[10px] uppercase tracking-[0.15em] mb-3 font-semibold" style={{ color: "var(--text-subtle)" }}>Draw New Zone</p>
        
        <button
          onClick={handleCreateZonesFromRooms}
          className="mb-4 w-full rounded-xl border px-4 py-3 text-left transition-all hover:shadow-[var(--shadow-lift)]"
          style={{ 
            background: "var(--surface-panel-soft)", 
            borderColor: "var(--border-strong)",
          }}
        >
          <p className="text-[12px] font-semibold" style={{ color: "var(--text-strong)" }}>Create zones from rooms</p>
          <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Auto-generate zone overlays matching your drawn rooms.</p>
        </button>
        
        <div className="grid grid-cols-2 gap-2">
          {ZONE_TYPES.map(({ type, icon, desc }) => {
            const isActive = tool === "zone" && activeZoneType === type;
            return (
              <button
                key={type}
                onClick={() => handleStartDrawing(type)}
                className="flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-all hover:-translate-y-0.5"
                style={{
                  background: isActive ? "var(--surface-accent-wash)" : "var(--surface-panel-soft)",
                  border: `1px solid ${isActive ? "var(--border-accent)" : "var(--border-soft)"}`,
                  boxShadow: isActive ? "0 0 12px var(--surface-glass)" : "none",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{icon}</span>
                  <p className="text-[11px] font-semibold" style={{ color: isActive ? "var(--color-ocean-boat-blue-400)" : "var(--text-strong)" }}>{type}</p>
                </div>
                <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.15em] mb-2 font-semibold" style={{ color: "var(--text-subtle)" }}>Active Zones ({zones.length})</p>
        
        {zones.length === 0 ? (
          <div className="text-center py-10 opacity-60">
            <p className="text-[32px] mb-2">📐</p>
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No zones defined yet.<br/>Select a type above to start drawing.</p>
          </div>
        ) : (
          zones.map((zone) => {
            const hint = getZoneOccupancyHint(zone);
            return (
              <div
                key={zone.id}
                className="rounded-xl border p-4 transition-all hover:shadow-[var(--shadow-panel)]"
                style={{ background: "var(--surface-glass)", borderColor: "var(--border-soft)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-4 h-4 rounded-full border-2"
                    style={{ backgroundColor: zone.color, borderColor: "var(--surface-panel)" }}
                  />
                  {editingId === zone.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleRenameConfirm}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameConfirm()}
                      className="flex-1 bg-transparent text-[13px] font-semibold px-2 py-1 rounded outline-none border-b-2"
                      style={{ color: "var(--text-strong)", borderColor: "var(--color-ocean-boat-blue-500)" }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="flex-1 text-[13px] font-semibold cursor-pointer transition-colors"
                      style={{ color: "var(--text-strong)" }}
                      onClick={() => handleRenameStart(zone)}
                    >
                      {zone.name}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 px-3 py-2 rounded-lg" style={{ background: "var(--surface-panel-soft)", border: "1px solid var(--border-soft)" }}>
                    <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "var(--text-subtle)" }}>Area</p>
                    <p className="text-[12px] font-medium" style={{ color: "var(--text-body)" }}>{hint.area} m²</p>
                  </div>
                  <div className="flex-1 px-3 py-2 rounded-lg" style={{ background: hint.isInfrastructure ? "var(--surface-panel-soft)" : "var(--surface-accent-wash)", border: "1px solid var(--border-soft)" }}>
                    <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "var(--text-subtle)" }}>Capacity</p>
                    <p className="text-[12px] font-semibold" style={{ color: hint.isInfrastructure ? "var(--text-body)" : "var(--color-ocean-boat-blue-400)" }}>
                      {hint.capacity} {hint.isInfrastructure ? "" : "people"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border-soft)" }}>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{zone.type} · {zone.points.length} points</span>
                  <button
                    onClick={() => deleteZone(zone.id)}
                    className="text-[10px] font-medium transition-colors hover:scale-105"
                    style={{ color: "var(--color-danger)" }}
                  >
                    Delete Zone
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
