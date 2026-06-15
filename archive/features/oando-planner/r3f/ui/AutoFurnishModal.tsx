"use client";

import { useState, useCallback } from "react";
import { X, Wand2, Loader2 } from "lucide-react";
import type { CatalogItem } from "@/features/planner/shared/catalog/types";
import type { MeshFamily } from "@/features/planner/shared/mesh-contract";
import { usePlannerR3FStore, type PlacedItem } from "../usePlannerR3FStore";
import { cn } from "@/lib/utils";

function resolveMeshType(item: CatalogItem): MeshFamily {
  if (item.meshType) return item.meshType;
  const cat = item.category.toLowerCase();
  if (cat.includes("desk") || cat.includes("workstation")) return "desk-rect";
  if (cat.includes("chair") || cat.includes("seat")) return "task-chair";
  if (cat.includes("table")) return "table-rect";
  if (cat.includes("sofa") || cat.includes("lounge")) return "sofa";
  if (cat.includes("storage") || cat.includes("cabinet")) return "storage-cabinet";
  return "utility-box";
}

interface AutoFurnishModalProps {
  open: boolean;
  onClose: () => void;
  catalog: CatalogItem[];
  guestMode?: boolean;
}

const ROOM_TYPES = [
  { id: "office", label: "Private Office", icon: "🏢", categories: ["desks", "seating", "storage"] },
  { id: "meeting", label: "Meeting Room", icon: "🤝", categories: ["tables", "seating"] },
  { id: "breakroom", label: "Break Room", icon: "☕", categories: ["tables", "seating", "storage"] },
  { id: "reception", label: "Reception", icon: "🛋️", categories: ["sofa", "tables", "storage"] },
  { id: "open-office", label: "Open Office", icon: "🖥️", categories: ["desks", "seating", "storage"] },
  { id: "lounge", label: "Lounge Area", icon: "🛎️", categories: ["sofa", "lounge", "tables"] },
];

const STYLE_PRESETS = [
  { id: "modern", label: "Modern", desc: "Clean lines, minimal" },
  { id: "executive", label: "Executive", desc: "Premium, spacious" },
  { id: "collaborative", label: "Collaborative", desc: "Open, team-focused" },
  { id: "compact", label: "Compact", desc: "Space-efficient" },
];

function layoutItems(
  roomType: string,
  style: string,
  catalog: CatalogItem[],
  roomWidthMm: number,
  roomDepthMm: number,
): Omit<PlacedItem, "id">[] {
  const roomW = roomWidthMm / 1000;
  const roomD = roomDepthMm / 1000;
  const items: Omit<PlacedItem, "id">[] = [];
  const roomConfig = ROOM_TYPES.find((r) => r.id === roomType);
  if (!roomConfig) return items;

  const matchingItems = catalog.filter((c) =>
    roomConfig.categories.some((cat) => c.category.includes(cat)),
  );

  const densityFactor = style === "compact" ? 1.3 : style === "executive" ? 0.6 : style === "collaborative" ? 0.9 : 1.0;
  const maxItems = Math.max(2, Math.floor((roomW * roomD) * densityFactor));

  const desks = matchingItems.filter((c) => c.category.includes("desk"));
  const chairs = matchingItems.filter((c) => c.category.includes("seat") || c.category.includes("chair"));
  const tables = matchingItems.filter((c) => c.category.includes("table"));
  const storage = matchingItems.filter((c) => c.category.includes("storage"));
  const sofas = matchingItems.filter((c) => c.category.includes("sofa") || c.category.includes("lounge"));

  let placed = 0;
  const padding = 0.4;

  if (roomType === "office" || roomType === "open-office") {
    const desk = desks[0] || tables[0];
    const chair = chairs[0];

    if (desk && placed < maxItems) {
      const dW = desk.dimensions.widthMm / 1000;
      const dD = desk.dimensions.depthMm / 1000;
      const cols = Math.max(1, Math.floor((roomW - padding * 2) / (dW + 0.3)));
      const rows = Math.max(1, Math.floor((roomD - padding * 2) / (dD + 1.0)));

      for (let r = 0; r < rows && placed < maxItems; r++) {
        for (let c = 0; c < cols && placed < maxItems; c++) {
          const x = padding + dW / 2 + c * (dW + 0.3);
          const z = padding + dD / 2 + r * (dD + 1.0);
          if (x + dW / 2 > roomW - padding || z + dD / 2 > roomD - padding) continue;

          items.push({
            catalogId: desk.id,
            name: desk.name,
            category: desk.category,
            meshType: resolveMeshType(desk),
            widthMm: desk.dimensions.widthMm,
            depthMm: desk.dimensions.depthMm,
            heightMm: desk.dimensions.heightMm,
            position: [x, 0, z],
            rotation: 0,
            color: desk.color,
          });
          placed++;

          if (chair && placed < maxItems) {
            items.push({
              catalogId: chair.id,
              name: chair.name,
              category: chair.category,
              meshType: resolveMeshType(chair),
              widthMm: chair.dimensions.widthMm,
              depthMm: chair.dimensions.depthMm,
              heightMm: chair.dimensions.heightMm,
              position: [x, 0, z + dD / 2 + 0.4],
              rotation: Math.PI,
              color: chair.color,
            });
            placed++;
          }
        }
      }
    }
  } else if (roomType === "meeting") {
    const table = tables[0] || desks[0];
    const chair = chairs[0];

    if (table) {
      const cx = roomW / 2;
      const cz = roomD / 2;
      items.push({
        catalogId: table.id,
        name: table.name,
        category: table.category,
        meshType: resolveMeshType(table),
        widthMm: table.dimensions.widthMm,
        depthMm: table.dimensions.depthMm,
        heightMm: table.dimensions.heightMm,
        position: [cx, 0, cz],
        rotation: 0,
        color: table.color,
      });
      placed++;

      if (chair) {
        const tW = table.dimensions.widthMm / 1000;
        const tD = table.dimensions.depthMm / 1000;
        const chairsPerSide = Math.max(2, Math.floor(tW / 0.6));

        for (let i = 0; i < chairsPerSide && placed < maxItems; i++) {
          const ox = cx - tW / 2 + 0.3 + i * (tW / chairsPerSide);
          items.push({
            catalogId: chair.id, name: chair.name, category: chair.category,
            meshType: resolveMeshType(chair), widthMm: chair.dimensions.widthMm,
            depthMm: chair.dimensions.depthMm, heightMm: chair.dimensions.heightMm,
            position: [ox, 0, cz - tD / 2 - 0.35], rotation: 0, color: chair.color,
          });
          placed++;
          if (placed < maxItems) {
            items.push({
              catalogId: chair.id, name: chair.name, category: chair.category,
              meshType: resolveMeshType(chair), widthMm: chair.dimensions.widthMm,
              depthMm: chair.dimensions.depthMm, heightMm: chair.dimensions.heightMm,
              position: [ox, 0, cz + tD / 2 + 0.35], rotation: Math.PI, color: chair.color,
            });
            placed++;
          }
        }
      }
    }
  } else if (roomType === "reception" || roomType === "lounge") {
    const sofa = sofas[0];
    const table = tables[0];

    if (sofa) {
      items.push({
        catalogId: sofa.id, name: sofa.name, category: sofa.category,
        meshType: resolveMeshType(sofa), widthMm: sofa.dimensions.widthMm,
        depthMm: sofa.dimensions.depthMm, heightMm: sofa.dimensions.heightMm,
        position: [roomW / 2, 0, roomD - 1], rotation: 0, color: sofa.color,
      });
      placed++;
    }
    if (table && placed < maxItems) {
      items.push({
        catalogId: table.id, name: table.name, category: table.category,
        meshType: resolveMeshType(table), widthMm: table.dimensions.widthMm,
        depthMm: table.dimensions.depthMm, heightMm: table.dimensions.heightMm,
        position: [roomW / 2, 0, roomD / 2], rotation: 0, color: table.color,
      });
      placed++;
    }
  } else {
    const table = tables[0] || desks[0];
    const chair = chairs[0];
    if (table) {
      items.push({
        catalogId: table.id, name: table.name, category: table.category,
        meshType: resolveMeshType(table), widthMm: table.dimensions.widthMm,
        depthMm: table.dimensions.depthMm, heightMm: table.dimensions.heightMm,
        position: [roomW / 2, 0, roomD / 2], rotation: 0, color: table.color,
      });
      placed++;
    }
    if (chair && placed < maxItems) {
      items.push({
        catalogId: chair.id, name: chair.name, category: chair.category,
        meshType: resolveMeshType(chair), widthMm: chair.dimensions.widthMm,
        depthMm: chair.dimensions.depthMm, heightMm: chair.dimensions.heightMm,
        position: [roomW / 2, 0, roomD / 2 + 1], rotation: Math.PI, color: chair.color,
      });
      placed++;
    }
  }

  if (storage.length > 0 && placed < maxItems) {
    const cab = storage[0];
    items.push({
      catalogId: cab.id, name: cab.name, category: cab.category,
      meshType: resolveMeshType(cab), widthMm: cab.dimensions.widthMm,
      depthMm: cab.dimensions.depthMm, heightMm: cab.dimensions.heightMm,
      position: [roomW - 0.4, 0, padding + 0.3], rotation: Math.PI / 2, color: cab.color,
    });
  }

  return items;
}

export function AutoFurnishModal({ open, onClose, catalog, guestMode = false }: AutoFurnishModalProps) {
  const [roomType, setRoomType] = useState("office");
  const [style, setStyle] = useState("modern");
  const [loading, setLoading] = useState(false);

  const room = usePlannerR3FStore((s) => s.room);
  const addItem = usePlannerR3FStore((s) => s.addItem);
  const clearItems = usePlannerR3FStore((s) => s.clearItems);

  const [, setAiReasoning] = useState<string | null>(null);

  const handleFurnish = useCallback(async () => {
    if (guestMode) return;
    setLoading(true);
    setAiReasoning(null);

    const roomW = room.widthMm / 1000;
    const roomD = room.depthMm / 1000;
    const categories = [...new Set(catalog.map((c) => c.category))];

    let aiPlacements: { category: string; label: string; x: number; z: number; rotation: number }[] = [];

    try {
      const res = await fetch("/api/planner-ai-furnish/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomType,
          style,
          roomWidthM: roomW,
          roomDepthM: roomD,
          availableCategories: categories.slice(0, 20),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.aiAvailable && data.placements?.length > 0) {
          aiPlacements = data.placements;
          if (data.reasoning) setAiReasoning(data.reasoning);
        }
      }
    } catch {
      // AI unavailable, fall back to heuristic
    }

    clearItems();

    if (aiPlacements.length > 0) {
      for (const placement of aiPlacements) {
        if (typeof placement.category !== "string" || !placement.category) continue;
        const match = catalog.find((c) =>
          c.category.toLowerCase().includes(placement.category.toLowerCase()),
        );
        if (match) {
          addItem({
            catalogId: match.id,
            name: placement.label || match.name,
            category: match.category,
            meshType: resolveMeshType(match),
            widthMm: match.dimensions.widthMm,
            depthMm: match.dimensions.depthMm,
            heightMm: match.dimensions.heightMm,
            position: [
              Math.max(0.3, Math.min(roomW - 0.3, placement.x)),
              0,
              Math.max(0.3, Math.min(roomD - 0.3, placement.z)),
            ],
            rotation: placement.rotation ?? 0,
            color: match.color,
          });
        }
      }
    } else {
      const items = layoutItems(roomType, style, catalog, room.widthMm, room.depthMm);
      for (const item of items) {
        addItem(item);
      }
    }

    usePlannerR3FStore.getState().clearSelection();
    setLoading(false);
    onClose();
  }, [roomType, style, catalog, room, addItem, clearItems, onClose, guestMode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative w-[480px] max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-sm font-bold text-[var(--border-soft)]">Smart Furnish</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--border-soft)] mb-2">Room Type</p>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_TYPES.map((rt) => (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => setRoomType(rt.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors",
                    roomType === rt.id
                      ? "border-[var(--color-primary)] bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <span className="text-lg">{rt.icon}</span>
                  <span className="text-[10px] font-semibold text-[var(--border-soft)]">{rt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--border-soft)] mb-2">Design Style</p>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_PRESETS.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => setStyle(sp.id)}
                  className={cn(
                    "flex flex-col rounded-lg border px-3 py-2 text-left transition-colors",
                    style === sp.id
                      ? "border-[var(--color-primary)] bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <span className="text-[11px] font-semibold text-[var(--border-soft)]">{sp.label}</span>
                  <span className="text-[9px] text-[var(--border-soft)]">{sp.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-[10px] text-amber-800 leading-relaxed">
              This will replace all existing furniture. Room size: {(room.widthMm / 1000).toFixed(1)}m x {(room.depthMm / 1000).toFixed(1)}m
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-[11px] font-semibold text-[var(--border-soft)] hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFurnish}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--border-soft)] px-5 py-2 text-[11px] font-semibold text-white transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Furnishing...
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5" />
                Auto-Furnish
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
