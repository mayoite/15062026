"use client";

import { useEffect, useState } from "react";
import type { Editor } from "tldraw";

import { plannerGridScreenSpacing } from "@/features/planner/editor/plannerGrid";

interface PlannerCanvasGridProps {
  editor: Editor | null;
  visible: boolean;
}

export function PlannerCanvasGrid({ editor, visible }: PlannerCanvasGridProps) {
  const [origin, setOrigin] = useState({ x: 0, y: 0, zoom: 1 });

  useEffect(() => {
    if (!editor || !visible) return;

    const sync = () => {
      const camera = editor.getCamera();
      const pageOrigin = editor.pageToViewport({ x: 0, y: 0 });
      setOrigin({ x: pageOrigin.x, y: pageOrigin.y, zoom: camera.z });
    };

    sync();
    const cleanup = editor.store.listen(sync, { scope: "session" });
    return () => cleanup();
  }, [editor, visible]);

  if (!visible || !editor) return null;

  const { minorPx, majorPx } = plannerGridScreenSpacing(origin.zoom);

  return (
    <div
      className="pw-canvas-grid"
      aria-hidden
      style={{
        ["--pw-grid-minor" as string]: `${minorPx}px`,
        ["--pw-grid-major" as string]: `${majorPx}px`,
        ["--pw-grid-origin-x" as string]: `${origin.x}px`,
        ["--pw-grid-origin-y" as string]: `${origin.y}px`,
      }}
    />
  );
}