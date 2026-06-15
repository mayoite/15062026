import type { CommandItem } from '../../lib/commandPaletteFilter'
import type { Floor } from '../../types/floor'
import type { CanvasElement } from '../../types/elements'

interface BuildCommandItemsOptions {
  floors: Floor[]
  activeFloorElements: Record<string, CanvasElement>
  query: string
  router: unknown
  teamSlug: string
  officeSlug: string
  close: () => void
  presentationMode: boolean
  canEditMap: boolean
  canManageTeam: boolean
  canViewReports: boolean
  guestMode: boolean
  announceGuestBlocked: (feature: string) => void
}

/**
 * Stub command palette actions.
 * The full implementation has been archived. Extend this as new commands are
 * wired into the unified buddy-planner UI shell.
 */
export function buildCommandItems(_opts: BuildCommandItemsOptions): CommandItem[] {
  return []
}
