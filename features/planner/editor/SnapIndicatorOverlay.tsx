"use client";

import { useEffect, useState } from "react";
import type { Editor } from "tldraw";

import {
  snapEditorPoint,
  type EditorSnapResult,
} from "@/features/planner/tldraw/tools/tldrawSnap";

const SNAP_TOOLS = new Set([
  "planner-wall",
  "planner-room",
  "planner-door-window",
  "planner-zone",
]);

type SnapIndicatorOverlayProps = {
  editor: Editor | null;
};

export function SnapIndicatorOverlay({ editor }: SnapIndicatorOverlayProps) {
  const [snap, setSnap] = useState<EditorSnapResult | null>(null);

  useEffect(() => {
    if (!editor) return;

    const updateSnap = () => {
      const toolId = editor.getCurrentToolId();
      const rootTool = toolId.split(".")[0] ?? toolId;
      if (!SNAP_TOOLS.has(rootTool)) {
        setSnap(null);
        return;
      }

      const point = editor.inputs.getCurrentPagePoint();
      const excludeId =
        rootTool === "planner-wall" && editor.getOnlySelectedShapeId()
          ? editor.getOnlySelectedShapeId()
          : null;
      const result = snapEditorPoint(editor, point, excludeId);
      setSnap(result.snapped ? result : null);
    };

    updateSnap();
    const cleanup = editor.store.listen(updateSnap, { scope: "session" });
    return cleanup;
  }, [editor]);

  if (!editor || !snap?.snapped) return null;

  const screen = editor.pageToScreen(snap.point);
  const kind = snap.kind ?? "grid";

  return (
    <div
      className="pw-snap-indicator"
      data-kind={kind}
      style={{
        left: screen.x,
        top: screen.y,
      }}
      aria-hidden
    >
      <span className="pw-snap-indicator__ring" />
      <span className="pw-snap-indicator__dot" />
    </div>
  );
}
