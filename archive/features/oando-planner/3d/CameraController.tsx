import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface CameraControllerProps {
  mode: "orbit" | "topDown" | "walkthrough";
}

/**
 * Camera system with three presets:
 * - orbit: OrbitControls — rotate, pan, zoom
 * - topDown: Fixed camera looking straight down
 * - walkthrough: First-person style with WASD movement + mouse look via OrbitControls
 */
export function CameraController({ mode }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls> | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const moveSpeed = 0.08;

  // Track keyboard state for walkthrough WASD movement
  useEffect(() => {
    if (mode !== "walkthrough") {
      keysRef.current.clear();
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keysRef.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    const keys = keysRef.current;
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      keys.clear();
    };
  }, [mode]);

  // Set camera positions on mode change
  useEffect(() => {
    if (!camera) return;

    if (mode === "topDown") {
      camera.position.set(0, 15, 0.01); // 0.01 z offset prevents gimbal lock
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    } else if (mode === "walkthrough") {
      camera.position.set(0, 1.6, 5); // 1.6m eye level
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 1.6, 0);
        controlsRef.current.update();
      }
    } else {
      // Standard perspective orbit view
      camera.position.set(5, 8, 10);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  }, [mode, camera]);

  // Per-frame WASD movement in walkthrough mode
  useFrame(() => {
    if (mode !== "walkthrough") return;
    if (keysRef.current.size === 0) return;

    const controls = controlsRef.current;
    if (!controls) return;

    // Get the camera's forward direction projected onto the XZ plane
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    // Right vector perpendicular to forward on XZ plane
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const delta = new THREE.Vector3();

    if (keysRef.current.has("w") || keysRef.current.has("arrowup")) {
      delta.add(forward.clone().multiplyScalar(moveSpeed));
    }
    if (keysRef.current.has("s") || keysRef.current.has("arrowdown")) {
      delta.add(forward.clone().multiplyScalar(-moveSpeed));
    }
    if (keysRef.current.has("a") || keysRef.current.has("arrowleft")) {
      delta.add(right.clone().multiplyScalar(-moveSpeed));
    }
    if (keysRef.current.has("d") || keysRef.current.has("arrowright")) {
      delta.add(right.clone().multiplyScalar(moveSpeed));
    }

    if (delta.lengthSq() > 0) {
      camera.position.add(delta);
      controls.target.add(delta);
      controls.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={
        mode === "topDown"
          ? 0.01
          : mode === "walkthrough"
          ? Math.PI * 0.85 // Allow looking slightly below horizon in walkthrough
          : Math.PI / 2 - 0.05
      }
      minPolarAngle={mode === "topDown" ? 0 : 0.1}
      enableZoom={mode !== "walkthrough"}
      enablePan={mode !== "walkthrough"}
      minDistance={mode === "topDown" ? 5 : 1}
      maxDistance={mode === "topDown" ? 30 : 40}
      rotateSpeed={mode === "walkthrough" ? 0.5 : 1}
    />
  );
}
