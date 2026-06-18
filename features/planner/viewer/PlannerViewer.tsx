"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CatalogCategory } from "../catalog/catalogTypes";
import { DoorMesh, RoomSlab, WallMesh, WindowMesh, ZoneSlab } from "./FixtureMeshes";
import { InstancedFurnitureRenderer } from "./InstancedFurnitureRenderer";
import { SceneEnvironment } from "./SceneEnvironment";
import { ShadowConfig } from "./ShadowConfig";
import {
  boundsCenter,
  computeSceneBounds,
  frameToContent,
  type FrameToContentResult,
} from "./viewerFraming";

/** A door/window void cut into a wall, measured along the wall axis in canvas units. */
export interface PlannerViewerWallOpening {
  start: number;
  end: number;
  kind: "door" | "window";
}

export interface PlannerViewerShape {
  id: string;
  type: "planner-wall" | "planner-room" | "planner-furniture" | "planner-zone" | "planner-door" | "planner-window";
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  label?: string;
  color?: string;
  catalogId?: string;
  modelUrl?: string;
  glbUrl?: string;
  /** Catalog category when known — drives material differentiation in 3D. */
  category?: CatalogCategory;
  wall?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    thickness: number;
    /** Openings cut by doors/windows sitting on this wall. */
    openings?: PlannerViewerWallOpening[];
  };
}

/** @deprecated Use `PlannerViewerShape`. */
export type BuddyViewerShape = PlannerViewerShape;

function ElementsMesh({ shapes }: { shapes: PlannerViewerShape[] }) {
  const furnitureShapes = shapes.filter((shape) => shape.type === "planner-furniture");
  const sceneShapes = shapes.filter((shape) => shape.type !== "planner-furniture");

  return (
    <>
      {sceneShapes.map((shape) => {
        switch (shape.type) {
          case "planner-wall":
            return <WallMesh key={shape.id} shape={shape} />;
          case "planner-room":
            return <RoomSlab key={shape.id} shape={shape} />;
          case "planner-zone":
            return <ZoneSlab key={shape.id} shape={shape} />;
          case "planner-door":
            return <DoorMesh key={shape.id} shape={shape} />;
          case "planner-window":
            return <WindowMesh key={shape.id} shape={shape} />;
          default:
            return null;
        }
      })}
      <InstancedFurnitureRenderer shapes={furnitureShapes} />
    </>
  );
}

/**
 * Frames the content once, when shapes first arrive. Subsequent edits never
 * yank the camera away from where the user orbited it.
 */
function CameraRig({ shapeCount, framing }: { shapeCount: number; framing: FrameToContentResult }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as unknown as OrbitControlsImpl | null;
  const framedRef = useRef(shapeCount > 0);

  useEffect(() => {
    if (framedRef.current || shapeCount === 0) return;
    camera.position.set(...framing.position);
    if (controls) {
      controls.target.set(...framing.target);
      controls.update();
    } else {
      camera.lookAt(...framing.target);
    }
    framedRef.current = true;
  }, [shapeCount, framing, camera, controls]);

  return null;
}

function InvalidateOnShapeChange({ shapes }: { shapes: PlannerViewerShape[] }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate, shapes]);
  return null;
}

function Scene({ isOrtho, shapes }: { isOrtho: boolean; shapes: PlannerViewerShape[] }) {
  const bounds = useMemo(() => computeSceneBounds(shapes), [shapes]);
  const framing = useMemo(() => frameToContent(shapes), [shapes]);
  const { cx, cz } = boundsCenter(bounds);

  // Capture the first framing so declarative camera/controls props stay
  // referentially stable and never reset the user's orbit position.
  const [initialFraming] = useState<FrameToContentResult>(framing);

  return (
    <>
      {isOrtho ? (
        <OrthographicCamera makeDefault position={[cx, 20, cz]} zoom={50} />
      ) : (
        <PerspectiveCamera makeDefault position={initialFraming.position} fov={50} />
      )}

      <OrbitControls
        makeDefault
        target={initialFraming.target}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.9}
        zoomSpeed={0.9}
        panSpeed={0.8}
        minDistance={1.2}
        maxDistance={120}
        enableRotate={!isOrtho}
        minPolarAngle={isOrtho ? 0 : 0.15}
        maxPolarAngle={isOrtho ? 0 : Math.PI / 2.05}
      />

      {!isOrtho && <CameraRig shapeCount={shapes.length} framing={framing} />}

      <InvalidateOnShapeChange shapes={shapes} />

      <ShadowConfig />
      <SceneEnvironment bounds={bounds} />
      <ElementsMesh shapes={shapes} />
    </>
  );
}

interface PlannerViewerProps {
  viewMode: "2d" | "3d";
  shapes: PlannerViewerShape[];
}

export function PlannerViewer({ viewMode, shapes }: PlannerViewerProps) {
  const isOrtho = viewMode === "2d";

  return (
    <div className="pw-viewer-canvas">
      <Canvas
        shadows
        dpr={[1, 2]}
        frameloop="demand"
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene isOrtho={isOrtho} shapes={shapes} />
        </Suspense>
      </Canvas>
    </div>
  );
}

/** @deprecated Use `PlannerViewer`. */
export const BuddyViewer = PlannerViewer;
