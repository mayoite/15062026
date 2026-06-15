"use client";

/**
 * Category-differentiated furniture meshes for the planner 3D viewer.
 * Desks get laminate tops on metal legs, chairs get fabric shells, storage
 * reads as metal carcasses, sharing benches get divider screens with seating
 * on both sides. Every mesh scales a shared unit geometry and pulls a cached
 * material, so 100+ items reuse the same GPU resources.
 */

import type { ThreeElements } from "@react-three/fiber";
import {
  SHARED_GEOMETRIES,
  getSharedMaterial,
  getTintedMaterial,
  getFurnitureFinishes,
  FIXTURE_FINISHES,
  type FurnitureKind,
  type MaterialFinish,
} from "./viewerMaterials";

export interface FurnitureMeshProps {
  /** Footprint width in metres. */
  width: number;
  /** Footprint depth in metres. */
  depth: number;
  label?: string;
  /** Optional 2D-editor color override for the primary surface. */
  color?: string;
  kind: FurnitureKind;
}

const { unitBox, unitBevelBox, unitCylinder, unitPlane } = SHARED_GEOMETRIES;

const DESK_HEIGHT = 0.72;
const TOP_THICKNESS = 0.03;
const SEAT_HEIGHT = 0.46;

type Material = ReturnType<typeof getSharedMaterial>;
type MeshProps = Pick<ThreeElements["mesh"], "position" | "scale">;

function Box({ material, bevel = true, ...props }: MeshProps & { material: Material; bevel?: boolean }) {
  return <mesh geometry={bevel ? unitBevelBox : unitBox} material={material} castShadow receiveShadow {...props} />;
}

// ---------------------------------------------------------------------------
// Desk: laminate top, four cylindrical legs
// ---------------------------------------------------------------------------

function DeskMesh({ w, d, top, frame }: { w: number; d: number; top: Material; frame: Material }) {
  const inset = Math.min(0.12, w * 0.08);
  const legXZ: Array<[number, number]> = [
    [-w / 2 + inset, -d / 2 + inset],
    [w / 2 - inset, -d / 2 + inset],
    [-w / 2 + inset, d / 2 - inset],
    [w / 2 - inset, d / 2 - inset],
  ];
  return (
    <group>
      <Box material={top} position={[0, DESK_HEIGHT + TOP_THICKNESS / 2, 0]} scale={[w, TOP_THICKNESS, d]} />
      {legXZ.map(([lx, lz], index) => (
        <mesh
          key={index}
          geometry={unitCylinder}
          material={frame}
          position={[lx, DESK_HEIGHT / 2, lz]}
          scale={[0.05, DESK_HEIGHT, 0.05]}
          castShadow
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Chair: fabric seat + backrest on a metal column and base disc
// ---------------------------------------------------------------------------

function ChairMesh({ w, d, fabric, frame }: { w: number; d: number; fabric: Material; frame: Material }) {
  return (
    <group>
      <Box material={fabric} position={[0, SEAT_HEIGHT, 0]} scale={[w * 0.85, 0.07, d * 0.8]} />
      <Box material={fabric} position={[0, SEAT_HEIGHT + 0.31, -d * 0.35]} scale={[w * 0.8, 0.52, 0.06]} />
      <mesh
        geometry={unitCylinder}
        material={frame}
        position={[0, SEAT_HEIGHT / 2, 0]}
        scale={[0.09, SEAT_HEIGHT - 0.05, 0.09]}
        castShadow
      />
      <mesh
        geometry={unitCylinder}
        material={frame}
        position={[0, 0.02, 0]}
        scale={[w * 0.85, 0.04, d * 0.85]}
        castShadow
      />
    </group>
  );
}

/** Compact chair (seat + back only) used around tables and benches. */
function SimpleChair({ x, z, ry, fabric }: { x: number; z: number; ry: number; fabric: Material }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <Box material={fabric} position={[0, SEAT_HEIGHT, 0]} scale={[0.42, 0.06, 0.4]} />
      <Box material={fabric} position={[0, SEAT_HEIGHT + 0.26, -0.18]} scale={[0.4, 0.46, 0.05]} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Storage: metal carcass on a plinth (pedestals stay desk-height)
// ---------------------------------------------------------------------------

function StorageMesh({ w, d, label, body, plinth }: {
  w: number; d: number; label: string; body: Material; plinth: Material;
}) {
  const isPedestal = /pedestal|drawer/.test(label.toLowerCase());
  const h = isPedestal ? 0.62 : 1.15;
  return (
    <group>
      <mesh geometry={unitBox} material={plinth} position={[0, 0.03, 0]} scale={[w * 0.96, 0.06, d * 0.96]} />
      <Box material={body} position={[0, 0.06 + (h - 0.06) / 2, 0]} scale={[w, h - 0.06, d]} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Screen / divider: thin upright panel on feet
// ---------------------------------------------------------------------------

function ScreenMesh({ w, d, panel, frame }: { w: number; d: number; panel: Material; frame: Material }) {
  const thickness = Math.max(Math.min(d * 0.25, 0.06), 0.03);
  return (
    <group>
      <Box material={panel} position={[0, 0.72, 0]} scale={[w, 1.4, thickness]} />
      {[-w / 2 + 0.08, w / 2 - 0.08].map((x, index) => (
        <mesh key={index} geometry={unitBox} material={frame} position={[x, 0.015, 0]} scale={[0.06, 0.03, 0.3]} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Meeting room: carpet mat, veneer table, chairs along the long sides
// ---------------------------------------------------------------------------

function MeetingMesh({ w, d, top, fabric }: { w: number; d: number; top: Material; fabric: Material }) {
  const tableW = w * 0.55;
  const tableD = Math.min(d * 0.38, 1.4);
  const tableH = 0.74;
  const perSide = Math.min(4, Math.max(1, Math.round(tableW / 0.7)));
  const step = tableW / perSide;
  const chairs: Array<{ x: number; z: number; ry: number }> = [];
  for (let i = 0; i < perSide; i++) {
    const x = -tableW / 2 + step * (i + 0.5);
    chairs.push({ x, z: tableD / 2 + 0.32, ry: Math.PI });
    chairs.push({ x, z: -(tableD / 2 + 0.32), ry: 0 });
  }
  return (
    <group>
      <mesh
        geometry={unitPlane}
        material={getSharedMaterial(FIXTURE_FINISHES.meetingCarpet)}
        position={[0, 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[w, d, 1]}
        receiveShadow
      />
      <Box material={top} position={[0, tableH / 2, 0]} scale={[tableW, tableH, tableD]} />
      {chairs.map((chair, index) => (
        <SimpleChair key={index} x={chair.x} z={chair.z} ry={chair.ry} fabric={fabric} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Sharing bench: divider screen, split worktops, chairs on both sides
// ---------------------------------------------------------------------------

function BenchMesh({ w, d, top, screen, fabric, frame }: {
  w: number; d: number; top: Material; screen: Material; fabric: Material; frame: Material;
}) {
  const topY = DESK_HEIGHT + TOP_THICKNESS / 2;
  const sideD = d * 0.46;
  const pairCount = Math.max(1, Math.round(w / 1.2));
  const step = w / pairCount;
  const chairs: Array<{ x: number; z: number; ry: number }> = [];
  for (let i = 0; i < pairCount; i++) {
    const x = -w / 2 + step * (i + 0.5);
    chairs.push({ x, z: d / 2 + 0.28, ry: Math.PI });
    chairs.push({ x, z: -(d / 2 + 0.28), ry: 0 });
  }
  const legXs = [-w / 2 + 0.1, w / 2 - 0.1];
  return (
    <group>
      {/* Divider screen spans floor to 1.16 m */}
      <Box material={screen} position={[0, 0.58, 0]} scale={[w, 1.16, 0.03]} />
      {[sideD / 2 + 0.02, -(sideD / 2 + 0.02)].map((z, index) => (
        <Box key={index} material={top} position={[0, topY, z]} scale={[w, TOP_THICKNESS, sideD]} />
      ))}
      {legXs.flatMap((x) =>
        [d / 2 - 0.08, -(d / 2 - 0.08)].map((z) => (
          <mesh
            key={`${x}:${z}`}
            geometry={unitCylinder}
            material={frame}
            position={[x, DESK_HEIGHT / 2, z]}
            scale={[0.05, DESK_HEIGHT, 0.05]}
            castShadow
          />
        )),
      )}
      {chairs.map((chair, index) => (
        <SimpleChair key={index} x={chair.x} z={chair.z} ry={chair.ry} fabric={fabric} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const CHAIR_FABRIC: MaterialFinish = getFurnitureFinishes("chair").primary;

export function FurnitureMesh({ width, depth, label = "", color, kind }: FurnitureMeshProps) {
  const w = Math.max(width, 0.12);
  const d = Math.max(depth, 0.12);
  const { primary, secondary } = getFurnitureFinishes(kind);
  const primaryMaterial = getTintedMaterial(primary, color);
  const secondaryMaterial = getSharedMaterial(secondary);
  const fabricMaterial = getSharedMaterial(CHAIR_FABRIC);

  switch (kind) {
    case "desk":
      return <DeskMesh w={w} d={d} top={primaryMaterial} frame={secondaryMaterial} />;
    case "chair":
      return <ChairMesh w={w} d={d} fabric={primaryMaterial} frame={secondaryMaterial} />;
    case "storage":
      return <StorageMesh w={w} d={d} label={label} body={primaryMaterial} plinth={secondaryMaterial} />;
    case "screen":
      return <ScreenMesh w={w} d={d} panel={primaryMaterial} frame={secondaryMaterial} />;
    case "meeting":
      return <MeetingMesh w={w} d={d} top={primaryMaterial} fabric={fabricMaterial} />;
    case "bench":
      return (
        <BenchMesh
          w={w}
          d={d}
          top={primaryMaterial}
          screen={secondaryMaterial}
          fabric={fabricMaterial}
          frame={getSharedMaterial(getFurnitureFinishes("desk").secondary)}
        />
      );
    case "equipment":
    case "generic":
    default:
      return <Box material={primaryMaterial} position={[0, 0.375, 0]} scale={[w, 0.75, d]} />;
  }
}
