"use client";

/**
 * Lighting rig, ground plane and floor grid for the planner 3D viewer.
 *
 * Three-point setup: warm hemisphere ambient, a shadow-casting key light whose
 * shadow camera is fitted to the scene bounds, and a soft fill from the
 * opposite side. An HDR environment supplies image-based reflections so
 * metals and laminates read as real materials.
 */

import { Environment, Grid } from "@react-three/drei";
import {
  boundsCenter,
  boundsExtent,
  type SceneBounds,
  CANVAS_UNITS_TO_M,
} from "./viewerFraming";
import {
  FIXTURE_FINISHES,
  FOCSS_3D_COLORS,
  SHARED_GEOMETRIES,
  getSharedMaterial,
} from "./viewerMaterials";

const FLOOR_MARGIN_M = 5;

export function SceneEnvironment({ bounds }: { bounds: SceneBounds }) {
  const { cx, cz } = boundsCenter(bounds);
  const extent = boundsExtent(bounds, 6);
  const spanX = Math.max((bounds.maxX - bounds.minX) * CANVAS_UNITS_TO_M, 6);
  const spanZ = Math.max((bounds.maxZ - bounds.minZ) * CANVAS_UNITS_TO_M, 6);
  const shadowSpan = extent * 0.75 + 4;

  return (
    <>
      <hemisphereLight
        color={FOCSS_3D_COLORS.white150}
        groundColor={FOCSS_3D_COLORS.darkMidnightBlue700}
        intensity={0.4}
      />

      {/* Key light — fitted shadow frustum, soft PCF shadows */}
      <directionalLight
        position={[cx + extent * 0.6, Math.max(6, extent * 0.9), cz + extent * 0.45]}
        intensity={1.15}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-shadowSpan}
        shadow-camera-right={shadowSpan}
        shadow-camera-top={shadowSpan}
        shadow-camera-bottom={-shadowSpan}
        shadow-camera-near={0.5}
        shadow-camera-far={extent * 3 + 20}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />

      {/* Fill light — lifts shadow side without casting */}
      <directionalLight
        position={[cx - extent * 0.8, extent * 0.5 + 3, cz - extent * 0.6]}
        intensity={0.3}
      />

      <Environment files="/cdn/lebombo_1k.hdr" environmentIntensity={0.35} />

      {/* Ground plane — warm screed floor that receives contact shadows */}
      <mesh
        geometry={SHARED_GEOMETRIES.unitPlane}
        material={getSharedMaterial(FIXTURE_FINISHES.floor)}
        position={[cx, -0.002, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[spanX + FLOOR_MARGIN_M * 2, spanZ + FLOOR_MARGIN_M * 2, 1]}
        receiveShadow
      />

      <Grid
        position={[cx, 0.001, cz]}
        infiniteGrid
        cellSize={0.5}
        cellThickness={0.5}
        cellColor={FOCSS_3D_COLORS.bronze800}
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor={FOCSS_3D_COLORS.bronze500}
        fadeDistance={Math.max(30, extent * 2.5)}
        fadeStrength={1.5}
      />
    </>
  );
}
