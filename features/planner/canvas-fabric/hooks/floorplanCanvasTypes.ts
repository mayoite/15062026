/**
 * floorplanCanvasTypes.ts
 *
 * Shared types and pure utility functions for the Fabric canvas hook.
 * Split from floorplanCanvas.ts to keep that file under 1 000 lines.
 */

import type { FabricObject } from 'fabric';
import type { Dispatch, SetStateAction } from 'react';
import type { PlannerLayerCategory } from '@/features/planner/store/workspaceStore';

// ─── Re-exported types ────────────────────────────────────────────────────────

export type PlannerFabricObject = FabricObject & { id?: string; name?: string };

export type InsertPayloadObj = Record<string, unknown> & {
  id?: string;
  svg?: string;
  title?: string;
  name?: string;
  variant?: 'furniture' | 'room' | 'zone';
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  lrSpacing?: number;
  tbSpacing?: number;
};

export type FloorplanCtx = {
  roomEdit: boolean;
  zoom: number;
  gridEnabled: boolean;
  snapEnabled: boolean;
  states: string[];
  redoStates: string[];
  roomEditStates: string[];
  roomEditRedoStates: string[];
  defaultChair: unknown;
  setSelections: (items: FabricObject[]) => void;
  setUngroupable: (v: boolean) => void;
  pushState: (s: string) => void;
  setStates: Dispatch<SetStateAction<string[]>>;
  setRedoStates: Dispatch<SetStateAction<string[]>>;
  setRoomEditStates: Dispatch<SetStateAction<string[]>>;
  setRoomEditRedoStates: Dispatch<SetStateAction<string[]>>;
  enterRoomEdit: () => void;
  exitRoomEdit: () => void;
  syncZoom: (zoomPct: number) => void;
};

// ─── Pure utility functions ───────────────────────────────────────────────────

/** Resolve which planner layer category an object belongs to by its name prefix. */
export function resolveLayerCategory(obj: unknown): PlannerLayerCategory | null {
  const name = String((obj as PlannerFabricObject)?.name ?? '');
  if (!name) return null;
  if (
    name === 'CORNER' ||
    name.startsWith('WALL:') ||
    name.startsWith('DOOR') ||
    name.startsWith('WINDOW')
  ) {
    return 'walls';
  }
  if (name.startsWith('DRAW:measure')) return 'measurements';
  if (name.startsWith('DRAW:')) return 'zones';
  if (
    name.startsWith('GENERIC:') ||
    name.startsWith('TABLE') ||
    name.startsWith('CHAIR') ||
    name.startsWith('DESK')
  ) {
    return 'furniture';
  }
  return null;
}

/**
 * Compute the axis-aligned bounding rectangle of Fabric objects (includes size).
 */
export function getBoundingRect(objects: FabricObject[]) {
  let top = Number.POSITIVE_INFINITY;
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  objects.forEach((obj) => {
    obj.setCoords?.();
    const bounds =
      typeof obj.getBoundingRect === 'function'
        ? obj.getBoundingRect()
        : {
            left: obj.left ?? 0,
            top: obj.top ?? 0,
            width: obj.width ?? 0,
            height: obj.height ?? 0,
          };
    left = Math.min(left, bounds.left);
    top = Math.min(top, bounds.top);
    right = Math.max(right, bounds.left + bounds.width);
    bottom = Math.max(bottom, bounds.top + bounds.height);
  });

  if (!Number.isFinite(left)) {
    return { left: 0, top: 0, right: 0, bottom: 0, center: 0, middle: 0, width: 0, height: 0 };
  }

  const center = (left + right) / 2;
  const middle = (top + bottom) / 2;

  return {
    left,
    top,
    right,
    bottom,
    center,
    middle,
    width: right - left,
    height: bottom - top,
  };
}
