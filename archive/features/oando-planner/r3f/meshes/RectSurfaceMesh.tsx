"use client";

import type { MeshProps } from "./types";

export function RectSurfaceMesh({
  width,
  depth,
  height,
  palette,
  pedestal = false,
}: MeshProps & { pedestal?: boolean }) {
  const topThickness = Math.max(height * 0.06, 0.04);
  const legHeight = Math.max(height - topThickness, 0.42);

  return (
    <group>
      <mesh position={[0, legHeight + topThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, topThickness, depth]} />
        <meshStandardMaterial color={palette.primary} roughness={0.56} metalness={0.08} />
      </mesh>
      {pedestal ? (
        <mesh position={[0, legHeight * 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[width * 0.18, legHeight, depth * 0.14]} />
          <meshStandardMaterial color={palette.accent} roughness={0.44} metalness={0.3} />
        </mesh>
      ) : (
        (
          [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ] as const
        ).map(([sx, sz], index) => (
          <mesh
            key={index}
            position={[sx * width * 0.38, legHeight / 2, sz * depth * 0.34]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.04, legHeight, 0.04]} />
            <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.5} />
          </mesh>
        ))
      )}
    </group>
  );
}
