"use client";

import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, PerspectiveCamera, RoundedBox, Text } from '@react-three/drei'
import { useElementsStore } from '../../../stores/elementsStore'
import { elementsTo3D } from '../../../lib/elementsTo3D'

const PX_TO_M = 0.005

function Floor({ bounds }: { bounds: { minX: number; minZ: number; maxX: number; maxZ: number } }) {
  const cx = ((bounds.minX + bounds.maxX) / 2) * PX_TO_M
  const cz = ((bounds.minZ + bounds.maxZ) / 2) * PX_TO_M
  const fw = (bounds.maxX - bounds.minX) * PX_TO_M || 10
  const fd = (bounds.maxZ - bounds.minZ) * PX_TO_M || 10

  return (
    <mesh position={[cx, -0.01, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[fw, fd]} />
      <meshStandardMaterial color="var(--surface-panel)" roughness={0.8} />
    </mesh>
  )
}

function Walls({ walls }: { walls: { x: number; y: number; w: number; d: number; h: number; rot?: number }[] }) {
  return (
    <>
      {walls.map((wall, i) => {
        const cx = (wall.x + wall.w / 2) * PX_TO_M
        const cz = (wall.y + wall.d / 2) * PX_TO_M
        const w = wall.w * PX_TO_M
        const d = wall.d * PX_TO_M
        const rad = -(wall.rot || 0) * Math.PI / 180
        return (
          <mesh key={i} position={[cx, wall.h * PX_TO_M / 2, cz]} rotation={[0, rad, 0]} castShadow>
            <boxGeometry args={[w || 0.1, wall.h * PX_TO_M, d || 0.1]} />
            <meshStandardMaterial color="var(--surface-panel)" roughness={0.6} />
          </mesh>
        )
      })}
    </>
  )
}

function Rooms({ rooms }: { rooms: { x: number; y: number; w: number; d: number; label: string; color: string; rot?: number }[] }) {
  return (
    <>
      {rooms.map((room, i) => {
        const cx = (room.x + room.w / 2) * PX_TO_M
        const cz = (room.y + room.d / 2) * PX_TO_M
        const w = room.w * PX_TO_M
        const dd = room.d * PX_TO_M
        const h = 0.05
        const rad = -(room.rot || 0) * Math.PI / 180
        return (
          <group key={i} position={[cx, h / 2, cz]} rotation={[0, rad, 0]}>
            <mesh receiveShadow>
              <boxGeometry args={[w, h, dd]} />
              <meshStandardMaterial color={room.color} roughness={0.7} transparent opacity={0.6} />
            </mesh>
            {room.label && (
              <Text
                position={[0, h + 0.05, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={Math.min(w, dd) * 0.15}
                color="var(--border-soft)"
                anchorX="center"
                anchorY="middle"
                maxWidth={w * 0.9}
              >
                {room.label}
              </Text>
            )}
          </group>
        )
      })}
    </>
  )
}

function Furniture({ furniture }: { furniture: { x: number; y: number; w: number; d: number; h: number; type: string; label: string; rot?: number }[] }) {
  return (
    <>
      {furniture.map((item, i) => {
        const cx = (item.x + item.w / 2) * PX_TO_M
        const cz = (item.y + item.d / 2) * PX_TO_M
        const w = item.w * PX_TO_M
        const dd = item.d * PX_TO_M
        const h = item.h * PX_TO_M
        const rad = -(item.rot || 0) * Math.PI / 180
        return (
          <group key={i} position={[cx, h / 2, cz]} rotation={[0, rad, 0]}>
            <RoundedBox args={[w, h, dd]} radius={0.02} smoothness={4} castShadow>
              <meshStandardMaterial color="var(--border-soft)" roughness={0.4} metalness={0.1} />
            </RoundedBox>
            {item.label && (
              <Text
                position={[0, h / 2 + 0.05, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={Math.min(w, dd) * 0.2}
                color="var(--border-soft)"
                anchorX="center"
                anchorY="middle"
                maxWidth={w * 0.9}
              >
                {item.label}
              </Text>
            )}
          </group>
        )
      })}
    </>
  )
}

function Scene() {
  const elements = useElementsStore((s) => s.elements)
  const scene = useMemo(() => elementsTo3D(elements), [elements])
  const center: [number, number, number] = [
    ((scene.bounds.minX + scene.bounds.maxX) / 2) * PX_TO_M,
    0,
    ((scene.bounds.minZ + scene.bounds.maxZ) / 2) * PX_TO_M,
  ]

  return (
    <>
      <PerspectiveCamera makeDefault position={[center[0] + 8, 8, center[2] + 8]} fov={50} />
      <OrbitControls target={center} enableDamping dampingFactor={0.1} minPolarAngle={0.2} maxPolarAngle={Math.PI / 2.2} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={1} castShadow shadow-mapSize={2048} />
      <Environment files="/cdn/lebombo_1k.hdr" />
      <Floor bounds={scene.bounds} />
      <Grid infiniteGrid fadeDistance={30} fadeStrength={2} cellSize={0.5} cellThickness={0.5} cellColor="var(--surface-panel)" sectionSize={2.5} sectionColor="var(--border-soft)" />
      <Walls walls={scene.walls} />
      <Rooms rooms={scene.rooms} />
      <Furniture furniture={scene.furniture} />
    </>
  )
}

export function ThreeScene() {
  return (
    <div className="h-full w-full">
      <Canvas shadows>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default ThreeScene
