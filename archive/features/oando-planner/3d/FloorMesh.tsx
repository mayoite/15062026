import React, { useMemo } from "react";
import * as THREE from "three";
import type { Room } from "../data/plannerStore";

interface FloorMeshProps {
  room: Room;
  isSelected?: boolean;
}

export function FloorMesh({ room, isSelected }: FloorMeshProps) {
  const SCALE = 0.01; // 1px = 1cm = 0.01m

  const shape = useMemo(() => {
    if (!room.points || room.points.length < 3) return null;
    const s = new THREE.Shape();
    // In Three.js, positive Y rotation maps shape Y to Z axis.
    // We map 2D coordinates to local shape coordinates.
    s.moveTo(room.points[0].x * SCALE, room.points[0].y * SCALE);
    for (let i = 1; i < room.points.length; i++) {
      s.lineTo(room.points[i].x * SCALE, room.points[i].y * SCALE);
    }
    s.closePath();
    return s;
  }, [room.points]);

  // Determine material color based on room floorMaterial
  const materialColor = useMemo(() => {
    if (isSelected) return "var(--border-soft)"; // highlight
    switch (room.floorMaterial) {
      case "wood":
        return "var(--border-soft)"; // warm wood
      case "tile":
        return "var(--surface-panel)"; // light tile
      case "marble":
        return "var(--surface-panel)"; // white marble
      case "concrete":
        return "var(--border-soft)"; // concrete grey
      case "default":
      default:
        return room.color || "var(--surface-panel)"; // fallback to room custom color or soft blue-grey;
    }
  }, [room.floorMaterial, room.color, isSelected]);

  if (!shape) return null;

  return (
    // Rotate -90 degrees around X axis to make it lie flat on XZ plane
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial
        color={materialColor}
        roughness={0.8}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
