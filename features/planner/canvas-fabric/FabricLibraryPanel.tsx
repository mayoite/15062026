"use client";

import { useEffect, useState } from "react";
import { FURNISHINGS } from "./models/furnishings";
import { useFloorplan } from "./context/FloorplanContext";
import { PreviewFurniture } from "./components/PreviewFurniture";
import { ChairsLayoutDialog } from "./components/ChairsLayoutDialog";

const PANEL_LABELS: Record<string, string> = {
  doors: "Doors",
  windows: "Windows",
  tables: "Tables",
  chairs: "Chairs",
  misc: "Miscellaneous",
  text: "Text",
  advanced: "Advanced",
};

function PreviewGrid({
  items,
  type,
  onInsert,
}: {
  items: Array<Record<string, unknown>>;
  type: string;
  onInsert: (object: unknown, type: string) => void;
}) {
  return (
    <div className="flp-preview-layout">
      {items.map((item) => (
        <button
          key={String(item.title)}
          type="button"
          className="flp-preview-item"
          onClick={() => onInsert(item, type)}
        >
          <PreviewFurniture type={type} furniture={item} />
          <div className="flp-preview-title">{String(item.title)}</div>
        </button>
      ))}
    </div>
  );
}

export function FabricLibraryPanel() {
  const app = useFloorplan();
  const [chairsOpen, setChairsOpen] = useState(false);
  const [defaultChairIndex, setDefaultChairIndex] = useState(0);
  const [openPanel, setOpenPanel] = useState<string | null>("doors");
  const [textForm, setTextForm] = useState({
    text: "New Text",
    font_size: 16,
    direction: "HORIZONTAL",
  });

  useEffect(() => {
    const chair = FURNISHINGS.chairs[0];
    if (chair) app.setDefaultChair(chair);
  }, [app]);

  const insert = (object: unknown, type: string) => {
    if (app.roomEdit) return;
    app.insertObject({ type, object });
  };

  const renderLibraryPanel = () => {
    switch (openPanel) {
      case "doors":
        return <PreviewGrid items={FURNISHINGS.doors} type="DOOR" onInsert={insert} />;
      case "windows":
        return <PreviewGrid items={FURNISHINGS.windows} type="WINDOW" onInsert={insert} />;
      case "tables":
        return (
          <>
            <label className="flp-field">
              Default chair
              <select
                value={defaultChairIndex}
                onChange={(e) => {
                  const i = Number(e.target.value);
                  setDefaultChairIndex(i);
                  app.setDefaultChair(FURNISHINGS.chairs[i]);
                }}
              >
                {FURNISHINGS.chairs.map((chair, i) => (
                  <option key={chair.title} value={i}>
                    {chair.title}
                  </option>
                ))}
              </select>
            </label>
            <PreviewGrid items={FURNISHINGS.tables} type="TABLE" onInsert={insert} />
          </>
        );
      case "chairs":
        return <PreviewGrid items={FURNISHINGS.chairs} type="CHAIR" onInsert={insert} />;
      case "misc":
        return <PreviewGrid items={FURNISHINGS.miscellaneous} type="MISCELLANEOUS" onInsert={insert} />;
      case "text":
        return (
          <form
            className="flp-text-form"
            onSubmit={(e) => {
              e.preventDefault();
              insert({ ...textForm, name: "TEXT:Text" }, "TEXT");
            }}
          >
            <label className="flp-field">
              Text
              <input
                value={textForm.text}
                onChange={(e) => setTextForm((f) => ({ ...f, text: e.target.value }))}
              />
            </label>
            <label className="flp-field">
              Font size
              <input
                type="number"
                min={1}
                max={200}
                value={textForm.font_size}
                onChange={(e) => setTextForm((f) => ({ ...f, font_size: Number(e.target.value) }))}
              />
            </label>
            <div className="flp-radio-row">
              <label>
                <input
                  type="radio"
                  checked={textForm.direction === "HORIZONTAL"}
                  onChange={() => setTextForm((f) => ({ ...f, direction: "HORIZONTAL" }))}
                />
                Horizontal
              </label>
              <label>
                <input
                  type="radio"
                  checked={textForm.direction === "VERTICAL"}
                  onChange={() => setTextForm((f) => ({ ...f, direction: "VERTICAL" }))}
                />
                Vertical
              </label>
            </div>
            <button type="submit" className="flp-btn flp-btn--primary flp-btn--block">
              Add text
            </button>
          </form>
        );
      case "advanced":
        return (
          <button type="button" className="flp-btn flp-btn--primary flp-btn--block" onClick={() => setChairsOpen(true)}>
            Layout chairs
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fabric-library-panel" aria-label="Fabric library">
      <section className="flp-section">
        <div className="flp-section__header">
          <h3>Library</h3>
        </div>
        <div className="flp-tool-row" role="tablist" aria-label="Library categories">
          {Object.entries(PANEL_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={openPanel === key}
              className={`flp-tool-card${openPanel === key ? " flp-tool-card--active" : ""}`}
              onClick={() => setOpenPanel(key)}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {openPanel ? (
        <section className="flp-section flp-section--drawer">
          <div className="flp-section__header">
            <h3>{PANEL_LABELS[openPanel]}</h3>
          </div>
          <div className="flp-drawer">{renderLibraryPanel()}</div>
        </section>
      ) : null}

      <ChairsLayoutDialog
        open={chairsOpen}
        onClose={() => setChairsOpen(false)}
        onCreate={(layout) => insert(layout, "LAYOUT")}
      />
    </div>
  );
}