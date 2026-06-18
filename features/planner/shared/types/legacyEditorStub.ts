/**
 * Minimal editor/shape stubs after tldraw removal.
 * Used by legacy planner modules until fully migrated to fabric.
 */

export type TLShapeId = string;

export type TLShape = {
  id: TLShapeId;
  type: string;
  x: number;
  y: number;
  rotation: number;
  isLocked: boolean;
  props: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export type TLLineShape = TLShape & {
  type: "line";
  props: {
    points: Record<string, { x: number; y: number }>;
  };
};

export type TLGeoShape = TLShape & {
  type: "geo";
  props: Record<string, unknown>;
};

export const AssetRecordType = {
  createId: () => `asset:${crypto.randomUUID()}`,
};

export function toRichText(text: string): string {
  return text;
}

export type Editor = {
  getCurrentPageShapes: () => TLShape[];
  getCurrentPageShapeIds: () => TLShapeId[];
  getSelectedShapeIds: () => TLShapeId[];
  getShape: (id: TLShapeId) => TLShape | undefined;
  getShapePageBounds: (id: TLShapeId) => {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    w: number;
    h: number;
  } | null;
  getCanUndo: () => boolean;
  getCanRedo: () => boolean;
  getCurrentToolId: () => string;
  setCurrentTool: (id: string) => void;
  select: (id: TLShapeId) => void;
  selectAll: () => void;
  selectNone: () => void;
  setSelectedShapes: (ids: TLShapeId[]) => void;
  toggleLock: (ids: TLShapeId[]) => void;
  bringToFront: (ids: TLShapeId[]) => void;
  sendToBack: (ids: TLShapeId[]) => void;
  zoomToSelection: (opts?: { animation?: { duration: number } }) => void;
  pageToScreen: (point: { x: number; y: number }) => { x: number; y: number };
  screenToPage: (point: { x: number; y: number }) => { x: number; y: number };
  getViewportPageBounds: () => { center: { x: number; y: number } };
  alignShapes: (ids: TLShapeId[], operation: string) => void;
  distributeShapes: (ids: TLShapeId[], operation: string) => void;
  store: {
    listen: (cb: () => void, opts?: { scope?: string }) => () => void;
  };
};

export function createShapeId(id?: string): TLShapeId {
  return id ?? `shape:${crypto.randomUUID()}`;
}

export const getIndices = (_ids: TLShapeId[]) => [] as string[];
export const DefaultColorStyle = {} as const;
export const DefaultDashStyle = {} as const;
export const DefaultFillStyle = {} as const;
export const DefaultSizeStyle = {} as const;
export const GeoShapeGeoStyle = {} as const;