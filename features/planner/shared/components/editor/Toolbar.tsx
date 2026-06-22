"use client";
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

const TOOL_SHELL = "pw-tool-shell";
const TOOL_SCROLL = "pw-tool-scroll";
const TOOL_BRAND = "pw-tool-brand";
const TOOL_GROUPS_CLASS = "pw-tool-groups";
const TOOL_GROUP_CLASS = "pw-tool-group";
const TOOL_GROUP_LABEL = "pw-tool-group-label";
const TOOL_GROUP_BUTTONS = "pw-tool-group-buttons";
const TOOL_DIVIDER = "pw-tool-divider";
const TOOL_SETTINGS = "pw-tool-settings";
const TOOL_SETTING_LABEL = "pw-tool-setting-label";
const TOOL_SEGMENT = "pw-tool-segment";
const TOOL_SEGMENT_STACKED = "pw-tool-segment--stacked";
const TOOL_SEGMENT_BUTTON = "pw-tool-segment-button";
const TOOL_ICON = "pw-tool-icon";
const TOOL_FOOTER = "pw-tool-footer";

function toolButtonClass({
  collapsed,
  active,
  variant = "default",
}: {
  collapsed?: boolean;
  active?: boolean;
  variant?: "default" | "ghost" | "danger" | "save";
}) {
  return [
    "pw-tool-button",
    collapsed ? "pw-tool-button--compact" : "pw-tool-button--wide",
    variant === "ghost" ? "pw-tool-button--ghost" : "",
    variant === "danger" ? "pw-tool-button--danger" : "",
    variant === "save" && !active ? "pw-tool-button--default" : "",
    variant === "save" && active ? "pw-tool-button--save-active" : "",
    variant === "default" && active ? "pw-tool-button--active" : "",
    variant === "default" && !active ? "pw-tool-button--default" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function segmentButtonClass() {
  return TOOL_SEGMENT_BUTTON;
}

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
      className={TOOL_SHELL}
    >
      {/* ── Tools ─────────────────────────────────────── */}
      <div className={TOOL_SCROLL}>
        {!collapsed && (
          <div className={TOOL_BRAND}>
            <OneAndOnlyLogo variant="white" className="h-7 w-auto" />
          </div>
        )}

        <div className={TOOL_GROUPS_CLASS}>
          {TOOL_GROUPS.map((group, gi) => (
            <div key={gi} className={TOOL_GROUP_CLASS}>
              {!collapsed && (
                <p className={TOOL_GROUP_LABEL}>
                  {TOOL_GROUP_ORDER[gi]}
                </p>
              )}
              <div className={TOOL_GROUP_BUTTONS}>
                {group.map((t) => {
                  const active = tool === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { if (!canMutate) return; setTool(t.id); }}
                      title={`${t.label} (${t.shortcut})`}
                      aria-label={t.label}
                      aria-pressed={!!active}
                      className={toolButtonClass({ collapsed, active, variant: "default" })}
                      data-active={active}
                    >
                      <span className="pw-tool-button-icon">
                        <t.icon className={TOOL_ICON} />
                      </span>
                      
                      {!collapsed && (
                        <span className="pw-tool-button-label">
                          {t.label}
                        </span>
                      )}
                      
                      {!collapsed && (
                        <kbd className="pw-tool-button-shortcut">
                          {t.shortcut}
                        </kbd>
                      )}

                      {collapsed && !active && (
                        <span className="pw-tool-button-tooltip">
                          {t.label} <span className="pw-tool-button-tooltip-shortcut">{t.shortcut}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {gi < TOOL_GROUPS.length - 1 && (
                <div className={TOOL_DIVIDER} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Settings ──────────────────────────────────── */}
      <div className={TOOL_SETTINGS}>
        <div>
          {!collapsed && <p className={TOOL_SETTING_LABEL}>Snap Grid</p>}
          <div className={`${TOOL_SEGMENT} ${collapsed ? TOOL_SEGMENT_STACKED : ""}`}>
            {SNAP_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => { if (!canMutate) return; setSnapDistance(opt); }}
                title={`Snap to ${opt}px`}
                className={segmentButtonClass()}
                data-active={snapDistance === opt}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          {!collapsed && <p className={TOOL_SETTING_LABEL}>Measurement</p>}
          <div className={`${TOOL_SEGMENT} ${collapsed ? TOOL_SEGMENT_STACKED : ""}`}>
            {(["cm", "m"] as const).map((u) => (
              <button
                key={u}
                onClick={() => { if (!canMutate) return; setWallDimensionUnit(u); }}
                title={`Use ${u}`}
                className={segmentButtonClass()}
                data-active={wallDimensionUnit === u}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom actions ────────────────────────────── */}
      <div className={TOOL_FOOTER}>
        <button 
          onClick={canMutate ? onOpenTemplates : undefined} 
          disabled={!canMutate}
          title="Templates"
          className={toolButtonClass({ collapsed, variant: "ghost" })}
        >
          <LayoutTemplate className={TOOL_ICON} />
          {!collapsed && <span className="pw-tool-button-label">Templates</span>}
          
          {collapsed && (
            <span className="pw-tool-button-tooltip">Templates</span>
          )}
        </button>

        <button 
          onClick={handleSave}
          title="Save Project"
          className={toolButtonClass({ collapsed, active: isDirty, variant: "save" })}
          data-active={isDirty}
        >
          <Save className={TOOL_ICON} />
          {!collapsed && <span className="pw-tool-button-label">Save</span>}
          
          {collapsed && (
            <span className="pw-tool-button-tooltip">Save Project</span>
          )}
        </button>

        <button 
          onClick={handleClear} 
          disabled={!canMutate}
          title="Clear Canvas"
          className={toolButtonClass({ collapsed, variant: "danger" })}
        >
          <Trash2 className={TOOL_ICON} />
          {!collapsed && <span className="pw-tool-button-label">Clear Canvas</span>}
          
          {collapsed && (
            <span className="pw-tool-button-tooltip">Clear Canvas</span>
          )}
        </button>
      </div>
    </nav>
  );
}
