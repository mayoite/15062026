"use client";

import { useRef, useState } from "react";
import { usePlannerStore } from "../data/plannerStore";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { type ThreeEvent, useThree } from "@react-three/fiber";

const PX_TO_M = 0.01;

export function Furniture3D() {
  const furniture = usePlannerStore((s) => s.furniture);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const setSelected = usePlannerStore((s) => s.setSelected);
  const updateFurniture = usePlannerStore((s) => s.updateFurniture);
  const tool = usePlannerStore((s) => s.tool);
  const deleteItem = usePlannerStore((s) => s.deleteItem);
  
  const { camera, raycaster, pointer } = useThree();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoveredFurniture, setHoveredFurniture] = useState<string | null>(null);
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffset = useRef(new THREE.Vector3());

  const handlePointerDown = (e: ThreeEvent<PointerEvent>, id: string, x: number, y: number) => {
    e.stopPropagation();
    if (tool === "eraser") {
      deleteItem(id);
      return;
    }
    setSelected(id);
    
    // Calculate grab offset for dragging
    raycaster.setFromCamera(pointer, camera);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlaneRef.current, intersect);
    if (intersect) {
      dragOffset.current.set(intersect.x - x * PX_TO_M, 0, intersect.z - y * PX_TO_M);
      setDraggedId(id);
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!draggedId) return;
    e.stopPropagation();
    
    raycaster.setFromCamera(pointer, camera);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlaneRef.current, intersect);
    
    if (intersect) {
      const newX = (intersect.x - dragOffset.current.x) / PX_TO_M;
      const newY = (intersect.z - dragOffset.current.z) / PX_TO_M;
      updateFurniture(draggedId, { x: newX, y: newY });
    }
  };

  const handlePointerUp = () => {
    setDraggedId(null);
  };

  return (
    <group 
      onPointerMove={draggedId ? handlePointerMove : undefined}
      onPointerUp={draggedId ? handlePointerUp : undefined}
      onPointerLeave={draggedId ? handlePointerUp : undefined}
    >
      {furniture.map((item) => {
        const w = (item.width || 120) * PX_TO_M;
        const d = (item.height || 80) * PX_TO_M;
        const h = 0.75; // Standard desk/table height
        const rad = -(item.rotation || 0) * (Math.PI / 180);

        const cx = item.x * PX_TO_M + w / 2;
        const cz = item.y * PX_TO_M + d / 2;

        const isSelected = selectedId === item.id;
        const isEraserHover = tool === "eraser" && hoveredFurniture === item.id;

        return (
          <group 
            key={item.id} 
            position={[cx, h / 2, cz]} 
            rotation={[0, rad, 0]}
            onPointerOver={(e) => {
              if (tool === "eraser") {
                e.stopPropagation();
                setHoveredFurniture(item.id);
              }
            }}
            onPointerOut={() => setHoveredFurniture(null)}
            onPointerDown={(e) => handlePointerDown(e, item.id, item.x + (item.width || 120)/2, item.y + (item.height || 80)/2)}
          >
            <RoundedBox args={[w, h, d]} radius={0.02} smoothness={4} castShadow receiveShadow>
              <meshStandardMaterial 
                color={isEraserHover ? "#ef4444" : (item.color || "#8b5cf6")} 
                roughness={0.2} 
                metalness={0.8}
                emissive={isSelected ? "#8b5cf6" : (isEraserHover ? "#ef4444" : "#000000")}
                emissiveIntensity={isSelected || isEraserHover ? 0.3 : 0}
              />
            </RoundedBox>
            {isSelected && (
              <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(w + 0.05, h + 0.05, d + 0.05)]} />
                <lineBasicMaterial color="#8b5cf6" linewidth={2} />
              </lineSegments>
            )}
          </group>
        );
      })}
    </group>
  );
}
