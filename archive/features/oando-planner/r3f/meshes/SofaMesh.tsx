"use client";

import type { MeshProps } from "./types";

export function SofaMesh({ width, depth, height, palette }: MeshProps) {
  const seatHeight = Math.max(height * 0.42, 0.2);
  const armWidth = Math.max(width * 0.12, 0.08);

  return (
    <group>
      <mesh position={[0, seatHeight, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.2, depth * 0.84]} />
        <meshStandardMaterial color={palette.primary} roughness={0.78} metalness={0.04} />
      </mesh>
      <mesh position={[0, seatHeight + height * 0.16, -depth * 0.28]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.92, height * 0.3, depth * 0.14]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.74} metalness={0.03} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (width / 2 - armWidth / 2), seatHeight + height * 0.08, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[armWidth, height * 0.28, depth * 0.72]} />
          <meshStandardMaterial color={palette.secondary} roughness={0.76} metalness={0.03} />
        </mesh>
      ))}
    </group>
  );
}
