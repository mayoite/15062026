import { vi } from "vitest";

export type MockShape = {
  id: string;
  type: string;
  x?: number;
  y?: number;
  rotation?: number;
  props: Record<string, unknown>;
  meta?: Record<string, unknown>;
  isLocked?: boolean;
};

export type MockEditorOptions = {
  shapes?: MockShape[];
  selectedIds?: string[];
};

export function makeShape(
  id: string,
  type: string,
  props: Record<string, unknown> = {},
  extra: Partial<MockShape> = {},
): MockShape {
  return {
    id,
    type,
    x: 0,
    y: 0,
    rotation: 0,
    props,
    ...extra,
  };
}

export function createMockEditor(options: MockEditorOptions = {}) {
  const shapes = [...(options.shapes ?? [])];
  const selectedIds = [...(options.selectedIds ?? [])];

  return {
    _shapes: shapes,
    createShape: vi.fn(),
    deleteShape: vi.fn((id: string) => {
      const index = shapes.findIndex((shape) => shape.id === id);
      if (index >= 0) shapes.splice(index, 1);
    }),
    getSelectedShapeIds: vi.fn(() => [...selectedIds]),
    getShape: vi.fn((id: string) => shapes.find((shape) => shape.id === id)),
    getCurrentPageShapes: vi.fn(() => [...shapes]),
  };
}

export type PlannerEditorMock = ReturnType<typeof createMockEditor> & {
  store: { listen: ReturnType<typeof vi.fn> };
  run: ReturnType<typeof vi.fn>;
  updateShapes: ReturnType<typeof vi.fn>;
  getCurrentPageShapeIds: ReturnType<typeof vi.fn>;
};

export function createPlannerEditorMock(options: MockEditorOptions = {}): PlannerEditorMock {
  const base = createMockEditor(options);
  return Object.assign(base, {
    store: { listen: vi.fn(() => vi.fn()) },
    run: vi.fn((fn: () => void) => fn()),
    updateShapes: vi.fn(),
    getCurrentPageShapeIds: vi.fn(() => base._shapes.map((shape) => shape.id)),
  });
}
