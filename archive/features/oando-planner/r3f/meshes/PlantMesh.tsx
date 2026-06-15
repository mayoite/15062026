"use client";

import type { MeshProps } from "./types";

export function PlantMesh({ width, depth, height, palette }: MeshProps) {
  const radius = Math.min(width, depth);

  return (
    <group>
      <mesh position={[0, height * 0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.16, radius * 0.22, height * 0.28, 16]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.74} metalness={0.06} />
      </mesh>
      <mesh position={[0, height * 0.5, 0]} castShadow receiveShadow>
        <sphereGeometry args={[radius * 0.26, 18, 18]} />
        <meshStandardMaterial color={palette.primary} roughness={0.88} metalness={0.02} />
      </mesh>
    </group>
  );
}
