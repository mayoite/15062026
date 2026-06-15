"use client";
import React from "react";
import type { Tool, SnapDistance } from "@/features/planner/store/plannerStore";
import { usePlannerStore } from "@/features/planner/store/plannerStore";
import { useToastStore } from "@/features/planner/store/toastStore";
import { OneAndOnlyLogo } from "@/components/ui/Logo";

import {
  MousePointer2,
  Hand,
  Square,
  BoxSelect,
  DoorOpen,
  AppWindow,
  Armchair,
  Map,
  Eraser,
  Ruler,
  LayoutTemplate,
  Save,
  Trash2,
  type LucideIcon
} from "lucide-react";

// ─── Tool definitions ────────────────────────────────────────────────────────

type ToolDef = { id: Tool; label: string; icon: LucideIcon; shortcut: string; group: string };

const TOOLS: ToolDef[] = [
  { id: "select",      label: "Select",     icon: MousePointer2,     shortcut: "V", group: "navigate" },
  { id: "pan",         label: "Pan",        icon: Hand,              shortcut: "H", group: "navigate" },
  { id: "wall",        label: "Wall",       icon: Square,            shortcut: "W", group: "structure" },
  { id: "room",        label: "Room",       icon: BoxSelect,         shortcut: "R", group: "structure" },
  { id: "door",        label: "Door",       icon: DoorOpen,          shortcut: "D", group: "structure" },
  { id: "window",      label: "Window",     icon: AppWindow,         shortcut: "N", group: "structure" },
  { id: "furniture",   label: "Furniture",  icon: Armchair,          shortcut: "F", group: "objects" },
  { id: "zone",        label: "Zone",       icon: Map,               shortcut: "Z", group: "objects" },
  { id: "measure",     label: "Measure",    icon: Ruler,             shortcut: "M", group: "utility" },
  { id: "eraser",      label: "Delete",     icon: Eraser,            shortcut: "X", group: "utility" },
];

// Group tools by their semantic group
const TOOL_GROUP_ORDER = ["navigate", "structure", "objects", "utility"] as const;
const TOOL_GROUPS: ToolDef[][] = TOOL_GROUP_ORDER.map(
  (group) => TOOLS.filter((t) => t.group === group)
);

// Snap distance options — derived from the SnapDistance type
const SNAP_OPTIONS: SnapDistance[] = [5, 10, 20];

interface Props {
  onOpenTemplates: () => void;
  collapsed?: boolean;
  readOnly?: boolean;
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

export function Toolbar({ onOpenTemplates, collapsed, readOnly = false }: Props) {
  const tool = usePlannerStore((s) => s.tool);
  const setTool = usePlannerStore((s) => s.setTool);
  const saveProject = usePlannerStore((s) => s.saveProject);
  const clearAll = usePlannerStore((s) => s.clearAll);
  const snapDistance = usePlannerStore((s) => s.snapDistance);
  const setSnapDistance = usePlannerStore((s) => s.setSnapDistance);
  const wallDimensionUnit = usePlannerStore((s) => s.wallDimensionUnit);
  const setWallDimensionUnit = usePlannerStore((s) => s.setWallDimensionUnit);
  const isDirty = usePlannerStore((s) => s.isDirty);
  const addToast = useToastStore((s) => s.addToast);
  const canMutate = !readOnly;

  const handleSave = () => {
    if (!canMutate) return;
    saveProject();
    addToast("success", "Project saved");
  };

  const handleClear = () => {
    if (!canMutate) return;
    if (confirm("Clear all items from the canvas?")) {
      clearAll();
      addToast("info", "Canvas cleared");
    }
  };

  return (
    <nav 
      aria-label="Editor tools" 
      className="flex flex-col h-full w-full bg-[var(--surface-glass)] backdrop-blur-[var(--blur-lg)] text-[var(--text-strong)] border-r border-[var(--border-soft)] shadow-[var(--shadow-soft)] transition-all duration-[var(--motion-base)] ease-[var(--ease-standard)]"
    >
      {/* ── Tools ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-4 px-3 flex flex-col gap-6">
        {!collapsed && (
          <div className="flex items-center justify-center px-2 pb-2">
            <OneAndOnlyLogo variant="white" className="h-7 w-auto" />
          </div>
        )}

        <div className="flex flex-col gap-5">
          {TOOL_GROUPS.map((group, gi) => (
            <div key={gi} className="flex flex-col">
              {!collapsed && (
                <p className="text-[10px] font-semibold text-[var(--text-subtle)] uppercase tracking-[var(--type-letter-label-wide)] mb-3 px-2">
                  {TOOL_GROUP_ORDER[gi]}
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                {group.map((t) => {
                  const active = tool === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { if (!canMutate) return; setTool(t.id); }}
                      title={`${t.label} (${t.shortcut})`}
                      aria-label={t.label}
                      aria-pressed={!!active}
                      className={`
                        relative flex items-center h-10 rounded-[var(--radius-md)] transition-all duration-[var(--motion-fast)] group
                        ${collapsed ? "w-10 justify-center mx-auto" : "w-full px-3 justify-start"}
                        ${active 
                          ? "bg-[var(--color-primary)] text-[var(--color-white-50)] shadow-[var(--shadow-lift)]" 
                          : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-strong)]"
                        }
                      `}
                    >
                      <span className={`flex items-center justify-center transition-transform duration-[var(--motion-fast)] ${active ? "scale-110" : ""}`}>
                        <t.icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[2]"}`} />
                      </span>
                      
                      {!collapsed && (
                        <span className={`ml-3 text-sm font-medium transition-colors ${active ? "text-[var(--color-white-50)]" : ""}`}>
                          {t.label}
                        </span>
                      )}
                      
                      {!collapsed && (
                        <kbd className={`
                          ml-auto text-[10px] px-1.5 py-0.5 rounded border 
                          ${active 
                            ? "bg-white/20 border-white/20 text-white" 
                            : "bg-[var(--surface-muted)] border-[var(--border-soft)] text-[var(--text-subtle)] group-hover:bg-[var(--surface-panel)] group-hover:border-[var(--border-muted)]"
                          }
                          transition-colors
                        `}>
                          {t.shortcut}
                        </kbd>
                      )}

                      {collapsed && !active && (
                        <span className="absolute left-full ml-3 px-2 py-1 bg-[var(--surface-inverse)] text-[var(--text-inverse)] text-xs font-medium rounded-[var(--radius-sm)] shadow-[var(--shadow-panel)] opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-[var(--motion-fast)] z-50 whitespace-nowrap">
                          {t.label} <span className="text-[var(--text-inverse-muted)] ml-1">{t.shortcut}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {gi < TOOL_GROUPS.length - 1 && (
                <div className="mt-5 mx-2 h-px bg-[var(--border-soft)] opacity-60" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Settings ──────────────────────────────────── */}
      <div className="p-4 border-t border-[var(--border-soft)] flex flex-col gap-5 bg-[var(--surface-soft)]/50">
        <div>
          {!collapsed && <p className="text-[10px] font-semibold text-[var(--text-subtle)] uppercase tracking-[var(--type-letter-label-wide)] mb-2 px-1">Snap Grid</p>}
          <div className={`flex ${collapsed ? "flex-col" : "flex-row"} gap-1.5 bg-[var(--surface-muted)] p-1 rounded-[var(--radius-md)] shadow-inner`}>
            {SNAP_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => { if (!canMutate) return; setSnapDistance(opt); }}
                title={`Snap to ${opt}px`}
                className={`
                  flex-1 flex items-center justify-center h-8 text-xs font-semibold rounded-[var(--radius-sm)] transition-all duration-[var(--motion-fast)]
                  ${snapDistance === opt 
                    ? "bg-[var(--surface-page)] text-[var(--color-primary)] shadow-sm ring-1 ring-black/5" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-hover)]/50"
                  }
                `}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          {!collapsed && <p className="text-[10px] font-semibold text-[var(--text-subtle)] uppercase tracking-[var(--type-letter-label-wide)] mb-2 px-1">Measurement</p>}
          <div className={`flex ${collapsed ? "flex-col" : "flex-row"} gap-1.5 bg-[var(--surface-muted)] p-1 rounded-[var(--radius-md)] shadow-inner`}>
            {(["cm", "m"] as const).map((u) => (
              <button
                key={u}
                onClick={() => { if (!canMutate) return; setWallDimensionUnit(u); }}
                title={`Use ${u}`}
                className={`
                  flex-1 flex items-center justify-center h-8 text-xs font-semibold rounded-[var(--radius-sm)] uppercase transition-all duration-[var(--motion-fast)]
                  ${wallDimensionUnit === u 
                    ? "bg-[var(--surface-page)] text-[var(--color-primary)] shadow-sm ring-1 ring-black/5" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-hover)]/50"
                  }
                `}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom actions ────────────────────────────── */}
      <div className="p-3 border-t border-[var(--border-soft)] flex flex-col gap-2 bg-[var(--surface-panel)]">
        <button 
          onClick={canMutate ? onOpenTemplates : undefined} 
          disabled={!canMutate}
          title="Templates"
          className={`
            relative flex items-center h-10 rounded-[var(--radius-md)] transition-all duration-[var(--motion-fast)] group
            ${collapsed ? "w-10 justify-center mx-auto" : "w-full px-3 justify-start"}
            text-[var(--text-strong)] hover:bg-[var(--surface-hover)] hover:shadow-sm
          `}
        >
          <LayoutTemplate className="w-5 h-5 stroke-[2] text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
          {!collapsed && <span className="ml-3 text-sm font-medium">Templates</span>}
          
          {collapsed && (
            <span className="absolute left-full ml-3 px-2 py-1 bg-[var(--surface-inverse)] text-[var(--text-inverse)] text-xs font-medium rounded-[var(--radius-sm)] shadow-[var(--shadow-panel)] opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-[var(--motion-fast)] z-50 whitespace-nowrap">
              Templates
            </span>
          )}
        </button>

        <button 
          onClick={handleSave}
          title="Save Project"
          className={`
            relative flex items-center h-10 rounded-[var(--radius-md)] transition-all duration-[var(--motion-fast)] group
            ${collapsed ? "w-10 justify-center mx-auto" : "w-full px-3 justify-start"}
            ${isDirty 
              ? "bg-[var(--color-accent)] text-[var(--color-white-50)] shadow-[var(--shadow-soft)] hover:bg-[var(--color-accent-hover)] hover:-translate-y-0.5" 
              : "text-[var(--text-strong)] hover:bg-[var(--surface-hover)] hover:shadow-sm"
            }
          `}
        >
          <Save className={`w-5 h-5 transition-all ${isDirty ? "stroke-[2.5]" : "stroke-[2] text-[var(--text-muted)] group-hover:text-[var(--color-accent)]"}`} />
          {!collapsed && <span className={`ml-3 text-sm font-medium ${isDirty ? "text-[var(--color-white-50)]" : ""}`}>Save</span>}
          
          {collapsed && (
            <span className="absolute left-full ml-3 px-2 py-1 bg-[var(--surface-inverse)] text-[var(--text-inverse)] text-xs font-medium rounded-[var(--radius-sm)] shadow-[var(--shadow-panel)] opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-[var(--motion-fast)] z-50 whitespace-nowrap">
              Save Project
            </span>
          )}
        </button>

        <button 
          onClick={handleClear} 
          disabled={!canMutate}
          title="Clear Canvas"
          className={`
            relative flex items-center h-10 rounded-[var(--radius-md)] transition-all duration-[var(--motion-fast)] group
            ${collapsed ? "w-10 justify-center mx-auto" : "w-full px-3 justify-start"}
            text-[var(--color-danger)] hover:bg-red-50 hover:text-red-600
          `}
        >
          <Trash2 className="w-5 h-5 stroke-[2] transition-colors" />
          {!collapsed && <span className="ml-3 text-sm font-medium">Clear Canvas</span>}
          
          {collapsed && (
            <span className="absolute left-full ml-3 px-2 py-1 bg-[var(--surface-inverse)] text-[var(--text-inverse)] text-xs font-medium rounded-[var(--radius-sm)] shadow-[var(--shadow-panel)] opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-[var(--motion-fast)] z-50 whitespace-nowrap">
              Clear Canvas
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
