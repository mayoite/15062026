"use client";

import type { MeshProps } from "./types";

export function ScreenMesh({ width, depth, height, palette }: MeshProps) {
  const screenHeight = Math.max(height * 0.72, 0.7);
  const standHeight = Math.max(height - screenHeight, 0.28);

  return (
    <group>
      <mesh position={[0, standHeight + screenHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, screenHeight, Math.max(depth * 0.18, 0.05)]} />
        <meshStandardMaterial color={palette.primary} roughness={0.3} metalness={0.55} />
      </mesh>
      <mesh position={[0, standHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.03, 0.04, standHeight, 12]} />
        <meshStandardMaterial color={palette.metal} roughness={0.34} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.42, 0.05, depth]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.48} metalness={0.36} />
      </mesh>
    </group>
  );
}
