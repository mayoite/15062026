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

- [ ] Wall drag creates persisted `WALL:` object (`floorplanCanvas.ts`)
- [ ] Wheel zoom changes zoom % (`mouse:wheel` → `zoomToPointer`)
- [ ] Reload restores object count (`importDraft` + refit)
- [ ] Mobile 390×844 canvas visible (not 0×0 host)
- [ ] Measure labels use mm per `unitSystem` (fix `fabricDrawTools.ts` inches)
- [ ] Draw-tool matrix (line / rect / pen / eraser / measure) — all pass

### WS2 — Onboarding + layout apply

- [ ] `buildShellOnlyLayout()` from project metadata
- [ ] `StartingPointStep` calls bootstrap before gate opens
- [ ] `applySuggestedLayout` inserts `layout.walls`
- [ ] `applySuggestedLayout` places furniture at `x/y`
- [ ] Copy audit: no blueprint promises in UI

### WS3 — 2D↔3D contract

- [ ] `fabricObjectToSceneItem()` with correct center offset
- [ ] Room AABB from walls when no room rect
- [ ] `planner-3d-parity.test.ts` passes
- [ ] `data-render-evidence="ready"` in E2E
- [ ] Label distance cap in `Planner3DViewer`

### WS4 — Inspector + Review

- [ ] Single inspector panel (remove duplicate empty state)
- [ ] Edit rotation + dimensions on selection
- [ ] `countMeasurementShapes()` reads Fabric objects
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
| B1 | Setup shell not generated | WS2 | Wire `buildShellOnlyLayout` in `StartingPointStep` |
| B2 | AI apply ignores positions | WS2 | Fix `applySuggestedLayout.ts` furniture loop |
| B3 | 3D center offset | WS3 | Fix `fabricDocumentBridge.ts` |
| B4–B6 | Canvas trust | WS1 | Run draw-tool matrix in browser |
| B7–B8 | Review/inspector | WS4 | Merge inspector components |

---

## Session handover

- Date/time:
- Branch/commit:
- Workstream:
- Completed:
- Files changed:
- Commands run:
- Evidence path:
- Blocker:
- Next action:
