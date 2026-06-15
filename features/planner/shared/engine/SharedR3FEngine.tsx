"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";

export interface SharedR3FEngineProps {
  children?: React.ReactNode;
}

export function SharedR3FEngine({ children }: SharedR3FEngineProps) {
  return (
    <div className="h-full w-full relative bg-gray-900">
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 45 }}>
        <OrbitControls makeDefault dampingFactor={0.1} />
        <Environment files="/cdn/potsdamer_platz_1k.hdr" />
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[10, 20, 10]}
          intensity={1.5}
          shadow-mapSize={[2048, 2048]}
        />
        {children}
      </Canvas>
    </div>
  );
}
