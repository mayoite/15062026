"use client";

/**
 * PlannerViewer3D — Shared view-only 3D scene for both planners.
 * Renders walls, furniture, and zones from a flat element list.
 * Lives in the same screen as 2D (tab toggle, no route change).
 */

import { Suspense, useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { Camera, RotateCcw, Sun, Moon, Lightbulb, CameraIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Element3D {
  id: string;
  type: "wall" | "door" | "window" | "furniture" | "desk" | "bench" | "zone";
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  rotation?: number;
  label?: string;
  material?: "wood" | "metal" | "fabric" | "glass";
  color?: string;
}

export interface Viewer3DProps {
  elements: Element3D[];
  floorWidth?: number;
  floorDepth?: number;
  floorMaterial?: "carpet" | "wood" | "tile" | "concrete";
}

// ─── Lighting presets ─────────────────────────────────────────────────────────

type LightingPreset = "daylight" | "evening" | "presentation";

const LIGHTING: Record<LightingPreset, { ambient: string; directional: string; intensity: number }> = {
  daylight: { ambient: "#f0f0ff", directional: "#ffffff", intensity: 1.2 },
  evening: { ambient: "#ffe8cc", directional: "#ffcc80", intensity: 0.8 },
  presentation: { ambient: "#ffffff", directional: "#ffffff", intensity: 1.5 },
};

// ─── Material colors ──────────────────────────────────────────────────────────

const MATERIAL_COLORS: Record<string, string> = {
  wood: "#8B6914",
  metal: "#888888",
  fabric: "#5B7FA3",
  glass: "#B8D4E3",
};

const FLOOR_COLORS: Record<string, string> = {
  carpet: "#7A7A6E",
  wood: "#C4A265",
  tile: "#D4D4D4",
  concrete: "#A0A0A0",
};

// ─── 3D Scene elements ────────────────────────────────────────────────────────

function WallMesh({ el }: { el: Element3D }) {
  return (
    <mesh
      position={[el.x + el.w / 2, el.h / 2, el.y + el.d / 2]}
      rotation={[0, (el.rotation || 0) * (Math.PI / 180), 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[el.w, el.h, el.d]} />
      <meshStandardMaterial color="#e0e0e0" roughness={0.9} />
    </mesh>
  );
}

function FurnitureMesh({ el }: { el: Element3D }) {
  const color = el.color || MATERIAL_COLORS[el.material || "wood"] || "#a0522d";
  return (
    <mesh
      position={[el.x + el.w / 2, el.h / 2, el.y + el.d / 2]}
      rotation={[0, (el.rotation || 0) * (Math.PI / 180), 0]}
      castShadow
    >
      <boxGeometry args={[el.w, el.h, el.d]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={el.material === "metal" ? 0.7 : 0.1} />
    </mesh>
  );
}

function ZoneMesh({ el }: { el: Element3D }) {
  return (
    <mesh position={[el.x + el.w / 2, 0.02, el.y + el.d / 2]} receiveShadow>
      <boxGeometry args={[el.w, 0.03, el.d]} />
      <meshStandardMaterial color={el.color || "#c8a96e"} transparent opacity={0.25} />
    </mesh>
  );
}

function FloorPlane({ width, depth, material }: { width: number; depth: number; material: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, depth / 2]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={FLOOR_COLORS[material] || "#d4d4d4"} roughness={0.8} />
    </mesh>
  );
}

function Scene({ elements, floorWidth, floorDepth, floorMaterial, lighting }: Viewer3DProps & { lighting: LightingPreset }) {
  const preset = LIGHTING[lighting];
  return (
    <>
      <ambientLight color={preset.ambient} intensity={0.4} />
      <directionalLight
        color={preset.directional}
        intensity={preset.intensity}
        position={[floorWidth || 10, 12, (floorDepth || 10) * 0.8]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <FloorPlane width={floorWidth || 20} depth={floorDepth || 15} material={floorMaterial || "concrete"} />
      {elements.map((el) => {
        switch (el.type) {
          case "wall":
            return <WallMesh key={el.id} el={el} />;
          case "zone":
            return <ZoneMesh key={el.id} el={el} />;
          default:
            return <FurnitureMesh key={el.id} el={el} />;
        }
      })}
    </>
  );
}

// ─── Controls bar ─────────────────────────────────────────────────────────────

function ViewerControls({
  isOrtho,
  onToggleOrtho,
  onReset,
  lighting,
  onSetLighting,
  onScreenshot,
}: {
  isOrtho: boolean;
  onToggleOrtho: () => void;
  onReset: () => void;
  lighting: LightingPreset;
  onSetLighting: (l: LightingPreset) => void;
  onScreenshot: () => void;
}) {
  const LightIcon = lighting === "daylight" ? Sun : lighting === "evening" ? Moon : Lightbulb;
  const nextLighting: LightingPreset = lighting === "daylight" ? "evening" : lighting === "evening" ? "presentation" : "daylight";

  return (
    <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
      <button onClick={onToggleOrtho} className="viewer3d-btn" title={isOrtho ? "Perspective" : "Top-down"}>
        <Camera size={14} />
      </button>
      <button onClick={onReset} className="viewer3d-btn" title="Reset camera">
        <RotateCcw size={14} />
      </button>
      <button onClick={() => onSetLighting(nextLighting)} className="viewer3d-btn" title={`Lighting: ${nextLighting}`}>
        <LightIcon size={14} />
      </button>
      <button onClick={onScreenshot} className="viewer3d-btn" title="Screenshot">
        <CameraIcon size={14} />
      </button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PlannerViewer3D({ elements, floorWidth = 20, floorDepth = 15, floorMaterial = "concrete" }: Viewer3DProps) {
  const [isOrtho, setIsOrtho] = useState(false);
  const [lighting, setLighting] = useState<LightingPreset>("daylight");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleScreenshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "planner-3d-screenshot.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px]" style={{ background: "var(--surface-canvas, #f8f8f8)" }}>
      <ViewerControls
        isOrtho={isOrtho}
        onToggleOrtho={() => setIsOrtho(!isOrtho)}
        onReset={() => setIsOrtho(false)}
        lighting={lighting}
        onSetLighting={setLighting}
        onScreenshot={handleScreenshot}
      />

      <Canvas
        ref={canvasRef}
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          {isOrtho ? (
            <OrthographicCamera makeDefault position={[floorWidth / 2, 20, floorDepth / 2]} zoom={30} />
          ) : (
            <PerspectiveCamera makeDefault position={[floorWidth * 0.8, 10, floorDepth * 1.2]} fov={50} />
          )}
          <OrbitControls
            enableDamping
            dampingFactor={0.1}
            target={[floorWidth / 2, 0, floorDepth / 2]}
            maxPolarAngle={Math.PI / 2.1}
          />
          <Scene
            elements={elements}
            floorWidth={floorWidth}
            floorDepth={floorDepth}
            floorMaterial={floorMaterial}
            lighting={lighting}
          />
        </Suspense>
      </Canvas>

      <style jsx>{`
        :global(.viewer3d-btn) {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: var(--surface-page, rgba(255,255,255,0.9));
          border: 1px solid var(--border-soft, #e0e0e0);
          color: var(--text-body, #444);
          cursor: pointer;
          transition: background 0.15s;
        }
        :global(.viewer3d-btn:hover) {
          background: var(--surface-inset, #f0f0f0);
        }
      `}</style>
    </div>
  );
}
