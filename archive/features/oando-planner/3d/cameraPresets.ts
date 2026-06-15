export type CameraMode = "orbit" | "top-down" | "walkthrough" | "section-elevation";

export interface CameraPreset {
  mode: CameraMode;
  label: string;
  description: string;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fov: number;
  near: number;
  far: number;
  enableOrbit: boolean;
  enablePan: boolean;
  enableZoom: boolean;
  animationDurationMs: number;
}

export function buildOrbitPreset(
  roomWidthM: number,
  roomDepthM: number,
  roomHeightM: number,
): CameraPreset {
  const maxDim = Math.max(roomWidthM, roomDepthM);
  const distance = maxDim * 1.5;
  return {
    mode: "orbit",
    label: "Orbit",
    description: "Free orbit around the scene",
    position: {
      x: roomWidthM / 2 + distance * 0.7,
      y: roomHeightM * 1.2,
      z: roomDepthM / 2 + distance * 0.7,
    },
    target: {
      x: roomWidthM / 2,
      y: 0,
      z: roomDepthM / 2,
    },
    fov: 50,
    near: 0.01,
    far: maxDim * 10,
    enableOrbit: true,
    enablePan: true,
    enableZoom: true,
    animationDurationMs: 800,
  };
}

export function buildTopDownPreset(
  roomWidthM: number,
  roomDepthM: number,
): CameraPreset {
  const maxDim = Math.max(roomWidthM, roomDepthM);
  return {
    mode: "top-down",
    label: "Top Down",
    description: "Bird's eye view from above",
    position: {
      x: roomWidthM / 2,
      y: maxDim * 1.5,
      z: roomDepthM / 2,
    },
    target: {
      x: roomWidthM / 2,
      y: 0,
      z: roomDepthM / 2,
    },
    fov: 50,
    near: 0.01,
    far: maxDim * 10,
    enableOrbit: false,
    enablePan: true,
    enableZoom: true,
    animationDurationMs: 600,
  };
}

export function buildWalkthroughPreset(
  roomWidthM: number,
  roomDepthM: number,
): CameraPreset {
  return {
    mode: "walkthrough",
    label: "Walkthrough",
    description: "First-person eye-level view",
    position: {
      x: roomWidthM * 0.1,
      y: 1.6,
      z: roomDepthM * 0.9,
    },
    target: {
      x: roomWidthM / 2,
      y: 1.2,
      z: roomDepthM / 2,
    },
    fov: 65,
    near: 0.01,
    far: Math.max(roomWidthM, roomDepthM) * 5,
    enableOrbit: true,
    enablePan: false,
    enableZoom: false,
    animationDurationMs: 1000,
  };
}

export function buildSectionElevationPreset(
  roomWidthM: number,
  roomDepthM: number,
  roomHeightM: number,
): CameraPreset {
  const maxDim = Math.max(roomWidthM, roomHeightM);
  return {
    mode: "section-elevation",
    label: "Section",
    description: "Side elevation view showing wall heights",
    position: {
      x: roomWidthM / 2,
      y: roomHeightM / 2,
      z: roomDepthM + maxDim * 0.8,
    },
    target: {
      x: roomWidthM / 2,
      y: roomHeightM / 2,
      z: roomDepthM / 2,
    },
    fov: 40,
    near: 0.01,
    far: maxDim * 10,
    enableOrbit: false,
    enablePan: true,
    enableZoom: true,
    animationDurationMs: 800,
  };
}

export function getAllCameraPresets(
  roomWidthM: number,
  roomDepthM: number,
  roomHeightM: number,
): CameraPreset[] {
  return [
    buildOrbitPreset(roomWidthM, roomDepthM, roomHeightM),
    buildTopDownPreset(roomWidthM, roomDepthM),
    buildWalkthroughPreset(roomWidthM, roomDepthM),
    buildSectionElevationPreset(roomWidthM, roomDepthM, roomHeightM),
  ];
}

export function interpolateCamera(
  from: CameraPreset,
  to: CameraPreset,
  t: number,
): { position: { x: number; y: number; z: number }; target: { x: number; y: number; z: number }; fov: number } {
  const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  return {
    position: {
      x: from.position.x + (to.position.x - from.position.x) * ease,
      y: from.position.y + (to.position.y - from.position.y) * ease,
      z: from.position.z + (to.position.z - from.position.z) * ease,
    },
    target: {
      x: from.target.x + (to.target.x - from.target.x) * ease,
      y: from.target.y + (to.target.y - from.target.y) * ease,
      z: from.target.z + (to.target.z - from.target.z) * ease,
    },
    fov: from.fov + (to.fov - from.fov) * ease,
  };
}
