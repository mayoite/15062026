# Phase 2 - Entry and Project Setup

## Goal

Make first entry, validation, metadata application, and returning-entry behavior reliable and accessible.

## Functional audit

- Default guest values and fresh member values.
- Project name trimming, empty name, Unicode, long text, and duplicate names.
- Floor area boundaries: empty, non-number, 99, 100, 5000, 5001, very large, decimal, negative.
- Seat count boundaries: empty, 0, 1, decimal, negative, unrealistic large value.
- Every city and primary-purpose option.
- Keyboard-only completion, radio focus visibility, submit state, and error announcement.
- Small-height and mobile scrolling; no inaccessible fields below the fold.
- Refresh during setup and refresh immediately after completion.

## Task checklist

- [ ] **P2-01 Route states:** test initial load, dynamic import loading, setup gate, workspace, error boundary and offline route load.
- [ ] **P2-02 Name validation:** empty, whitespace, Unicode, punctuation, long input and duplicate local-session names.
- [ ] **P2-03 Area validation:** empty, NaN, 99, 100, 5000, 5001, decimals, negative and maximum supported value.
- [ ] **P2-04 Seat validation:** empty, 0, 1, decimals, negative and maximum supported value.
- [ ] **P2-05 Purpose/city:** verify all options are selectable and persist exactly.
- [ ] **P2-06 Atomic setup:** metadata, blueprint scale and catalog purpose must update together or not at all.
- [ ] **P2-07 Storage failure:** simulate localStorage denial/quota and verify a recoverable message.
- [ ] **P2-08 Stale flag:** completion flag without metadata must return to setup; metadata without flag must follow the documented policy.
- [ ] **P2-09 Focus/accessibility:** initial focus, keyboard order, radio semantics, alert announcement, submit focus and no trap.
- [ ] **P2-10 Responsive:** 320x568, 390x844, tablet and short desktop; form remains scrollable and submit visible.
- [ ] **P2-11 Refresh/race:** refresh before submit, during state write and immediately after entry.
- [ ] **P2-12 Document round-trip:** setup fields survive save, reload, import and export.

## Acceptance matrix

| Input/state | Expected result |
|---|---|
| Valid defaults | Workspace opens once and saves metadata |
| Invalid field | Specific inline/announced error; no partial state |
| 5000 sq ft | 500 mm grid unit |
| 5001 sq ft | 1000 mm grid unit |
| Stale completion flag | Setup is shown; flag is repaired |
| Storage unavailable | User receives recovery path; page does not crash |
| Mobile keyboard open | Active field and submit remain reachable |

## Implementation checks

1. Verify `applyProjectSetup` updates metadata, grid calibration, and purpose filter atomically.
2. Verify `1000` versus `500` mm grid behavior at the 5000 sq-ft boundary.
3. Confirm the scoped completion flag cannot bypass missing metadata.
4. Ensure storage exceptions do not trap the user or lose an otherwise valid setup.
5. Ensure setup metadata is serialized into the planner document and restored with a draft.
6. Add explicit maximums and help text where unrestricted numeric input could create unusable geometry.
7. Confirm submit feedback is visible and duplicate submission cannot occur.
8. Verify the setup dialog has correct dialog semantics, focus entry, focus containment, and error focus.

## Primary files

- `features/planner/onboarding/ProjectSetupGate.tsx`
- `features/planner/onboarding/ProjectSetupStep.tsx`
- `features/planner/onboarding/projectSetup.ts`
- `features/planner/store/workspaceStore.ts`
- `features/planner/catalog/catalogStore.ts`
- `tests/e2e/guestProjectSetup.ts`

## Required tests

- Unit tests for validation and grid threshold.
- Integration tests for store/catalog changes and document round-trip.
- E2E happy path plus invalid name, invalid area, invalid seats, keyboard completion, refresh, and mobile viewport.
- Axe scan with the setup gate open.

## Exit gate

A fresh guest can complete setup once, receives correct planner state, and returns after refresh without stale flags or inaccessible failure states.

## Deliverables

- Central tested setup validation rules.
- Setup integration tests and browser matrix.
- Documented storage-key/state transition diagram.
- Accessibility evidence for setup success and error states.
