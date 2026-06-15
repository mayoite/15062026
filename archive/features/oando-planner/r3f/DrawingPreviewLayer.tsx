import React from "react";
import { usePlannerStore } from "../data/plannerStore";

const PX_TO_M = 0.01;

export function DrawingPreviewLayer() {
  const tool = usePlannerStore((s) => s.tool);
  const drawingWall = usePlannerStore((s) => s.drawingWall);
  const drawingRoom = usePlannerStore((s) => s.drawingRoom);
  const cursorPosition = usePlannerStore((s) => s.cursorPosition);

  if (!cursorPosition) return null;

  // 1. Preview Wall
  if (tool === "wall" && drawingWall) {
    const dx = cursorPosition.x - drawingWall.start.x;
    const dy = cursorPosition.y - drawingWall.start.y;
    const length = Math.max(Math.hypot(dx, dy) * PX_TO_M, 0.01);
    const thickness = 0.08; // default 8cm wall thickness
    const cx = ((drawingWall.start.x + cursorPosition.x) / 2) * PX_TO_M;
    const cz = ((drawingWall.start.y + cursorPosition.y) / 2) * PX_TO_M;
    const rad = -Math.atan2(dy, dx);

    return (
      <mesh position={[cx, 1.5, cz]} rotation={[0, rad, 0]}>
        <boxGeometry args={[length, 3, thickness]} />
        <meshStandardMaterial color="var(--color-primary)" opacity={0.5} transparent roughness={0.6} />
      </mesh>
    );
  }

  // 2. Preview Room (Lines to cursor)
  if (tool === "room" && drawingRoom && drawingRoom.length > 0) {
    const lastPoint = drawingRoom[drawingRoom.length - 1];
    const dx = cursorPosition.x - lastPoint.x;
    const dy = cursorPosition.y - lastPoint.y;
    const length = Math.hypot(dx, dy) * PX_TO_M;
    const cx = ((lastPoint.x + cursorPosition.x) / 2) * PX_TO_M;
    const cz = ((lastPoint.y + cursorPosition.y) / 2) * PX_TO_M;
    const rad = -Math.atan2(dy, dx);

    return (
      <group>
        {/* Render lines between existing points */}
        {drawingRoom.map((p, i) => {
          if (i === 0) return null;
          const prev = drawingRoom[i - 1];
          const lx = ((prev.x + p.x) / 2) * PX_TO_M;
          const lz = ((prev.y + p.y) / 2) * PX_TO_M;
          const ldx = p.x - prev.x;
          const ldy = p.y - prev.y;
          const llen = Math.hypot(ldx, ldy) * PX_TO_M;
          const lrad = -Math.atan2(ldy, ldx);
          return (
            <mesh key={i} position={[lx, 0.02, lz]} rotation={[0, lrad, 0]}>
              <boxGeometry args={[llen, 0.01, 0.05]} />
              <meshBasicMaterial color="var(--color-primary)" />
            </mesh>
          );
        })}
        {/* Render line from last point to cursor */}
        <mesh position={[cx, 0.02, cz]} rotation={[0, rad, 0]}>
          <boxGeometry args={[length, 0.01, 0.05]} />
          <meshBasicMaterial color="var(--color-primary)" opacity={0.5} transparent />
        </mesh>
      </group>
    );
  }

  // Preview cursor highlight for snap (optional future enhancement)
  return (
    <mesh position={[cursorPosition.x * PX_TO_M, 0.01, cursorPosition.y * PX_TO_M]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.05, 16]} />
      <meshBasicMaterial color="var(--color-primary)" opacity={0.4} transparent />
    </mesh>
  );
}
