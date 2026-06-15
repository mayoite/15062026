"use client";

import type { MeshProps } from "./types";

const TWO_PI = Math.PI * 2;

export function CollaborativeMesh({ width, depth, height, palette }: MeshProps) {
  const tableTopH = Math.max(height * 0.08, 0.04);
  const tableH = Math.max(height * 0.7, 0.36);
  const tableR = Math.min(width, depth) * 0.26;
  const seatCount = 4;
  const seatR = Math.min(width, depth) * 0.12;
  const seatH = height * 0.45;
  const ringR = Math.min(width, depth) * 0.42;

  return (
    <group>
      <mesh position={[0, tableH + tableTopH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[tableR, tableR, tableTopH, 16]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.44} metalness={0.1} />
      </mesh>
      <mesh position={[0, tableH * 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[tableR * 0.14, tableR * 0.2, tableH, 8]} />
        <meshStandardMaterial color={palette.metal} roughness={0.3} metalness={0.6} />
      </mesh>
      {Array.from({ length: seatCount }, (_, i) => {
        const angle = (i / seatCount) * TWO_PI;
        const x = Math.sin(angle) * ringR;
        const z = Math.cos(angle) * ringR;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, seatH, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[seatR, seatR, seatH * 0.12, 12]} />
              <meshStandardMaterial color={palette.accent} roughness={0.65} metalness={0.04} />
            </mesh>
            <mesh position={[0, seatH * 0.5, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[seatR * 0.15, seatR * 0.18, seatH, 6]} />
              <meshStandardMaterial color={palette.metal} roughness={0.3} metalness={0.55} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
