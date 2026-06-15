import React from "react";
import type { WindowItem } from "../data/plannerStore";

interface WindowMeshProps {
  window: WindowItem;
  isSelected?: boolean;
}

export function WindowMesh({ window: win, isSelected }: WindowMeshProps) {
  const SCALE = 0.01; // 1px = 1cm = 0.01m
  const SILL_HEIGHT = 0.9; // 0.9 meters off the ground
  const WINDOW_HEIGHT = 1.2; // 1.2 meters high

  const x = win.x * SCALE;
  const z = win.y * SCALE;
  const w = win.width * SCALE;
  const rotationRad = -(win.rotation * Math.PI) / 180;

  const frameColor = isSelected ? "var(--border-soft)" : "var(--surface-panel)";

  return (
    <group position={[x, SILL_HEIGHT + WINDOW_HEIGHT / 2, z]} rotation={[0, rotationRad, 0]}>
      {/* Window Frame (Outer boundary) */}
      {/* Top frame */}
      <mesh position={[0, WINDOW_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[w, 0.06, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} />
      </mesh>
      {/* Bottom frame */}
      <mesh position={[0, -WINDOW_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[w, 0.06, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} />
      </mesh>
      {/* Left frame */}
      <mesh position={[-w / 2, 0, 0]} castShadow>
        <boxGeometry args={[0.06, WINDOW_HEIGHT, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} />
      </mesh>
      {/* Right frame */}
      <mesh position={[w / 2, 0, 0]} castShadow>
        <boxGeometry args={[0.06, WINDOW_HEIGHT, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} />
      </mesh>

      {/* Middle division bar (mullion) */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.04, WINDOW_HEIGHT, 0.06]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} />
      </mesh>

      {/* Glass Panes */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w - 0.12, WINDOW_HEIGHT - 0.12, 0.01]} />
        <meshStandardMaterial
          color="var(--border-soft)"
          transparent
          opacity={0.4}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
}
