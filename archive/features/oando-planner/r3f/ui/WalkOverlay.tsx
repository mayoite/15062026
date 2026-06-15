"use client";

import { usePlannerR3FStore } from "../usePlannerR3FStore";

function KeyCap({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-md border text-[12px] font-bold transition-colors ${
        active
          ? "border-blue-400 bg-blue-500/20 text-blue-300"
          : "border-white/20 bg-white/10 text-white/60"
      }`}
    >
      {label}
    </div>
  );
}

export function WalkOverlay() {
  const cameraMode = usePlannerR3FStore((s) => s.cameraMode);
  const setPlannerMode = usePlannerR3FStore((s) => s.setPlannerMode);

  if (cameraMode !== "walk") return null;

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_4px_var(--surface-glass)]" />
      </div>

      <div className="absolute left-4 bottom-4 z-10 flex flex-col items-center gap-1 select-none">
        <KeyCap label="W" />
        <div className="flex gap-1">
          <KeyCap label="A" />
          <KeyCap label="S" />
          <KeyCap label="D" />
        </div>
        <p className="mt-1 text-[10px] text-white/60">Mouse to look</p>
      </div>

      <div className="absolute right-4 bottom-4 z-10">
        <button
          type="button"
          onClick={() => setPlannerMode("layout")}
          className="flex items-center gap-1.5 rounded-lg bg-white/15 border border-white/20 backdrop-blur-sm px-3 py-2 text-[12px] font-medium text-white/80 hover:bg-white/25 hover:text-white transition"
        >
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono">ESC</kbd>
          Exit Walk
        </button>
      </div>

      <div className="absolute left-1/2 bottom-4 z-10 -translate-x-1/2 rounded-lg bg-black/60 backdrop-blur-sm px-4 py-2 text-[11px] text-white/70">
        Click to lock pointer &middot; WASD to move &middot; ESC to exit
      </div>
    </>
  );
}
