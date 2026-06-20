# Phase 1 - Baseline and Contract

## Goal

Establish one truthful product contract and make the audit suite runnable before changing planner behavior.

## Scope

- Fresh guest entry and returning guest entry.
- Current desktop chrome defaults.
- Feature inventory and state boundaries.
- Deterministic E2E setup and independent tests.

## Prerequisites

- Development server responds at `http://localhost:3000`.
- Browser control is attached or a separate audit tab is available.
- No product behavior is changed until the current contract is recorded.

## Task checklist

- [ ] **P1-01 Fresh state:** clear only planner-owned localStorage/IndexedDB keys, load `/planner/guest/`, capture setup state, complete setup, and record resulting defaults.
- [ ] **P1-02 Returning state:** seed a named guest document, reload, and prove metadata, canvas, panels, view mode, catalog filter, and save status restore.
- [ ] **P1-03 Chrome contract:** decide expected left/right open and collapsed states, workflow step, Fabric tool, theme, view mode, zoom, grid and coach state.
- [ ] **P1-04 Command inventory:** map every visible button/menu/tab/shortcut to handler, state mutation, user feedback and existing test.
- [ ] **P1-05 Locator contract:** prefer role/name, then stable `data-*`; remove tests targeting deleted custom-rail structure.
- [ ] **P1-06 Isolation:** remove serial cascade behavior where tests do not share intentional state; each test creates and cleans its own planner state.
- [ ] **P1-07 Baseline failures:** classify left-panel, Drawing-tools and Canvas-history failures as product/test/environment issues and resolve correctly.
- [ ] **P1-08 Runtime health:** capture console, framework overlays, failed assets, save-state transitions and loading timings.
- [ ] **P1-09 Visual baseline:** capture setup, 2D workspace, open catalog, inspector, Split/3D and one mobile viewport.
- [ ] **P1-10 Coverage map:** mark each inventory row as covered, partial or missing and link it to a later phase task.

## Current contract candidates requiring decision

| Contract | Runtime observation | Old test assumption | Required decision |
|---|---|---|---|
| Left panel | Open on Blueprint | Closed | Select one intended default |
| Drawing controls | `Drawing tools` group inside `Canvas tools` toolbar | `Drawing tools` navigation | Active Fabric contract should win unless product says otherwise |
| History controls | Undo/Redo inside `Canvas tools` | `Canvas history` group | Add group semantics or update locator |
| View modes | 2D and 3D visible | 2D, Split and 3D visible | Confirm whether Split remains supported/exposed |
| Fresh content | Runtime restored 8 objects/4 walls | Empty canvas | Separate fresh and returning fixtures |
| 3D proof | Visible nonblank/WebGL ready | render evidence attributes required | Repair proof hook or change test evidence contract |

## Work

1. Attach the in-app browser and capture URL, title, first viewport, DOM snapshot, console warnings/errors, and local-storage keys.
2. Repeat with cleared planner storage and with an existing guest draft.
3. Decide and document the intended initial state for left panel, right panel, current workflow step, active tool, view mode, onboarding coach, and mobile dock.
4. Reconcile the three confirmed failures. Do not blindly change assertions: compare product intent, source defaults, and visible behavior first.
5. Remove serial-suite cascade risk. Each E2E test must create its own known storage state and must not depend on a previous test.
6. Inventory all exposed commands and map each to a handler, state mutation, feedback state, and test owner.
7. Add stable accessible names or test IDs only where semantic locators cannot be made reliable.
8. Record load timings for setup gate, Fabric readiness, catalog readiness, and first 3D render.

## Primary files

- `tests/e2e/guestProjectSetup.ts`
- `tests/e2e/planner-guest-workspace.spec.ts`
- `tests/e2e/planner-custom-tools.spec.ts`
- `tests/e2e/planner-chrome.spec.ts`
- `features/planner/editor/PlannerWorkspace.tsx`
- `features/planner/editor/PlannerChromeHost.tsx`
- `features/planner/editor/PlannerToolRail.tsx`
- `features/planner/editor/PlannerHistoryControls.tsx`

## Required tests

- Fresh guest reaches either setup or workspace deterministically.
- Returning guest reaches workspace with restored state.
- Initial panel/tool/view contract matches product intent.
- Each E2E file passes alone and in the combined suite.
- No test uses `.first()` where a stable semantic locator is available.

## Evidence

- Desktop screenshot before setup and after setup.
- DOM and console record.
- Feature-to-test coverage matrix.
- E2E report showing the three baseline blockers resolved.

## Deliverables

- Written current-state contract table with approved defaults.
- Deterministic guest setup/restore helpers.
- Updated active-workspace E2E smoke suite.
- Coverage matrix linked to Phases 2-8.
- Baseline screenshots and console report.

## Risks

- Clearing broad browser storage can invalidate unrelated tests; target planner keys only.
- Updating tests before deciding intended behavior can conceal regressions.
- Fabric canvas readiness and autosave are asynchronous; use state evidence, not fixed sleeps.

## Exit gate

All guest planner E2E tests can enter the workspace independently. No downstream phase begins while suite setup or core chrome identity is ambiguous.
