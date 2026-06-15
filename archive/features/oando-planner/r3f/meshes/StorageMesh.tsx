"use client";

import type { MeshProps } from "./types";

export function StorageMesh({
  width,
  depth,
  height,
  palette,
  locker = false,
}: MeshProps & { locker?: boolean }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={palette.primary} roughness={0.82} metalness={0.04} />
      </mesh>
      <mesh position={[0, height / 2, depth / 2 + 0.006]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.92, height * 0.92, 0.012]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.78} metalness={0.04} />
      </mesh>
      {locker ? (
        <mesh position={[0, height / 2, depth / 2 + 0.014]} castShadow receiveShadow>
          <boxGeometry args={[0.012, height * 0.86, 0.01]} />
          <meshStandardMaterial color={palette.accent} roughness={0.42} metalness={0.56} />
        </mesh>
      ) : null}
    </group>
  );
}
