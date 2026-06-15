import React from "react";
import type { DoorItem } from "../data/plannerStore";

interface DoorMeshProps {
  door: DoorItem;
  isSelected?: boolean;
}

export function DoorMesh({ door, isSelected }: DoorMeshProps) {
  const SCALE = 0.01; // 1px = 1cm = 0.01m
  const DOOR_HEIGHT = 2.1; // 2.1 meters high door

  const x = door.x * SCALE;
  const z = door.y * SCALE;
  const w = door.width * SCALE;
  const rotationRad = -(door.rotation * Math.PI) / 180;
  
  // Set door panel angle (always open at least a bit, e.g. 45 degrees or custom angle)
  const openAngleRad = ((door.openAngle || 90) * Math.PI) / 180;

  const colorToUse = isSelected ? "var(--border-soft)" : "var(--border-soft)";

  return (
    <group position={[x, 0, z]} rotation={[0, rotationRad, 0]}>
      {/* 3D Door Frame */}
      {/* Left post */}
      <mesh position={[-w / 2, DOOR_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.08, DOOR_HEIGHT, 0.12]} />
        <meshStandardMaterial color="var(--border-soft)" roughness={0.5} />
      </mesh>
      {/* Right post */}
      <mesh position={[w / 2, DOOR_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[0.08, DOOR_HEIGHT, 0.12]} />
        <meshStandardMaterial color="var(--border-soft)" roughness={0.5} />
      </mesh>
      {/* Top beam */}
      <mesh position={[0, DOOR_HEIGHT + 0.04, 0]} castShadow>
        <boxGeometry args={[w + 0.08, 0.08, 0.12]} />
        <meshStandardMaterial color="var(--border-soft)" roughness={0.5} />
      </mesh>

      {/* Swinging Door Panel */}
      {/* Pivot point at left frame post */}
      <group position={[-w / 2 + 0.04, 0, 0]} rotation={[0, openAngleRad, 0]}>
        <mesh position={[w / 2 - 0.04, DOOR_HEIGHT / 2, 0.02]} castShadow>
          <boxGeometry args={[w - 0.08, DOOR_HEIGHT - 0.02, 0.04]} />
          <meshStandardMaterial color={colorToUse} roughness={0.7} />
        </mesh>
        {/* Door handle */}
        <mesh position={[w - 0.16, DOOR_HEIGHT / 2, 0.05]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
          <meshStandardMaterial color="var(--surface-panel)" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}
