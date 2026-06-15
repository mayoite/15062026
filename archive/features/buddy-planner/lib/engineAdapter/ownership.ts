/**
 * Buddy engine ownership constants and runtime guards.
 *
 * Planner engine ownership lives in features/oando-planner/lib/engineOwnership.ts.
 * This module only defines engines that belong to the Buddy surface.
 */

import type { EngineId } from './registry'

export const BUDDY_ENGINES: readonly EngineId[] = ['three3d', 'tldraw']

export function isBuddyEngine(engineId: string): engineId is EngineId {
  return BUDDY_ENGINES.includes(engineId as EngineId)
}

export function crossBoundaryViolationMessage(
  engineId: string,
  callerSurface: 'buddy',
): string {
  return (
    `[Architecture Violation] Engine "${engineId}" was requested on the ` +
    `"${callerSurface}" surface but does not belong there. ` +
    `Buddy owns: [${BUDDY_ENGINES.join(', ')}].`
  )
}

/**
 * Asserts that the given engineId is a valid buddy engine.
 * Throws in development/test; logs in production to avoid cascading failures.
 */
export function assertBuddyEngine(engineId: string): asserts engineId is EngineId {
  if (!isBuddyEngine(engineId)) {
    const msg = crossBoundaryViolationMessage(engineId, 'buddy')
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(msg)
    }
    console.error(msg)
  }
}
