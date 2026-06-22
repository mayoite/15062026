"use client";

import { LayoutTemplate, MousePointerClick, Sparkles } from "lucide-react";

interface PlannerEmptyCanvasProps {
  guestMode?: boolean;
  /** When true, the guidance card does not capture drags (wall/room/zone tools). */
  allowCanvasDragThrough?: boolean;
  onDrawWalls: () => void;
  onOpenTemplates: () => void;
  onQuickLayout?: () => void;
}

export function PlannerEmptyCanvas({
  guestMode = false,
  allowCanvasDragThrough: _allowCanvasDragThrough = false,
  onDrawWalls,
  onOpenTemplates,
  onQuickLayout,
}: PlannerEmptyCanvasProps) {
  return (
    <div
      className="pw-empty-canvas pointer-events-none absolute inset-0 flex items-center justify-center p-4"
      role="region"
      aria-label="Empty canvas guidance"
    >
      <div
        className="pw-empty-canvas-card max-w-full pointer-events-auto"
      >
        <div className="pw-empty-canvas-icon" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
            <rect x="3" y="3" width="30" height="30" rx="3" stroke="currentColor" strokeWidth="2" />
            <line x1="3" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="3" x2="20" y2="24" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="24" x2="33" y2="24" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <p className="pw-empty-canvas-kicker">{guestMode ? "Guest session" : "New layout"}</p>
        <h2 className="pw-empty-canvas-title">Start your layout</h2>
        <p className="pw-empty-canvas-copy">
          {guestMode
            ? "Draw walls, drop catalog furniture, or open a template. Your work autosaves in this browser."
            : "Draw walls, drop catalog furniture, or open a template to get moving fast."}
        </p>

        <div className="pw-empty-canvas-actions">
          <button type="button" onClick={onDrawWalls} className="pw-empty-canvas-primary btn-primary">
            Draw walls
          </button>
          <button type="button" onClick={onOpenTemplates} className="pw-empty-canvas-secondary btn-outline">
            <LayoutTemplate size={14} aria-hidden />
            Use template
          </button>
          {onQuickLayout ? (
            <button type="button" onClick={onQuickLayout} className="pw-empty-canvas-secondary btn-outline">
              <Sparkles size={14} aria-hidden />
              Quick layout
            </button>
          ) : null}
        </div>

        <p className="pw-empty-canvas-note">
          <MousePointerClick size={14} aria-hidden />
          Click catalog items or drag them onto the canvas
        </p>
      </div>
    </div>
  );
}
