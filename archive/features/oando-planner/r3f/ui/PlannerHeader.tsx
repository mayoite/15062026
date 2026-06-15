"use client";

import Link from "next/link";
import { ArrowLeft, Save, Download } from "lucide-react";
import { usePlannerR3FStore, type PlannerMode } from "../usePlannerR3FStore";

const MODE_TABS: { mode: PlannerMode; label: string }[] = [
  { mode: "layout", label: "Layout" },
  { mode: "walk", label: "Walk" },
  { mode: "export", label: "Export" },
];

export function PlannerHeader({
  onSave,
  onExport,
  guestMode = false,
}: {
  onSave?: () => void;
  onExport?: () => void;
  guestMode?: boolean;
}) {
  const plannerMode = usePlannerR3FStore((s) => s.plannerMode);
  const setPlannerMode = usePlannerR3FStore((s) => s.setPlannerMode);
  const modeTabs = guestMode
    ? MODE_TABS.filter((tab) => tab.mode !== "export")
    : MODE_TABS;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between bg-[var(--text-body)] px-4">
      <div className="flex items-center gap-3">
        <Link
          href="/oando-planner"
          className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-white transition-colors"
          aria-label="Back to Planner Hub"
          title="Back to Planner Hub"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div className="h-5 w-px bg-slate-700" />
        <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          3D Planner
        </span>
        {guestMode ? (
          <span className="rounded border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
            Guest
          </span>
        ) : null}
        <span className="hidden text-[13px] font-medium text-slate-300 sm:block">
          Untitled Plan
        </span>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-slate-800/60 p-0.5">
        {modeTabs.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setPlannerMode(mode)}
            className={`rounded-md px-4 py-1.5 text-[12px] font-semibold transition-all ${
              plannerMode === mode
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {guestMode ? (
          <div className="hidden rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-300 sm:block">
            Save and export are disabled in guest mode
          </div>
        ) : null}
        {!guestMode && onSave && (
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-[12px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
        )}
        {!guestMode && onExport && (
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}
      </div>
    </header>
  );
}
