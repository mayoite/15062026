"use client";

import type { ReactNode } from "react";

interface SplitViewLayoutProps {
  view: "2d" | "3d" | "split";
  children2D: ReactNode;
  children3D: ReactNode;
}

/**
 * Keep both engines mounted so Fabric state, tools, and 3D sync stay alive across view switches.
 * Only visibility/layout changes — never unmount the 2D canvas when entering 3D.
 */
export function SplitViewLayout({ view, children2D, children3D }: SplitViewLayoutProps) {
  if (view === "split") {
    return (
      <div className="pw-split-view h-full w-full min-h-0 overflow-hidden">
        <div className="pw-split-pane pw-split-pane--2d h-full min-h-0">{children2D}</div>
        <div className="pw-split-divider" aria-hidden />
        <div className="pw-split-pane pw-split-pane--3d h-full min-h-0">{children3D}</div>
      </div>
    );
  }

  return (
    <div className="pw-view-stack h-full w-full min-h-0 overflow-hidden">
      <div
        className="pw-view-stack__pane pw-view-stack__pane--2d"
        data-active={view === "2d" || undefined}
        aria-hidden={view !== "2d"}
      >
        {children2D}
      </div>
      <div
        className="pw-view-stack__pane pw-view-stack__pane--3d"
        data-active={view === "3d" || undefined}
        aria-hidden={view !== "3d"}
      >
        {children3D}
      </div>
    </div>
  );
}