import type {
  MeasurementItem,
  Point,
  StructuralElement,
  StructuralType,
  TextLabel,
  Zone,
  ZoneType,
} from "./plannerStore";

const STRUCTURAL_DEFAULTS: Record<string, { w: number; h: number; label: string }> = {
  column: { w: 30, h: 30, label: "Column" },
  stair: { w: 120, h: 200, label: "Stairs" },
  electrical: { w: 20, h: 20, label: "Outlet" },
};

export function createMeasurementItem(id: string, start: Point, end: Point): MeasurementItem {
  return { id, start, end };
}

export function createTextLabel(id: string, x: number, y: number, text: string): TextLabel {
  return { id, x, y, text, fontSize: 14, color: "var(--border-soft)", rotation: 0 };
}

export function createStructuralElement(
  id: string,
  type: StructuralType,
  x: number,
  y: number
): StructuralElement {
  const defaults = STRUCTURAL_DEFAULTS[type] || STRUCTURAL_DEFAULTS.column;
  return {
    id,
    type,
    x,
    y,
    width: defaults.w,
    height: defaults.h,
    rotation: 0,
    label: defaults.label,
  };
}

export function createZone(
  id: string,
  points: Point[],
  name: string,
  type: ZoneType,
  zoneColors: Record<ZoneType, string>
): Zone {
  return {
    id,
    points,
    name,
    type,
    color: zoneColors[type],
    opacity: 0.25,
  };
}
