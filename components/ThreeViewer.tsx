"use client";

import React, { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import { logClientError } from "@/lib/errorLogger";

interface ThreeViewerProps {
  modelUrl: string;
  fallback?: React.ReactNode;
}

class ThreeErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void logClientError({
      error,
      label: "ThreeViewer-canvas",
      componentStack: errorInfo?.componentStack ?? "",
    });
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center bg-zinc-900/5 text-zinc-400 p-6 text-center border border-dashed border-zinc-300 rounded-xl">
            <p className="text-sm font-semibold text-zinc-600">3D Preview unavailable</p>
            <p className="text-xs text-zinc-500 mt-1">An error occurred loading the 3D model.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
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
      <ThreeErrorBoundary fallback={fallback}>
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
      </ThreeErrorBoundary>
    </div>
  );
}
