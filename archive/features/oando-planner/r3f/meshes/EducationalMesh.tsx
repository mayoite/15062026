"use client";

import type { MeshProps } from "./types";

export function EducationalMesh({ width, depth, height, palette }: MeshProps) {
  const topH = Math.max(height * 0.05, 0.03);
  const legH = Math.max(height * 0.65, 0.4);
  const shelfH = legH * 0.28;
  const shelfD = depth * 0.55;

  return (
    <group>
      <mesh position={[0, legH + topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, topH, depth]} />
        <meshStandardMaterial color={palette.primary} roughness={0.55} metalness={0.04} />
      </mesh>
      <mesh position={[0, shelfH + topH / 2, depth * 0.22]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.88, topH, shelfD]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.6} metalness={0.04} />
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
          position={[sx * width * 0.4, legH / 2, sz * depth * 0.38]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.035, legH, 0.035]} />
          <meshStandardMaterial color={palette.metal} roughness={0.35} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
