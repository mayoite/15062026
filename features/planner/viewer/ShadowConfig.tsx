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
  const shadowMap = gl.shadowMap;

  useEffect(() => {
    Object.assign(shadowMap, {
      enabled: true,
      type: THREE.PCFShadowMap,
    });
  }, [shadowMap]);
  return null;
}
