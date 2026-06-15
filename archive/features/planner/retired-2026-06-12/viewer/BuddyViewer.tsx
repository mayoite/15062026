"use client";

import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, PerspectiveCamera, OrthographicCamera, RoundedBox } from '@react-three/drei';

// Canvas units are centimetres (catalog compact dims).
const PX_TO_M = 0.01;

export interface BuddyViewerShape {
  id: string;
  type: "planner-wall" | "planner-room" | "planner-furniture" | "planner-zone" | "planner-door" | "planner-window";
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  label?: string;
  color?: string;
  glbUrl?: string;
  wall?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    thickness: number;
  };
}

function normalizeColor(color: string | undefined, fallback: string): string {
  if (!color || color.startsWith("var(")) {
    return fallback;
  }
  return color;
}

const FURNITURE_MATERIALS: Record<string, { color: string; roughness: number; metalness: number }> = {
  "planner-furniture": { color: "#c8b28c", roughness: 0.42, metalness: 0.08 },
  "planner-door": { color: "#8b7355", roughness: 0.55, metalness: 0.05 },
  "planner-window": { color: "#7eb8da", roughness: 0.2, metalness: 0.15 },
  "planner-wall": { color: "#5b6472", roughness: 0.65, metalness: 0.02 },
};

// Basic Floor
function Floor({ bounds }: { bounds: { minX: number; minZ: number; maxX: number; maxZ: number } }) {
  const cx = ((bounds.minX + bounds.maxX) / 2) * PX_TO_M;
  const cz = ((bounds.minZ + bounds.maxZ) / 2) * PX_TO_M;
  const fw = Math.max((bounds.maxX - bounds.minX) * PX_TO_M, 10);
  const fd = Math.max((bounds.maxZ - bounds.minZ) * PX_TO_M, 10);

  return (
    <mesh position={[cx, -0.01, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[fw, fd]} />
      <meshStandardMaterial color="#20242c" roughness={0.8} />
    </mesh>
  );
}

// Map Elements to 3D meshes
function ElementsMesh({ shapes }: { shapes: BuddyViewerShape[] }) {
  return (
    <>
      {shapes.map((shape) => {
        if (shape.type === 'planner-wall' && shape.wall) {
          const dx = shape.wall.endX - shape.wall.startX;
          const dy = shape.wall.endY - shape.wall.startY;
          const length = Math.max(Math.hypot(dx, dy) * PX_TO_M, 0.1);
          const thickness = Math.max(shape.wall.thickness * PX_TO_M, 0.05);
          const cx = ((shape.wall.startX + shape.wall.endX) / 2) * PX_TO_M;
          const cz = ((shape.wall.startY + shape.wall.endY) / 2) * PX_TO_M;
          const rad = -Math.atan2(dy, dx);

          return (
            <mesh key={shape.id} position={[cx, 1.5, cz]} rotation={[0, rad, 0]} castShadow>
              <boxGeometry args={[length, 3, thickness]} />
              <meshStandardMaterial color={normalizeColor(shape.color, "#5b6472")} roughness={0.6} />
            </mesh>
          );
        }

        const cx = (shape.x + shape.width / 2) * PX_TO_M;
        const cz = (shape.y + shape.height / 2) * PX_TO_M;
        const w = shape.width * PX_TO_M || 0.1;
        const d = shape.height * PX_TO_M || 0.1;
        // Map rotation from Konva (degrees) to Three.js (radians, flipped Y axis)
        const rad = -(shape.rotation || 0) * Math.PI / 180;

        if (shape.type === 'planner-room') {
          return (
            <group key={shape.id} position={[cx, 0, cz]} rotation={[0, rad, 0]}>
              <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[w, d]} />
                <meshStandardMaterial color={normalizeColor(shape.color, "#4f8cff")} transparent opacity={0.18} />
              </mesh>
              <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(w, 0.04, d)]} />
                <lineBasicMaterial color={normalizeColor(shape.color, "#4f8cff")} />
              </lineSegments>
            </group>
          );
        }

        if (shape.type === 'planner-zone') {
          return (
            <mesh key={shape.id} position={[cx, 0.02, cz]} rotation={[-Math.PI / 2, rad, 0]} receiveShadow>
              <planeGeometry args={[w, d]} />
              <meshStandardMaterial color={normalizeColor(shape.color, "#7ab3ff")} transparent opacity={0.12} />
            </mesh>
          );
        }

        const h = shape.type === "planner-door" || shape.type === "planner-window" ? 1.2 : 0.75;
        const mat = FURNITURE_MATERIALS[shape.type] ?? FURNITURE_MATERIALS["planner-furniture"];
        const finish = shape.label?.toLowerCase().includes("storage")
          ? { color: "#9ca3af", roughness: 0.5, metalness: 0.12 }
          : mat;
        return (
          <group key={shape.id} position={[cx, h / 2, cz]} rotation={[0, rad, 0]}>
            <RoundedBox args={[w, h, d]} radius={0.02} smoothness={4} castShadow>
              <meshStandardMaterial
                color={normalizeColor(shape.color, finish.color)}
                roughness={finish.roughness}
                metalness={finish.metalness}
              />
            </RoundedBox>
          </group>
        );
      })}
    </>
  );
}

// Scene content
function Scene({ isOrtho, shapes }: { isOrtho: boolean; shapes: BuddyViewerShape[] }) {
  // Calculate bounding box center
  const center = useMemo(() => {
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    let hasShapes = false;
    for (const shape of shapes) {
      hasShapes = true;
      if (shape.type === "planner-wall" && shape.wall) {
        minX = Math.min(minX, shape.wall.startX, shape.wall.endX);
        minZ = Math.min(minZ, shape.wall.startY, shape.wall.endY);
        maxX = Math.max(maxX, shape.wall.startX, shape.wall.endX);
        maxZ = Math.max(maxZ, shape.wall.startY, shape.wall.endY);
        continue;
      }
      if (shape.x < minX) minX = shape.x;
      if (shape.y < minZ) minZ = shape.y;
      if (shape.x + shape.width > maxX) maxX = shape.x + shape.width;
      if (shape.y + shape.height > maxZ) maxZ = shape.y + shape.height;
    }
    if (!hasShapes) return { cx: 0, cz: 0, bounds: { minX: -1000, minZ: -1000, maxX: 1000, maxZ: 1000 } };
    return {
      cx: ((minX + maxX) / 2) * PX_TO_M,
      cz: ((minZ + maxZ) / 2) * PX_TO_M,
      bounds: { minX, minZ, maxX, maxZ }
    };
  }, [shapes]);

  return (
    <>
      {isOrtho ? (
        <OrthographicCamera makeDefault position={[center.cx, 20, center.cz]} zoom={50} />
      ) : (
        <PerspectiveCamera makeDefault position={[center.cx + 8, 8, center.cz + 8]} fov={50} />
      )}
      
      <OrbitControls 
        target={[center.cx, 0, center.cz]} 
        enableDamping 
        dampingFactor={0.1} 
        enableRotate={!isOrtho}
        minPolarAngle={isOrtho ? 0 : 0.2} 
        maxPolarAngle={isOrtho ? 0 : Math.PI / 2.2} 
      />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={1} castShadow shadow-mapSize={2048} />
      <Environment files="/cdn/lebombo_1k.hdr" />
      
      <Floor bounds={center.bounds} />
      <Grid infiniteGrid fadeDistance={30} fadeStrength={2} cellSize={0.5} cellThickness={0.5} cellColor="#555" sectionSize={2.5} sectionColor="#888" />
      
      <ElementsMesh shapes={shapes} />
    </>
  );
}

interface BuddyViewerProps {
  viewMode: '2d' | '3d';
  shapes: BuddyViewerShape[];
}

export function BuddyViewer({ viewMode, shapes }: BuddyViewerProps) {
  const isOrtho = viewMode === '2d';
  
  return (
    <div className="h-full w-full bg-[#111111]">
      <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true }}>
        <Suspense fallback={null}>
          <Scene isOrtho={isOrtho} shapes={shapes} />
        </Suspense>
      </Canvas>
    </div>
  );
}
