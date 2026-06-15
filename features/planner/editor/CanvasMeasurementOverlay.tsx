"use client";

import { useEffect, useState } from "react";
import type { Editor } from "tldraw";

import {
  deriveViewportState,
  type CanvasMeasurement,
  type MeasurementUnit,
} from "@/features/planner/lib/measurements";

type CanvasMeasurementOverlayProps = {
  editor: Editor | null;
  unitSystem: MeasurementUnit;
};

function MeasurementChip({ measurement }: { measurement: CanvasMeasurement }) {
  const transform = measurement.rotateDeg
    ? `translate(-50%, -50%) rotate(${measurement.rotateDeg}deg)`
    : "translate(-50%, -50%)";

  return (
    <div
      className={`pw-canvas-measurement pw-canvas-measurement--${measurement.tone ?? "default"}`}
      style={{ left: measurement.x, top: measurement.y, transform }}
    >
      <span className="pw-canvas-measurement__caption">{measurement.caption}</span>
      <span className="pw-canvas-measurement__value">{measurement.value}</span>
    </div>
  );
}

export function CanvasMeasurementOverlay({ editor, unitSystem }: CanvasMeasurementOverlayProps) {
  const [measurements, setMeasurements] = useState<CanvasMeasurement[]>([]);

  useEffect(() => {
    if (!editor) return;

    const sync = () => {
      const state = deriveViewportState(
        editor,
        editor.getSelectedShapeIds(),
        unitSystem,
      );
      setMeasurements(state.canvasMeasurements);
    };

    sync();
    const cleanupDoc = editor.store.listen(sync, { scope: "document" });
    const cleanupSession = editor.store.listen(sync, { scope: "session" });

    return () => {
      cleanupDoc();
      cleanupSession();
    };
  }, [editor, unitSystem]);

  const visibleMeasurements = editor ? measurements : [];

  if (visibleMeasurements.length === 0) return null;

  return (
    <div className="pw-canvas-measurements" aria-hidden="true">
      {visibleMeasurements.map((measurement) => (
        <MeasurementChip key={measurement.id} measurement={measurement} />
      ))}
    </div>
  );
}
