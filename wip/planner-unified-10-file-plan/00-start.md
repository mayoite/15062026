# Unified Planner Start

## Goal

Create one canonical planner execution packet for `E:\16062026` that is safe to execute without reopening older planning docs.

This packet must stay standalone.
If a lane still needs truth from somewhere else, the packet is incomplete.

## Recovered Truths That Must Survive

- The safe dependency order is: runtime cleanup, startup performance, state/persistence/offline sync, baseline AI reliability, approved sketch-to-plan, catalog/asset pipeline, database/query optimization, then final verification/governance.
- Shared planner seams cannot be edited by multiple active lanes at the same time without churn and regressions.
- State/persistence/offline sync and baseline AI reliability are related, but they are not one lane. Baseline AI reliability starts only after the state lane is proved or the exact gap is logged.
- Sketch-to-plan is an approved scope expansion beyond baseline AI reliability. It remains a separate lane with its own fallback, preview, rollback, and recovery contract.
- `reference underlay + trace mode` is the safest universal no-AI fallback for sketch conversion.
- No lane counts as complete without proof or an explicit logged verification gap.

## Standalone Rule

- Do not rely on deleted, archived, or older planning packets to fill execution gaps.
- Do not write "see older docs" or equivalent handoff shortcuts.
- If a reviewer cannot execute the next lane from this packet alone, fix the packet before implementation starts.

## Hard Stops

- No tests without explicit user permission.
- No Playwright without explicit user permission.
- No commit without explicit user permission.
- Log skips, blockers, and follow-ups in `E:\16062026\Failures.md`.

## Canonical Lane Order

1. `01-lane-map-and-sequencing.md`
2. `02-runtime-cleanup.md`
3. `03-startup-performance.md`
4. `04-state-persistence-and-ai-reliability.md`
   - Lane 3 inside file `04`: state, persistence, autosave, offline sync
   - Lane 4 inside file `04`: baseline AI reliability
5. `05-sketch-to-plan-approved-lane.md`
6. `06-catalog-and-asset-pipeline.md`
7. `07-database-and-query-optimization.md`
8. `08-verification-and-governance.md`
9. `09-handover.md`

## Working Method

For each file:
- read the named repo surfaces first
- keep changes inside that lane
- satisfy the completion checklist before moving on
- if proof cannot be gathered, log the exact gap
- if a lane changes a shared seam, call that out before the next lane touches it

For file `04` specifically:
- finish the state/persistence/offline sync lane first
- do not start baseline AI reliability until the state lane proof exists or the exact verification gap is logged

## Scope Rules

- Do not blur baseline AI reliability with sketch-to-plan conversion.
- Do not let performance work redefine persistence or catalog contracts.
- Do not let database tuning redefine persistence semantics or sketch recovery semantics.

## Exit Condition

This packet is complete only when:
- file `04` has both internal lanes completed in order
- files `01` through `08` are individually complete
- cross-lane conflicts are resolved or explicitly logged
- unresolved verification gaps are logged with lane, file, and exact missing proof
- `09-handover.md` reflects the true current state of the work
