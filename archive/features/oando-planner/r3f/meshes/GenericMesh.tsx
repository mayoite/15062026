"use client";

import type { MeshProps } from "./types";

export function GenericMesh({ width, depth, height, palette }: MeshProps) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={palette.secondary}
          roughness={0.75}
          metalness={0.0}
          transparent
          opacity={0.82}
        />
      </mesh>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={palette.accent}
          roughness={1}
          metalness={0}
          wireframe
        />
      </mesh>
    </group>
  );
}
