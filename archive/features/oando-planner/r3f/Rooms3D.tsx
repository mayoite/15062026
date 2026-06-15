"use client";

import { useMemo, useState } from "react";
import * as THREE from "three";
import { usePlannerStore } from "../data/plannerStore";

const PX_TO_M = 0.01;

type RoomPoint = { x: number; y: number };

type RoomRecord = {
  id: string;
  points: RoomPoint[];
  color?: string;
};

function RoomMesh({
  room,
  isSelected,
  isEraserHover,
  tool,
  onHover,
  onUnhover,
  onSelect,
  onDelete,
}: {
  room: RoomRecord;
  isSelected: boolean;
  isEraserHover: boolean;
  tool: string;
  onHover: () => void;
  onUnhover: () => void;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const shape = useMemo(() => {
    if (room.points.length < 3) return null;
    const s = new THREE.Shape();
    s.moveTo(room.points[0].x * PX_TO_M, -room.points[0].y * PX_TO_M);
    for (let i = 1; i < room.points.length; i++) {
      s.lineTo(room.points[i].x * PX_TO_M, -room.points[i].y * PX_TO_M);
    }
    s.lineTo(room.points[0].x * PX_TO_M, -room.points[0].y * PX_TO_M);
    return s;
  }, [room.points]);

  const bounds = useMemo(() => {
    let minX = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxZ = -Infinity;
    room.points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.y < minZ) minZ = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxZ) maxZ = p.y;
    });
    return {
      w: (maxX - minX) * PX_TO_M,
      d: (maxZ - minZ) * PX_TO_M,
      cx: ((minX + maxX) / 2) * PX_TO_M,
      cz: ((minZ + maxZ) / 2) * PX_TO_M,
    };
  }, [room.points]);

  if (!shape) return null;

  return (
    <group
      onPointerOver={(e) => {
        if (tool === "eraser") {
          e.stopPropagation();
          onHover();
        }
      }}
      onPointerOut={onUnhover}
      onClick={(e) => {
        e.stopPropagation();
        if (tool === "eraser") {
          onDelete();
        } else {
          onSelect();
        }
      }}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial
          color={isEraserHover ? "#ef4444" : (room.color || "#10b981")}
          transparent
          opacity={isEraserHover ? 0.3 : 0.15}
          depthWrite={false}
        />
      </mesh>

      {isSelected && (
        <group position={[bounds.cx, 0.03, bounds.cz]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(bounds.w, 0.01, bounds.d)]} />
            <lineBasicMaterial color="#10b981" linewidth={2} />
          </lineSegments>
        </group>
      )}
    </group>
  );
}

export function Rooms3D() {
  const rooms = usePlannerStore((s) => s.rooms);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const setSelected = usePlannerStore((s) => s.setSelected);
  const tool = usePlannerStore((s) => s.tool);
  const deleteItem = usePlannerStore((s) => s.deleteItem);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  return (
    <group>
      {rooms.map((room) => (
        <RoomMesh
          key={room.id}
          room={room}
          isSelected={selectedId === room.id}
          isEraserHover={tool === "eraser" && hoveredRoom === room.id}
          tool={tool}
          onHover={() => setHoveredRoom(room.id)}
          onUnhover={() => setHoveredRoom(null)}
          onSelect={() => setSelected(room.id)}
          onDelete={() => deleteItem(room.id)}
        />
      ))}
    </group>
  );
}
