"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addAfterEffect, Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Html,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import { Eye, User } from "lucide-react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

import {
  buildPlanner3DSceneDocument,
  mmToWorld,
  type Planner3DItem,
  type Planner3DSceneDocument,
  type PlannerDocument,
} from "./types";
import { FOCSS_3D_COLORS } from "./viewerMaterials";

interface Planner3DViewerProps {
  document: PlannerDocument;
  className?: string;
}

interface WebGLProbeResult {
  ok: boolean;
  renderer: string | null;
  context: "webgl2" | "webgl" | null;
}

type ViewerCameraMode = "orbit" | "walk";

interface OrbitPose {
  position: [number, number, number];
  target: [number, number, number];
}

interface WalkPose {
  position: [number, number, number];
  rotation: [number, number];
}

interface CameraMemory {
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

const UP_VECTOR = new THREE.Vector3(0, 1, 0);

function clamp(value: number, min: number, max: number) {
  if (min > max) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

function probeWebGL(): WebGLProbeResult {
  if (typeof document === "undefined") {
    return { ok: false, renderer: null, context: null };
  }

  const canvas = document.createElement("canvas");
  const contexts: Array<"webgl2" | "webgl"> = ["webgl2", "webgl"];

  for (const contextName of contexts) {
    const gl = canvas.getContext(contextName) as WebGLRenderingContext | WebGL2RenderingContext | null;
    if (!gl) continue;

    let renderer = "WebGL available";
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
    }
    return { ok: true, renderer, context: contextName };
  }

  return { ok: false, renderer: null, context: null };
}

function resolveItemColor(item: Planner3DItem) {
  if (item.color) return item.color;
  const category = item.category.toLowerCase();
  if (category.includes("storage")) return FOCSS_3D_COLORS.bronze800;
  if (category.includes("seat") || category.includes("sofa")) return FOCSS_3D_COLORS.bronze500;
  if (category.includes("table")) return FOCSS_3D_COLORS.ecru400;
  if (category.includes("desk") || category.includes("work")) return FOCSS_3D_COLORS.darkMidnightBlue350;
  return FOCSS_3D_COLORS.bronze700;
}

function getSceneSignature(sceneDocument: Planner3DSceneDocument) {
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

function getItemBounds(room: Planner3DSceneDocument["room"], item: Planner3DItem) {
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
  const extentX = width / 2 * cosY + depth / 2 * sinY;
  const extentZ = width / 2 * sinY + depth / 2 * cosY;

  return {
    minX: centerX - extentX,
    maxX: centerX + extentX,
    minZ: centerZ - extentZ,
    maxZ: centerZ + extentZ,
    topY: height,
  };
}

export function computePlanner3DSceneMetrics(sceneDocument: Planner3DSceneDocument): SceneMetrics {
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
  const maxSpanWorld = Math.max(maxX - minX, maxZ - minZ, roomHeightWorld * 1.1, 2.4);
  const targetY = clamp(Math.max(roomHeightWorld * 0.42, topY * 0.48), 0.9, Math.max(roomHeightWorld * 0.72, 1.4));
  const walkEyeHeight = clamp(mmToWorld(room.wallHeightMm * 0.56), 1.55, Math.max(1.7, roomHeightWorld - 0.45));
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
      clamp(centerX - roomHalfWidthWorld * 0.35, -roomHalfWidthWorld + walkMargin, roomHalfWidthWorld - walkMargin),
      walkEyeHeight,
      clamp(centerZ + roomHalfDepthWorld * 0.2, -roomHalfDepthWorld + walkMargin, roomHalfDepthWorld - walkMargin),
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

function PlannerRoomShell({ room }: { room: Planner3DSceneDocument["room"] }) {
  const halfWidth = mmToWorld(room.widthMm) / 2;
  const halfDepth = mmToWorld(room.depthMm) / 2;
  const wallHeight = mmToWorld(room.wallHeightMm);
  const wallThickness = mmToWorld(room.wallThicknessMm);
  const floorThickness = mmToWorld(room.floorThicknessMm);
  // Front wall is cut to 40% height so the orbit camera can see inside
  const frontWallHeight = wallHeight * 0.4;

  return (
    <group>
      {/* Floor */}
      <mesh receiveShadow position={[0, -floorThickness / 2, 0]}>
        <boxGeometry args={[mmToWorld(room.widthMm), floorThickness, mmToWorld(room.depthMm)]} />
        <meshStandardMaterial color={FOCSS_3D_COLORS.darkMidnightBlue700} roughness={0.98} metalness={0.02} />
      </mesh>
      {/* Back wall — full height */}
      <mesh receiveShadow position={[0, wallHeight / 2, -halfDepth - wallThickness / 2]}>
        <boxGeometry args={[mmToWorld(room.widthMm) + wallThickness * 2, wallHeight, wallThickness]} />
        <meshStandardMaterial color={FOCSS_3D_COLORS.darkMidnightBlue600} roughness={0.82} metalness={0.03} />
      </mesh>
      {/* Front wall — short + translucent for visibility */}
      <mesh receiveShadow position={[0, frontWallHeight / 2, halfDepth + wallThickness / 2]}>
        <boxGeometry args={[mmToWorld(room.widthMm) + wallThickness * 2, frontWallHeight, wallThickness]} />
        <meshStandardMaterial color={FOCSS_3D_COLORS.darkMidnightBlue700} roughness={0.82} metalness={0.03} transparent opacity={0.45} />
      </mesh>
      {/* Left wall — slight transparency */}
      <mesh receiveShadow position={[-halfWidth - wallThickness / 2, wallHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, mmToWorld(room.depthMm)]} />
        <meshStandardMaterial color={FOCSS_3D_COLORS.darkMidnightBlue600} roughness={0.82} metalness={0.03} transparent opacity={0.72} />
      </mesh>
      {/* Right wall — slight transparency */}
      <mesh receiveShadow position={[halfWidth + wallThickness / 2, wallHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, mmToWorld(room.depthMm)]} />
        <meshStandardMaterial color={FOCSS_3D_COLORS.darkMidnightBlue600} roughness={0.82} metalness={0.03} transparent opacity={0.72} />
      </mesh>
      <gridHelper
        args={[Math.max(mmToWorld(room.widthMm), mmToWorld(room.depthMm)) + 2, 16, FOCSS_3D_COLORS.bronze800, FOCSS_3D_COLORS.darkMidnightBlue700]}
        position={[0, 0.001, 0]}
      />
    </group>
  );
}

function PlannerItemMesh({ room, item }: { room: Planner3DSceneDocument["room"]; item: Planner3DItem }) {
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
        <meshStandardMaterial color={resolveItemColor(item)} roughness={0.72} metalness={0.08} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, height / 2 - 0.01, 0]}>
        <boxGeometry args={[width * 0.92, Math.min(mmToWorld(18), height * 0.18), depth * 0.92]} />
        <meshStandardMaterial color={FOCSS_3D_COLORS.white400} roughness={0.34} metalness={0.06} />
      </mesh>
      <Html center transform distanceFactor={10} position={[0, height / 2 + 0.14, 0]} style={{ pointerEvents: "none" }}>
        <div className="planner-viewer-chip min-w-[7rem] rounded-full px-3 py-1 text-center typ-caption font-semibold uppercase tracking-[0.16em] text-body">
          {item.name}
        </div>
      </Html>
    </group>
  );
}

function OrbitCamera({
  cameraMemoryRef,
  metrics,
}: {
  cameraMemoryRef: React.MutableRefObject<CameraMemory>;
  metrics: SceneMetrics;
}) {
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const savedPose = cameraMemoryRef.current.orbit;
    const position = savedPose?.position ?? metrics.defaultOrbitPosition;
    const target = savedPose?.target ?? metrics.target;

    camera.position.set(position[0], position[1], position[2]);
    controls.target.set(target[0], target[1], target[2]);
    controls.update();
  }, [cameraMemoryRef, metrics]);

  const handleControlsChange = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    cameraMemoryRef.current.orbit = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [controls.target.x, controls.target.y, controls.target.z],
    };
  };

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault fov={42} near={0.1} far={metrics.cameraFar} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={metrics.orbitMinDistance}
        maxDistance={metrics.orbitMaxDistance}
        maxPolarAngle={Math.PI / 2.03}
        target={metrics.target}
        onChange={handleControlsChange}
      />
    </>
  );
}

function WalkCamera({
  cameraMemoryRef,
  metrics,
  room,
}: {
  cameraMemoryRef: React.MutableRefObject<CameraMemory>;
  metrics: SceneMetrics;
  room: Planner3DSceneDocument["room"];
}) {
  const gl = useThree((state) => state.gl);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const moveSpeed = Math.min(0.11, Math.max(0.035, metrics.maxSpanWorld * 0.018));
  const lookSpeed = 0.002;
  const keys = useRef<Set<string>>(new Set());
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const isPointerLocked = useRef(false);

  const persistWalkPose = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    cameraMemoryRef.current.walk = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      rotation: [euler.current.x, euler.current.y],
    };
  }, [cameraMemoryRef]);

  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    const savedPose = cameraMemoryRef.current.walk;
    if (savedPose) {
      camera.position.set(savedPose.position[0], savedPose.position[1], savedPose.position[2]);
      euler.current.set(savedPose.rotation[0], savedPose.rotation[1], 0, "YXZ");
      camera.quaternion.setFromEuler(euler.current);
    } else {
      camera.position.set(
        metrics.defaultWalkPosition[0],
        metrics.defaultWalkPosition[1],
        metrics.defaultWalkPosition[2],
      );
      camera.lookAt(metrics.target[0], metrics.walkEyeHeight, metrics.target[2]);
      euler.current.setFromQuaternion(camera.quaternion, "YXZ");
    }

    persistWalkPose();

    const handleKeyDown = (event: KeyboardEvent) => keys.current.add(event.key.toLowerCase());
    const handleKeyUp = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    const handleMouseMove = (event: MouseEvent) => {
      if (!isPointerLocked.current) return;
      euler.current.y -= event.movementX * lookSpeed;
      euler.current.x -= event.movementY * lookSpeed;
      euler.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, euler.current.x));
    };
    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === gl.domElement;
    };
    const handleCanvasClick = () => {
      if (!isPointerLocked.current) {
        void gl.domElement.requestPointerLock();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    gl.domElement.addEventListener("click", handleCanvasClick);

    return () => {
      persistWalkPose();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      gl.domElement.removeEventListener("click", handleCanvasClick);
      if (document.pointerLockElement === gl.domElement) {
        void document.exitPointerLock();
      }
    };
  }, [cameraMemoryRef, gl, metrics, persistWalkPose]);

  useFrame((_state, delta) => {
    const camera = cameraRef.current;
    if (!camera) return;

    camera.quaternion.setFromEuler(euler.current);

    const direction = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;

    if (forward.lengthSq() > 0) {
      forward.normalize();
    }

    right.crossVectors(forward, UP_VECTOR);
    if (right.lengthSq() > 0) {
      right.normalize();
    }

    if (keys.current.has("w") || keys.current.has("arrowup")) direction.add(forward);
    if (keys.current.has("s") || keys.current.has("arrowdown")) direction.sub(forward);
    if (keys.current.has("a") || keys.current.has("arrowleft")) direction.sub(right);
    if (keys.current.has("d") || keys.current.has("arrowright")) direction.add(right);

    if (direction.lengthSq() > 0) {
      camera.position.add(direction.normalize().multiplyScalar(moveSpeed * Math.min(delta * 60, 1.8)));
    }

    const walkMargin = Math.min(
      Math.max(mmToWorld(room.wallThicknessMm) + 0.15, 0.28),
      Math.min(metrics.roomHalfWidthWorld, metrics.roomHalfDepthWorld) * 0.8,
    );

    camera.position.set(
      clamp(
        camera.position.x,
        -metrics.roomHalfWidthWorld + walkMargin,
        metrics.roomHalfWidthWorld - walkMargin,
      ),
      metrics.walkEyeHeight,
      clamp(
        camera.position.z,
        -metrics.roomHalfDepthWorld + walkMargin,
        metrics.roomHalfDepthWorld - walkMargin,
      ),
    );

    persistWalkPose();
  });

  return <PerspectiveCamera ref={cameraRef} makeDefault fov={70} near={0.1} far={metrics.cameraFar} />;
}

function Planner3DRenderEvidence({
  viewerRef,
}: {
  viewerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { gl } = useThree();
  const reported = useRef(false);

  useEffect(() => {
    return addAfterEffect(() => {
      if (reported.current) return;

      const context = gl.getContext();
      const width = context.drawingBufferWidth;
      const height = context.drawingBufferHeight;
      if (width <= 0 || height <= 0) return;

      const pixels = new Uint8Array(4);
      context.readPixels(
        Math.max(0, Math.floor(width / 2)),
        Math.max(0, Math.floor(height / 2)),
        1,
        1,
        context.RGBA,
        context.UNSIGNED_BYTE,
        pixels,
      );

      if (!pixels.some((value) => value > 0)) return;

      viewerRef.current?.setAttribute("data-render-evidence", "ready");
      viewerRef.current?.setAttribute(
        "data-render-luma",
        String(pixels[0] + pixels[1] + pixels[2] + pixels[3]),
      );
      reported.current = true;
    });
  }, [gl, viewerRef]);

  return null;
}

function PlannerScene({
  cameraMemoryRef,
  cameraMode,
  sceneDocument,
  viewerRef,
}: {
  cameraMemoryRef: React.MutableRefObject<CameraMemory>;
  cameraMode: ViewerCameraMode;
  sceneDocument: Planner3DSceneDocument;
  viewerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { room, items } = sceneDocument;
  const metrics = useMemo(() => computePlanner3DSceneMetrics(sceneDocument), [sceneDocument]);

  return (
    <>
      <Planner3DRenderEvidence viewerRef={viewerRef} />
      <color attach="background" args={[FOCSS_3D_COLORS.darkMidnightBlue950]} />
      <fog attach="fog" args={[FOCSS_3D_COLORS.darkMidnightBlue950, metrics.fogNear, metrics.fogFar]} />
      <ambientLight intensity={0.92} />
      <hemisphereLight intensity={0.58} groundColor={FOCSS_3D_COLORS.darkMidnightBlue800} color={FOCSS_3D_COLORS.oceanBoatBlue100} />
      <directionalLight
        position={[6, 12, 9]}
        intensity={1.65}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={metrics.shadowFar}
      />
      <spotLight position={[-8, 10, -5]} angle={0.34} penumbra={0.7} intensity={0.9} color={FOCSS_3D_COLORS.white350} />

      {cameraMode === "orbit" ? (
        <OrbitCamera cameraMemoryRef={cameraMemoryRef} metrics={metrics} />
      ) : (
        <WalkCamera cameraMemoryRef={cameraMemoryRef} metrics={metrics} room={room} />
      )}
      <PlannerRoomShell room={room} />
      {items.map((item) => (
        <PlannerItemMesh key={item.id} room={room} item={item} />
      ))}
      <ContactShadows
        position={[0, 0.005, 0]}
        opacity={items.length > 0 ? 0.42 : 0.24}
        scale={metrics.shadowScale}
        blur={2.6}
        far={metrics.shadowFar}
      />
      <Html position={metrics.labelPosition} style={{ pointerEvents: "none" }}>
        <div className="planner-viewer-surface rounded-2xl border border-theme-soft px-3 py-2 typ-caption font-semibold uppercase tracking-[0.18em] text-body">
          mm scene
        </div>
      </Html>
    </>
  );
}

export function Planner3DViewer({ document, className }: Planner3DViewerProps) {
  const [cameraMode, setCameraMode] = useState<ViewerCameraMode>("orbit");
  const [webglProbe] = useState<WebGLProbeResult>(() => probeWebGL());
  const viewerRef = useRef<HTMLDivElement>(null);
  const sceneDocument = useMemo(() => buildPlanner3DSceneDocument(document), [document]);
  const sceneSignature = useMemo(() => getSceneSignature(sceneDocument), [sceneDocument]);
  const cameraMemoryRef = useRef<CameraMemory>({ sceneSignature });

  useEffect(() => {
    cameraMemoryRef.current = { sceneSignature };
  }, [sceneSignature]);

  useEffect(() => {
    viewerRef.current?.removeAttribute("data-render-evidence");
    viewerRef.current?.removeAttribute("data-render-luma");
  }, [sceneSignature, webglProbe.ok]);

  return (
    <div
      ref={viewerRef}
      className={`surface-inverse relative overflow-hidden rounded-[2rem] border border-theme-soft shadow-theme-float ${className ?? ""}`}
      data-testid="planner-3d-viewer"
      data-webgl-status={webglProbe.ok ? "ready" : "fallback"}
    >
      {webglProbe.ok ? (
        <Suspense
          fallback={
            <div className="surface-inverse flex h-full min-h-[420px] items-center justify-center">
              <div className="planner-viewer-chip rounded-full px-4 py-2 typ-caption font-semibold uppercase tracking-[0.22em] text-body">
                Preparing 3D scene
              </div>
            </div>
          }
        >
          <Canvas
            shadows
            dpr={[1, 1.75]}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              preserveDrawingBuffer: true,
            }}
            className="h-full min-h-[420px] w-full"
            data-testid="planner-3d-canvas"
          >
            <PlannerScene
              cameraMemoryRef={cameraMemoryRef}
              cameraMode={cameraMode}
              sceneDocument={sceneDocument}
              viewerRef={viewerRef}
            />
          </Canvas>
        </Suspense>
      ) : (
        <div
          className="surface-inverse flex h-full min-h-[420px] items-center justify-center px-6"
          data-testid="planner-3d-fallback"
        >
          <div className="planner-viewer-surface max-w-md rounded-[1.35rem] border border-warning px-5 py-4 text-center">
            <div className="typ-caption font-semibold uppercase tracking-[0.16em] text-warning">3D unavailable</div>
            <div className="mt-2 typ-caption-lg text-body">
              WebGL is unavailable in this browser context. Continue editing in 2D or Split while the room data stays intact.
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[color:var(--surface-inverse)] to-transparent" />

      <div className="absolute bottom-4 right-4 z-20 flex gap-2">
        <button
          type="button"
          aria-pressed={cameraMode === "orbit"}
          onClick={() => setCameraMode("orbit")}
          className={`planner-viewer-chip flex items-center gap-2 rounded-full px-4 py-2 typ-caption font-semibold uppercase tracking-[0.18em] transition ${cameraMode === "orbit" ? "planner-viewer-chip-active" : "hover:border-[color:var(--planner-border-hover)] hover:text-strong"}`}
        >
          <Eye className="h-4 w-4" /> Orbit
        </button>
        <button
          type="button"
          aria-pressed={cameraMode === "walk"}
          onClick={() => setCameraMode("walk")}
          className={`planner-viewer-chip flex items-center gap-2 rounded-full px-4 py-2 typ-caption font-semibold uppercase tracking-[0.18em] transition ${cameraMode === "walk" ? "planner-viewer-chip-active" : "hover:border-[color:var(--planner-border-hover)] hover:text-strong"}`}
        >
          <User className="h-4 w-4" /> Walk
        </button>
      </div>

      <div className="absolute left-4 top-4 z-20 flex max-w-[20rem] flex-col gap-2">
        <div className="planner-viewer-surface rounded-[1.35rem] border border-theme-soft px-4 py-3">
          <div className="typ-caption font-semibold uppercase tracking-[0.18em] text-muted">
            {cameraMode === "orbit" ? "Orbit camera" : "Walk camera"}
          </div>
          <div className="mt-1 typ-caption-lg text-body">
            {cameraMode === "orbit"
              ? "Drag to inspect the document-mapped room and product shells."
              : "Click into the canvas, then use WASD or arrow keys with mouse look."}
          </div>
        </div>
        <div className="planner-viewer-surface rounded-[1.35rem] border border-theme-soft px-4 py-3">
          <div className="typ-caption font-semibold uppercase tracking-[0.16em] text-muted">Renderer</div>
          <div className="mt-1 typ-caption-lg text-body" data-testid="planner-3d-renderer">
            {webglProbe.ok
              ? `${webglProbe.context?.toUpperCase() ?? "WEBGL"} · ${webglProbe.renderer ?? "Renderer unavailable"}`
              : "Fallback mode"}
          </div>
        </div>
        {sceneDocument.items.length === 0 ? (
          <div className="planner-viewer-surface rounded-[1.35rem] border border-warning px-4 py-3">
            <div className="typ-caption font-semibold uppercase tracking-[0.16em] text-warning">Empty mapped scene</div>
            <div className="mt-1 typ-caption-lg text-body">
              No planner items are mapped yet. The room shell is using the document dimensions.
            </div>
          </div>
        ) : null}
        {cameraMode === "walk" ? (
          <div className="planner-viewer-surface rounded-[1.35rem] border border-theme-soft px-4 py-3">
            <div className="typ-caption font-semibold uppercase tracking-[0.16em] text-muted">Controls</div>
            <div className="mt-1 typ-caption-lg text-body">WASD or arrow keys | Mouse look | Esc releases pointer lock</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
