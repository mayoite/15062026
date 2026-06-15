"use client";
import { useState } from "react";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import { useToastStore } from "@/features/oando-planner/data/toastStore";

type ClusterConfig = {
  id: string;
  name: string;
  description: string;
  icon: string;
  desks: { dx: number; dy: number; rotation: number }[];
  chairs: { dx: number; dy: number; rotation: number }[];
};

const DESK_W = 60;
const DESK_H = 30;
const CHAIR_W = 22;
const CHAIR_H = 22;
const GAP = 10;

const clusterConfigs: ClusterConfig[] = [
  {
    id: "linear-2",
    name: "Linear 2-Pack",
    description: "2 desks side by side",
    icon: "▬▬",
    desks: [
      { dx: 0, dy: 0, rotation: 0 },
      { dx: DESK_W + GAP, dy: 0, rotation: 0 },
    ],
    chairs: [
      { dx: 0, dy: DESK_H + 10, rotation: 0 },
      { dx: DESK_W + GAP, dy: DESK_H + 10, rotation: 0 },
    ],
  },
  {
    id: "linear-4",
    name: "Linear 4-Pack",
    description: "4 desks in a row, 2 facing 2",
    icon: "▬▬\n▬▬",
    desks: [
      { dx: 0, dy: 0, rotation: 0 },
      { dx: DESK_W + GAP, dy: 0, rotation: 0 },
      { dx: 0, dy: DESK_H + GAP, rotation: 180 },
      { dx: DESK_W + GAP, dy: DESK_H + GAP, rotation: 180 },
    ],
    chairs: [
      { dx: 0, dy: -CHAIR_H - 5, rotation: 0 },
      { dx: DESK_W + GAP, dy: -CHAIR_H - 5, rotation: 0 },
      { dx: 0, dy: DESK_H * 2 + GAP + 5, rotation: 180 },
      { dx: DESK_W + GAP, dy: DESK_H * 2 + GAP + 5, rotation: 180 },
    ],
  },
  {
    id: "linear-6",
    name: "Linear 6-Pack",
    description: "6 desks, 3 facing 3",
    icon: "▬▬▬\n▬▬▬",
    desks: [
      { dx: 0, dy: 0, rotation: 0 },
      { dx: DESK_W + GAP, dy: 0, rotation: 0 },
      { dx: (DESK_W + GAP) * 2, dy: 0, rotation: 0 },
      { dx: 0, dy: DESK_H + GAP, rotation: 180 },
      { dx: DESK_W + GAP, dy: DESK_H + GAP, rotation: 180 },
      { dx: (DESK_W + GAP) * 2, dy: DESK_H + GAP, rotation: 180 },
    ],
    chairs: [
      { dx: 0, dy: -CHAIR_H - 5, rotation: 0 },
      { dx: DESK_W + GAP, dy: -CHAIR_H - 5, rotation: 0 },
      { dx: (DESK_W + GAP) * 2, dy: -CHAIR_H - 5, rotation: 0 },
      { dx: 0, dy: DESK_H * 2 + GAP + 5, rotation: 180 },
      { dx: DESK_W + GAP, dy: DESK_H * 2 + GAP + 5, rotation: 180 },
      { dx: (DESK_W + GAP) * 2, dy: DESK_H * 2 + GAP + 5, rotation: 180 },
    ],
  },
  {
    id: "l-shaped-pair",
    name: "L-Shaped Pair",
    description: "2 L-shaped desks side by side",
    icon: "⌐¬",
    desks: [
      { dx: 0, dy: 0, rotation: 0 },
      { dx: 80, dy: 0, rotation: 0 },
    ],
    chairs: [
      { dx: 15, dy: 65, rotation: 0 },
      { dx: 95, dy: 65, rotation: 0 },
    ],
  },
  {
    id: "120-pod",
    name: "120° Triple Pod",
    description: "3 desks at 120° angles",
    icon: "⚡",
    desks: [
      { dx: 0, dy: -35, rotation: 0 },
      { dx: -40, dy: 20, rotation: 120 },
      { dx: 40, dy: 20, rotation: 240 },
    ],
    chairs: [
      { dx: 0, dy: -70, rotation: 0 },
      { dx: -65, dy: 40, rotation: 120 },
      { dx: 65, dy: 40, rotation: 240 },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WorkstationClusterTool({ open, onClose }: Props) {
  const [selectedConfig, setSelectedConfig] = useState<string>("linear-4");
  const [spacing, setSpacing] = useState(120);
  const addFurnitureBatch = usePlannerStore((s) => s.addFurnitureBatch);
  const panOffset = usePlannerStore((s) => s.panOffset);
  const zoom = usePlannerStore((s) => s.zoom);
  const addToast = useToastStore((s) => s.addToast);

  if (!open) return null;

  const handlePlace = () => {
    const config = clusterConfigs.find((c) => c.id === selectedConfig);
    if (!config) return;

    const cw = typeof window === "undefined" ? 400 : window.innerWidth / 2;
    const ch = typeof window === "undefined" ? 300 : window.innerHeight / 2;
    const centerX = (cw - panOffset.x) / zoom;
    const centerY = (ch - panOffset.y) / zoom;

    const spacingScale = spacing / 120;
    const items: Parameters<typeof addFurnitureBatch>[0] = [];

    config.desks.forEach((d) => {
      const isLShaped = selectedConfig === "l-shaped-pair";
      items.push({
        catalogId: isLShaped ? "desk-l" : "desk",
        name: isLShaped ? "L-Shaped Desk" : "Office Desk",
        x: centerX + d.dx * spacingScale,
        y: centerY + d.dy * spacingScale,
        width: isLShaped ? 70 : DESK_W,
        height: isLShaped ? 60 : DESK_H,
        rotation: d.rotation,
        color: "var(--color-bronze-300)",
        shape: isLShaped ? "desk-l" : "desk",
      });
    });

    config.chairs.forEach((c) => {
      items.push({
        catalogId: "office-chair",
        name: "Office Chair",
        x: centerX + c.dx * spacingScale,
        y: centerY + c.dy * spacingScale,
        width: CHAIR_W,
        height: CHAIR_H,
        rotation: c.rotation,
        color: "var(--color-dark-midnight-blue-800)",
        shape: "office-chair",
      });
    });

    addFurnitureBatch(items);
    addToast("success", `Placed ${config.name} cluster`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--surface-inverse)] rounded-xl border border-white/10 shadow-2xl w-[480px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white text-[15px] font-semibold">Workstation Clusters</h2>
            <p className="text-white/40 text-[11px] mt-0.5">Select a configuration and place it on the canvas</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto max-h-[50vh]">
          {clusterConfigs.map((config) => (
            <button
              key={config.id}
              onClick={() => setSelectedConfig(config.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-lg border transition-all ${
                selectedConfig === config.id
                  ? "border-[var(--color-ocean-boat-blue-600)] bg-[var(--color-ocean-boat-blue-600)]/10"
                  : "border-white/5 bg-white/[0.02] hover:bg-white/5"
              }`}
            >
              <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center text-2xl font-mono text-white/60 shrink-0">
                {config.icon.split("\n").map((line, i) => (
                  <span key={i} className="block text-[14px] leading-tight">{line}</span>
                ))}
              </div>
              <div className="text-left">
                <p className="text-white text-[13px] font-medium">{config.name}</p>
                <p className="text-white/40 text-[11px]">{config.description}</p>
                <p className="text-white/30 text-[10px] mt-0.5">{config.desks.length} desks + {config.chairs.length} chairs</p>
              </div>
              {selectedConfig === config.id && (
                <span className="ml-auto text-[var(--color-ocean-boat-blue-600)] text-lg">&var(--text-body);</span>
              )}
            </button>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-white/10 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Desk Spacing (cm)</label>
            <input
              type="range"
              min="80"
              max="200"
              value={spacing}
              onChange={(e) => setSpacing(Number(e.target.value))}
              className="w-full accent-[var(--color-ocean-boat-blue-600)]"
            />
            <span className="text-[10px] text-white/30">{spacing}cm</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-[12px] text-white/50 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePlace}
              className="flex-1 py-2 rounded-lg text-[12px] text-white bg-[var(--color-ocean-boat-blue-600)] hover:bg-[var(--color-ocean-boat-blue-400)] transition-colors font-medium"
            >
              Place Cluster
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
