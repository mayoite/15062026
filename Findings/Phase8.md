# Phase 8: Final Validation

## Goal

Run every quality gate: typecheck, lint, tests, build, and manual smoke test. This is the final checkpoint before the work is considered complete. No code changes happen in this phase — only verification and documentation.

## Estimated Time

2–3 hours

## Prerequisites

All phases 1–7 must be complete.

## Tasks

### 8.1 Automated gates

Run these commands in order. If any fails, stop and document the failure in `11-Handover.md`. Do not proceed to the next gate until the current one passes.

| Order | Command | Must Exit | Action if Fail |
|-------|---------|-----------|----------------|
| 1 | `npm run typecheck` | 0 | Fix TypeScript errors, re-run |
| 2 | `npm run lint` | 0 | Fix lint errors, re-run |
| 3 | `npm run test` | 0 | Fix test failures, re-run |
| 4 | `npm run test:planner` | 0 | Fix planner-specific failures, re-run |
| 5 | `npm run test -- --coverage` | 0 (tests pass) | Check coverage report, add tests if below target |
| 6 | `npm run build` | 0 | Fix build errors (Next.js, R3F SSR, dynamic imports), re-run |

**Coverage targets (from Phase 7):**
- Lines: ≥ 85% of baseline (record exact number in results)
- Functions: ≥ 80%
- Branches: ≥ 75%

### 8.2 Manual smoke test

Open `/planner/canvas` in a browser and walk through this checklist. Record any failures in `11-Handover.md`.

#### 2D Canvas
- [ ] Page loads without console errors (ignore warnings)
- [ ] Grid is visible (toggle with `g` key)
- [ ] Can draw walls (select wall tool, click and drag)
- [ ] Can place furniture from catalog (click or drag)
- [ ] Can select, move, and delete objects
- [ ] Undo/redo works (Ctrl+Z / Ctrl+Shift+Z)
- [ ] Zoom in/out works (mouse wheel or buttons)

#### 3D View
- [ ] Switch to 3D view — scene loads
- [ ] Orbit camera — drag to rotate
- [ ] Walk mode — click Walk button, click canvas, WASD moves camera
- [ ] WebGL fallback — disable WebGL in devtools, fallback message appears
- [ ] Empty scene warning — with no items, warning panel shows
- [ ] Item labels — readable, styled, not clipped
- [ ] Dark mode — toggle theme, 3D background and overlays adapt

#### Split View
- [ ] Switch to Split view — 2D canvas and 3D viewer side-by-side
- [ ] Both panes are interactive
- [ ] Resizing the window does not break layout

#### Templates
- [ ] Open template picker (Templates button in top bar)
- [ ] Select a template (e.g., "Cabin")
- [ ] Click Apply — walls/room appear on canvas
- [ ] Close modal, furniture can be placed inside the new room

#### Blueprint
- [ ] Open Blueprint panel (left panel tab)
- [ ] Upload an image
- [ ] Draw calibration line, enter real dimension (e.g., 5000 mm)
- [ ] Place furniture — size matches real-world scale

#### AI Assistant
- [ ] Open AI drawer (AI button in top bar)
- [ ] Type a request (e.g., "Arrange 6 desks in this room")
- [ ] Suggestions appear, click Apply — furniture placed

#### Save/Load/Export
- [ ] Save local draft — status indicator shows "Saved"
- [ ] Reload page — draft restores
- [ ] Export JSON — file downloads
- [ ] Export PNG — file downloads (requires room shell)
- [ ] Export SVG — file downloads (requires room shell)

#### Mobile / Responsive
- [ ] Resize window to < 768px width
- [ ] Mobile dock appears at bottom
- [ ] Can open left panel via dock button
- [ ] Can open right panel via dock button
- [ ] Canvas is still usable (touch events)

#### Accessibility
- [ ] Tab navigation works through top bar buttons
- [ ] Skip-to-main-content link is visible on Tab
- [ ] Camera mode buttons have `aria-pressed` state
- [ ] No `aria-hidden` traps detected

### 8.3 Document results

Write the exact results into `11-Handover.md`:

- Which gates passed
- Which gates failed (with error messages)
- Which smoke tests passed
- Which smoke tests failed (with screenshots if possible)
- Coverage numbers (lines, functions, branches)
- Build time and output size (from `next build` output)
- Any remaining blockers for production

### 8.4 Archive this plan

When all gates pass and smoke tests are clean, this plan is complete. The `11-Handover.md` should say:

```
Status: COMPLETE
Date: [today]
All phases 1–8 finished. All gates passed. No blockers.
```

## Verification Checklist

- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run test` exits 0 with 0 failed tests
- [ ] `npm run test:planner` exits 0
- [ ] `npm run test -- --coverage` meets target thresholds
- [ ] `npm run build` completes successfully
- [ ] 2D canvas smoke test passed (draw, place, select, undo, zoom)
- [ ] 3D view smoke test passed (orbit, walk, fallback, labels, dark mode)
- [ ] Split view smoke test passed
- [ ] Template smoke test passed
- [ ] Blueprint smoke test passed
- [ ] AI assistant smoke test passed
- [ ] Save/load/export smoke test passed
- [ ] Mobile/responsive smoke test passed
- [ ] Accessibility smoke test passed
- [ ] `11-Handover.md` updated with complete results

## What This Means

If every item in the verification checklist is checked, the Option C reconciliation is complete. The codebase has:
- One canonical `PlannerDocument`
- One 3D viewer (`Planner3DViewer`)
- One persistence barrel
- Zero tldraw residue
- All features wired (templates, blueprint, AI)
- Clean tests, stable build, and passing quality gates

Ship it.