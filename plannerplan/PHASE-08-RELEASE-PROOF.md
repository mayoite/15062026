# Phase 8 — Release Proof

## Goal

Produce repeatable evidence that the guest planner is releasable and hand it over without ambiguous claims. Every gate must pass from a clean checkout.

---

## Prerequisites (all must be true before this phase starts)

- All 7 confirmed bugs resolved with regression tests (BUG-01 through BUG-07).
- Phase 1–7 exit gates passed.
- `CHECKLIST-HANDOVER.md` bug tracking table shows all `[x]`.
- Zero known P0 or P1 issues without an explicit owner and resolution timeline.

---

## Final user journeys

Each journey must be executed with browser DevTools console open. Every warning and error must be explained or fixed. Screenshots required at each ✓ checkpoint.

**Journey 1 — Desktop fresh guest (mandatory)**
Setup ✓ → Draw room + walls + door + window ✓ → Place 3 catalog items ✓ → Inspect one item, change name ✓ → Review step (assert finding counts) ✓ → Save named session ✓ → Refresh + restore ✓ → Switch to 3D (assert render evidence) ✓ → Export PNG ✓ → Export JSON ✓

**Journey 2 — Template and sessions**
Setup ✓ → Apply template → Modify one item ✓ → Undo (assert template gone) ✓ → Save named session ✓ → Open session dialog → Load named session ✓ → Rename session ✓ → Delete session (confirm current draft unaffected) ✓

**Journey 3 — Blueprint**
Setup ✓ → Import PNG blueprint ✓ → Calibrate (assert `mmPerUnit` set) ✓ → Trace one wall ✓ → Hide blueprint ✓ → Save ✓ → Reload (assert blueprint restored with correct scale) ✓ → Export SVG (assert no blueprint data in SVG) ✓

**Journey 4 — Mobile (390×844 portrait, mandatory)**
Setup (scroll + submit visible, keyboard doesn't obscure) ✓ → Place one item via mobile dock ✓ → Select, open inspector ✓ → Save ✓ → Refresh ✓

**Journey 5 — Failure recovery (mandatory)**
Open workspace → Disable network → Place object → Re-enable network → Assert autosave recovers ✓
Simulate IndexedDB unavailable → Assert `saveStatus === 'unavailable'` shown ✓
Import invalid JSON → Assert inline error, canvas unchanged ✓
Switch to 3D with WebGL probe returning `{ ok: false }` → Assert fallback message ✓
Simulate AI timeout → Assert timeout error shown, canvas unchanged ✓

**Journey 6 — Guest-to-member migration**
Create guest data (3 objects) → Sign in as empty-member account → Assert migration copies guest data ✓
Create guest data → Sign in as occupied-member account → Assert guest data NOT overwritten ✓

---

## Task checklist

- [ ] **P8-01 Clean baseline:** record branch, full commit hash, `git status` (zero unstaged changes), Node version, browser version, OS, and test data sources. No stale `.next/` output; run `rm -rf .next` and rebuild.
- [ ] **P8-02 Targeted tests — unit/integration:** run each test file individually; confirm each passes in isolation:
  ```powershell
  npm.cmd run test -- tests/unit/floorplanCanvas.test.ts
  npm.cmd run test -- tests/unit/planner-persistence.test.ts
  npm.cmd run test -- tests/unit/planner-projectSetup.test.ts
  npm.cmd run test -- tests/unit/planner-guestToAuthMigration.test.ts
  ```
- [ ] **P8-03 Targeted tests — E2E:** run each E2E file individually:
  ```powershell
  npx.cmd playwright test -c config/build/playwright.config.ts tests/e2e/planner-guest-workspace.spec.ts
  npx.cmd playwright test -c config/build/playwright.config.ts tests/e2e/planner-custom-tools.spec.ts
  npx.cmd playwright test -c config/build/playwright.config.ts tests/e2e/planner-chrome.spec.ts
  ```
  Record pass/fail/skip counts and duration for each.
- [ ] **P8-04 Static gates:**
  ```powershell
  npm.cmd run lint        # zero errors
  npm.cmd run typecheck   # zero errors (includes lifted @ts-nocheck from BUG-06)
  ```
- [ ] **P8-05 Accessibility gate:**
  ```powershell
  npm.cmd run test:a11y
  ```
  Zero critical/serious violations. Every remaining warning documented.
- [ ] **P8-06 Production build:**
  ```powershell
  npm.cmd run build
  ```
  Build must succeed. Confirm `three` and `fabric` appear in async chunks (inspect `.next/static/chunks/`), not in the main bundle. Record total output size.
- [ ] **P8-07 Final journeys:** execute all 6 journeys in a real browser. Capture screenshot at every ✓ checkpoint. Save screenshots to `plannerplan/evidence/YYYY-MM-DD/`.
- [ ] **P8-08 Console/network review:** for each journey, attach the full DevTools console log. Every warning must have an assigned owner and a resolution decision (fix now / acceptable / track in next sprint).
- [ ] **P8-09 Artifact verification:** for every export triggered in Journeys 1–3: open the file, parse/render it, and assert content against the plan state at export time. A download event alone is not a pass.
- [ ] **P8-10 Performance/memory results:** attach the measured results from Phase 7 baselines. State whether each budget target is met or document the new agreed target.
- [ ] **P8-11 Risk register:** classify every open finding as P0/P1/P2/P3 with owner and release decision. Zero unowned blockers. Zero P0/P1 issues without a resolution.
- [ ] **P8-12 Clean checkout:** from a clean clone (or `git clean -fdx`), reproduce:
  ```powershell
  npm.cmd install
  npm.cmd run typecheck
  npm.cmd run lint
  npm.cmd run test:planner
  npm.cmd run build
  ```
  All must pass.
- [ ] **P8-13 Handover:** complete every field in `CHECKLIST-HANDOVER.md`. Name the exact next action for the next engineer. Confirm no temporary evidence files are committed to the repository.

---

## Pass/fail recording table

Fill after executing each gate. Duration is wall-clock time.

| Gate | Command / journey | Duration | Result | Evidence | Owner |
|---|---|---:|---|---|---|
| Lint | `npm.cmd run lint` | | | | |
| Typecheck | `npm.cmd run typecheck` | | | | |
| Unit tests | `npm.cmd run test:planner` | | | | |
| E2E planner-chrome | targeted | | | | |
| E2E planner-custom-tools | targeted | | | | |
| E2E planner-guest-workspace | targeted | | | | |
| Accessibility | `npm.cmd run test:a11y` | | | | |
| Build | `npm.cmd run build` | | | | |
| Journey 1 — Desktop fresh | Browser | | | | |
| Journey 2 — Template/sessions | Browser | | | | |
| Journey 3 — Blueprint | Browser | | | | |
| Journey 4 — Mobile | Browser | | | | |
| Journey 5 — Failure recovery | Browser | | | | |
| Journey 6 — Migration | Browser | | | | |
| Clean checkout gate | CI / clean env | | | | |

---

## Release rules

- No skipped critical flow without a documented blocker and explicit acceptance by the product owner.
- No flaky retry treated as a pass; reproduce and remove the cause.
- No test changes solely to hide a product regression.
- No completion claim from typecheck/build alone.
- Any P0/P1 issue blocks release. P2 requires owner and a documented decision.
- All 7 confirmed bugs must be `[x]` in `CHECKLIST-HANDOVER.md`.

---

## Exit gate

All mandatory commands pass from a clean checkout. All 6 final journeys pass in the browser. All artifacts inspected and content-verified. `CHECKLIST-HANDOVER.md` contains no unowned blocker. Every bug in the tracking table is `[x]`.
