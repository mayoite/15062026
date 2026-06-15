"use client";

type PlannerEnvironmentProps = {
  ambientIntensity?: number;
  directionalIntensity?: number;
  directionalPosition?: [x: number, y: number, z: number];
  softShadows?: boolean;
};

const DEFAULT_DIRECTIONAL_POSITION: [number, number, number] = [5, 10, 6];

export function SafeEnvironment() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#94a3b8", "#94a3b8", 0.55]} />
      <directionalLight position={[5, 8, 4]} intensity={0.9} />
    </>
  );
}

export function PlannerEnvironment({
  ambientIntensity = 0.55,
  directionalIntensity = 1.1,
  directionalPosition = DEFAULT_DIRECTIONAL_POSITION,
  softShadows = true,
}: PlannerEnvironmentProps) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={directionalPosition}
        intensity={directionalIntensity}
        castShadow={softShadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <hemisphereLight args={["#94a3b8", "#94a3b8", 0.5]} />
      <directionalLight position={[-4, 6, -3]} intensity={0.3} />
    </>
  );
}
