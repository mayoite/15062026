"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

/**
 * Forces PCFShadowMap to avoid deprecated PCFSoftShadowMap paths.
 * Ported from E:\floorplan-react\1\planner\viewer\ShadowConfig.tsx
 */
export function ShadowConfig() {
  const { gl } = useThree();
  useEffect(() => {
    if (gl?.shadowMap) {
      gl.shadowMap.type = THREE.PCFShadowMap;
      gl.shadowMap.enabled = true;
    }
  }, [gl]);
  return null;
}