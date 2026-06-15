import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { usePlannerStore } from "../data/plannerStore";
import { WallMesh } from "./WallMesh";
import { FloorMesh } from "./FloorMesh";
import { FurnitureMesh } from "./FurnitureMesh";
import { DoorMesh } from "./DoorMesh";
import { WindowMesh } from "./WindowMesh";
import { CameraController } from "./CameraController";
import { Lighting } from "./Lighting";
import { getLightingPreset } from "./presets";
import ErrorBoundary from "../components/ErrorBoundary";

export function PlannerScene() {
  const [cameraMode, setCameraMode] = useState<"orbit" | "topDown" | "walkthrough">("orbit");

  const walls = usePlannerStore((s) => s.walls);
  const rooms = usePlannerStore((s) => s.rooms);
  const furniture = usePlannerStore((s) => s.furniture);
  const doors = usePlannerStore((s) => s.doors);
  const windows = usePlannerStore((s) => s.windows);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const lightingPreset = usePlannerStore((s) => s.lightingPreset);

  // Get lighting configuration for fog and background
  const lightingConfig = getLightingPreset(lightingPreset);

  return (
    <div className="absolute inset-0 bg-[var(--text-body)]">
      {/* Floating Camera Control Toolbar in Top-Right */}
      <div className="absolute right-4 top-4 z-40 flex bg-[var(--text-body)]/90 backdrop-blur-md border border-white/10 rounded-lg p-1 shadow-lg gap-1">
        <button
          onClick={() => setCameraMode("orbit")}
          className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
            cameraMode === "orbit"
              ? "bg-[var(--border-soft)] text-white shadow-md"
              : "text-white/60 hover:text-white/90 hover:bg-white/5"
          }`}
        >
          🔭 Orbit
        </button>
        <button
          onClick={() => setCameraMode("topDown")}
          className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
            cameraMode === "topDown"
              ? "bg-[var(--border-soft)] text-white shadow-md"
              : "text-white/60 hover:text-white/90 hover:bg-white/5"
          }`}
        >
          🗺️ Top-Down
        </button>
        <button
          onClick={() => setCameraMode("walkthrough")}
          className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
            cameraMode === "walkthrough"
              ? "bg-[var(--border-soft)] text-white shadow-md"
              : "text-white/60 hover:text-white/90 hover:bg-white/5"
          }`}
        >
          🚶 Walk
        </button>
      </div>

      <ErrorBoundary resetKey="planner-3d-scene">
        <Canvas
          shadows
          camera={{ position: [5, 8, 10], fov: 50 }}
          style={{ width: "100%", height: "100%" }}
        >
          {/* Fog for a more premium and depth-rich look */}
          <fog attach="fog" args={[lightingConfig.fog.color, lightingConfig.fog.near, lightingConfig.fog.far]} />

          {/* Scene background color */}
          <color attach="background" args={[lightingConfig.backgroundColor]} />

          {/* Lighting configuration */}
          <Lighting />

          {/* Camera interaction controller */}
          <CameraController mode={cameraMode} />

          {/* Floor Grid for perspective alignment */}
          <gridHelper args={[50, 50, "var(--border-soft)", "var(--border-soft)"]} position={[0, -0.01, 0]} />

          {/* Render Floor Polygons (Rooms) */}
          {rooms.map((room) => (
            <FloorMesh key={room.id} room={room} isSelected={selectedId === room.id} />
          ))}

          {/* Render Walls */}
          {walls.map((wall) => (
            <WallMesh key={wall.id} wall={wall} isSelected={selectedId === wall.id} />
          ))}

          {/* Render Doors */}
          {doors.map((door) => (
            <DoorMesh key={door.id} door={door} isSelected={selectedId === door.id} />
          ))}

          {/* Render Windows */}
          {windows.map((win) => (
            <WindowMesh key={win.id} window={win} isSelected={selectedId === win.id} />
          ))}

          {/* Render Furniture */}
          {furniture.map((item) => (
            <FurnitureMesh key={item.id} item={item} isSelected={selectedId === item.id} />
          ))}
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
