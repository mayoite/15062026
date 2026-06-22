"use client";

import { useFloorplan } from "./context/FloorplanContext";
import { FloorplanCanvas } from "./FloorplanCanvas";
import { FabricCanvasContextMenu } from "./FabricCanvasContextMenu";

type FabricCanvasWorkspaceProps = {
  onExport?: () => void;
};

export function FabricCanvasWorkspace({
  onExport: _onExport,
}: FabricCanvasWorkspaceProps) {
  const app = useFloorplan();

  // P7-04: describe canvas state for screen readers.
  const objectCount = app.selections.length > 0
    ? app.selections.length
    : undefined;
  const canvasLabel = objectCount !== undefined
    ? `Floor plan: ${objectCount} object${objectCount !== 1 ? "s" : ""} selected`
    : "Floor plan canvas";

  // P7-04: announce selection changes to aria-live region.
  const selectionAnnouncement = app.selections.length > 0
    ? app.selections.map((s) => String(s.name ?? "Object").split(":")[1] || String(s.name ?? "Object")).join(", ")
    : "";

  return (
    <div className="fcw-workspace">
      {/* P7-04: visually-hidden live region for selection announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {selectionAnnouncement ? `Selected: ${selectionAnnouncement}` : ""}
      </div>
      <FabricCanvasContextMenu />
        {/* P7-04: role="application" marks the canvas as a complex interactive widget. */}
        <section
          className="fcw-stage-card"
          style={{ flex: 1, width: "100%", minHeight: 0, border: "none" }}
          role="application"
          aria-label={canvasLabel}
          data-testid="planner-fabric-ready"
        >
          <FloorplanCanvas />
        </section>


    </div>
  );
}