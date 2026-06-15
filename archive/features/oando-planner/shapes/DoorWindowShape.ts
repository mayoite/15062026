import type { TLBaseShape } from "tldraw";

export const DOOR_SHAPE_TYPE = "planner-door" as const;
export const WINDOW_SHAPE_TYPE = "planner-window" as const;

export type DoorSwing = "left" | "right" | "double" | "sliding";
export type WindowType = "single" | "double" | "sliding" | "fixed";

export interface DoorShapeProps {
  widthMm: number;
  wallThicknessMm: number;
  swing: DoorSwing;
  openAngleDeg: number;
  isOpen: boolean;
  label: string;
}

export interface WindowShapeProps {
  widthMm: number;
  wallThicknessMm: number;
  windowType: WindowType;
  sillHeightMm: number;
  label: string;
}

export type DoorShape = TLBaseShape<typeof DOOR_SHAPE_TYPE, DoorShapeProps>;
export type WindowShape = TLBaseShape<typeof WINDOW_SHAPE_TYPE, WindowShapeProps>;

const PAGE_UNIT_MM = 10;

export function doorToSvg(props: DoorShapeProps): string {
  const w = props.widthMm / PAGE_UNIT_MM;
  const thickness = props.wallThicknessMm / PAGE_UNIT_MM;
  const arcRadius = w;

  const wallRect = `<rect x="0" y="0" width="${w}" height="${thickness}" fill="var(--surface-panel)" stroke="var(--border-soft)" stroke-width="1.5" />`;

  if (props.swing === "sliding") {
    const trackY = thickness / 2;
    return `
      ${wallRect}
      <line x1="0" y1="${trackY}" x2="${w}" y2="${trackY}" stroke="var(--border-soft)" stroke-width="1" stroke-dasharray="3,2" />
      <rect x="${w * 0.1}" y="${trackY - 1}" width="${w * 0.4}" height="2" fill="var(--border-soft)" rx="0.5" />
    `;
  }

  if (props.swing === "double") {
    const halfW = w / 2;
    return `
      ${wallRect}
      <path d="M 0 ${thickness} A ${halfW} ${halfW} 0 0 0 ${halfW} ${thickness + halfW}" fill="none" stroke="var(--border-soft)" stroke-width="0.8" stroke-dasharray="2,2" />
      <line x1="0" y1="${thickness}" x2="${halfW}" y2="${thickness + halfW}" stroke="var(--border-soft)" stroke-width="1.2" />
      <path d="M ${w} ${thickness} A ${halfW} ${halfW} 0 0 1 ${halfW} ${thickness + halfW}" fill="none" stroke="var(--border-soft)" stroke-width="0.8" stroke-dasharray="2,2" />
      <line x1="${w}" y1="${thickness}" x2="${halfW}" y2="${thickness + halfW}" stroke="var(--border-soft)" stroke-width="1.2" />
    `;
  }

  const isRight = props.swing === "right";
  const pivotX = isRight ? w : 0;
  const arcStartX = pivotX;
  const arcStartY = thickness;
  const sweepFlag = isRight ? 1 : 0;

  return `
    ${wallRect}
    <path d="M ${arcStartX} ${arcStartY} A ${arcRadius} ${arcRadius} 0 0 ${sweepFlag} ${isRight ? pivotX : pivotX + arcRadius} ${thickness + arcRadius}" fill="none" stroke="var(--border-soft)" stroke-width="0.8" stroke-dasharray="2,2" />
    <line x1="${pivotX}" y1="${thickness}" x2="${isRight ? pivotX - arcRadius * 0.7 : pivotX + arcRadius * 0.7}" y2="${thickness + arcRadius * 0.7}" stroke="var(--border-soft)" stroke-width="1.2" />
  `;
}

export function windowToSvg(props: WindowShapeProps): string {
  const w = props.widthMm / PAGE_UNIT_MM;
  const thickness = props.wallThicknessMm / PAGE_UNIT_MM;

  const wallRect = `<rect x="0" y="0" width="${w}" height="${thickness}" fill="var(--surface-panel)" stroke="var(--border-soft)" stroke-width="1.5" />`;

  const glassY = thickness * 0.2;
  const glassH = thickness * 0.6;

  if (props.windowType === "double") {
    const halfW = w / 2;
    return `
      ${wallRect}
      <rect x="1" y="${glassY}" width="${halfW - 1.5}" height="${glassH}" fill="var(--surface-glass)" stroke="var(--border-soft)" stroke-width="0.8" />
      <rect x="${halfW + 0.5}" y="${glassY}" width="${halfW - 1.5}" height="${glassH}" fill="var(--surface-glass)" stroke="var(--border-soft)" stroke-width="0.8" />
    `;
  }

  if (props.windowType === "sliding") {
    const thirdW = w / 3;
    return `
      ${wallRect}
      <rect x="1" y="${glassY}" width="${thirdW * 2 - 1}" height="${glassH}" fill="var(--surface-glass)" stroke="var(--border-soft)" stroke-width="0.8" />
      <line x1="${thirdW}" y1="${glassY}" x2="${thirdW}" y2="${glassY + glassH}" stroke="var(--border-soft)" stroke-width="0.5" />
      <line x1="${thirdW * 2}" y1="${glassY}" x2="${thirdW * 2}" y2="${glassY + glassH}" stroke="var(--border-soft)" stroke-width="0.5" stroke-dasharray="2,1" />
    `;
  }

  return `
    ${wallRect}
    <rect x="1" y="${glassY}" width="${w - 2}" height="${glassH}" fill="var(--surface-glass)" stroke="var(--border-soft)" stroke-width="0.8" />
    <line x1="${w / 2}" y1="${glassY}" x2="${w / 2}" y2="${glassY + glassH}" stroke="var(--border-soft)" stroke-width="0.5" />
  `;
}

export function createDoorShapeProps(
  options?: Partial<DoorShapeProps>,
): DoorShapeProps {
  return {
    widthMm: options?.widthMm ?? 900,
    wallThicknessMm: options?.wallThicknessMm ?? 120,
    swing: options?.swing ?? "left",
    openAngleDeg: options?.openAngleDeg ?? 90,
    isOpen: options?.isOpen ?? true,
    label: options?.label ?? "Door",
  };
}

export function createWindowShapeProps(
  options?: Partial<WindowShapeProps>,
): WindowShapeProps {
  return {
    widthMm: options?.widthMm ?? 1200,
    wallThicknessMm: options?.wallThicknessMm ?? 120,
    windowType: options?.windowType ?? "single",
    sillHeightMm: options?.sillHeightMm ?? 900,
    label: options?.label ?? "Window",
  };
}
