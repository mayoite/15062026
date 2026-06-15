/**
 * features/oando-planner/lib/engineOwnership.ts
 *
 * Planner-owned engine boundary guard.
 *
 * The Space Planner runs exclusively on tldraw (2D) + Three/R3F (3D). The 2D
 * editing surface is tldraw and nothing else. This guard is the planner-side
 * counterpart to the configurator's engineAdapter/ownership.ts — kept separate
 * so the planner never imports configurator runtime (features must not import
 * each other).
 */

export const PLANNER_2D_ENGINE = 'tldraw' as const;

export type PlannerEngineId = typeof PLANNER_2D_ENGINE;

export function isPlannerEngine(engineId: string): engineId is PlannerEngineId {
  return engineId === PLANNER_2D_ENGINE;
}

/**
 * Asserts the planner is wired to its own engine. Throws in development/test
 * if a foreign engine (e.g. konva/fabric) leaks into the planner surface;
 * logs in production to avoid cascading failures.
 */
export function assertPlannerEngine(engineId: string): void {
  if (!isPlannerEngine(engineId)) {
    const msg =
      `[Architecture Violation] Engine "${engineId}" was activated on the ` +
      `planner surface, which owns only "${PLANNER_2D_ENGINE}".`;
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(msg);
    } else {
      console.error(msg);
    }
  }
}
