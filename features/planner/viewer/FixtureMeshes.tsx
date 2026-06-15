"use client";

/**
 * Architectural fixtures for the planner 3D viewer: walls, doors, windows,
 * room slabs and zone overlays. All meshes scale shared unit geometries and
 * use cached materials — no per-shape GPU resource allocation.
 */

import { computeSolidSpans } from "../lib/geometry/wallOpenings";
import type { PlannerViewerShape, PlannerViewerWallOpening } from "./PlannerViewer";
import { CANVAS_UNITS_TO_M } from "./viewerFraming";
import {
  FIXTURE_FINISHES,
  FOCSS_3D_COLORS,
  SHARED_GEOMETRIES,
  getSharedMaterial,
  getTintedMaterial,
} from "./viewerMaterials";

export const WALL_HEIGHT_M = 2.7;
const DOOR_HEIGHT_M = 2.05;
const WINDOW_SILL_M = 0.9;
const WINDOW_HEIGHT_M = 1.2;

const { unitBox, unitPlane } = SHARED_GEOMETRIES;

function footprint(shape: PlannerViewerShape) {
  return {
    cx: (shape.x + shape.width / 2) * CANVAS_UNITS_TO_M,
    cz: (shape.y + shape.height / 2) * CANVAS_UNITS_TO_M,
    w: Math.max(shape.width * CANVAS_UNITS_TO_M, 0.1),
    d: Math.max(shape.height * CANVAS_UNITS_TO_M, 0.1),
    rad: (-(shape.rotation || 0) * Math.PI) / 180,
  };
}

/**
 * Horizontal wall band over an opening: header above a door, or the
 * spandrels below/above a window. Local x is measured from the wall center.
 */
function wallBandsForOpening(opening: PlannerViewerWallOpening): Array<{ bottom: number; top: number }> {
  if (opening.kind === "door") {
    return [{ bottom: DOOR_HEIGHT_M, top: WALL_HEIGHT_M }];
  }
  return [
    { bottom: 0, top: WINDOW_SILL_M },
    { bottom: WINDOW_SILL_M + WINDOW_HEIGHT_M, top: WALL_HEIGHT_M },
  ];
}

export function WallMesh({ shape }: { shape: PlannerViewerShape }) {
  if (!shape.wall) return null;
  const dx = shape.wall.endX - shape.wall.startX;
  const dy = shape.wall.endY - shape.wall.startY;
  const lengthUnits = Math.hypot(dx, dy);
  const length = Math.max(lengthUnits * CANVAS_UNITS_TO_M, 0.1);
  const thickness = Math.max(shape.wall.thickness * CANVAS_UNITS_TO_M, 0.05);
  const cx = ((shape.wall.startX + shape.wall.endX) / 2) * CANVAS_UNITS_TO_M;
  const cz = ((shape.wall.startY + shape.wall.endY) / 2) * CANVAS_UNITS_TO_M;
  const rad = -Math.atan2(dy, dx);
  const material = getTintedMaterial(FIXTURE_FINISHES.wall, shape.color);

  const openings = shape.wall.openings ?? [];
  if (openings.length === 0 || lengthUnits <= 0) {
    return (
      <mesh
        geometry={unitBox}
        material={material}
        position={[cx, WALL_HEIGHT_M / 2, cz]}
        rotation={[0, rad, 0]}
        scale={[length, WALL_HEIGHT_M, thickness]}
        castShadow
        receiveShadow
      />
    );
  }

  // Solid full-height spans between openings, in metres along the wall axis.
  const spans = computeSolidSpans(lengthUnits, openings).map((span) => ({
    start: span.start * CANVAS_UNITS_TO_M,
    end: span.end * CANVAS_UNITS_TO_M,
  }));

  return (
    <group position={[cx, 0, cz]} rotation={[0, rad, 0]}>
      {spans.map((span) => (
        <mesh
          key={`span-${span.start}`}
          geometry={unitBox}
          material={material}
          position={[(span.start + span.end) / 2 - length / 2, WALL_HEIGHT_M / 2, 0]}
          scale={[Math.max(span.end - span.start, 0.01), WALL_HEIGHT_M, thickness]}
          castShadow
          receiveShadow
        />
      ))}
      {openings.flatMap((opening, index) => {
        const start = opening.start * CANVAS_UNITS_TO_M;
        const end = opening.end * CANVAS_UNITS_TO_M;
        const bandX = (start + end) / 2 - length / 2;
        const bandWidth = Math.max(end - start, 0.01);
        return wallBandsForOpening(opening).map((band, bandIndex) => (
          <mesh
            key={`band-${index}-${bandIndex}`}
            geometry={unitBox}
            material={material}
            position={[bandX, (band.bottom + band.top) / 2, 0]}
            scale={[bandWidth, Math.max(band.top - band.bottom, 0.01), thickness]}
            castShadow
            receiveShadow
          />
        ));
      })}
    </group>
  );
}

export function DoorMesh({ shape }: { shape: PlannerViewerShape }) {
  const { cx, cz, w, d, rad } = footprint(shape);
  const leafThickness = Math.min(d, 0.06);
  const frameDepth = Math.min(d, 0.08);
  const frameWidth = 0.05;
  const frameMaterial = getSharedMaterial(FIXTURE_FINISHES.windowFrame);
  // The wall cuts a real opening and renders its own header above the door,
  // so the door contributes the leaf and side frame posts only.
  return (
    <group position={[cx, 0, cz]} rotation={[0, rad, 0]}>
      <mesh
        geometry={unitBox}
        material={getTintedMaterial(FIXTURE_FINISHES.door, shape.color)}
        position={[0, DOOR_HEIGHT_M / 2, 0]}
        scale={[Math.max(w - frameWidth * 2, 0.1), DOOR_HEIGHT_M, leafThickness]}
        castShadow
      />
      {/* Frame posts at either side of the opening */}
      <mesh
        geometry={unitBox}
        material={frameMaterial}
        position={[-(w - frameWidth) / 2, DOOR_HEIGHT_M / 2, 0]}
        scale={[frameWidth, DOOR_HEIGHT_M, frameDepth]}
        castShadow
      />
      <mesh
        geometry={unitBox}
        material={frameMaterial}
        position={[(w - frameWidth) / 2, DOOR_HEIGHT_M / 2, 0]}
        scale={[frameWidth, DOOR_HEIGHT_M, frameDepth]}
        castShadow
      />
    </group>
  );
}

export function WindowMesh({ shape }: { shape: PlannerViewerShape }) {
  const { cx, cz, w, d, rad } = footprint(shape);
  const glassThickness = Math.min(d, 0.05);
  const frameThickness = Math.min(d, 0.08);
  const frameWidth = 0.05;
  const frameMaterial = getSharedMaterial(FIXTURE_FINISHES.windowFrame);
  const centerY = WINDOW_SILL_M + WINDOW_HEIGHT_M / 2;
  return (
    <group position={[cx, 0, cz]} rotation={[0, rad, 0]}>
      <mesh
        geometry={unitBox}
        material={getSharedMaterial(FIXTURE_FINISHES.windowGlass)}
        position={[0, centerY, 0]}
        scale={[Math.max(w - frameWidth * 2, 0.1), WINDOW_HEIGHT_M, glassThickness]}
      />
      {/* Sill + head frame */}
      <mesh
        geometry={unitBox}
        material={frameMaterial}
        position={[0, WINDOW_SILL_M, 0]}
        scale={[w, 0.05, frameThickness]}
        castShadow
      />
      <mesh
        geometry={unitBox}
        material={frameMaterial}
        position={[0, WINDOW_SILL_M + WINDOW_HEIGHT_M, 0]}
        scale={[w, 0.05, frameThickness]}
        castShadow
      />
      {/* Jamb posts at either side of the opening */}
      <mesh
        geometry={unitBox}
        material={frameMaterial}
        position={[-(w - frameWidth) / 2, centerY, 0]}
        scale={[frameWidth, WINDOW_HEIGHT_M, frameThickness]}
        castShadow
      />
      <mesh
        geometry={unitBox}
        material={frameMaterial}
        position={[(w - frameWidth) / 2, centerY, 0]}
        scale={[frameWidth, WINDOW_HEIGHT_M, frameThickness]}
        castShadow
      />
    </group>
  );
}

const ROOM_BORDER_M = 0.05;

export function RoomSlab({ shape }: { shape: PlannerViewerShape }) {
  const { cx, cz, w, d, rad } = footprint(shape);
  const accent = { color: FOCSS_3D_COLORS.oceanBoatBlue600, roughness: 0.8, metalness: 0 };
  const slabMaterial = getTintedMaterial({ ...accent, opacity: 0.16 }, shape.color);
  const borderMaterial = getTintedMaterial(accent, shape.color);

  return (
    <group position={[cx, 0, cz]} rotation={[0, rad, 0]}>
      <mesh
        geometry={unitPlane}
        material={slabMaterial}
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[w, d, 1]}
        receiveShadow
      />
      {/* Skirting outline — four thin boxes instead of per-room line geometry */}
      {([
        [0, -d / 2 + ROOM_BORDER_M / 2, w, ROOM_BORDER_M],
        [0, d / 2 - ROOM_BORDER_M / 2, w, ROOM_BORDER_M],
        [-w / 2 + ROOM_BORDER_M / 2, 0, ROOM_BORDER_M, d],
        [w / 2 - ROOM_BORDER_M / 2, 0, ROOM_BORDER_M, d],
      ] as const).map(([x, z, sx, sz], index) => (
        <mesh
          key={index}
          geometry={unitBox}
          material={borderMaterial}
          position={[x, 0.015, z]}
          scale={[sx, 0.02, sz]}
        />
      ))}
    </group>
  );
}

export function ZoneSlab({ shape }: { shape: PlannerViewerShape }) {
  const { cx, cz, w, d, rad } = footprint(shape);
  const material = getTintedMaterial(
    { color: FOCSS_3D_COLORS.oceanBoatBlue300, roughness: 0.85, metalness: 0, opacity: 0.12 },
    shape.color,
  );
  return (
    <group position={[cx, 0, cz]} rotation={[0, rad, 0]}>
      <mesh
        geometry={unitPlane}
        material={material}
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[w, d, 1]}
      />
    </group>
  );
}
