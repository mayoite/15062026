"use client";

import { Html } from "@react-three/drei";

import { mmToWorld, type Planner3DItem, type Planner3DSceneDocument } from "./types";

function resolveItemColor(item: Planner3DItem) {
  if (item.color) return item.color;
  const category = item.category.toLowerCase();
  if (category.includes("storage")) return "var(--border-soft)";
  if (category.includes("seat") || category.includes("sofa")) return "var(--border-soft)";
  if (category.includes("table")) return "var(--border-soft)";
  if (category.includes("desk") || category.includes("work")) return "var(--border-soft)";
  return "var(--border-soft)";
}

export function PlannerRoomShell({ room }: { room: Planner3DSceneDocument["room"] }) {
  const halfWidth = mmToWorld(room.widthMm) / 2;
  const halfDepth = mmToWorld(room.depthMm) / 2;
  const wallHeight = mmToWorld(room.wallHeightMm);
  const wallThickness = mmToWorld(room.wallThicknessMm);
  const floorThickness = mmToWorld(room.floorThicknessMm);
  const frontWallHeight = wallHeight * 0.4;

  return (
    <group>
      <mesh receiveShadow position={[0, -floorThickness / 2, 0]}>
        <boxGeometry
          args={[
            mmToWorld(room.widthMm),
            floorThickness,
            mmToWorld(room.depthMm),
          ]}
        />
        <meshStandardMaterial
          color="var(--text-body)"
          roughness={0.98}
          metalness={0.02}
        />
      </mesh>
      <mesh
        receiveShadow
        position={[0, wallHeight / 2, -halfDepth - wallThickness / 2]}
      >
        <boxGeometry
          args={[
            mmToWorld(room.widthMm) + wallThickness * 2,
            wallHeight,
            wallThickness,
          ]}
        />
        <meshStandardMaterial
          color="var(--border-soft)"
          roughness={0.82}
          metalness={0.03}
        />
      </mesh>
      <mesh
        receiveShadow
        position={[0, frontWallHeight / 2, halfDepth + wallThickness / 2]}
      >
        <boxGeometry
          args={[
            mmToWorld(room.widthMm) + wallThickness * 2,
            frontWallHeight,
            wallThickness,
          ]}
        />
        <meshStandardMaterial
          color="var(--border-soft)"
          roughness={0.82}
          metalness={0.03}
          transparent
          opacity={0.45}
        />
      </mesh>
      <mesh
        receiveShadow
        position={[-halfWidth - wallThickness / 2, wallHeight / 2, 0]}
      >
        <boxGeometry
          args={[wallThickness, wallHeight, mmToWorld(room.depthMm)]}
        />
        <meshStandardMaterial
          color="var(--border-soft)"
          roughness={0.82}
          metalness={0.03}
          transparent
          opacity={0.72}
        />
      </mesh>
      <mesh
        receiveShadow
        position={[halfWidth + wallThickness / 2, wallHeight / 2, 0]}
      >
        <boxGeometry
          args={[wallThickness, wallHeight, mmToWorld(room.depthMm)]}
        />
        <meshStandardMaterial
          color="var(--border-soft)"
          roughness={0.82}
          metalness={0.03}
          transparent
          opacity={0.72}
        />
      </mesh>
      <gridHelper
        args={[
          Math.max(mmToWorld(room.widthMm), mmToWorld(room.depthMm)) + 2,
          16,
          "var(--border-soft)",
          "var(--border-soft)",
        ]}
        position={[0, 0.001, 0]}
      />
    </group>
  );
}

export function PlannerItemMesh({
  room,
  item,
}: {
  room: Planner3DSceneDocument["room"];
  item: Planner3DItem;
}) {
  const halfWidth = mmToWorld(room.widthMm) / 2;
  const halfDepth = mmToWorld(room.depthMm) / 2;
  const width = mmToWorld(item.sizeMm.widthMm);
  const depth = mmToWorld(item.sizeMm.depthMm);
  const height = mmToWorld(item.sizeMm.heightMm);
  const x = mmToWorld(item.centerMm.xMm) - halfWidth;
  const z = mmToWorld(item.centerMm.yMm) - halfDepth;
  const y = height / 2;
  const rotationY = ((item.rotationDeg ?? 0) * Math.PI) / 180;

  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={resolveItemColor(item)}
          roughness={0.72}
          metalness={0.08}
        />
      </mesh>
      <mesh castShadow receiveShadow position={[0, height / 2 - 0.01, 0]}>
        <boxGeometry
          args={[
            width * 0.92,
            Math.min(mmToWorld(18), height * 0.18),
            depth * 0.92,
          ]}
        />
        <meshStandardMaterial
          color="var(--surface-panel)"
          roughness={0.34}
          metalness={0.06}
        />
      </mesh>
      <Html
        center
        transform
        distanceFactor={10}
        position={[0, height / 2 + 0.14, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="planner-viewer-chip min-w-[7rem] rounded-full px-3 py-1 text-center typ-caption font-semibold uppercase tracking-[0.16em] text-body">
          {item.name}
        </div>
      </Html>
    </group>
  );
}
