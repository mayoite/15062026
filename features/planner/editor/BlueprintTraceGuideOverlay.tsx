"use client";

import { DraftingCompass, Eye, EyeOff, Move, Minus, Plus, Ruler } from "lucide-react";

import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { getBlueprintTraceGuide } from "@/features/planner/editor/blueprintTraceGuide";
import { stepBlueprintOpacity } from "@/features/planner/editor/blueprintTransform";

interface BlueprintTraceGuideOverlayProps {
  activePlannerTool: "wall" | "room" | "select" | "pan" | "door" | "window" | "furniture" | "zone" | "measure" | "eraser";
  blueprintLoaded: boolean;
  underlayVisible: boolean;
  calibrated: boolean;
  calibrating: boolean;
  interactionMode: "idle" | "move";
}

export function BlueprintTraceGuideOverlay({
  activePlannerTool,
  blueprintLoaded,
  underlayVisible,
  calibrated,
  calibrating,
  interactionMode,
}: BlueprintTraceGuideOverlayProps) {
  const blueprint = usePlannerWorkspaceStore((s) => s.blueprint);
  const setBlueprint = usePlannerWorkspaceStore((s) => s.setBlueprint);
  const toggleLayer = usePlannerWorkspaceStore((s) => s.toggleLayer);

  if (!blueprintLoaded || !underlayVisible) return null;
  if (calibrating || interactionMode !== "idle") return null;
  if (activePlannerTool !== "wall" && activePlannerTool !== "room") return null;

  const guide = getBlueprintTraceGuide(activePlannerTool, calibrated);

  return (
    <aside className="absolute left-5 top-5 z-[26] max-w-[20rem] rounded-2xl border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel)]/96 p-4 shadow-theme-panel backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--planner-primary-soft)] bg-[color:var(--planner-primary-soft)] text-[color:var(--planner-primary)]">
          <DraftingCompass size={16} strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--planner-text-muted)]">
            Blueprint Trace
          </p>
          <h3 className="mt-1 text-sm font-semibold text-strong">{guide.title}</h3>
          <p className="mt-2 text-xs leading-5 text-soft">{guide.body}</p>
          <div className="mt-3 flex items-start gap-2 text-xs text-[color:var(--planner-primary)]">
            <Ruler size={13} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0" />
            <span>{guide.tip}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <HudButton
              label="Calibrate blueprint"
              onClick={() => setBlueprint({ calibrating: true, calibrationPoints: [] })}
            >
              <Ruler size={13} strokeWidth={1.75} aria-hidden />
              Calibrate
            </HudButton>
            <HudButton
              label="Move blueprint on canvas"
              onClick={() => setBlueprint({ interactionMode: "move" })}
            >
              <Move size={13} strokeWidth={1.75} aria-hidden />
              Move
            </HudButton>
            <HudButton
              label={underlayVisible ? "Hide blueprint underlay" : "Show blueprint underlay"}
              onClick={() => toggleLayer("underlay")}
            >
              {underlayVisible ? <EyeOff size={13} strokeWidth={1.75} aria-hidden /> : <Eye size={13} strokeWidth={1.75} aria-hidden />}
              {underlayVisible ? "Hide" : "Show"}
            </HudButton>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <HudIconButton
              label="Decrease blueprint opacity"
              onClick={() => setBlueprint({ opacity: stepBlueprintOpacity(blueprint.opacity, "down") })}
            >
              <Minus size={13} strokeWidth={1.75} aria-hidden />
            </HudIconButton>
            <div className="min-w-0 flex-1 rounded-full border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--planner-text-muted)]">
              Underlay opacity {Math.round(blueprint.opacity * 100)}%
            </div>
            <HudIconButton
              label="Increase blueprint opacity"
              onClick={() => setBlueprint({ opacity: stepBlueprintOpacity(blueprint.opacity, "up") })}
            >
              <Plus size={13} strokeWidth={1.75} aria-hidden />
            </HudIconButton>
          </div>
        </div>
      </div>
    </aside>
  );
}

function HudButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex items-center gap-1.5 rounded-full border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel)] px-3 py-1.5 text-[11px] font-semibold text-[color:var(--planner-text-body)] transition-colors hover:border-[color:var(--planner-primary)] hover:text-[color:var(--planner-primary)]"
    >
      {children}
    </button>
  );
}

function HudIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel)] text-[color:var(--planner-text-body)] transition-colors hover:border-[color:var(--planner-primary)] hover:text-[color:var(--planner-primary)]"
    >
      {children}
    </button>
  );
}
