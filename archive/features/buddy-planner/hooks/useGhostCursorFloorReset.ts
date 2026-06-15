import { useEffect } from 'react'
import { useFloorStore } from '../stores/floorStore'

/**
 * Clear any floor-scoped hover/ghost state whenever the active floor
 * changes. Door/window placement previews are transient UI, so they must
 * restart cleanly on the new floor instead of carrying the previous hover
 * target across the switch.
 */
export function useGhostCursorFloorReset(onFloorChange: () => void) {
  const activeFloorId = useFloorStore((s) => s.activeFloorId)

  useEffect(() => {
    onFloorChange()
  }, [activeFloorId, onFloorChange])
}



