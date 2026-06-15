"use client";

import React, { useRef, useEffect, useCallback, useReducer } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { usePlannerR3FStore, type CameraMode } from "./usePlannerR3FStore";

const WALK_SPEED = 4;
const WALK_EYE_HEIGHT = 1.6;
const MOUSE_SENSITIVITY = 0.002;
const TRANSITION_DURATION = 0.6;

function CameraTransition({
  targetPosition,
  targetLookAt,
  onComplete,
}: {
  targetPosition: THREE.Vector3;
  targetLookAt: THREE.Vector3;
  onComplete: () => void;
}) {
  const { camera } = useThree();
  const startPos = useRef(camera.position.clone());
  const startQuat = useRef(camera.quaternion.clone());
  const progress = useRef(0);
  const completed = useRef(false);
  const targetQuat = useRef(new THREE.Quaternion());

  useEffect(() => {
    startPos.current.copy(camera.position);
    startQuat.current.copy(camera.quaternion);
    progress.current = 0;
    completed.current = false;

    const tempCam = new THREE.PerspectiveCamera();
    tempCam.position.copy(targetPosition);
    tempCam.lookAt(targetLookAt);
    targetQuat.current.copy(tempCam.quaternion);
  }, [camera, targetPosition, targetLookAt]);

  useFrame((_, delta) => {
    if (completed.current) return;
    progress.current = Math.min(1, progress.current + delta / TRANSITION_DURATION);
    const t = easeInOutCubic(progress.current);

    camera.position.lerpVectors(startPos.current, targetPosition, t);
    camera.quaternion.slerpQuaternions(startQuat.current, targetQuat.current, t);

    if (progress.current >= 1) {
      completed.current = true;
      onComplete();
    }
  });

  return null;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function TopDownCamera({ roomWidth, roomDepth }: { roomWidth: number; roomDepth: number }) {
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[roomWidth / 2, 20, roomDepth / 2]}
        zoom={60}
        near={0.1}
        far={100}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <OrbitControls
        enableRotate={false}
        enablePan
        enableZoom
        minZoom={10}
        maxZoom={200}
        target={[roomWidth / 2, 0, roomDepth / 2]}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
    </>
  );
}

function OrbitCamera({ roomWidth, roomDepth }: { roomWidth: number; roomDepth: number }) {
  const pendingPreset = usePlannerR3FStore((s) => s.pendingCameraPreset);
  const clearCameraPreset = usePlannerR3FStore((s) => s.clearCameraPreset);
  const updateLiveCameraState = usePlannerR3FStore((s) => s.updateLiveCameraState);
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null!);
  const { camera } = useThree();

  const defaultPos: [number, number, number] = [
    roomWidth / 2 + roomWidth * 0.8,
    roomWidth * 0.6,
    roomDepth / 2 + roomDepth * 0.8,
  ];
  const defaultTgt: [number, number, number] = [roomWidth / 2, 0, roomDepth / 2];

  const appliedRef = useRef(false);

  useEffect(() => {
    if (!pendingPreset) return;
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(...pendingPreset.position);
    if (cam.isPerspectiveCamera) {
      Object.assign(cam, { fov: pendingPreset.fov });
      cam.updateProjectionMatrix();
    }
    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(...pendingPreset.target);
      controls.update();
    }
    appliedRef.current = true;
    clearCameraPreset();
  }, [pendingPreset, clearCameraPreset, camera]);

  const frameCount = useRef(0);
  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 30 !== 0) return;
    const target = controlsRef.current?.target;
    if (camera && target) {
      updateLiveCameraState({
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [target.x, target.y, target.z],
        fov: (camera as THREE.PerspectiveCamera).fov ?? 50,
      });
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={50}
        near={0.1}
        far={200}
        position={defaultPos}
      />
      <OrbitControls
        ref={controlsRef}
        target={defaultTgt}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={1}
        maxDistance={30}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

function WalkCamera({ roomWidth, roomDepth }: { roomWidth: number; roomDepth: number }) {
  const { gl } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const keys = useRef<Set<string>>(new Set());
  const locked = useRef(false);

  const handlePointerLockChange = useCallback(() => {
    locked.current = document.pointerLockElement === gl.domElement;
  }, [gl.domElement]);

  useEffect(() => {
    const canvas = gl.domElement;

    const onMouseMove = (e: MouseEvent) => {
      if (!locked.current) return;
      yaw.current -= e.movementX * MOUSE_SENSITIVITY;
      pitch.current -= e.movementY * MOUSE_SENSITIVITY;
      pitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch.current));
    };

    const onKeyDown = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const onKeyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());

    const onClick = () => {
      if (!locked.current) canvas.requestPointerLock();
    };

    const onPointerLockError = () => {
      locked.current = false;
    };

    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    document.addEventListener("pointerlockerror", onPointerLockError);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => {
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      document.removeEventListener("pointerlockerror", onPointerLockError);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
  }, [gl.domElement, handlePointerLockChange]);

  useFrame((_, delta) => {
    const cam = cameraRef.current;
    if (!cam) return;

    const euler = new THREE.Euler(pitch.current, yaw.current, 0, "YXZ");
    cam.quaternion.setFromEuler(euler);

    if (!locked.current) return;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    right.y = 0;
    right.normalize();

    const move = new THREE.Vector3();
    if (keys.current.has("w")) move.add(forward);
    if (keys.current.has("s")) move.sub(forward);
    if (keys.current.has("d")) move.add(right);
    if (keys.current.has("a")) move.sub(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(WALK_SPEED * delta);
      cam.position.add(move);
    }

    const margin = 0.3;
    cam.position.x = Math.max(margin, Math.min(roomWidth - margin, cam.position.x));
    cam.position.z = Math.max(margin, Math.min(roomDepth - margin, cam.position.z));
    cam.position.y = WALK_EYE_HEIGHT;
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={70}
      near={0.05}
      far={100}
      position={[roomWidth / 2, WALK_EYE_HEIGHT, roomDepth / 2]}
    />
  );
}

function getTargetPosition(mode: CameraMode, w: number, d: number): THREE.Vector3 {
  switch (mode) {
    case "walk":
      return new THREE.Vector3(w / 2, WALK_EYE_HEIGHT, d / 2);
    case "top-down":
      return new THREE.Vector3(w / 2, 20, d / 2);
    case "orbit":
    default:
      return new THREE.Vector3(w / 2 + w * 0.8, w * 0.6, d / 2 + d * 0.8);
  }
}

function getTargetLookAt(w: number, d: number): THREE.Vector3 {
  return new THREE.Vector3(w / 2, 0, d / 2);
}

type TransitionState = {
  activeMode: CameraMode;
  transitioning: boolean;
  targetMode: CameraMode;
};

type TransitionAction =
  | { type: "START_TRANSITION"; targetMode: CameraMode }
  | { type: "COMPLETE_TRANSITION" };

function transitionReducer(state: TransitionState, action: TransitionAction): TransitionState {
  switch (action.type) {
    case "START_TRANSITION":
      return { ...state, transitioning: true, targetMode: action.targetMode };
    case "COMPLETE_TRANSITION":
      return { ...state, transitioning: false, activeMode: state.targetMode };
    default:
      return state;
  }
}

export function PlannerCamera() {
  const cameraMode = usePlannerR3FStore((s) => s.cameraMode);
  const room = usePlannerR3FStore((s) => s.room);
  const w = room.widthMm / 1000;
  const d = room.depthMm / 1000;

  const [state, dispatch] = useReducer(transitionReducer, {
    activeMode: cameraMode,
    transitioning: false,
    targetMode: cameraMode,
  });
  const prevMode = useRef<CameraMode>(cameraMode);

  useEffect(() => {
    if (cameraMode !== prevMode.current) {
      prevMode.current = cameraMode;
      dispatch({ type: "START_TRANSITION", targetMode: cameraMode });
    }
  }, [cameraMode]);

  const handleTransitionComplete = useCallback(() => {
    dispatch({ type: "COMPLETE_TRANSITION" });
  }, []);

  if (state.transitioning) {
    const targetPos = getTargetPosition(state.targetMode, w, d);
    const targetLookAt = getTargetLookAt(w, d);
    return (
      <CameraTransition
        targetPosition={targetPos}
        targetLookAt={targetLookAt}
        onComplete={handleTransitionComplete}
      />
    );
  }

  switch (state.activeMode) {
    case "top-down":
      return <TopDownCamera roomWidth={w} roomDepth={d} />;
    case "walk":
      return <WalkCamera roomWidth={w} roomDepth={d} />;
    case "orbit":
    default:
      return <OrbitCamera roomWidth={w} roomDepth={d} />;
  }
}
