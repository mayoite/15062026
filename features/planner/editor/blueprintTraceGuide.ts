export interface BlueprintTraceGuide {
  title: string;
  body: string;
  tip: string;
}

export function getBlueprintTraceGuide(
  tool: "wall" | "room",
  calibrated: boolean,
): BlueprintTraceGuide {
  if (tool === "wall") {
    return {
      title: calibrated ? "Trace wall runs" : "Trace walls after calibrating",
      body: calibrated
        ? "Start at a known corner and click along the blueprint edges to chain accurate wall segments."
        : "Calibrate the underlay first if you need trustworthy dimensions, then trace the wall lines from one fixed corner.",
      tip: calibrated
        ? "Use doors and windows after the wall shell is in place."
        : "If measurements drift, run Calibrate again before tracing more walls.",
    };
  }

  return {
    title: calibrated ? "Block the room shell" : "Sketch the room shell first",
    body: calibrated
      ? "Drag a room outline over the blueprint footprint, then refine walls and openings on top of it."
      : "Use the room tool to rough in the footprint, then calibrate if you need the room dimensions to match the drawing.",
    tip: calibrated
      ? "Trace the big envelope first, then switch to Wall for partitions."
      : "A quick room shell helps you place furniture even before full wall tracing.",
  };
}
