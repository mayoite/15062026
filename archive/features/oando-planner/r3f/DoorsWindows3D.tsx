"use client";

import { useState } from "react";
import { usePlannerStore } from "../data/plannerStore";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

const PX_TO_M = 0.01;

export function DoorsWindows3D() {
  const doors = usePlannerStore((s) => s.doors);
  const windows = usePlannerStore((s) => s.windows);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const setSelected = usePlannerStore((s) => s.setSelected);
  const tool = usePlannerStore((s) => s.tool);
  const deleteItem = usePlannerStore((s) => s.deleteItem);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <group>
      {/* Doors */}
      {doors.map((door) => {
        const w = (door.width || 80) * PX_TO_M;
        const d = 0.1; // 10cm thickness
        const h = 2.1; // 2.1m standard door height
        const rad = -(door.rotation || 0) * (Math.PI / 180);
        
        const cx = door.x * PX_TO_M;
        const cz = door.y * PX_TO_M;
        const isSelected = selectedId === door.id;
        const isEraserHover = tool === "eraser" && hoveredItem === door.id;

        return (
          <group 
            key={door.id} 
            position={[cx, h / 2, cz]} 
            rotation={[0, rad, 0]}
            onPointerOver={(e) => {
              if (tool === "eraser") {
                e.stopPropagation();
                setHoveredItem(door.id);
              }
            }}
            onPointerOut={() => setHoveredItem(null)}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (tool === "eraser") deleteItem(door.id);
              else setSelected(door.id); 
            }}
          >
            <RoundedBox args={[w, h, d]} radius={0.01} smoothness={4} castShadow receiveShadow>
              <meshStandardMaterial 
                color={isEraserHover ? "#ef4444" : "#8c6b5d"} 
                roughness={0.8} 
                emissive={isSelected ? "#f59e0b" : (isEraserHover ? "#ef4444" : "#000000")}
                emissiveIntensity={isSelected || isEraserHover ? 0.3 : 0}
              />
            </RoundedBox>
            {isSelected && (
              <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(w + 0.05, h + 0.05, d + 0.05)]} />
                <lineBasicMaterial color="#f59e0b" linewidth={2} />
              </lineSegments>
            )}
          </group>
        );
      })}

      {/* Windows */}
      {windows.map((win) => {
        const w = (win.width || 100) * PX_TO_M;
        const d = 0.1; // 10cm thickness
        const h = 1.2; // 1.2m height
        const rad = -(win.rotation || 0) * (Math.PI / 180);
        
        const cx = win.x * PX_TO_M;
        const cz = win.y * PX_TO_M;
        const yOffset = 1.0; // 1m off the ground
        const isSelected = selectedId === win.id;
        const isEraserHover = tool === "eraser" && hoveredItem === win.id;

        return (
          <group 
            key={win.id} 
            position={[cx, yOffset + h / 2, cz]} 
            rotation={[0, rad, 0]}
            onPointerOver={(e) => {
              if (tool === "eraser") {
                e.stopPropagation();
                setHoveredItem(win.id);
              }
            }}
            onPointerOut={() => setHoveredItem(null)}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (tool === "eraser") deleteItem(win.id);
              else setSelected(win.id); 
            }}
          >
            {/* Glass Pane */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[w, h, d * 0.5]} />
              <meshPhysicalMaterial 
                color={isEraserHover ? "#ef4444" : "#a5f3fc"} 
                transmission={isEraserHover ? 0 : 0.9} 
                opacity={1} 
                metalness={0} 
                roughness={0.1} 
                ior={1.5} 
                thickness={0.05}
                emissive={isSelected ? "#06b6d4" : (isEraserHover ? "#ef4444" : "#000000")}
                emissiveIntensity={isSelected || isEraserHover ? 0.3 : 0}
              />
            </mesh>
            {/* Frame */}
            <mesh>
              <boxGeometry args={[w + 0.05, h + 0.05, d]} />
              <meshStandardMaterial color={isEraserHover ? "#ef4444" : "#334155"} roughness={0.5} />
            </mesh>
            
            {isSelected && (
              <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(w + 0.1, h + 0.1, d + 0.1)]} />
                <lineBasicMaterial color="#06b6d4" linewidth={2} />
              </lineSegments>
            )}
          </group>
        );
      })}
    </group>
  );
}
