# Planner Guest Checklist and Handover

## Status key

- `[ ]` not started
- `[~]` in progress
- `[x]` verified with evidence
- `[!]` blocked; add owner and reason

## Phase gates

- [ ] Phase 1: baseline contract agreed; independent E2E entry is green.
- [ ] Phase 2: setup validation, metadata, refresh, keyboard, and mobile are green.
- [ ] Phase 3: all 2D tools, history, inspector, grid, and geometry are green.
- [ ] Phase 4: catalog, templates, and blueprint success/failure paths are green.
- [ ] Phase 5: autosave, session CRUD, import/export, offline, and migration are green.
- [ ] Phase 6: 3D, AI, review, and every exposed output are green.
- [ ] Phase 7: accessibility, responsive, performance, memory, and resilience are green.
- [ ] Phase 8: targeted gates and final journeys pass from a clean checkout.

## Task progress ledger

Update this table for every executed task; do not mark a phase complete only from the phase gate checkbox.

| Task ID | Status | Finding/change | Test/evidence | Blocker/owner | Next action |
|---|---|---|---|---|---|
| P1-01 | | | | | |
| P1-02 | | | | | |
| P1-03 | | | | | |
| P1-04 | | | | | |
| P1-05 | | | | | |
| P1-06 | | | | | |
| P1-07 | | | | | |
| P1-08 | | | | | |
| P1-09 | | | | | |
| P1-10 | | | | | |

Add subsequent phase task rows when that phase starts; keep this file as the single status source.

## Confirmed starting blockers

- [x] Runtime audit completed in a separate background tab at 1280x720; the original user tab remained untouched.
- [!] Left-panel default conflicts with `planner-chrome.spec.ts`. Owner: planner chrome contract.
- [!] E2E expects `Drawing tools` navigation; runtime exposes a group inside `Canvas tools`. Owner: tool chrome/test contract.
- [!] E2E expects `Canvas history`; runtime exposes unnamed Undo/Redo controls. Owner: toolbar accessibility/test contract.
- [!] Catalog articles expose duplicate same-name Add buttons. Owner: catalog component accessibility.
- [!] 3D is visibly nonblank and WebGL-ready but lacks `data-render-evidence` and `data-render-luma`. Owner: 3D test contract.
- [!] Workspace logs a `THREE.Clock` deprecation warning. Owner: 3D runtime.
- [!] 31 E2E checks skipped after three serial suite entry failures. Owner: test isolation.
- [!] `npm.cmd run test:planner` exceeded 120 seconds. Owner: test runtime/timeout investigation.

## Mandatory final checks

- [ ] Fresh guest setup.
- [ ] Returning guest restore.
- [ ] Draw, Place, and Review workflow.
- [ ] Select, pan, wall, room, door, window, furniture, zone, measure, erase.
- [ ] Undo/redo and keyboard shortcuts.
- [ ] Catalog search/filter/click/drop/recents.
- [ ] Templates and blueprint import/calibration.
- [ ] Inspector and layer controls.
- [ ] 2D, Split, 3D, and WebGL fallback.
- [ ] Autosave and named session CRUD.
- [ ] JSON import/export and visual/document exports.
- [ ] AI accept/reject/failure and undo.
- [ ] Offline, storage denial, invalid data, and error boundaries.
- [ ] Desktop, tablet, mobile, touch, keyboard, screen reader, reduced motion.
- [ ] No unexplained console errors or critical accessibility findings.
- [ ] Typecheck, lint, planner tests, E2E, a11y, and build pass.

## Handover record

Fill this at the end of every work session:

- Date/time:
- Branch/commit:
- Current phase:
- Completed items:
- Files changed:
- Commands run and results:
- Browser evidence paths:
- Defects opened/fixed:
- Remaining blockers with owner:
- Data or environment assumptions:
- Exact next action:
- Rollback notes:

## Final sign-off

- Engineering:
- QA:
- Product contract owner:
- Release decision and date:

## Handover completeness check

- [ ] Current behavior and intended contract are not confused.
- [ ] Every open finding has severity, reproduction, owner and next action.
- [ ] Every completion claim links to a passing command or browser artifact.
- [ ] Skipped tests and untested environments are explicit.
- [ ] No temporary screenshots, traces or generated reports remain in the repository.
- [ ] No unauthorized auth/API/database/build/top-level changes were made.
- [ ] The next engineer can run the exact next task without rediscovery.
