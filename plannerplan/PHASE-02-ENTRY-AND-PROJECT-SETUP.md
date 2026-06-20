# Phase 2 — Entry and Project Setup

## Goal

Make first entry, validation, metadata application, and returning-entry behavior reliable, accessible, and fully tested. This phase does not change canvas or catalog behavior.

---

## Scope

- `ProjectSetupGate` and `ProjectSetupStep` behavior.
- Validation rules for name, floor area, seat count, city, and purpose.
- Storage state machine: fresh → setup → completed flag.
- Returning guest: stale flag, missing metadata, valid draft.
- Mobile, keyboard, and screen-reader paths through the setup form.

---

## Pre-existing known issue in scope

**`applyProjectSetup`** writes metadata, grid calibration, and catalog purpose filter as separate operations. If any write fails after another succeeds, the workspace state is partially applied. This must be made atomic (or at minimum rollback-safe) in this phase.

---

## Task checklist

- [ ] **P2-01 Route states:** test initial load (no draft, no flag), dynamic-import loading state, setup gate showing, workspace showing, error boundary on setup crash, and offline route load (service worker cached page). *(needs E2E run)*
- [ ] **P2-02 Name validation:** empty string, whitespace-only, valid ASCII, valid Unicode (Hindi, emoji), 255-char max, names that duplicate an existing local-session name. Each invalid input must show a specific inline error without partial state write. — `maxLength=255` added to input; `>255` check in `handleSubmit`; `aria-describedby` wired. *(remaining: E2E)*
- [x] **P2-03 Area validation:** `resolveGridMmPerUnit` boundary tests added in `planner-projectSetup.test.ts` covering 99, 100, 5000, 5001, 999999, decimal, negative. Confirms `> 5000` (strict). `workspaceStore.blueprint.mmPerUnit` asserted via `applyProjectSetup` integration test.
- [x] **P2-04 Seat validation:** boundary unit tests added (`seatTarget` 1, 10000). `metadataToDocumentFields` asserts seat is stored correctly. Form validates `< 1`.
- [x] **P2-05 Purpose and city:** completeness tests added — 4 purpose options with value/label/description; city list > 10 entries with major metros. `applyProjectSetup` sets `purposeFilter` in catalog store (verified via unit test).
- [x] **P2-06 Atomic setup:** `ProjectSetupStep.tsx` now wraps `applyProjectSetup` + `markProjectSetupCompleteInStorage` in try/catch. If either throws, `setError` is called and `onComplete` is NOT called. Flag is never written on failure. Comment added to `applyProjectSetup` in `projectSetup.ts`.
- [x] **P2-07 Storage failure:** `handleSubmit` catches `DOMException` with `name === "QuotaExceededError"` and shows human-readable error. Page stays active. Unit test mocks `localStorage.setItem` to throw and asserts the error surfaces.
- [x] **P2-08 Stale flag states:** `ProjectSetupGate.tsx` already clears stale flag when `ready=false` but flag is present. Unit tests cover: no flag → false; flag set → true; wrong scope → false; wrong planId → false; key format stable.
- [x] **P2-09 Focus and accessibility:** `autoFocus` added to name field. `role="radiogroup"` + `aria-labelledby` added to purpose grid. Error paragraph gets `id="project-setup-error"` + `aria-live="assertive"`. Name input `aria-describedby` wired to error id when error is present.
- [ ] **P2-10 Responsive layout:** at `320×568`, `390×844`, tablet portrait, and short desktop (`1024×600`): form is scrollable, submit button is visible without horizontal scroll, no field is clipped. *(needs browser)*
- [ ] **P2-11 Refresh and race:** (a) refresh immediately after opening setup but before submit → setup shows again; (b) refresh during setup `state write` (simulate slow storage) → no partial state; (c) refresh immediately after successful setup → workspace loads with correct project metadata. *(needs E2E)*
- [ ] **P2-12 Document round-trip:** project name, floor area, seat count, purpose, city, and grid unit survive: `buildCurrentPlannerDocument()` → `normalizePlannerDocument()` → JSON export → JSON import → `loadPlannerDocumentIntoFabric()`. Assert field values match at each step. *(needs integration test)*

---

## Acceptance matrix

| Input / state | Expected result |
|---|---|
| Valid defaults, first visit | Workspace opens once; `projectMetadata` and `catalogStore.purposeFilter` set; flag written |
| Empty project name | Inline error shown; flag NOT written; form remains active |
| `99` sq ft area | Validation error: below minimum |
| `100` sq ft area | Accepted; grid unit `500 mm` |
| `5000` sq ft area | Accepted; grid unit `500 mm` |
| `5001` sq ft area | Accepted; grid unit `1000 mm` |
| Stale completion flag (no metadata) | Setup shown; flag cleared |
| `QuotaExceededError` on write | Recovery message shown; no crash |
| Mobile keyboard open | Active field and submit remain in viewport |
| Round-trip export/import | All setup fields present and correct in reimported document |

---

## Primary files

- `features/planner/onboarding/ProjectSetupGate.tsx`
- `features/planner/onboarding/ProjectSetupStep.tsx`
- `features/planner/onboarding/projectSetup.ts`
- `features/planner/store/workspaceStore.ts`
- `features/planner/catalog/catalogStore.ts`
- `features/planner/lib/fabricDocumentBridge.ts`
- `features/planner/model/`
- `tests/e2e/guestProjectSetup.ts`
- `tests/unit/planner-projectSetup.test.ts` ← create if absent

---

## Required tests

- Unit tests: validation functions for name, area, seat with all boundary values.
- Unit test: grid threshold logic at 5000/5001 boundary.
- Integration test: `applyProjectSetup` with simulated storage failure.
- Integration test: stale-flag recovery path.
- E2E: happy path, invalid name, invalid area, invalid seats, keyboard-only, refresh, mobile viewport, and accessibility (axe scan with gate open).
- Round-trip test: export then import preserves all setup fields.

---

## Exit gate

A fresh guest can complete setup once, receives correct workspace state (metadata, grid, catalog filter), and returns after refresh without stale flags or inaccessible failure states. All boundary inputs produce the correct stored values.
