# Phase 8 - Release Proof

## Goal

Produce repeatable evidence that the guest planner is releasable and hand it over without ambiguous claims.

## Final user journeys

1. Fresh desktop guest: setup -> draw room/walls/openings -> place/search furniture -> inspect/edit -> review -> save -> refresh -> 3D -> export.
2. Template journey: setup -> apply template -> modify -> undo/redo -> save named session -> reload.
3. Blueprint journey: import -> calibrate -> trace/place -> hide/show -> save -> reload -> export.
4. Mobile journey: setup -> create/place/select -> mobile panels -> save -> refresh.
5. Failure journey: offline/storage denial/WebGL unavailable/AI failure/invalid import -> clear recovery with plan intact.
6. Guest conversion journey: create guest data -> sign in -> migration policy executes once without overwriting member data.

## Task checklist

- [ ] **P8-01 Clean baseline:** record branch, commit, worktree status, environment and test data.
- [ ] **P8-02 Targeted tests:** run each phase-owned unit/integration/E2E group separately and fix flakes.
- [ ] **P8-03 Static gates:** lint and typecheck with zero warnings/errors.
- [ ] **P8-04 Build:** production build succeeds without relying on stale output.
- [ ] **P8-05 Final journeys:** run all six journeys on desktop and required mobile states.
- [ ] **P8-06 Console/network:** capture errors, warnings, failed requests and asset failures for every journey.
- [ ] **P8-07 Artifacts:** open and verify every exported file used in sign-off.
- [ ] **P8-08 Accessibility:** final axe and keyboard checks on mandatory states.
- [ ] **P8-09 Performance/memory:** attach measured results and budget decision.
- [ ] **P8-10 Risk review:** classify every open finding P0-P3 with owner and release decision.
- [ ] **P8-11 Clean checkout:** reproduce mandatory gates from a clean checkout/environment.
- [ ] **P8-12 Handover:** complete every field in `CHECKLIST-HANDOVER.md` and name the exact next action.

## Gate commands

Run individually first, then as one release sequence:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:planner
npx.cmd playwright test -c config/build/playwright.config.ts tests/e2e/planner-guest-workspace.spec.ts
npx.cmd playwright test -c config/build/playwright.config.ts tests/e2e/planner-custom-tools.spec.ts
npx.cmd playwright test -c config/build/playwright.config.ts tests/e2e/planner-chrome.spec.ts
npm.cmd run test:a11y
npm.cmd run build
```

Run the full `npm.cmd run release:gate` only after targeted failures are zero.

## Evidence pack

- Test command, timestamp, duration, exit code, pass/fail/skip counts.
- Browser version, viewport, operating system, and test data state.
- Screenshots for every final journey and important error state.
- Console log review with every warning explained or fixed.
- Export artifacts opened and validated.
- Performance and memory results against agreed budgets.
- Known-risk register with owner and release decision.

## Pass/fail recording table

| Gate | Command/journey | Duration | Result | Evidence | Owner |
|---|---|---:|---|---|---|
| Lint | `npm.cmd run lint` | | | | |
| Typecheck | `npm.cmd run typecheck` | | | | |
| Planner tests | `npm.cmd run test:planner` | | | | |
| Planner E2E | targeted files | | | | |
| Accessibility | `npm.cmd run test:a11y` | | | | |
| Build | `npm.cmd run build` | | | | |
| Desktop journey | Journey 1 | | | | |
| Mobile journey | Journey 4 | | | | |
| Failure journey | Journey 5 | | | | |
| Migration journey | Journey 6 | | | | |

## Release rules

- No skipped critical flow without a documented blocker and explicit acceptance.
- No flaky retry treated as a pass; reproduce and remove the cause.
- No test changes solely to hide a product regression.
- No completion claim from typecheck/build alone.
- Any P0/P1 issue blocks release. P2 requires an explicit owner and decision.

## Exit gate

All mandatory commands pass from a clean checkout, final journeys pass in the browser, artifacts are inspected, and `CHECKLIST-HANDOVER.md` contains no unowned blocker.
