"use client";

import type { MeshProps } from "./types";

export function LoungeChairMesh({ width, depth, height, palette }: MeshProps) {
  const seatHeight = Math.max(height * 0.44, 0.24);
  const seatThickness = Math.max(height * 0.11, 0.05);

  return (
    <group>
      <mesh position={[0, seatHeight, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.84, seatThickness, depth * 0.78]} />
        <meshStandardMaterial color={palette.primary} roughness={0.76} metalness={0.04} />
      </mesh>
      <mesh position={[0, seatHeight + height * 0.18, -depth * 0.24]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.82, height * 0.26, depth * 0.14]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.72} metalness={0.03} />
      </mesh>
      {(
        [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ] as const
      ).map(([sx, sz], index) => (
        <mesh
          key={index}
          position={[sx * width * 0.28, seatHeight * 0.46, sz * depth * 0.22]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.016, 0.02, seatHeight * 0.92, 10]} />
          <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.58} />
        </mesh>
      ))}
    </group>
  );
}
