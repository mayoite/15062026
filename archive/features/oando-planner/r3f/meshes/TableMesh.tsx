"use client";

import type { MeshProps } from "./types";

export function TableMesh({ width, depth, height, palette }: MeshProps) {
  const topThickness = Math.max(height * 0.07, 0.05);
  const legHeight = Math.max(height - topThickness, 0.42);
  const pedestalR = Math.min(width, depth) * 0.12;

  return (
    <group>
      <mesh position={[0, legHeight + topThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, topThickness, depth]} />
        <meshStandardMaterial color={palette.primary} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[0, legHeight * 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[pedestalR, pedestalR * 1.3, legHeight, 10]} />
        <meshStandardMaterial color={palette.metal} roughness={0.28} metalness={0.65} />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[pedestalR * 2.4, pedestalR * 2.6, 0.04, 12]} />
        <meshStandardMaterial color={palette.metal} roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  );
}
