// @ts-nocheck
import type { CanvasElement } from '../../types/elements'
import type { CanvasSettings } from '../../types/project'
import type { Annotation } from '../../types/annotations'
import { DEFAULT_CANVAS_SETTINGS } from '../../types/project'
import type { PlannerDocument } from '../../../oando-planner/model/plannerDocument'
import type { LengthUnit } from '../../lib/units'

function isRecord(v: unknown): v is Record<string, unknown> { 
  return typeof v === "object" && v !== null; 
}

function toRecord<T>(v: unknown): Record<string, T> { 
  return isRecord(v) ? v as Record<string, T> : {}; 
}

export interface BuddySceneState {
  version: 1
  elements: Record<string, CanvasElement>
  settings: CanvasSettings
  annotations: Record<string, Annotation>
}

export interface LegacyOfficePayload {
  elements?: unknown
  floors?: unknown
  activeFloorId?: unknown
  settings?: unknown
  annotations?: unknown
  [key: string]: unknown
}

export function normalizeCanvasSettings(raw: unknown): CanvasSettings {
  const next: CanvasSettings = { ...DEFAULT_CANVAS_SETTINGS }
  if (!isRecord(raw)) return next
  if (typeof raw.scale === 'number') next.scale = raw.scale
  if (typeof raw.scaleUnit === 'string' && (['px', 'in', 'ft', 'cm', 'm'] as readonly string[]).includes(raw.scaleUnit)) {
    next.scaleUnit = raw.scaleUnit as LengthUnit
  }
  if (typeof raw.showGrid === 'boolean') next.showGrid = raw.showGrid
  if (typeof raw.seatLabelStyle === 'string' && raw.seatLabelStyle.length > 0) {
    next.seatLabelStyle = raw.seatLabelStyle as CanvasSettings['seatLabelStyle']
  }
  if (typeof raw.showDeskIds === 'boolean') next.showDeskIds = raw.showDeskIds
  return next
}

function rebaseAnnotationsToFloor(
  annotations: Record<string, Annotation>,
  canonicalFloorId: string | null,
): Record<string, Annotation> {
  if (!canonicalFloorId) return annotations
  const next: Record<string, Annotation> = {}
  for (const [id, annotation] of Object.entries(annotations)) {
    if (annotation.anchor.type !== 'floor-position') {
      next[id] = annotation
      continue
    }
    next[id] =
      annotation.anchor.floorId === canonicalFloorId
        ? annotation
        : {
            ...annotation,
            anchor: { ...annotation.anchor, floorId: canonicalFloorId },
          }
  }
  return next
}

export function normalizeBuddySceneState(raw: unknown): BuddySceneState {
  const source = isRecord(raw) ? raw : {}
  return {
    version: 1,
    elements: toRecord<CanvasElement>(source.elements),
    settings: normalizeCanvasSettings(source.settings),
    annotations: toRecord<Annotation>(source.annotations),
  }
}

export function createBlankPlannerProjectDocument(): PlannerDocument {
  const emptyScene: BuddySceneState = normalizeBuddySceneState({})
  return {
    schemaVersion: 1,
    title: 'Untitled project',
    projectName: 'Untitled project',
    roomWidthMm: 6000,
    roomDepthMm: 8000,
    seatTarget: 10,
    unitSystem: 'metric',
    sceneJson: emptyScene as unknown as Record<string, unknown>,
    itemCount: 0,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function pickCanonicalFloor(raw: LegacyOfficePayload): {
  sourceFloorId: string | null
  migratedFromMultiFloor: boolean
  elements: Record<string, CanvasElement>
} {
  const floors = Array.isArray(raw.floors) ? raw.floors : []
  const normalizedFloors = floors
    .filter((floor): floor is Record<string, unknown> => isRecord(floor))
    .map((floor) => ({
      id: typeof floor.id === 'string' ? floor.id : '',
      floor,
    }))
    .filter((entry) => entry.id.length > 0)
  const activeFloorId =
    typeof raw.activeFloorId === 'string' && raw.activeFloorId.length > 0
      ? raw.activeFloorId
      : null
  const chosenFloor =
    normalizedFloors.find((entry) => entry.id === activeFloorId) ??
    normalizedFloors[0] ??
    null
  
  const chosenElements = chosenFloor
    ? toRecord<CanvasElement>(chosenFloor.floor.elements)
    : {}
  return {
    sourceFloorId: chosenFloor?.id ?? null,
    migratedFromMultiFloor: normalizedFloors.length > 1,
    elements: Object.keys(chosenElements).length > 0
      ? chosenElements
      : toRecord<CanvasElement>(raw.elements),
  }
}

export function migrateLegacyOfficePayload(
  raw: unknown,
  fallbackTitle: string = 'Imported Project'
): PlannerDocument | null {
  if (!isRecord(raw)) return null
  const candidate = raw as LegacyOfficePayload
  const canonicalFloor = pickCanonicalFloor(candidate)
  const canonicalFloorId = canonicalFloor.sourceFloorId
  
  const annotations = rebaseAnnotationsToFloor(
    toRecord<Annotation>(candidate.annotations),
    canonicalFloorId,
  )

  const sceneState: BuddySceneState = {
    version: 1,
    elements: canonicalFloor.elements,
    settings: normalizeCanvasSettings(candidate.settings),
    annotations,
  }

  return {
    schemaVersion: 1,
    title: fallbackTitle,
    projectName: fallbackTitle,
    roomWidthMm: 6000,
    roomDepthMm: 8000,
    seatTarget: 10,
    unitSystem: 'metric',
    sceneJson: sceneState as unknown as Record<string, unknown>,
    itemCount: Object.keys(canonicalFloor.elements).length,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
