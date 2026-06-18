"use client";

import type { ReactNode } from "react";
import { Layers3, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useFloorplan } from "./context/FloorplanContext";
import { FloorplanCanvas } from "./FloorplanCanvas";
import { FabricCanvasContextMenu } from "./FabricCanvasContextMenu";

type FabricCanvasWorkspaceProps = {
  onExport?: () => void;
  leftPanel?: ReactNode;
  leftOpen?: boolean;
  leftCollapsed?: boolean;
  layersCollapsed?: boolean;
  onToggleLayersCollapsed?: () => void;
};

export function FabricCanvasWorkspace({
  onExport: _onExport,
  leftPanel,
  leftOpen = false,
  leftCollapsed = false,
  layersCollapsed = false,
  onToggleLayersCollapsed,
}: FabricCanvasWorkspaceProps) {
  const app = useFloorplan();

  const selectedItems = app.selections.map((selected, i) => {
    const name = String(selected.name ?? "");
    const [type, label] = name.split(":");
    return {
      key: `${name}-${i}`,
      type,
      label: label || type || "Untitled item",
      left: String(selected.left ?? ""),
      top: String(selected.top ?? ""),
      width: String(selected.width ?? ""),
      height: String(selected.height ?? ""),
      rotation: String(selected.angle ?? ""),
    };
  });

  const layersCollapseControl = onToggleLayersCollapsed ? (
    <button
      type="button"
      className="fcw-panel-collapse pw-icon-btn"
      onClick={onToggleLayersCollapsed}
      aria-label={layersCollapsed ? "Expand layers panel" : "Collapse layers panel"}
    >
      {layersCollapsed ? (
        <PanelRightOpen size={14} strokeWidth={2} aria-hidden />
      ) : (
        <PanelRightClose size={14} strokeWidth={2} aria-hidden />
      )}
    </button>
  ) : null;

  return (
    <div className="fcw-workspace" aria-label="Fabric canvas workspace">
      <FabricCanvasContextMenu />
      <div
        className="fcw-workspace-grid"
        data-left-open={leftOpen || undefined}
        data-left-collapsed={leftCollapsed || undefined}
        data-layers-collapsed={layersCollapsed || undefined}
      >
        {leftPanel}
        <section className="fcw-stage-card">
          <FloorplanCanvas />
        </section>

        <aside className="fcw-layers-panel" data-collapsed={layersCollapsed || undefined}>
          <div className="fcw-sidecard-head">
            {layersCollapsed ? (
              <div className="fcw-sidecard-head--collapsed">
                <Layers3 size={16} strokeWidth={1.9} aria-hidden />
                {layersCollapseControl}
              </div>
            ) : (
              <>
                <div>
                  <h2>Layers</h2>
                  <p>Select layers to focus, lock, align, or distribute them.</p>
                </div>
                <div className="fcw-sidecard-head__actions">
                  <button type="button" className="fcw-ghost-icon-btn" aria-label="Layers">
                    <Layers3 size={15} strokeWidth={1.8} />
                  </button>
                  {layersCollapseControl}
                </div>
              </>
            )}
          </div>

          <div className="fcw-layers-panel__body" hidden={layersCollapsed}>
            <div className="fcw-sidecard-actions">
              <button type="button" className="fcw-sidecard-button" disabled={!app.selections.length}>
                Select All
              </button>
              <button type="button" className="fcw-sidecard-button" disabled={!app.selections.length}>
                Fit Selection
              </button>
              <button type="button" className="fcw-sidecard-button" disabled={!app.selections.length}>
                Lock Selection
              </button>
              <button type="button" className="fcw-sidecard-button fcw-sidecard-button--count">
                <strong>{selectedItems.length}</strong>
                <span>Layers</span>
              </button>
            </div>

            <div className="fcw-mini-arrange">
              <span>Arrange Selection</span>
              <div className="fcw-mini-arrange__icons">
                <button type="button" className="fcw-ghost-icon-btn" onClick={() => app.arrange("LEFT")} disabled={app.selections.length < 2}>←</button>
                <button type="button" className="fcw-ghost-icon-btn" onClick={() => app.arrange("CENTER")} disabled={app.selections.length < 2}>↔</button>
                <button type="button" className="fcw-ghost-icon-btn" onClick={() => app.arrange("RIGHT")} disabled={app.selections.length < 2}>→</button>
                <button type="button" className="fcw-ghost-icon-btn" onClick={() => app.arrange("TOP")} disabled={app.selections.length < 2}>↑</button>
              </div>
            </div>

            <div className="fcw-sidecard-empty">
              {selectedItems.length
                ? `${selectedItems.length} editable item${selectedItems.length === 1 ? "" : "s"} selected.`
                : "No editable layers yet. Draw walls or place items to build the plan."}
            </div>
          </div>
        </aside>
      </div>

      <table className="fcw-status-bar">
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Left</th>
            <th>Top</th>
            <th>Rotation</th>
            <th>Width</th>
            <th>Height</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {app.selections.map((selected, i) => {
            const name = String(selected.name ?? "");
            const [type, label] = name.split(":");
            return (
              <tr key={i}>
                <td>{type}</td>
                <td>{label}</td>
                <td>{String(selected.left ?? "")}</td>
                <td>{String(selected.top ?? "")}</td>
                <td>{String(selected.angle ?? "")}°</td>
                <td>{String(selected.width ?? "")}</td>
                <td>{String(selected.height ?? "")}</td>
                <td>
                  {type === "TABLE" && Array.isArray((selected as { _objects?: unknown[] })._objects)
                    ? `${((selected as { _objects: unknown[] })._objects.length ?? 1) - 1} Chairs`
                    : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}