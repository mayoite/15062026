"use client";
import { useState } from "react";
import type { Tool } from "@/features/oando-planner/data/plannerStore";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import { useToastStore } from "@/features/oando-planner/data/toastStore";
import { exportPDF } from "@/features/oando-planner/lib/export/exportPDF";
import { exportSVG } from "@/features/oando-planner/lib/export/exportSVG";

const primaryTools: { id: Tool; icon: string; label: string }[] = [
  { id: "select", icon: "\u2196", label: "Select" },
  { id: "wall", icon: "\u25AC", label: "Wall" },
  { id: "room", icon: "\u2B1C", label: "Room" },
  { id: "door", icon: "\uD83D\uDEAA", label: "Door" },
  { id: "furniture", icon: "\uD83D\uDECB\uFE0F", label: "Furniture" },
];

const overflowTools: { id: Tool; icon: string; label: string }[] = [
  { id: "window", icon: "\u229E", label: "Window" },
  { id: "zone", icon: "\uD83D\uDDFA\uFE0F", label: "Zone" },
  { id: "eraser", icon: "\uD83D\uDDD1\uFE0F", label: "Delete" },
  { id: "measure", icon: "\uD83D\uDCCF", label: "Measure" },
];

interface Props {
  onOpenTemplates?: () => void;
  readOnly?: boolean;
}

export function ToolbarMobile({ onOpenTemplates, readOnly = false }: Props) {
  const tool = usePlannerStore((s) => s.tool);
  const setTool = usePlannerStore((s) => s.setTool);
  const zoom = usePlannerStore((s) => s.zoom);
  const setZoom = usePlannerStore((s) => s.setZoom);
  const showGrid = usePlannerStore((s) => s.showGrid);
  const toggleGrid = usePlannerStore((s) => s.toggleGrid);
  const saveProject = usePlannerStore((s) => s.saveProject);
  const clearAll = usePlannerStore((s) => s.clearAll);
  const undo = usePlannerStore((s) => s.undo);
  const redo = usePlannerStore((s) => s.redo);
  const canUndo = usePlannerStore((s) => s.canUndo);
  const canRedo = usePlannerStore((s) => s.canRedo);
  const isDirty = usePlannerStore((s) => s.isDirty);
  const addToast = useToastStore((s) => s.addToast);
  const [showMore, setShowMore] = useState(false);
  const canMutate = !readOnly;

  const handleExportPNG = async () => {
    const s = usePlannerStore.getState();
    try {
      const { exportPNG } = await import("../../lib/export/exportPNG");
      const exported = await exportPNG(s.projectName, s.walls, s.rooms, s.furniture, s.doors, s.windows, 1920);
      addToast(exported ? "success" : "error", exported ? "PNG exported" : "Nothing to export");
    } catch {
      addToast("error", "PNG export failed");
    }
  };

  const handleExportPDF = () => {
    const s = usePlannerStore.getState();
    try {
      exportPDF(s.projectName, s.walls, s.rooms, s.furniture, s.doors, s.windows);
      addToast("success", "PDF exported");
    } catch {
      addToast("error", "Failed to export PDF");
    }
  };

  const handleExportSVG = () => {
    const s = usePlannerStore.getState();
    try {
      exportSVG(s.projectName, s.walls, s.rooms, s.furniture, s.doors, s.windows);
      addToast("success", "SVG exported");
    } catch {
      addToast("error", "Failed to export SVG");
    }
  };

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t safe-area-bottom"
        style={{ background: "var(--surface-inverse)", borderColor: "var(--overlay-panel-12)" }}
        role="toolbar"
        aria-label="Drawing tools"
      >
        <div className="flex items-center justify-around px-2 py-1.5">
          {primaryTools.map((t) => (
            <button
              key={t.id}
              onClick={() => { if (!canMutate) return; setTool(t.id); setShowMore(false); }}
              aria-label={t.label}
              aria-pressed={tool === t.id}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[44px] min-h-[44px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px] ${
                tool === t.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-white/50 active:bg-white/10"
              }`}
            >
              <span className="text-[18px]">{t.icon}</span>
              <span className="text-[9px]">{t.label}</span>
            </button>
          ))}

          <button
            onClick={() => setShowMore(!showMore)}
            aria-label="More tools"
            aria-expanded={showMore}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[44px] min-h-[44px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px] ${
              showMore ? "bg-white/15 text-white" : "text-white/50 active:bg-white/10"
            }`}
          >
            <span className="text-[18px]">{"\u2026"}</span>
            <span className="text-[9px]">More</span>
          </button>
        </div>
      </div>

      {showMore && (
        <div className="fixed bottom-[60px] left-0 right-0 z-40 md:hidden">
          <div className="absolute inset-0 -top-[100vh]" onClick={() => setShowMore(false)} />
          <div
            className="relative border-t rounded-t-2xl shadow-[0_-8px_30px_var(--surface-glass)] mx-2 mb-0 overflow-hidden max-h-[70vh] overflow-y-auto"
            style={{ background: "var(--surface-inverse)", borderColor: "var(--overlay-panel-12)" }}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-8 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-4 py-2">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">More Tools</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {overflowTools.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { if (!canMutate) return; setTool(t.id); setShowMore(false); }}
                    aria-label={t.label}
                    aria-pressed={tool === t.id}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg transition-colors min-h-[56px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px] ${
                      tool === t.id
                        ? "bg-[var(--color-primary)] text-white"
                        : "text-white/60 bg-white/5 active:bg-white/10"
                    }`}
                  >
                    <span className="text-[18px]">{t.icon}</span>
                    <span className="text-[10px]">{t.label}</span>
                  </button>
                ))}
              </div>

              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">View</p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <button
                  onClick={() => { if (!canMutate) return; setZoom(Math.max(0.25, zoom - 0.15)); }}
                  aria-label={`Zoom out (current: ${Math.round(zoom * 100)}%)`}
                  title="Zoom out"
                  className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-white/60 bg-white/5 active:bg-white/10 min-h-[56px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px]"
                >
                  <span className="text-[16px]">&minus;</span>
                  <span className="text-[9px]">{Math.round(zoom * 100)}%</span>
                </button>
                <button
                  onClick={() => { if (!canMutate) return; setZoom(Math.min(3, zoom + 0.15)); }}
                  aria-label="Zoom in"
                  title="Zoom in"
                  className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-white/60 bg-white/5 active:bg-white/10 min-h-[56px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px]"
                >
                  <span className="text-[16px]">+</span>
                  <span className="text-[9px]">Zoom</span>
                </button>
                <button
                  onClick={() => { if (!canMutate) return; toggleGrid(); setShowMore(false); }}
                  aria-label={showGrid ? "Hide grid" : "Show grid"}
                  aria-pressed={showGrid}
                  title={showGrid ? "Hide grid" : "Show grid"}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg min-h-[56px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px] ${
                    showGrid ? "bg-white/15 text-white" : "text-white/60 bg-white/5 active:bg-white/10"
                  }`}
                >
                  <span className="text-[16px]">{"\u229E"}</span>
                  <span className="text-[9px]">Grid</span>
                </button>
                <div
                  className="flex flex-col items-center gap-1 py-2.5 rounded-lg min-h-[56px] justify-center bg-white/3 text-white/20 cursor-not-allowed"
                  role="button"
                  aria-disabled="true"
                  aria-label="3D view (not available on mobile)"
                  title="3D view not available on mobile"
                >
                  <span className="text-[16px] opacity-30">{"\uD83E\uDDCA"}</span>
                  <span className="text-[9px]">3D</span>
                </div>
              </div>

              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Actions</p>
              <div className="mb-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-[10px] text-white/45">
                {isDirty ? "Unsaved changes in current plan" : "Current plan is saved"}
              </div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {onOpenTemplates && canMutate && (
                  <button
                    onClick={() => { onOpenTemplates(); setShowMore(false); }}
                    aria-label="Open templates"
                    className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-white/60 bg-white/5 active:bg-white/10 min-h-[56px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px]"
                  >
                    <span className="text-[16px]">{"\uD83D\uDCCB"}</span>
                    <span className="text-[9px]">Templates</span>
                  </button>
                )}
                <button
                  onClick={() => { if (!canMutate) return; saveProject(); addToast("success", "Saved"); setShowMore(false); }}
                  aria-label="Save project"
                  className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-white/60 bg-white/5 active:bg-white/10 min-h-[56px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px]"
                >
                  <span className="text-[16px]">{"\uD83D\uDCBE"}</span>
                  <span className="text-[9px]">Save</span>
                </button>
                <button
                  onClick={() => { if (!canMutate) return; undo(); setShowMore(false); }}
                  aria-label="Undo last action"
                  disabled={!canUndo()}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-white/60 bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed active:bg-white/10 min-h-[56px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px]"
                >
                  <span className="text-[16px]">↶</span>
                  <span className="text-[9px]">Undo</span>
                </button>
                <button
                  onClick={() => { if (!canMutate) return; redo(); setShowMore(false); }}
                  aria-label="Redo last action"
                  disabled={!canRedo()}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-white/60 bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed active:bg-white/10 min-h-[56px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px]"
                >
                  <span className="text-[16px]">↷</span>
                  <span className="text-[9px]">Redo</span>
                </button>
                <button
                  onClick={() => { if (!canMutate) return; if (confirm("Clear all?")) { clearAll(); addToast("info", "Cleared"); } setShowMore(false); }}
                  aria-label="Clear canvas"
                  className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-red-400/70 bg-white/5 active:bg-red-500/10 min-h-[56px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px]"
                >
                  <span className="text-[16px]">{"\uD83D\uDDD1\uFE0F"}</span>
                  <span className="text-[9px]">Clear</span>
                </button>
              </div>

              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Export</p>
              <div className="grid grid-cols-3 gap-2 pb-3">
                <button
                  onClick={() => { if (!canMutate) return; handleExportPNG(); setShowMore(false); }}
                  aria-label="Export as PNG"
                  className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-white/60 bg-white/5 active:bg-white/10 min-h-[56px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px]"
                >
                  <span className="text-[16px]">🖼️</span>
                  <span className="text-[9px]">PNG</span>
                </button>
                <button
                  onClick={() => { if (!canMutate) return; handleExportPDF(); setShowMore(false); }}
                  aria-label="Export as PDF"
                  className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-white/60 bg-white/5 active:bg-white/10 min-h-[56px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px]"
                >
                  <span className="text-[16px]">📄</span>
                  <span className="text-[9px]">PDF</span>
                </button>
                <button
                  onClick={() => { if (!canMutate) return; handleExportSVG(); setShowMore(false); }}
                  aria-label="Export as SVG"
                  className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-white/60 bg-white/5 active:bg-white/10 min-h-[56px] justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px]"
                >
                  <span className="text-[16px]">📐</span>
                  <span className="text-[9px]">SVG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
