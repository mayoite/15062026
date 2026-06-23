# Lane Map and Sequencing

## Objective

Define one safe planner execution order without letting lanes overwrite each other or smuggle contract changes across boundaries.

## Canonical Lane Order

| Lane | Scope | Canonical file | Start only when |
|---|---|---|---|
| 1 | runtime cleanup | `02-runtime-cleanup.md` | file `01` is understood |
| 2 | startup performance | `03-startup-performance.md` | lane 1 is complete or its exact gap is logged |
| 3 | state, persistence, autosave, offline sync | `04-state-persistence-and-ai-reliability.md` lane A | lane 2 is complete or its exact gap is logged |
| 4 | baseline AI reliability | `04-state-persistence-and-ai-reliability.md` lane B | lane 3 proof exists or its exact gap is logged |
| 5 | approved sketch-to-plan | `05-sketch-to-plan-approved-lane.md` | lane 4 proof exists or its exact gap is logged |
| 6 | catalog and asset pipeline | `06-catalog-and-asset-pipeline.md` | lanes 1 through 5 have settled their contracts |
| 7 | database and query optimization | `07-database-and-query-optimization.md` | lanes 3 and 6 have settled their contracts |
| 8 | final verification and governance | `08-verification-and-governance.md` | lanes 1 through 7 have proof or logged gaps |

## Why This Order

- Cleanup must land before performance so measurements are trustworthy.
- Performance must land before persistence/offline work so startup timing is stable and non-critical work can be deferred cleanly.
- Persistence/offline sync must land before baseline AI reliability so stale-response handling and apply-to-canvas behavior can rely on one settled draft authority model.
- Baseline AI reliability must land before sketch conversion so sketch recovery can reuse stable fallback classification, abort hygiene, and deterministic canvas application rules.
- Sketch-to-plan stays separate because it changes the UX, route contract, failure handling, preview/rollback contract, and test surface.
- Catalog and asset work must wait until runtime, state, and AI seams are stable.
- Database tuning must wait until persistence and data contracts stop moving.

## Shared Seams

These files are likely cross-lane collision points:
- `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- `E:\16062026\features\planner\editor\usePlannerSessionHandlers.ts`
- `E:\16062026\features\planner\canvas-fabric\plannerRuntime.ts`
- `E:\16062026\features\planner\canvas-fabric\hooks\floorplanCanvas.ts`
- `E:\16062026\features\planner\hooks\usePlannerFabricAutosave.ts`
- `E:\16062026\features\planner\store\plannerPersistence.ts`
- `E:\16062026\features\planner\ai\spaceSuggest.ts`
- `E:\16062026\features\planner\lib\assetPipeline.ts`

Only one active lane should own a shared seam at a time.

## Boundary Rules

- Lane 2 may wrap current catalog and persistence adapter surfaces in lazy boundaries, but it must not redefine their data contracts.
- Lane 3 owns canonical draft/state semantics. Lane 7 may optimize those queries later, but it may not redefine save, hydration, queue, or conflict behavior.
- Lane 4 owns baseline AI provider fallback, abort/cancel hygiene, validation, and deterministic apply. It does not own editable sketch conversion.
- Lane 5 owns editable sketch conversion, workspace recovery UI, preview/accept/reject, and retry rules. It must not weaken the baseline AI guarantees from lane 4.

## Do Not Break

- the explicit approval boundary that makes sketch-to-plan a separate lane
- the master dependency order
- the internal gate between lane 3 and lane 4 inside file `04`

## Proof Target

Proof for this file is strong only if the next implementer can point to:
- the exact next lane to work
- the shared seams that require coordination
- the gate that blocks lane 4 until lane 3 is proved
- the reason sketch-to-plan is separate from baseline AI reliability

## Completion Checklist

- [ ] The lane order is explicit and internally consistent.
- [ ] File `04` is treated as two separate lanes executed in order.
- [ ] Shared seam ownership is named.
- [ ] Sketch-to-plan is classified as an approved separate lane.
- [ ] No later file contradicts this lane order.
