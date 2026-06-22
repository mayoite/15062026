"use client";

import { useState, useEffect } from "react";
import { useFloorplan } from "../context/FloorplanContext";
import { Trash2, Lock, Unlock } from "lucide-react";

const FABRIC_TO_MM = 10;

export function FabricPropertiesInspector() {
  const app = useFloorplan();
  const [localAngles, setLocalAngles] = useState<Record<string, string>>({});
  const [localDimensions, setLocalDimensions] = useState<Record<string, { w: string; d: string }>>({});

  useEffect(() => {
    const angles: Record<string, string> = {};
    const dims: Record<string, { w: string; d: string }> = {};
    app.selections.forEach((sel) => {
      const id = String(sel.id ?? sel.name ?? "");
      angles[id] = String(Math.round(Number(sel.angle) || 0));
      dims[id] = {
        w: String(Math.round((Number(sel.width) || 0) * Number(sel.scaleX ?? 1) * FABRIC_TO_MM)),
        d: String(Math.round((Number(sel.height) || 0) * Number(sel.scaleY ?? 1) * FABRIC_TO_MM)),
      };
    });
    
    // Defer state update to avoid synchronous setState inside useEffect warning
    const timer = setTimeout(() => {
      setLocalAngles(angles);
      setLocalDimensions(dims);
    }, 0);
    return () => clearTimeout(timer);
  }, [app.selections]);

  if (app.selections.length === 0) {
    return null;
  }

  const handleAngleBlur = (id: string) => {
    const angle = Number(localAngles[id]);
    if (!isNaN(angle)) {
      app.setObjectRotation(id, angle);
    }
  };

  const handleDimBlur = (id: string) => {
    const dims = localDimensions[id];
    const w = Number(dims?.w);
    const d = Number(dims?.d);
    if (!isNaN(w) && !isNaN(d) && w > 0 && d > 0) {
      app.resizeObject(id, w, d);
    }
  };

  return (
    <div className="pwx-inspector-section mt-4 border-t border-soft pt-4">
      <div className="flex items-center justify-between mb-4">
        <p className="typ-label text-muted">Properties</p>
        <button
          className="pw-icon-btn text-danger flex items-center gap-1 text-xs"
          onClick={() => app.deleteSelection()}
          title="Delete selected"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {app.selections.map((selected, i) => {
          const name = String(selected.name ?? "");
          const id = String(selected.id ?? selected.name ?? "");
          const [type, label] = name.split(":");
          const isLocked = Boolean(selected.lockMovementX);
          
          return (
            <div key={id || i} className="bg-black/5 p-3 rounded-md flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="typ-body text-sm text-strong">{label || name || "Unknown"}</div>
                  <div className="text-xs text-muted">{type}</div>
                </div>
                <button
                  className="pw-icon-btn"
                  onClick={() => app.setObjectLock(id, !isLocked)}
                  title={isLocked ? "Unlock" : "Lock"}
                >
                  {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted">Width (mm)</label>
                  <input
                    type="number"
                    className="pw-input text-sm px-2 py-1"
                    value={localDimensions[id]?.w ?? ""}
                    onChange={(e) => setLocalDimensions(prev => ({ ...prev, [id]: { ...prev[id], w: e.target.value } }))}
                    onBlur={() => handleDimBlur(id)}
                    disabled={isLocked}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted">Depth (mm)</label>
                  <input
                    type="number"
                    className="pw-input text-sm px-2 py-1"
                    value={localDimensions[id]?.d ?? ""}
                    onChange={(e) => setLocalDimensions(prev => ({ ...prev, [id]: { ...prev[id], d: e.target.value } }))}
                    onBlur={() => handleDimBlur(id)}
                    disabled={isLocked}
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs text-muted">Rotation (°)</label>
                  <input
                    type="number"
                    className="pw-input text-sm px-2 py-1"
                    value={localAngles[id] ?? ""}
                    onChange={(e) => setLocalAngles(prev => ({ ...prev, [id]: e.target.value }))}
                    onBlur={() => handleAngleBlur(id)}
                    disabled={isLocked}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
