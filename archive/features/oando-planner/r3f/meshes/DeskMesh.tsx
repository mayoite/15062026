"use client";

import type { MeshProps } from "./types";

export function DeskMesh({ width, depth, height, palette }: MeshProps) {
  const topThickness = Math.max(height * 0.055, 0.035);
  const legHeight = Math.max(height - topThickness, 0.42);
  const trayH = topThickness * 0.4;
  const trayD = depth * 0.08;

  return (
    <group>
      <mesh position={[0, legHeight + topThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, topThickness, depth]} />
        <meshStandardMaterial color={palette.primary} roughness={0.52} metalness={0.06} />
      </mesh>
      <mesh position={[0, legHeight - trayH / 2, depth * 0.44]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.7, trayH, trayD]} />
        <meshStandardMaterial color={palette.metal} roughness={0.35} metalness={0.55} />
      </mesh>
      {(
        [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ] as const
      ).map(([sx, sz], i) => (
        <mesh
          key={i}
          position={[sx * width * 0.42, legHeight / 2, sz * depth * 0.4]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.04, legHeight, 0.04]} />
          <meshStandardMaterial color={palette.metal} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
