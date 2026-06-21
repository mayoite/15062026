# Planner overhaul checklist

Linked plan: [`OVERHAUL.md`](./OVERHAUL.md)

Status: `[ ]` not started · `[~]` in progress · `[x]` verified with evidence · `[!]` blocked

---

## Journey gates

| Journey | Description | Status | Evidence |
|---|---|---|---|
| J1 | Fresh guest → shell → place desk → autosave → export | `[ ]` | |
| J2 | Wall, room, door, measure, undo | `[ ]` | |
| J3 | Template apply + overwrite guard | `[ ]` | |
| J4 | 3D parity fixture ±150 mm | `[ ]` | |
| J5 | AI apply at preview coordinates | `[ ]` | |
| J6 | Member session restore | `[ ]` | |

---

## Workstreams

### WS1 — Canvas trust

- [~] Wall drag creates persisted `WALL:` object (`floorplanCanvas.ts`)
- [~] Wheel zoom changes zoom % (`mouse:wheel` → `zoomToPointer`)
- [ ] Reload restores object count (`importDraft` + refit)
- [ ] Mobile 390×844 canvas visible (not 0×0 host)
- [x] Measure labels use mm per `unitSystem` (fix `fabricDrawTools.ts` inches)
- [ ] Draw-tool matrix (line / rect / pen / eraser / measure) — all pass

### WS2 — Onboarding + layout apply

- [x] `buildShellOnlyLayout()` from project metadata
- [x] `StartingPointStep` calls bootstrap before gate opens
- [x] `applySuggestedLayout` inserts `layout.walls`
- [x] `applySuggestedLayout` places furniture at `x/y`
- [~] Copy audit: no blueprint promises in UI

### WS3 — 2D↔3D contract

- [~] `fabricObjectToSceneItem()` with correct center offset
- [ ] Room AABB from walls when no room rect
- [x] `planner-3d-parity.test.ts` passes
- [ ] `data-render-evidence="ready"` in E2E
- [ ] Label distance cap in `Planner3DViewer`

### WS4 — Inspector + Review

- [ ] Single inspector panel (remove duplicate empty state)
- [ ] Edit rotation + dimensions on selection
- [x] `countMeasurementShapes()` reads Fabric objects
- [ ] Export gate matches real canvas state

### WS5 — Maintainability

- [ ] `PlannerWorkspace.tsx` ≤ 600 lines
- [ ] `COMMAND-INVENTORY.md` matches live UI
- [ ] `test:planner` < 120 s
- [ ] Phase files marked superseded in `START.md`

---

## Blockers (live)

| ID | Issue | Owner | Next action |
|---|---|---|---|
| B1 | Starter shell and layout apply are implemented; browser proof is still pending | WS2 | Verify J1 in browser and record evidence |
| B2 | AI/layout placement path is implemented; preview/apply parity is still unverified | WS2 | Verify applied furniture lands at expected coordinates |
| B3 | 3D center offset | WS3 | Fix `fabricDocumentBridge.ts` |
| B4–B6 | Canvas trust is partial; browser proof is still open | WS1 | Run draw-tool matrix in browser and verify reload/mobile behavior |
| B7–B8 | Review/inspector is still incomplete | WS4 | Merge inspector components and add editable controls |

---

## Session handover

- Date/time: 2026-06-21
- Branch/commit:
- Workstream: WS1, WS3, WS4 verification and test reconciliation
- Completed:
  - `typecheck` now passes
  - `planner-3d-parity.test.ts` passes after restoring fixture coverage
  - WS2 checklist remains complete for implemented bootstrap/layout items
- Files changed:
  - `features/planner/editor/plannerWorkspaceHooks.ts`
  - `fixtures/planner-3d-parity.json`
  - planner/integration and planner/unit test files aligned with current code
- Commands run:
  - `npm.cmd run typecheck`
  - `npm.cmd run test -- tests/unit/applySuggestedLayout.test.ts tests/unit/planner-3d-parity.test.ts tests/unit/planner-canvas-fabric-fabricSceneUtils.test.ts tests/unit/planner-editor-pure.test.ts tests/unit/planner-ai-fabric-bridges.test.ts tests/unit/planner-lib-calibrationScale.test.ts tests/unit/planner-layerCounts.test.ts tests/unit/planner-document-plannerDocumentBridge.test.ts tests/unit/planner-projectSetup.test.ts tests/integration/planner-onboarding-ProjectSetupStep.test.tsx tests/integration/planner-editor-PlannerLeftPanel.test.tsx tests/integration/planner-editor-PlannerWorkspace.test.tsx tests/integration/planner-hooks-usePlannerFabricAutosave.test.tsx tests/integration/planner-store-smallStores.test.ts`
  - `npm.cmd run test:planner`
- Evidence path:
  - Typecheck passing locally
  - `test:planner` currently 145 passed files, 3 failed files; 1088 passed tests, 6 failed tests
- Blocker:
  - Remaining planner failures are in `planner-catalog-components`, `planner-ai-fabric-bridges`, and `planner-editor-PlannerWorkspace`
- Next action:
  - Align remaining planner tests with current catalog/workspace behavior and FloorplanProvider usage
