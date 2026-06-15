"use client";

import { useState } from "react";
import { usePlannerStore } from "../data/plannerStore";
import { distance } from "../data/plannerStoreGeometry";
import * as THREE from "three";

const PX_TO_M = 0.01; // Assuming 1px = 1cm, so 1px = 0.01m for R3F scale

export function Walls3D() {
  const walls = usePlannerStore((s) => s.walls);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const setSelected = usePlannerStore((s) => s.setSelected);
  const tool = usePlannerStore((s) => s.tool);
  const deleteItem = usePlannerStore((s) => s.deleteItem);
  const [hoveredWall, setHoveredWall] = useState<string | null>(null);

  return (
    <group>
      {walls.map((wall) => {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const len = distance(wall.start, wall.end) * PX_TO_M;
        const thickness = (wall.thickness || 12) * PX_TO_M;
        const height = 2.8; // 2.8 meters tall wall

        const cx = ((wall.start.x + wall.end.x) / 2) * PX_TO_M;
        const cz = ((wall.start.y + wall.end.y) / 2) * PX_TO_M;
        const rad = -Math.atan2(dy, dx);
        
        const isSelected = selectedId === wall.id;
        const isEraserHover = tool === "eraser" && hoveredWall === wall.id;

        return (
          <group 
            key={wall.id} 
            position={[cx, height / 2, cz]} 
            rotation={[0, rad, 0]}
            onPointerOver={(e) => {
              if (tool === "eraser") {
                e.stopPropagation();
                setHoveredWall(wall.id);
              }
            }}
            onPointerOut={() => setHoveredWall(null)}
            onClick={(e) => {
              e.stopPropagation();
              if (tool === "eraser") {
                deleteItem(wall.id);
              } else {
                setSelected(wall.id);
              }
            }}
          >
            <mesh castShadow receiveShadow>
              <boxGeometry args={[len, height, thickness]} />
              <meshStandardMaterial 
                color={isEraserHover ? "#ef4444" : (wall.color || "#e2e8f0")} 
                roughness={0.9} 
                metalness={0.05} 
                emissive={isSelected ? "#3b82f6" : (isEraserHover ? "#ef4444" : "#000000")}
                emissiveIntensity={isSelected || isEraserHover ? 0.2 : 0}
              />
            </mesh>
            {isSelected && (
              <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(len + 0.02, height + 0.02, thickness + 0.02)]} />
                <lineBasicMaterial color="#3b82f6" linewidth={2} />
              </lineSegments>
            )}
            {/* Node Handles for start and end when selected */}
            {isSelected && tool === "select" && (
              <>
                <mesh position={[-len / 2, 0, 0]}>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshBasicMaterial color="#3b82f6" depthTest={false} />
                </mesh>
                <mesh position={[len / 2, 0, 0]}>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshBasicMaterial color="#3b82f6" depthTest={false} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
