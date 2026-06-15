"use client";

import type { MeshProps } from "./types";

export function TaskChairMesh({ width, depth, height, palette }: MeshProps) {
  const seatHeight = Math.max(height * 0.52, 0.28);
  const seatThickness = Math.max(height * 0.08, 0.04);
  const backHeight = Math.max(height * 0.34, 0.22);

  return (
    <group>
      <mesh position={[0, seatHeight, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.76, seatThickness, depth * 0.76]} />
        <meshStandardMaterial color={palette.primary} roughness={0.72} metalness={0.04} />
      </mesh>
      <mesh position={[0, seatHeight + backHeight * 0.42, -depth * 0.26]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.66, backHeight, seatThickness]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.66} metalness={0.04} />
      </mesh>
      <mesh position={[0, seatHeight * 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.025, 0.035, seatHeight, 12]} />
        <meshStandardMaterial color={palette.metal} roughness={0.36} metalness={0.64} />
      </mesh>
      {[0, 72, 144, 216, 288].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <mesh
            key={deg}
            position={[Math.cos(rad) * width * 0.16, 0.04, Math.sin(rad) * depth * 0.16]}
            rotation={[0, rad, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width * 0.24, 0.02, 0.03]} />
            <meshStandardMaterial color={palette.metal} roughness={0.4} metalness={0.62} />
          </mesh>
        );
      })}
    </group>
  );
}
