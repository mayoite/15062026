# Planner SVG + Playwright Audit

Date: 2026-06-20
Scope: planner guest entry, planner workspace reachability, planner SVG/export path

## Outcome

- SVG unit tests passed.
- Playwright runtime is working after installing Chromium.
- Planner browser flow is blocked before workspace entry, so end-to-end SVG export could not be completed in the browser.

## Evidence in this folder

- `svg-vitest.txt` — focused SVG unit-test run
- `playwright-install.txt` — Chromium install log
- `playwright-cli.txt` — Playwright spec run output
- `manual-probe.json` — manual Playwright probe result
- `raw-playwright.json` — Playwright JSON reporter output
- `screenshots/01-guest-setup.png` — guest setup before submit
- `screenshots/02-after-submit.png` — page state after submit
- `playwright-output/.../error-context.md` — failed spec context from Playwright
- `server.log` — local Next dev server log

## Verified

- `tests/planner-svg-export-colors.test.ts` passed
- `tests/planner-svg-qa.test.ts` passed
- Manual Playwright probe confirmed:
  - setup form loads
  - submit button is clickable
  - workspace top bar does not appear
  - page remains on setup flow after submit
  - resulting URL becomes `/planner/guest/?project-setup-purpose=on`

## Findings

1. Guest setup does not transition into the planner workspace.

- Browser proof: `manual-probe.json` shows `topbarVisible: false` and `setupHeadingVisibleAfterClick: true`.
- The Playwright spec fails waiting for `.pw-topbar`.
- Relevant code:
  - `features/planner/onboarding/ProjectSetupStep.tsx:63`
  - `features/planner/onboarding/ProjectSetupStep.tsx:64`
  - `features/planner/onboarding/projectSetup.ts:154`
  - `features/planner/onboarding/ProjectSetupGate.tsx:24`
  - `features/planner/onboarding/ProjectSetupGate.tsx:39`

2. SVG export still depends on live-canvas mutation during export.

- Relevant code:
  - `features/planner/canvas-fabric/hooks/floorplanCanvas.ts:1239`
  - `features/planner/canvas-fabric/hooks/floorplanCanvas.ts:1270`
  - `features/planner/canvas-fabric/hooks/floorplanCanvas.ts:1275`
- Risk:
  - export path resizes the active canvas
  - export path changes background state
  - export path injects and removes credit text on the live scene
  - this can create flicker, race conditions, and persistence contamination

3. Export bounds logic is weak and likely wrong for transformed objects.

- Relevant code:
  - `features/planner/canvas-fabric/hooks/floorplanCanvas.ts:1216`
- Risk:
  - bounding rectangle logic uses object anchors instead of transformed extents
  - top/left comparison logic is inconsistent
  - rotated or scaled objects can crop or export with wrong padding

4. Browser SVG export remains unverified because the workspace gate is currently broken.

- Export entry points exist:
  - `features/planner/editor/exportActions.ts:208`
  - `features/planner/editor/ExportModal.tsx:144`
- But the browser run cannot reach the export modal from the guest path until setup flow is fixed.

## Recommended next step

1. Fix guest setup so `ProjectSetupGate` re-renders into the workspace after submit.
2. Re-run this same Playwright folder flow and add one more artifact:
   - downloaded `workspace-plan.svg`
3. Then validate the downloaded SVG for:
   - no unresolved `var(...)`
   - no `color-mix(...)`
   - correct bounds
   - expected room and furniture nodes

## Commands used

- `npm.cmd run test -- tests/planner-svg-export-colors.test.ts tests/planner-svg-qa.test.ts`
- `npx playwright install chromium`
- `npx playwright test -c config/build/playwright.config.ts tests/planner-guest-workspace.spec.ts`
