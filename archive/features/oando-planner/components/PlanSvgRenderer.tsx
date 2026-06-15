"use client";

/**
 * PlanSvgRenderer — Lightweight SVG-based read-only 2D floor plan renderer.
 * Used in the client portal for plan preview without loading tldraw.
 */

import type {
  Wall,
  Room,
  FurnitureItem,
  DoorItem,
  WindowItem,
  MeasurementItem,
  Zone,
} from "../data/plannerStore";

interface PlanSvgRendererProps {
  walls: Wall[];
  rooms: Room[];
  furniture: FurnitureItem[];
  doors: DoorItem[];
  windows: WindowItem[];
  measurements: MeasurementItem[];
  zones?: Zone[];
  className?: string;
}

function computeBounds(props: PlanSvgRendererProps) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const expand = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  for (const wall of props.walls) {
    expand(wall.start.x, wall.start.y);
    expand(wall.end.x, wall.end.y);
  }

  for (const room of props.rooms) {
    for (const pt of room.points) {
      expand(pt.x, pt.y);
    }
  }

  for (const f of props.furniture) {
    expand(f.x, f.y);
    expand(f.x + f.width, f.y + f.height);
  }

  for (const d of props.doors) {
    expand(d.x, d.y);
    expand(d.x + d.width, d.y);
  }

  for (const w of props.windows) {
    expand(w.x, w.y);
    expand(w.x + w.width, w.y);
  }

  for (const m of props.measurements) {
    expand(m.start.x, m.start.y);
    expand(m.end.x, m.end.y);
  }

  if (props.zones) {
    for (const z of props.zones) {
      for (const pt of z.points) {
        expand(pt.x, pt.y);
      }
    }
  }

  // Handle empty plans
  if (minX === Infinity) {
    minX = 0;
    minY = 0;
    maxX = 800;
    maxY = 600;
  }

  const padding = 40;
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

export function PlanSvgRenderer(props: PlanSvgRendererProps) {
  const { walls, rooms, furniture, doors, windows, measurements, zones } = props;
  const bounds = computeBounds(props);

  const isEmpty =
    walls.length === 0 &&
    rooms.length === 0 &&
    furniture.length === 0;

  if (isEmpty) {
    return (
      <div className={`flex items-center justify-center bg-[var(--surface-inverse)] rounded-lg ${props.className || ""}`}>
        <p className="text-xs text-[var(--text-muted)]">
          Empty plan — no elements to display
        </p>
      </div>
    );
  }

  return (
    <svg
      viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
      className={`w-full h-auto bg-[var(--surface-inverse)] rounded-lg ${props.className || ""}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Floor plan layout"
    >
      {/* Zones (rendered first, as background) */}
      {zones?.map((zone) => {
        if (zone.points.length < 3) return null;
        const pathD = zone.points
          .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
          .join(" ") + " Z";
        return (
          <g key={zone.id}>
            <path
              d={pathD}
              fill={zone.color || "var(--surface-glass)"}
              stroke={zone.color || "var(--surface-glass)"}
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            {zone.points.length > 0 && (
              <text
                x={zone.points.reduce((s, p) => s + p.x, 0) / zone.points.length}
                y={zone.points.reduce((s, p) => s + p.y, 0) / zone.points.length}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--surface-glass)"
                fontSize="10"
                fontFamily="var(--font-sans)"
              >
                {zone.name || zone.type}
              </text>
            )}
          </g>
        );
      })}

      {/* Rooms */}
      {rooms.map((room) => {
        if (room.points.length < 3) return null;
        const pathD = room.points
          .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
          .join(" ") + " Z";
        return (
          <g key={room.id}>
            <path
              d={pathD}
              fill={room.color || "var(--surface-glass)"}
              stroke="var(--surface-glass)"
              strokeWidth="1"
            />
            <text
              x={room.points.reduce((s, p) => s + p.x, 0) / room.points.length}
              y={room.points.reduce((s, p) => s + p.y, 0) / room.points.length}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--surface-glass)"
              fontSize="11"
              fontFamily="var(--font-sans)"
            >
              {room.name}
            </text>
          </g>
        );
      })}

      {/* Walls */}
      {walls.map((wall) => (
        <line
          key={wall.id}
          x1={wall.start.x}
          y1={wall.start.y}
          x2={wall.end.x}
          y2={wall.end.y}
          stroke={wall.color || "var(--surface-glass)"}
          strokeWidth={wall.thickness || 6}
          strokeLinecap="round"
        />
      ))}

      {/* Doors */}
      {doors.map((door) => {
        const arcRadius = door.width || 30;
        const startAngle = door.rotation || 0;
        const sweepAngle = door.openAngle || 90;
        const endAngle = startAngle + sweepAngle;
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        const arcX1 = door.x + arcRadius * Math.cos(startRad);
        const arcY1 = door.y + arcRadius * Math.sin(startRad);
        const arcX2 = door.x + arcRadius * Math.cos(endRad);
        const arcY2 = door.y + arcRadius * Math.sin(endRad);
        const largeArc = sweepAngle > 180 ? 1 : 0;

        return (
          <g key={door.id}>
            {/* Door panel line */}
            <line
              x1={door.x}
              y1={door.y}
              x2={arcX1}
              y2={arcY1}
              stroke="var(--surface-glass)"
              strokeWidth="2"
            />
            {/* Swing arc */}
            <path
              d={`M ${arcX1} ${arcY1} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${arcX2} ${arcY2}`}
              fill="none"
              stroke="var(--surface-glass)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
          </g>
        );
      })}

      {/* Windows */}
      {windows.map((win) => {
        const rad = ((win.rotation || 0) * Math.PI) / 180;
        const dx = (win.width || 40) * Math.cos(rad);
        const dy = (win.width || 40) * Math.sin(rad);
        return (
          <g key={win.id}>
            <line
              x1={win.x}
              y1={win.y}
              x2={win.x + dx}
              y2={win.y + dy}
              stroke="var(--surface-glass)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Glass panel indicator */}
            <line
              x1={win.x}
              y1={win.y}
              x2={win.x + dx}
              y2={win.y + dy}
              stroke="var(--surface-glass)"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>
        );
      })}

      {/* Furniture */}
      {furniture.map((item) => (
        <g
          key={item.id}
          transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation || 0}, ${item.width / 2}, ${item.height / 2})`}
        >
          <rect
            x={0}
            y={0}
            width={item.width}
            height={item.height}
            fill={item.color || "var(--surface-glass)"}
            stroke="var(--surface-glass)"
            strokeWidth="1"
            rx="2"
          />
          <text
            x={item.width / 2}
            y={item.height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--surface-glass)"
            fontSize={Math.min(item.width, item.height) > 40 ? "8" : "6"}
            fontFamily="var(--font-sans)"
          >
            {item.name.length > 12 ? item.name.slice(0, 10) + "…" : item.name}
          </text>
        </g>
      ))}

      {/* Measurements */}
      {measurements.map((m) => {
        const dx = m.end.x - m.start.x;
        const dy = m.end.y - m.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const midX = (m.start.x + m.end.x) / 2;
        const midY = (m.start.y + m.end.y) / 2;
        const labelMm = Math.round(length * 10);

        return (
          <g key={m.id}>
            <line
              x1={m.start.x}
              y1={m.start.y}
              x2={m.end.x}
              y2={m.end.y}
              stroke="var(--surface-glass)"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            {/* Endpoints */}
            <circle cx={m.start.x} cy={m.start.y} r="2" fill="var(--surface-glass)" />
            <circle cx={m.end.x} cy={m.end.y} r="2" fill="var(--surface-glass)" />
            {/* Label */}
            <text
              x={midX}
              y={midY - 6}
              textAnchor="middle"
              fill="var(--surface-glass)"
              fontSize="9"
              fontFamily="var(--font-sans)"
            >
              {labelMm}mm
            </text>
          </g>
        );
      })}
    </svg>
  );
}
