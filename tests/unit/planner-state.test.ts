import { describe, it, expect } from 'vitest'
import {
  buildClearedPlannerState,
  snapPointToGrid,
  plannerHasContent,
} from '@/features/planner/store/plannerStateUtils'
import {
  buildUndoState,
  buildRedoState,
} from '@/features/planner/store/plannerHistoryUtils'
import type { Wall, Room, DoorItem, WindowItem, Zone, TextLabel, StructuralType, Snapshot } from '@/features/planner/store/plannerTypes'
import type { FurnitureItem } from '@/features/planner/store/plannerFurnitureStore'

describe('buildClearedPlannerState', () => {
  it('returns geometry with all empty arrays and null drawingWall', () => {
    const state = buildClearedPlannerState()
    expect(state.geometry.walls).toEqual([])
    expect(state.geometry.rooms).toEqual([])
    expect(state.geometry.doors).toEqual([])
    expect(state.geometry.windows).toEqual([])
    expect(state.geometry.measurements).toEqual([])
    expect(state.geometry.zones).toEqual([])
    expect(state.geometry.structuralElements).toEqual([])
    expect(state.geometry.drawingWall).toBeNull()
    expect(state.geometry.drawingRoom).toEqual([])
    expect(state.geometry.drawingZone).toEqual([])
  })

  it('returns furniture section with empty arrays and null selectedId', () => {
    const state = buildClearedPlannerState()
    expect(state.furniture.furniture).toEqual([])
    expect(state.furniture.selectedId).toBeNull()
    expect(state.furniture.selectedIds).toEqual([])
  })

  it('returns ui section with correct defaults', () => {
    const state = buildClearedPlannerState()
    expect(state.ui.zoom).toBe(1)
    expect(state.ui.panOffset).toEqual({ x: 0, y: 0 })
    expect(state.ui.viewMode).toBe('2d')
    expect(state.ui.backgroundImage).toBeNull()
    expect(state.ui.tags).toEqual([])
    expect(state.ui.lightingPreset).toBe('day')
  })

  it('returns history section with empty stacks and null clipboard', () => {
    const state = buildClearedPlannerState()
    expect(state.history.undoStack).toEqual([])
    expect(state.history.redoStack).toEqual([])
    expect(state.history.clipboard).toBeNull()
  })

  it('returns a fresh object on each call (no shared references)', () => {
    const a = buildClearedPlannerState()
    const b = buildClearedPlannerState()
    expect(a).not.toBe(b)
    expect(a.geometry.walls).not.toBe(b.geometry.walls)
  })
})

describe('snapPointToGrid', () => {
  it('snaps a point exactly on grid to itself', () => {
    expect(snapPointToGrid({ x: 20, y: 40 }, 10)).toEqual({ x: 20, y: 40 })
  })

  it('snaps a point slightly above grid line down', () => {
    expect(snapPointToGrid({ x: 11, y: 14 }, 10)).toEqual({ x: 10, y: 10 })
  })

  it('snaps a point slightly below next grid line up', () => {
    expect(snapPointToGrid({ x: 16, y: 18 }, 10)).toEqual({ x: 20, y: 20 })
  })

  it('snaps at midpoint (Math.round(0.5) === 1)', () => {
    expect(snapPointToGrid({ x: 5, y: 5 }, 10)).toEqual({ x: 10, y: 10 })
  })

  it('handles zero coordinates', () => {
    expect(snapPointToGrid({ x: 0, y: 0 }, 10)).toEqual({ x: 0, y: 0 })
  })

  it('handles negative coordinates', () => {
    expect(snapPointToGrid({ x: -7, y: -13 }, 10)).toEqual({ x: -10, y: -10 })
  })

  it('handles snap distance of 1', () => {
    expect(snapPointToGrid({ x: 3.7, y: 8.2 }, 1)).toEqual({ x: 4, y: 8 })
  })

  it('handles large snap distance', () => {
    expect(snapPointToGrid({ x: 130, y: 260 }, 100)).toEqual({ x: 100, y: 300 })
  })

  it('handles fractional snap distance', () => {
    const result = snapPointToGrid({ x: 0.3, y: 0.7 }, 0.5)
    expect(result.x).toBeCloseTo(0.5)
    expect(result.y).toBeCloseTo(0.5)
  })
})

describe('plannerHasContent', () => {
  const emptyState = {
    walls: [] as Wall[],
    rooms: [] as Room[],
    furniture: [] as FurnitureItem[],
    doors: [] as DoorItem[],
    windows: [] as WindowItem[],
    zones: [] as Zone[],
    textLabels: [] as TextLabel[],
    structuralElements: [] as Array<{ id: string; type: StructuralType; points: {x:number, y:number}[] }>,
  }

  const dummyPoint = { x: 0, y: 0 };

  it('returns false when all arrays are empty', () => {
    expect(plannerHasContent(emptyState)).toBe(false)
  })

  it('returns true when walls has content', () => {
    expect(plannerHasContent({ ...emptyState, walls: [{ id: 'w', start: dummyPoint, end: dummyPoint, thickness: 1, color: '' }] })).toBe(true)
  })

  it('returns true when rooms has content', () => {
    expect(plannerHasContent({ ...emptyState, rooms: [{ id: 'r', points: [], name: '', color: '', area: 0 }] })).toBe(true)
  })

  it('returns true when furniture has content', () => {
    expect(plannerHasContent({ ...emptyState, furniture: [{ id: 'f', productId: 'p', position: dummyPoint, rotation: 0, boundingBox: { width: 1, depth: 1, height: 1 } }] })).toBe(true)
  })

  it('returns true when doors has content', () => {
    expect(plannerHasContent({ ...emptyState, doors: [{ id: 'd', wallId: 'w', position: 0, width: 1, swing: 90, style: 'single', x: 0, y: 0, rotation: 0 }] })).toBe(true)
  })

  it('returns true when windows has content', () => {
    expect(plannerHasContent({ ...emptyState, windows: [{ id: 'w', wallId: 'w', position: 0, width: 1, style: 'casement', x: 0, y: 0, rotation: 0 }] })).toBe(true)
  })

  it('returns true when zones has content', () => {
    expect(plannerHasContent({ ...emptyState, zones: [{ id: 'z', type: 'Open Plan', points: [], name: '', color: '', area: 0 }] })).toBe(true)
  })

  it('returns true when textLabels has content', () => {
    expect(plannerHasContent({ ...emptyState, textLabels: [{ id: 't', position: dummyPoint, text: '', fontSize: 12, color: '' }] })).toBe(true)
  })

  it('returns true when structuralElements has content', () => {
    expect(plannerHasContent({ ...emptyState, structuralElements: [{ id: 's', type: 'column', points: [dummyPoint] }] })).toBe(true)
  })
})

describe('buildUndoState', () => {
  const createSnapshot = (id: string): Snapshot => ({
    timestamp: Date.now(),
    description: id,
    geometry: buildClearedPlannerState().geometry,
    furniture: buildClearedPlannerState().furniture,
    ui: buildClearedPlannerState().ui
  })

  it('returns null when undoStack is empty', () => {
    const result = buildUndoState({ undoStack: [], redoStack: [] }, createSnapshot('current'))
    expect(result).toBeNull()
  })

  it('pops the last item from undoStack as snapshot', () => {
    const snap1 = createSnapshot('snap1')
    const snap2 = createSnapshot('snap2')
    const current = createSnapshot('current')
    const result = buildUndoState({ undoStack: [snap1, snap2], redoStack: [] }, current)
    expect(result).not.toBeNull()
    expect(result!.snapshot).toBe(snap2)
  })

  it('removes the last item from undoStack', () => {
    const snap1 = createSnapshot('snap1')
    const snap2 = createSnapshot('snap2')
    const current = createSnapshot('current')
    const result = buildUndoState({ undoStack: [snap1, snap2], redoStack: [] }, current)
    expect(result!.undoStack).toEqual([snap1])
  })

  it('pushes currentSnapshot onto redoStack', () => {
    const snap1 = createSnapshot('snap1')
    const current = createSnapshot('current')
    const result = buildUndoState({ undoStack: [snap1], redoStack: [] }, current)
    expect(result!.redoStack).toEqual([current])
  })

  it('preserves existing redoStack items when pushing', () => {
    const snap1 = createSnapshot('snap1')
    const existing = createSnapshot('existing')
    const current = createSnapshot('current')
    const result = buildUndoState({ undoStack: [snap1], redoStack: [existing] }, current)
    expect(result!.redoStack).toEqual([existing, current])
  })

  it('does not mutate the original stacks', () => {
    const undoStack = [createSnapshot('snap1')]
    const redoStack = [createSnapshot('r1')]
    const current = createSnapshot('current')
    buildUndoState({ undoStack, redoStack }, current)
    expect(undoStack).toHaveLength(1)
    expect(redoStack).toHaveLength(1)
  })
})

describe('buildRedoState', () => {
  const createSnapshot = (id: string): Snapshot => ({
    timestamp: Date.now(),
    description: id,
    geometry: buildClearedPlannerState().geometry,
    furniture: buildClearedPlannerState().furniture,
    ui: buildClearedPlannerState().ui
  })

  it('returns null when redoStack is empty', () => {
    const result = buildRedoState({ undoStack: [], redoStack: [] }, createSnapshot('current'))
    expect(result).toBeNull()
  })

  it('pops the last item from redoStack as snapshot', () => {
    const snap1 = createSnapshot('snap1')
    const snap2 = createSnapshot('snap2')
    const current = createSnapshot('current')
    const result = buildRedoState({ undoStack: [], redoStack: [snap1, snap2] }, current)
    expect(result).not.toBeNull()
    expect(result!.snapshot).toBe(snap2)
  })

  it('removes the last item from redoStack', () => {
    const snap1 = createSnapshot('snap1')
    const snap2 = createSnapshot('snap2')
    const current = createSnapshot('current')
    const result = buildRedoState({ undoStack: [], redoStack: [snap1, snap2] }, current)
    expect(result!.redoStack).toEqual([snap1])
  })

  it('pushes currentSnapshot onto undoStack', () => {
    const snap1 = createSnapshot('snap1')
    const current = createSnapshot('current')
    const result = buildRedoState({ undoStack: [], redoStack: [snap1] }, current)
    expect(result!.undoStack).toEqual([current])
  })

  it('preserves existing undoStack items when pushing', () => {
    const snap1 = createSnapshot('snap1')
    const existing = createSnapshot('existing')
    const current = createSnapshot('current')
    const result = buildRedoState({ undoStack: [existing], redoStack: [snap1] }, current)
    expect(result!.undoStack).toEqual([existing, current])
  })

  it('does not mutate the original stacks', () => {
    const undoStack = [createSnapshot('u1')]
    const redoStack = [createSnapshot('snap1')]
    const current = createSnapshot('current')
    buildRedoState({ undoStack, redoStack }, current)
    expect(undoStack).toHaveLength(1)
    expect(redoStack).toHaveLength(1)
  })
})

