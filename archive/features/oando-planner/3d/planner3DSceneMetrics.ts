import * as THREE from "three";

import { mmToWorld, type Planner3DItem, type Planner3DSceneDocument } from "./types";

export interface OrbitPose {
  position: [number, number, number];
  target: [number, number, number];
}

export interface WalkPose {
  position: [number, number, number];
  rotation: [number, number];
}

export interface CameraMemory {
  sceneSignature: string;
  orbit?: OrbitPose;
  walk?: WalkPose;
}

export interface SceneMetrics {
  target: [number, number, number];
  defaultOrbitPosition: [number, number, number];
  defaultWalkPosition: [number, number, number];
  walkEyeHeight: number;
  roomHalfWidthWorld: number;
  roomHalfDepthWorld: number;
  roomHeightWorld: number;
  maxSpanWorld: number;
  cameraFar: number;
  fogNear: number;
  fogFar: number;
  shadowScale: number;
  shadowFar: number;
  orbitMinDistance: number;
  orbitMaxDistance: number;
  labelPosition: [number, number, number];
}

export const UP_VECTOR = new THREE.Vector3(0, 1, 0);

export function clamp(value: number, min: number, max: number) {
  if (min > max) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

function getItemBounds(
  room: Planner3DSceneDocument["room"],
  item: Planner3DItem,
) {
  const halfWidth = mmToWorld(room.widthMm) / 2;
  const halfDepth = mmToWorld(room.depthMm) / 2;
  const width = mmToWorld(item.sizeMm.widthMm);
  const depth = mmToWorld(item.sizeMm.depthMm);
  const height = mmToWorld(item.sizeMm.heightMm);
  const centerX = mmToWorld(item.centerMm.xMm) - halfWidth;
  const centerZ = mmToWorld(item.centerMm.yMm) - halfDepth;
  const rotationY = ((item.rotationDeg ?? 0) * Math.PI) / 180;
  const cosY = Math.abs(Math.cos(rotationY));
  const sinY = Math.abs(Math.sin(rotationY));
  const extentX = (width / 2) * cosY + (depth / 2) * sinY;
  const extentZ = (width / 2) * sinY + (depth / 2) * cosY;

  return {
    minX: centerX - extentX,
    maxX: centerX + extentX,
    minZ: centerZ - extentZ,
    maxZ: centerZ + extentZ,
    topY: height,
  };
}

export function getSceneSignature(sceneDocument: Planner3DSceneDocument) {
  return [
    sceneDocument.id,
    sceneDocument.room.widthMm,
    sceneDocument.room.depthMm,
    sceneDocument.room.wallHeightMm,
    sceneDocument.room.wallThicknessMm,
    sceneDocument.room.floorThicknessMm,
    sceneDocument.items
      .map(
        (item) =>
          `${item.id}:${item.centerMm.xMm}:${item.centerMm.yMm}:${item.sizeMm.widthMm}:${item.sizeMm.depthMm}:${item.sizeMm.heightMm}:${item.rotationDeg ?? 0}`,
      )
      .join("|"),
  ].join(";");
}

export function getSceneMetrics(sceneDocument: Planner3DSceneDocument): SceneMetrics {
  const { room, items } = sceneDocument;
  const roomHalfWidthWorld = mmToWorld(room.widthMm) / 2;
  const roomHalfDepthWorld = mmToWorld(room.depthMm) / 2;
  const roomHeightWorld = mmToWorld(room.wallHeightMm);

  let minX = -roomHalfWidthWorld;
  let maxX = roomHalfWidthWorld;
  let minZ = -roomHalfDepthWorld;
  let maxZ = roomHalfDepthWorld;
  let topY = roomHeightWorld;

  for (const item of items) {
    const bounds = getItemBounds(room, item);
    minX = Math.min(minX, bounds.minX);
    maxX = Math.max(maxX, bounds.maxX);
    minZ = Math.min(minZ, bounds.minZ);
    maxZ = Math.max(maxZ, bounds.maxZ);
    topY = Math.max(topY, bounds.topY);
  }

  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const maxSpanWorld = Math.max(
    maxX - minX,
    maxZ - minZ,
    roomHeightWorld * 1.1,
    2.4,
  );
  const targetY = clamp(
    Math.max(roomHeightWorld * 0.42, topY * 0.48),
    0.9,
    Math.max(roomHeightWorld * 0.72, 1.4),
  );
  const walkEyeHeight = clamp(
    mmToWorld(room.wallHeightMm * 0.56),
    1.55,
    Math.max(1.7, roomHeightWorld - 0.45),
  );
  const walkMargin = Math.min(
    Math.max(mmToWorld(room.wallThicknessMm) + 0.15, 0.28),
    Math.min(roomHalfWidthWorld, roomHalfDepthWorld) * 0.8,
  );

  return {
    target: [centerX, targetY, centerZ],
    defaultOrbitPosition: [
      centerX + maxSpanWorld * 0.92,
      targetY + maxSpanWorld * 0.44,
      centerZ + maxSpanWorld * 0.96,
    ],
    defaultWalkPosition: [
      clamp(
        centerX - roomHalfWidthWorld * 0.35,
        -roomHalfWidthWorld + walkMargin,
        roomHalfWidthWorld - walkMargin,
      ),
      walkEyeHeight,
      clamp(
        centerZ + roomHalfDepthWorld * 0.2,
        -roomHalfDepthWorld + walkMargin,
        roomHalfDepthWorld - walkMargin,
      ),
    ],
    walkEyeHeight,
    roomHalfWidthWorld,
    roomHalfDepthWorld,
    roomHeightWorld,
    maxSpanWorld,
    cameraFar: Math.max(120, maxSpanWorld * 8),
    fogNear: Math.max(8, maxSpanWorld * 0.8),
    fogFar: Math.max(28, maxSpanWorld * 4.2),
    shadowScale: maxSpanWorld * 1.15,
    shadowFar: Math.max(12, maxSpanWorld * 1.8),
    orbitMinDistance: Math.max(3.2, maxSpanWorld * 0.36),
    orbitMaxDistance: Math.max(12, maxSpanWorld * 2.8),
    labelPosition: [minX + 0.2, roomHeightWorld + 0.16, minZ + 0.2],
  };
}
