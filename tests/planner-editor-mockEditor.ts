import { vi } from "vitest";
import type { TLShape, TLShapeId } from "@tldraw/editor";

import {
  createMockEditor,
  type MockEditor,
  type MockEditorOptions,
} from "./planner-tldraw-mockEditor";

type StoreListener = () => void;

export type PlannerEditorMock = MockEditor & {
  store: {
    listen: ReturnType<typeof vi.fn>;
  };
  run: ReturnType<typeof vi.fn>;
  undo: ReturnType<typeof vi.fn>;
  redo: ReturnType<typeof vi.fn>;
  getCanUndo: ReturnType<typeof vi.fn>;
  getCanRedo: ReturnType<typeof vi.fn>;
  getCurrentPageShapeIds: ReturnType<typeof vi.fn>;
  deleteShapes: ReturnType<typeof vi.fn>;
  updateShapes: ReturnType<typeof vi.fn>;
  selectNone: ReturnType<typeof vi.fn>;
  clearHistory: ReturnType<typeof vi.fn>;
  zoomToBounds: ReturnType<typeof vi.fn>;
  zoomToFit: ReturnType<typeof vi.fn>;
  setCamera: ReturnType<typeof vi.fn>;
  setCameraOptions: ReturnType<typeof vi.fn>;
  getCurrentToolId: ReturnType<typeof vi.fn>;
  getOnlySelectedShapeId: ReturnType<typeof vi.fn>;
  pageToScreen: ReturnType<typeof vi.fn>;
  screenToPage: ReturnType<typeof vi.fn>;
  getCamera: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  selectAll: ReturnType<typeof vi.fn>;
  setSelectedShapes: ReturnType<typeof vi.fn>;
  toggleLock: ReturnType<typeof vi.fn>;
  alignShapes: ReturnType<typeof vi.fn>;
  distributeShapes: ReturnType<typeof vi.fn>;
  bringToFront: ReturnType<typeof vi.fn>;
  sendToBack: ReturnType<typeof vi.fn>;
  duplicateShapes: ReturnType<typeof vi.fn>;
  zoomToSelection: ReturnType<typeof vi.fn>;
  getSnapshot: ReturnType<typeof vi.fn>;
  pageToViewport: ReturnType<typeof vi.fn>;
  _emitStoreChange: () => void;
};

export interface PlannerEditorMockOptions extends MockEditorOptions {
  selectedIds?: TLShapeId[];
  canUndo?: boolean;
  canRedo?: boolean;
  currentToolId?: string;
  camera?: { x: number; y: number; z: number };
}

export function createPlannerEditorMock(
  options: PlannerEditorMockOptions = {},
): PlannerEditorMock {
  const listeners = new Set<StoreListener>();
  const base = createMockEditor(options);
  const shapes = base._shapes;
  let selectedIds = [...(options.selectedIds ?? [])];
  let canUndo = options.canUndo ?? false;
  let canRedo = options.canRedo ?? false;
  const currentToolId = options.currentToolId ?? "select";
  const camera = { ...(options.camera ?? { x: 0, y: 0, z: 1 }) };

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const editor = Object.assign(base, {
    store: {
      listen: vi.fn((listener: StoreListener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }),
    },
    _emitStoreChange: emit,
    run: vi.fn((fn: () => void) => fn()),
    undo: vi.fn(() => {
      canUndo = false;
      canRedo = true;
      emit();
    }),
    redo: vi.fn(() => {
      canRedo = false;
      canUndo = true;
      emit();
    }),
    getCanUndo: vi.fn(() => canUndo),
    getCanRedo: vi.fn(() => canRedo),
    getCurrentPageShapeIds: vi.fn(() => shapes.map((shape) => shape.id)),
    deleteShapes: vi.fn((ids: TLShapeId[]) => {
      for (const id of ids) base.deleteShape(id);
      emit();
    }),
    updateShapes: vi.fn((updates: Array<{ id: TLShapeId; type?: string; x?: number; y?: number; props?: Record<string, unknown> }>) => {
      for (const update of updates) {
        const index = shapes.findIndex((shape) => shape.id === update.id);
        if (index < 0) continue;
        const current = shapes[index]!;
        shapes[index] = {
          ...current,
          ...("x" in update ? { x: update.x ?? current.x } : {}),
          ...("y" in update ? { y: update.y ?? current.y } : {}),
          props: update.props ? { ...current.props, ...update.props } : current.props,
        };
      }
      emit();
    }),
    selectNone: vi.fn(() => {
      selectedIds = [];
      emit();
    }),
    clearHistory: vi.fn(),
    zoomToBounds: vi.fn(),
    zoomToFit: vi.fn(),
    setCamera: vi.fn((next: typeof camera) => Object.assign(camera, next)),
    setCameraOptions: vi.fn(),
    getCurrentToolId: vi.fn(() => currentToolId),
    getOnlySelectedShapeId: vi.fn(() => selectedIds[0] ?? null),
    pageToScreen: vi.fn((point: { x: number; y: number }) => ({
      x: point.x * camera.z + camera.x,
      y: point.y * camera.z + camera.y,
    })),
    screenToPage: vi.fn((point: { x: number; y: number }) => ({
      x: (point.x - camera.x) / camera.z,
      y: (point.y - camera.y) / camera.z,
    })),
    getCamera: vi.fn(() => ({ ...camera })),
    select: vi.fn((id: TLShapeId) => {
      selectedIds = [id];
      emit();
    }),
    selectAll: vi.fn(() => {
      selectedIds = shapes.map((shape) => shape.id);
      emit();
    }),
    setSelectedShapes: vi.fn((ids: TLShapeId[]) => {
      selectedIds = [...ids];
      emit();
    }),
    toggleLock: vi.fn(),
    alignShapes: vi.fn(),
    distributeShapes: vi.fn(),
    bringToFront: vi.fn(),
    sendToBack: vi.fn(),
    duplicateShapes: vi.fn(),
    zoomToSelection: vi.fn(),
    getSnapshot: vi.fn(() => ({ store: { records: {} } })),
    pageToViewport: vi.fn((point: { x: number; y: number }) => ({
      x: point.x,
      y: point.y,
    })),
  }) as PlannerEditorMock;

  editor.getSelectedShapeIds = vi.fn(() => [...selectedIds]);
  editor.getShape = vi.fn((id: TLShapeId) => shapes.find((shape) => shape.id === id));
  editor.getCurrentPageShapes = vi.fn(() => [...shapes]);

  return editor;
}

export function makeShape(
  id: string,
  type: string,
  props: Record<string, unknown> = {},
  extra: Partial<TLShape> = {},
): TLShape {
  return {
    id: id as TLShapeId,
    type,
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    props,
    ...extra,
  } as TLShape;
}
