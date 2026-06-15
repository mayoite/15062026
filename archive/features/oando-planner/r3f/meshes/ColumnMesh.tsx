"use client";

import type { MeshProps } from "./types";

export function ColumnMesh({
  width,
  depth,
  height,
  palette,
  round = false,
}: MeshProps & { round?: boolean }) {
  const radius = Math.min(width, depth) * 0.34;

  return round ? (
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, 20]} />
      <meshStandardMaterial color={palette.primary} roughness={0.78} metalness={0.04} />
    </mesh>
  ) : (
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[width * 0.72, height, depth * 0.72]} />
      <meshStandardMaterial color={palette.primary} roughness={0.78} metalness={0.04} />
    </mesh>
  );
}
