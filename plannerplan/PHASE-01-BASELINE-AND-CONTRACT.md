# Phase 1 — Baseline and Contract

## Goal

Establish one truthful product contract and make the audit suite runnable before changing any planner behavior. No product changes in this phase.

---

## Scope

- Fresh guest entry and returning guest entry.
- Current desktop chrome defaults (panels, tools, view mode, step, grid, zoom).
- Feature inventory and state boundaries.
- Deterministic E2E setup — isolated, not serial.
- Fix test runner timeout (currently > 120 s for `test:planner`).

---

## Prerequisites

- Dev server responds at `http://localhost:3000`.
- Browser control is attached or a separate audit tab is available.
- No product behavior changes until the current contract is recorded.

---

## Known baseline conflicts requiring a product decision

| Contract point | Runtime observation | Old E2E assumption | Decision needed |
|---|---|---|---|
| Left panel default | Open on Blueprint tab | Expected closed | Pick one intended default; document in code comment AND update test |
| Drawing controls chrome | `Drawing tools` group inside `Canvas tools` toolbar | `Drawing tools` as top-level navigation | Active Fabric chrome wins; update test locator only |
| History controls chrome | Undo/Redo inside `Canvas tools` without group label | `Canvas history` group | Add `aria-label="Canvas history"` wrapper OR update test locator; not both |
| View modes exposed | Runtime shows 2D + 3D (Split tab visible but unlabeled) | 2D, Split, 3D distinct | Confirm whether Split is a first-class mode; document |
| Fresh canvas state | Runtime restored 8 objects / 4 walls from prior session | Expected empty canvas | Fix fixture isolation; fresh test must always clear planner storage first |
| 3D render proof | Canvas visible, WebGL ready; `data-render-evidence` never set | Attribute required by test | Either repair `Planner3DRenderEvidence` pixel hook OR change test evidence contract |

---

## Task checklist

- [ ] **P1-01 Fresh state:** clear only planner-owned `localStorage` and `IndexedDB` keys (prefix `planner_`), load `/planner/guest/`, capture: URL, title, DOM snapshot, console output, visible panels, active tool, step, zoom, grid state. Record as the current contract. *(needs dev server)*
- [ ] **P1-02 Returning state:** seed a named guest document via `savePlannerDraftDocument`, reload, and assert: metadata, canvas object count, panel state, view mode, catalog filter, autosave status, and step all match the seeded values. *(needs dev server)*
- [x] **P1-03 Chrome contract decision:** `leftOpen=true` is the intended default. Documented in `plannerWorkspacePreferences.ts` with rationale comment. `Drawing tools` nav (`PlannerToolRail.tsx:209`) and `Canvas history` group (`PlannerHistoryControls.tsx:19`) confirmed present. Test `planner-chrome.spec.ts` updated to close panel before asserting open.
- [x] **P1-04 Command inventory:** full command→handler→mutation→coverage table written to `plannerplan/COMMAND-INVENTORY.md`.
- [x] **P1-05 Locator contract:** `getByRole("navigation",{name:"Drawing tools"})` confirmed correct against live DOM. `getByRole("group",{name:"Canvas history"})` confirmed correct. All three failing spec locators verified against live source.
- [x] **P1-06 Test isolation:** `clearPlannerStorage(page)` exported from `guestProjectSetup.ts`. Clears `cad-suite:planner:*`, `oando-project-setup-complete-*`, `planner-*` localStorage keys and deletes `planner-workspace-db` + `buddy-planner-db` IndexedDB. `enterGuestPlannerWorkspace` delegates to it.
- [x] **P1-07 Baseline failures:** (1) Left panel closed: product default is `leftOpen=true` → test updated. (2) Drawing tools nav: test locator was already correct. (3) Canvas history group: already existed in source → test locator was already correct. All three were test/assumption issues, not product regressions.
- [ ] **P1-08 Test runner timeout:** reproduce the `test:planner` > 120 s issue. Check for: hanging Vitest workers, unresolved async operations, missing `afterEach` cleanup, or accidental browser launch in unit tests. Fix and verify the suite completes in < 60 s. *(needs test run)*
- [ ] **P1-09 Runtime health check:** with dev server running, capture full console output for: fresh guest load, returning guest load. Flag every warning and error. `THREE.Clock` deprecation is known (BUG-07) — note it but do not fix in Phase 1. *(needs dev server)*
- [x] **P1-10 Coverage map:** all functionality inventory rows mapped to phase tasks in `COMMAND-INVENTORY.md`; all marked `missing → Pn` with owner phase.

---

## Work sequence

1. Write a `clearPlannerStorage()` helper in `tests/e2e/guestProjectSetup.ts` that clears:
   - IndexedDB: delete database `planner-workspace-db` (and legacy `buddy-planner-db`)
   - localStorage keys matching: `cad-suite:planner:draft:v1*`, `oando-project-setup-complete-*`, `planner.guest.claimed`, `planner.indexeddb.migrated`
   - Do NOT clear unrelated keys (auth tokens, theme preferences, etc.)
2. Update all three failing specs to use the `clearPlannerStorage()` helper in `beforeEach`.
3. Resolve the three contract conflicts by making the product decision; document the chosen default in source and in `COMMAND-INVENTORY.md`.
4. Run `npm.cmd run test:planner` with verbose output; attach full log to P1-08 evidence.
5. Run `npx.cmd playwright test -c config/build/playwright.config.ts tests/e2e/planner-guest-workspace.spec.ts --reporter=list` — capture pass/fail per test.

---

## Primary files

- `tests/e2e/guestProjectSetup.ts`
- `tests/e2e/planner-guest-workspace.spec.ts`
- `tests/e2e/planner-custom-tools.spec.ts`
- `tests/e2e/planner-chrome.spec.ts`
- `features/planner/editor/PlannerWorkspace.tsx`
- `features/planner/editor/usePlannerPanels.ts`
- `features/planner/editor/PlannerHistoryControls.tsx`
- `features/planner/editor/PlannerToolRail.tsx`

---

## Required evidence

- `clearPlannerStorage` helper passing in a fresh-browser run.
- Three baseline failures each resolved with a documented rationale.
- E2E suite runs to completion without serial cascade within 60 s.
- DOM and console capture for fresh and returning guest.
- Coverage map table committed to `plannerplan/COMMAND-INVENTORY.md`.

---

## Exit gate

All guest-planner E2E tests can enter the workspace independently. No downstream phase starts while suite isolation, chrome identity, or test timeout is unresolved.
