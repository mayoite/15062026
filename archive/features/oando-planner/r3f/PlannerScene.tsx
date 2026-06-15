"use client";

import { useMemo } from "react";
import { Grid } from "@react-three/drei";
import * as THREE from "three";
import { usePlannerR3FStore } from "./usePlannerR3FStore";

const WALL_COLOR = "#1e293b"; // Dark slate
const FLOOR_COLOR = "#0f172a"; // Darker slate
const WALL_THICKNESS = 0.06;

function Floor({ width, depth }: { width: number; depth: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, depth / 2]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={FLOOR_COLOR} roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

function Wall({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={WALL_COLOR} roughness={0.9} metalness={0.02} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Walls({ width, depth, height }: { width: number; depth: number; height: number }) {
  const showWalls = usePlannerR3FStore((s) => s.showWalls);
  if (!showWalls) return null;

  return (
    <group>
      <Wall position={[width / 2, height / 2, 0]} size={[width + WALL_THICKNESS, height, WALL_THICKNESS]} />
      <Wall position={[0, height / 2, depth / 2]} size={[WALL_THICKNESS, height, depth]} />
      <Wall position={[width / 2, height / 2, depth]} size={[width + WALL_THICKNESS, height, WALL_THICKNESS]} />
      <Wall position={[width, height / 2, depth / 2]} size={[WALL_THICKNESS, height, depth]} />
    </group>
  );
}

function PlannerGrid({ width, depth }: { width: number; depth: number }) {
  const showGrid = usePlannerR3FStore((s) => s.showGrid);
  if (!showGrid) return null;

  const cellSize = 0.1;
  const sectionSize = 1;

  return (
    <Grid
      args={[width, depth]}
      position={[width / 2, 0.002, depth / 2]}
      cellSize={cellSize}
      sectionSize={sectionSize}
      cellColor="#334155"
      sectionColor="#475569"
      fadeDistance={20}
      fadeStrength={1}
      cellThickness={0.6}
      sectionThickness={1}
    />
  );
}

export function PlannerScene() {
  const room = usePlannerR3FStore((s) => s.room);

  const dims = useMemo(() => ({
    width: room.widthMm / 1000,
    depth: room.depthMm / 1000,
    height: room.wallHeightMm / 1000,
  }), [room.widthMm, room.depthMm, room.wallHeightMm]);

  return (
    <group>
      <Floor width={dims.width} depth={dims.depth} />
      <PlannerGrid width={dims.width} depth={dims.depth} />
      <Walls width={dims.width} depth={dims.depth} height={dims.height} />
    </group>
  );
}
