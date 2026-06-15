import React from "react";
import type { Wall } from "../data/plannerStore";

interface WallMeshProps {
  wall: Wall;
  isSelected?: boolean;
}

export function WallMesh({ wall, isSelected }: WallMeshProps) {
  const SCALE = 0.01; // 1px = 1cm = 0.01m
  const WALL_HEIGHT = 2.7; // 2.7 meters high office walls

  const x1 = wall.start.x * SCALE;
  const z1 = wall.start.y * SCALE;
  const x2 = wall.end.x * SCALE;
  const z2 = wall.end.y * SCALE;

  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const angle = -Math.atan2(dz, dx); // Negative because Three.js Z axis is opposite to 2D screen Y axis

  const xMid = (x1 + x2) / 2;
  const zMid = (z1 + z2) / 2;
  const yMid = WALL_HEIGHT / 2;

  const thickness = (wall.thickness || 8) * SCALE;

  // Visual cues: use primary color or specified wall color
  const baseColor = wall.color || "var(--border-soft)";
  const colorToUse = isSelected ? "var(--border-soft)" : baseColor; // Highlight with accent/bronze if selected

  return (
    <mesh position={[xMid, yMid, zMid]} rotation={[0, angle, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, WALL_HEIGHT, thickness]} />
      <meshStandardMaterial
        color={colorToUse}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  );
}
