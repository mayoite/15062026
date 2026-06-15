import type { CanvasElement } from '../types/elements'
import type { Scene3D } from './engineAdapter/types'

const WALL_HEIGHT = 2.8
const DESK_HEIGHT = 0.75
const TABLE_HEIGHT = 0.75
const SOFA_HEIGHT = 0.7
const CABINET_HEIGHT = 1.8
const DEFAULT_HEIGHT = 0.75

function getFurnitureHeight(type: string): number {
  if (type.startsWith('desk') || type.startsWith('workstation')) return DESK_HEIGHT
  if (type.startsWith('table') || type === 'coffee-table') return TABLE_HEIGHT
  if (type.startsWith('sofa') || type === 'lounge-chair') return SOFA_HEIGHT
  if (type.startsWith('cabinet') || type.startsWith('storage') || type === 'file-cabinet' || type === 'locker' || type === 'vending-machine') return CABINET_HEIGHT
  if (type === 'acoustic-pod') return 2.2
  if (type === 'credenza') return 0.9
  if (type === 'water-cooler' || type === 'coat-rack') return 1.5
  return DEFAULT_HEIGHT
}

function getNumField(el: CanvasElement, field: 'x' | 'y' | 'width' | 'height' | 'rotation'): number {
  const record = el as unknown as Record<string, unknown>
  const val = record[field]
  return typeof val === 'number' ? val : 0
}

function getStrField(el: CanvasElement, field: 'label' | 'fillColor', fallback: string): string {
  const record = el as unknown as Record<string, unknown>
  const val = record[field]
  return typeof val === 'string' ? val : fallback
}

export function elementsTo3D(elements: Record<string, CanvasElement>): Scene3D {
  const walls: Scene3D['walls'] = []
  const rooms: Scene3D['rooms'] = []
  const furniture: Scene3D['furniture'] = []

  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity

  for (const el of Object.values(elements)) {
    const hw = getNumField(el, 'width') || 1
    const hh = getNumField(el, 'height') || 1
    const hx = getNumField(el, 'x')
    const hy = getNumField(el, 'y')
    const rot = getNumField(el, 'rotation') || 0
    const label = getStrField(el, 'label', '')
    const color = getStrField(el, 'fillColor', 'var(--surface-panel)')
    const type = el.type

    const x1 = hx, z1 = hy
    const x2 = hx + hw, z2 = hy + hh
    if (x1 < minX) minX = x1
    if (z1 < minZ) minZ = z1
    if (x2 > maxX) maxX = x2
    if (z2 > maxZ) maxZ = z2

    if (type === 'wall') {
      walls.push({ x: hx, y: hy, w: hw, d: 0.15, h: WALL_HEIGHT, rot })
    } else if ((type as string) === 'room' || type === 'conference-room' || type === 'phone-booth' || type === 'common-area' || type === 'private-office') {
      rooms.push({ x: hx, y: hy, w: hw, d: hh, label, color, rot })
    } else if (['desk', 'workstation', 'table-rect', 'table-round', 'sofa', 'plant', 'printer', 'whiteboard', 'cabinet', 'lounge-chair', 'coffee-table', 'file-cabinet', 'storage-cabinet', 'locker', 'vending-machine', 'water-cooler', 'acoustic-pod', 'credenza', 'coat-rack'].includes(type)) {
      furniture.push({
        x: hx, y: hy, w: hw, d: hh,
        h: getFurnitureHeight(type),
        type, label, rot
      })
    }
  }

  if (!isFinite(minX)) { minX = 0; minZ = 0; maxX = 10; maxZ = 10 }

  return { walls, rooms, furniture, bounds: { minX, minZ, maxX, maxZ } }
}


