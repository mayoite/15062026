"use client";

import { usePlannerWorkspaceStore } from "../store/workspaceStore";

interface BlueprintUnderlayProps {
  camera: { x: number; y: number; z: number } | null;
}

export function BlueprintUnderlay({ camera }: BlueprintUnderlayProps) {
  const blueprint = usePlannerWorkspaceStore((s) => s.blueprint);
  const underlayVisible = usePlannerWorkspaceStore((s) => s.layerVisible?.underlay ?? true);

  if (!blueprint?.dataUrl || !underlayVisible) return null;

  const cameraScale = camera?.z ?? 1;
  const tx = camera ? -camera.x * cameraScale : 0;
  const ty = camera ? -camera.y * cameraScale : 0;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      <div
        role="presentation"
        className="absolute origin-top-left select-none bg-center bg-no-repeat"
        data-testid="planner-blueprint-underlay"
        style={{
          opacity: blueprint.opacity,
          width: blueprint.widthPx,
          height: blueprint.heightPx,
          backgroundImage: `url("${blueprint.dataUrl}")`,
          backgroundSize: "100% 100%",
          transform: `translate(${tx}px, ${ty}px) scale(${cameraScale * blueprint.scale})`,
          left: blueprint.x,
          top: blueprint.y,
        }}
      />
    </div>
  );
}
