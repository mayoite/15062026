"use client";

/**
 * PlannerHeroDemo — labeled 10×8 m office floor plan for the landing hero.
 * Shows real furniture outcomes (workstations, boardroom, storage) with a
 * single workstation drop-in animation on load.
 */

import { motion, useReducedMotion, type Variants } from "framer-motion";

const DROP_IN: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

function Workstation({
  x,
  y,
  label,
  dropIn = false,
  reduced,
}: {
  x: number;
  y: number;
  label: string;
  dropIn?: boolean;
  reduced: boolean | null;
}) {
  const body = (
    <>
      <rect x={x} y={y} width={72} height={36} rx={3} className="pl-desk" />
      <rect x={x + 10} y={y + 38} width={14} height={6} rx={2} className="pl-chair" />
      <rect x={x + 48} y={y + 38} width={14} height={6} rx={2} className="pl-chair" />
      <text x={x + 36} y={y - 5} textAnchor="middle" className="pl-room-label" fontSize="7">
        {label}
      </text>
    </>
  );

  if (dropIn && !reduced) {
    return (
      <motion.g variants={DROP_IN} initial="hidden" animate="visible">
        {body}
      </motion.g>
    );
  }

  return <g>{body}</g>;
}

function BoardroomTable({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={96} height={48} rx={8} className="pl-desk" />
      <rect x={x - 10} y={y + 12} width={7} height={18} rx={2} className="pl-chair" />
      <rect x={x + 99} y={y + 12} width={7} height={18} rx={2} className="pl-chair" />
      <rect x={x + 16} y={y - 10} width={18} height={7} rx={2} className="pl-chair" />
      <rect x={x + 62} y={y - 10} width={18} height={7} rx={2} className="pl-chair" />
      <rect x={x + 16} y={y + 51} width={18} height={7} rx={2} className="pl-chair" />
      <rect x={x + 62} y={y + 51} width={18} height={7} rx={2} className="pl-chair" />
      <text x={x + 48} y={y - 16} textAnchor="middle" className="pl-room-label" fontSize="7">
        Boardroom BR-12
      </text>
    </g>
  );
}

function StorageUnit({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={88} height={22} rx={2} className="pl-storage" />
      <line x1={x + 29} y1={y + 3} x2={x + 29} y2={y + 19} stroke="var(--text-muted)" strokeWidth="1" />
      <line x1={x + 58} y1={y + 3} x2={x + 58} y2={y + 19} stroke="var(--text-muted)" strokeWidth="1" />
      <text x={x + 44} y={y - 5} textAnchor="middle" className="pl-room-label" fontSize="7">
        Storage ST-05
      </text>
    </g>
  );
}

export function PlannerHeroDemo() {
  const reduced = useReducedMotion();

  return (
    <div className="planner-hero-demo" aria-hidden>
      <div className="planner-hero-demo__chrome">
        <span className="planner-hero-demo__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="planner-hero-demo__title">Office layout · 10 × 8 m</span>
        <span className="planner-hero-demo__segment">
          <i data-active="true">2D</i>
          <i>3D</i>
          <i>Split</i>
        </span>
      </div>

      <div className="planner-hero-demo__canvas">
        <svg viewBox="0 0 480 360" role="presentation">
          {/* 10 × 8 m shell */}
          <rect x={32} y={24} width={416} height={332} rx={2} className="pl-wall" />

          {/* Boardroom partition */}
          <line x1={312} y1={24} x2={312} y2={108} className="pl-wall" />
          <line x1={312} y1={148} x2={312} y2={200} className="pl-wall" />
          <path d="M 312 148 A 28 28 0 0 1 340 120" className="pl-door" />
          <text x={326} y={142} className="pl-zone-label">
            Door
          </text>

          {/* Windows on left wall */}
          <line x1={32} y1={88} x2={32} y2={128} className="pl-door" strokeWidth="2.5" />
          <line x1={32} y1={200} x2={32} y2={240} className="pl-door" strokeWidth="2.5" />
          <text x={44} y={82} className="pl-zone-label">
            Window
          </text>

          {/* Open-plan zone */}
          <rect x={48} y={40} width={248} height={200} rx={6} className="pl-zone" />
          <text x={58} y={54} className="pl-zone-label">
            OPEN PLAN · 4 WORKSTATIONS
          </text>

          <Workstation x={68} y={72} label="Workstation WS-301" reduced={reduced} />
          <Workstation x={168} y={72} label="Workstation WS-302" reduced={reduced} />
          <Workstation x={68} y={152} label="Workstation WS-303" reduced={reduced} />
          <Workstation x={168} y={152} label="Workstation WS-304" dropIn reduced={reduced} />

          {/* Boardroom */}
          <rect x={324} y={40} width={112} height={148} rx={6} className="pl-zone pl-zone--alt" />
          <text x={334} y={54} className="pl-zone-label">
            BOARDROOM
          </text>
          <BoardroomTable x={332} y={88} />

          {/* Storage */}
          <StorageUnit x={68} y={280} />

          {/* Width dimension */}
          <line x1={32} y1={348} x2={448} y2={348} className="pl-dim-line" />
          <line x1={32} y1={342} x2={32} y2={354} className="pl-dim-line" />
          <line x1={448} y1={342} x2={448} y2={354} className="pl-dim-line" />
          <rect x={196} y={340} width={88} height={15} rx={3} className="pl-dim-badge" />
          <text x={240} y={351} textAnchor="middle" className="pl-dim-text">
            10 000 mm
          </text>

          {/* Depth dimension */}
          <line x1={462} y1={24} x2={462} y2={356} className="pl-dim-line" />
          <line x1={456} y1={24} x2={468} y2={24} className="pl-dim-line" />
          <line x1={456} y1={356} x2={468} y2={356} className="pl-dim-line" />
          <rect x={454} y={178} width={15} height={72} rx={3} className="pl-dim-badge" />
          <text
            x={461}
            y={214}
            textAnchor="middle"
            className="pl-dim-text"
            transform="rotate(-90 461 214)"
          >
            8 000 mm
          </text>
        </svg>

        <span className="planner-hero-demo__saved">● Saved</span>
      </div>

      <div className="planner-hero-demo__status">
        <span>6 furniture items</span>
        <span>2 zones</span>
        <span>
          Floor <strong>80 m²</strong>
        </span>
        <span className="planner-hero-demo__status-right">True to scale</span>
      </div>
    </div>
  );
}