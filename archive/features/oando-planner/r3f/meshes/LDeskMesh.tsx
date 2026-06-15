"use client";

import type { MeshProps } from "./types";
import { RectSurfaceMesh } from "./RectSurfaceMesh";

export function LDeskMesh({ width, depth, height, palette }: MeshProps) {
  const mainWidth = width * 0.68;
  const wingDepth = depth * 0.42;

  return (
    <group>
      <RectSurfaceMesh width={mainWidth} depth={depth} height={height} palette={palette} />
      <group position={[width * 0.16, 0, depth * 0.22]}>
        <RectSurfaceMesh width={width * 0.48} depth={wingDepth} height={height} palette={palette} />
      </group>
    </group>
  );
}
