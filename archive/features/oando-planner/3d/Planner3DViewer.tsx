"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
  type Planner3DSceneDocument,
  type PlannerDocument,
} from "./types";
import {
  clamp,
  getSceneMetrics,
  getSceneSignature,
  type CameraMemory,
  type SceneMetrics,
  UP_VECTOR,
} from "./planner3DSceneMetrics";
import { PlannerItemMesh, PlannerRoomShell } from "./Planner3DPrimitives";
import { collectPlanner3DSceneWarnings } from "../model";

interface Planner3DViewerProps {
  document: PlannerDocument;
  className?: string;
}

type ViewerCameraMode = "orbit" | "walk";

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
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={42}
        near={0.1}
        far={metrics.cameraFar}
      />
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
  const moveSpeed = Math.min(
    0.11,
    Math.max(0.035, metrics.maxSpanWorld * 0.018),
  );
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
      camera.position.set(
        savedPose.position[0],
        savedPose.position[1],
        savedPose.position[2],
      );
      euler.current.set(savedPose.rotation[0], savedPose.rotation[1], 0, "YXZ");
      camera.quaternion.setFromEuler(euler.current);
    } else {
      camera.position.set(
        metrics.defaultWalkPosition[0],
        metrics.defaultWalkPosition[1],
        metrics.defaultWalkPosition[2],
      );
      camera.lookAt(
        metrics.target[0],
        metrics.walkEyeHeight,
        metrics.target[2],
      );
      euler.current.setFromQuaternion(camera.quaternion, "YXZ");
    }

    persistWalkPose();

    const handleKeyDown = (event: KeyboardEvent) =>
      keys.current.add(event.key.toLowerCase());
    const handleKeyUp = (event: KeyboardEvent) =>
      keys.current.delete(event.key.toLowerCase());
    const handleMouseMove = (event: MouseEvent) => {
      if (!isPointerLocked.current) return;
      euler.current.y -= event.movementX * lookSpeed;
      euler.current.x -= event.movementY * lookSpeed;
      euler.current.x = Math.max(
        -Math.PI / 2.5,
        Math.min(Math.PI / 2.5, euler.current.x),
      );
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
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange,
      );
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

    if (keys.current.has("w") || keys.current.has("arrowup"))
      direction.add(forward);
    if (keys.current.has("s") || keys.current.has("arrowdown"))
      direction.sub(forward);
    if (keys.current.has("a") || keys.current.has("arrowleft"))
      direction.sub(right);
    if (keys.current.has("d") || keys.current.has("arrowright"))
      direction.add(right);

    if (direction.lengthSq() > 0) {
      camera.position.add(
        direction
          .normalize()
          .multiplyScalar(moveSpeed * Math.min(delta * 60, 1.8)),
      );
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

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={70}
      near={0.1}
      far={metrics.cameraFar}
    />
  );
}

function PlannerScene({
  cameraMemoryRef,
  cameraMode,
  sceneDocument,
}: {
  cameraMemoryRef: React.MutableRefObject<CameraMemory>;
  cameraMode: ViewerCameraMode;
  sceneDocument: Planner3DSceneDocument;
}) {
  const { room, items } = sceneDocument;
  const metrics = useMemo(
    () => getSceneMetrics(sceneDocument),
    [sceneDocument],
  );

  return (
    <>
      <color attach="background" args={["var(--text-body)"]} />
      <fog attach="fog" args={["var(--text-body)", metrics.fogNear, metrics.fogFar]} />
      <ambientLight intensity={0.92} />
      <hemisphereLight intensity={0.58} groundColor="var(--text-body)" color="var(--surface-panel)" />
      <directionalLight
        position={[6, 12, 9]}
        intensity={1.65}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={metrics.shadowFar}
      />
      <spotLight
        position={[-8, 10, -5]}
        angle={0.34}
        penumbra={0.7}
        intensity={0.9}
        color="var(--surface-panel)"
      />

      {cameraMode === "orbit" ? (
        <OrbitCamera cameraMemoryRef={cameraMemoryRef} metrics={metrics} />
      ) : (
        <WalkCamera
          cameraMemoryRef={cameraMemoryRef}
          metrics={metrics}
          room={room}
        />
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
  const sceneDocument = useMemo(
    () => buildPlanner3DSceneDocument(document),
    [document],
  );
  const sceneWarnings = useMemo(
    () => collectPlanner3DSceneWarnings(document).warnings,
    [document],
  );
  const sceneSignature = useMemo(
    () => getSceneSignature(sceneDocument),
    [sceneDocument],
  );
  const cameraMemoryRef = useRef<CameraMemory>({ sceneSignature });

  useEffect(() => {
    cameraMemoryRef.current = { sceneSignature };
  }, [sceneSignature]);

  return (
    <div
      className={`surface-inverse relative overflow-hidden rounded-[2rem] border border-theme-soft shadow-theme-float ${className ?? ""}`}
    >
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
          }}
          className="h-full min-h-[420px] w-full"
        >
          <PlannerScene
            cameraMemoryRef={cameraMemoryRef}
            cameraMode={cameraMode}
            sceneDocument={sceneDocument}
          />
        </Canvas>
      </Suspense>

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
        {sceneDocument.items.length === 0 ? (
          <div className="planner-viewer-surface rounded-[1.35rem] border border-warning px-4 py-3">
            <div className="typ-caption font-semibold uppercase tracking-[0.16em] text-warning">
              Empty mapped scene
            </div>
            <div className="mt-1 typ-caption-lg text-body">
              No planner items are mapped yet. The room shell is using the
              document dimensions.
            </div>
          </div>
        ) : null}
        {sceneWarnings.length > 0 ? (
          <div className="planner-viewer-surface rounded-[1.35rem] border border-warning px-4 py-3">
            <div className="typ-caption font-semibold uppercase tracking-[0.16em] text-warning">
              Scene warnings
            </div>
            <div className="mt-1 space-y-1 typ-caption-lg text-body">
              {sceneWarnings.slice(0, 3).map((warning) => (
                <div key={warning.code}>{warning.message}</div>
              ))}
              {sceneWarnings.length > 3 ? (
                <div className="text-muted">
                  +{sceneWarnings.length - 3} more warnings
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        {cameraMode === "walk" ? (
          <div className="planner-viewer-surface rounded-[1.35rem] border border-theme-soft px-4 py-3">
            <div className="typ-caption font-semibold uppercase tracking-[0.16em] text-muted">
              Controls
            </div>
            <div className="mt-1 typ-caption-lg text-body">
              WASD or arrow keys | Mouse look | Esc releases pointer lock
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
