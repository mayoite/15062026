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
 * Compute the bounding rectangle of an array of Fabric objects.
 * BUG-01 fix: `obj.top < top` (was erroneously `obj.left < top`).
 */
export function getBoundingRect(objects: FabricObject[]) {
  let top = 9999;
  let left = 9999;
  let right = 0;
  let bottom = 0;

  objects.forEach((obj) => {
    if (obj.top < top) {
      top = obj.top;
    }
    if (obj.left < left) {
      left = obj.left;
    }
    if (obj.top > bottom) {
      bottom = obj.top;
    }
    if (obj.left > right) {
      right = obj.left;
    }
  });

  const center = (left + right) / 2;
  const middle = (top + bottom) / 2;

  return { left, top, right, bottom, center, middle };
}
