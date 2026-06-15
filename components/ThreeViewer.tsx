"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
  ContactShadows,
} from "@react-three/drei";

interface ThreeViewerProps {
  modelUrl: string;
  fallback?: React.ReactNode;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  // Clone to avoid mutation issues if rendered multiple times
  return <primitive object={scene.clone()} />;
}

export default function ThreeViewer({ modelUrl, fallback }: ThreeViewerProps) {
  if (!modelUrl) return fallback || null;

  return (
    <div className="pdp-viewer-panel min-h-[320px]">
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="pdp-viewer-spinner"></div>
          </div>
        }
      >
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
            castShadow
          />
          <Environment preset="city" />

          <Model url={modelUrl} />

          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4}
          />
          <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </Suspense>
    </div>
  );
}
