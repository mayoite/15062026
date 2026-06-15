"use client";

import type { ReactNode } from "react";

interface SplitViewLayoutProps {
  view: "2d" | "3d" | "split";
  children2D: ReactNode;
  children3D: ReactNode;
}

export function SplitViewLayout({ view, children2D, children3D }: SplitViewLayoutProps) {
  if (view === "2d") {
    return <div className="h-full w-full min-h-0 overflow-hidden">{children2D}</div>;
  }

  if (view === "3d") {
    return <div className="h-full w-full min-h-0 overflow-hidden">{children3D}</div>;
  }

  return (
    <div className="pw-split-view h-full w-full min-h-0 overflow-hidden">
      <div className="pw-split-pane pw-split-pane--2d">{children2D}</div>
      <div className="pw-split-divider" aria-hidden />
      <div className="pw-split-pane pw-split-pane--3d">{children3D}</div>
    </div>
  );
}
