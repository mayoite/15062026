# Failures — historical log (through 2026-06-14)

*Superseded by `docs/Failures.md` for **open** issues. Recovered from git `ba8b0f3^` after doc truncation.*

## 2026-06-14 — stale markdown cleanup (files since restored)

Four reference markdown files were deleted in `3c1acce` and **restored 2026-06-15** to `archive/` and `docs/ops/context/`:

- `archive/ARCHIVED-2026-06-12-cleanup.md`
- `archive/docs/new-pruned-2026-06-13/reference/AGENT-REVIEW-FINDINGS.md`
- `archive/docs/new-pruned-2026-06-13/reference/BRAINSTORM-IDEAS.md`
- `docs/ops/context/live-route-classification.md`

## 2026-06-14 ΓÇö product viewer `model-viewer` type/runtime blocker resolved

- Fixed the `npm.cmd run typecheck` blocker in `app/(site)/products/[category]/[product]/ProductViewer.tsx` by replacing the direct `import("@google/model-viewer")` call with a local browser-side loader helper at `lib/ui/loadModelViewer.ts`.
- The loader injects the official `model-viewer` module script from jsDelivr on demand and waits for the `model-viewer` custom element to register before marking the mobile viewer ready.
- This avoided forcing `@google/model-viewer` into `package.json`, which currently conflicts with the repo's `three@0.184.0` dependency via a peer requirement on `three@^0.183.0`.
- Verified locally:
  - `npm.cmd run typecheck` ΓÇö pass
  - `npx eslint -c config/build/eslint.config.mjs lib/ui/loadModelViewer.ts 'app/(site)/products/[category]/[product]/ProductViewer.tsx' --max-warnings=0` ΓÇö pass

## 2026-06-14 ΓÇö planner data-folder collapse

- Removed the catch-all `features/planner/data/` folder completely and relocated its live files into feature-owned folders:
  - `features/planner/catalog/` for catalog content, shape registry, managed-product adapters, and ingest helpers
  - `features/planner/templates/` for layout-template definitions
  - `features/planner/store/workspaceStore.ts` for planner workspace state
  - `features/planner/persistence/` for IndexedDB/session/draft/import/save helpers
  - `features/planner/document/` for the secondary planner document bridge used by export actions
- Updated runtime imports across planner UI, hooks, tldraw helpers, landing data, tests, and planner route helpers so no live app code points at `features/planner/data/`.
- Verified locally:
  - `Test-Path features/planner/data` -> `False`
  - `rg -n "features/planner/data|@/features/planner/data|../data/|./data/" app components features lib tests` now only finds the historical CSV fixture path inside `features/planner/catalog/ingest/csvCatalogIngest.test.ts`, which was updated in this pass.
  - `npm.cmd run typecheck` still fails only at `app/(site)/products/[category]/[product]/ProductViewer.tsx(212,17)` with `TS2307: Cannot find module '@google/model-viewer' or its corresponding type declarations.`
- Remaining planner lint blockers are pre-existing workspace issues in `PlannerWorkspace.tsx` and `usePlannerSession.ts`; this folder move did not introduce new planner lint failures.

## 2026-06-14 ΓÇö planner-owned file consolidation into `features/planner/`

- Moved planner-owned loading, onboarding, and shared draw-contract files out of generic roots and into the active planner feature tree:
  - `lib/ui/PlannerSkeleton.tsx` -> `features/planner/ui/PlannerSkeleton.tsx`
  - `lib/ui/OnboardingCoach.tsx` -> `features/planner/onboarding/OnboardingCoach.tsx`
  - `components/draw/types.ts` -> `features/planner/shared/types/planner.ts`
- Updated planner imports so the active planner runtime now resolves those files from `features/planner/` instead of `lib/` or `components/`.
- Replaced the old `components/draw/types.ts` back-reference to `plannerCatalogCore` with a direct planner shared type contract so the moved file no longer depends on a planner data module outside its new home.
- Verified locally:
  - `npx eslint -c config/build/eslint.config.mjs features/planner/ui/PlannerWorkspaceRoute.tsx features/planner/ui/PlannerCanvasEnhancements.tsx features/planner/ui/StepBar.tsx features/planner/data/plannerCatalogCore.ts features/planner/hooks/usePlannerWorkspace.ts --max-warnings=0` ΓÇö pass
  - `npm.cmd run typecheck` still fails only at `app/(site)/products/[category]/[product]/ProductViewer.tsx(212,17)` with `TS2307: Cannot find module '@google/model-viewer' or its corresponding type declarations.`

## 2026-06-14 ΓÇö planner 3D and onboarding wiring

- Wired the dormant planner 3D branch into the live workspace shell by switching `features/planner/editor/PlannerWorkspace.tsx` to render `features/planner/3d/Planner3DViewer.tsx` for the 3D/split preview branch instead of leaving the `features/planner/3d/` module unused.
- Completed the live onboarding path by removing the disabled `OnboardingTooltips` stub from `PlannerWorkspace` and marking the top-bar AI button with `data-coach="ai-advisor"` so `features/planner/onboarding/steps.ts` can spotlight the real workspace control through `features/planner/ui/PlannerCanvasEnhancements.tsx`.
- Verified locally:
  - `npm.cmd run typecheck` reaches planner code cleanly after the wiring change.
- Remaining blocker outside planner scope:
  - `npm.cmd run typecheck` still fails at `app/(site)/products/[category]/[product]/ProductViewer.tsx(212,17)` with `TS2307: Cannot find module '@google/model-viewer' or its corresponding type declarations.` The new planner wiring did not introduce that failure.

## 2026-06-14 ΓÇö planner unit/rendering pass verification

- Fixed live planner wall rendering so new walls use physical wall thickness converted into canvas units instead of treating `100mm` as `100` canvas units. The practical effect is that walls now read as drafted walls instead of thick solid blocks in the live `/planner/canvas` UI.
- Fixed the active planner measurement path to read calibration from `blueprint.mmPerUnit` for wall labels, measurement labels, room edit prompts, room/zone area math, inspector dimensions, layer details, and planner document export bounds instead of hardcoded `* 10` conversions.
- Fixed local dev runtime blockers for planner verification by adding root `tsconfig.json` alias resolution for Next dev and preventing the client catalog store from importing the server-only merged planner catalog module.
- Verified locally:
  - `npm.cmd run test:planner` ΓÇö 182/182 pass
  - `npx eslint -c config/build/eslint.config.mjs` on the touched planner files ΓÇö pass
  - `npx next dev --webpack` serves `http://localhost:3000`
  - `/planner` and `/planner/canvas` both load in the browser after the runtime fixes
- Remaining blocker outside planner scope:
  - `npm.cmd run typecheck` still fails at `app/(site)/products/[category]/[product]/ProductViewer.tsx` because `@google/model-viewer` types/module resolution are missing in this workspace. Planner work did not introduce that failure.

## 2026-06-14 ΓÇö install warnings cleaned up

- `npm install --no-audit --no-fund --loglevel=warn` now completes without peer-dependency warning spam.
- The root cause was `eslint@10.4.1` conflicting with `eslint-config-next@16.2.9`'s plugin peers, so `eslint` was pinned to `9.39.4` and `@eslint/js` to `^9.39.4`.
- `@testing-library/react` remains on `^16.3.2`, which was the registry-valid version needed to keep install working.

## 2026-06-14 ΓÇö package.json cleanup follow-up

- Updated `package.json` to match the live Next 16 / React 19 app and added the missing `test:coverage:features` script.
- Corrected `planner:render` to use the active `docs/new/` pack and removed the broken root `dev:ops` script that pointed at a non-existent folder.
- Runtime verification of `npm run` scripts was skipped because `node_modules/` is not present in this workspace snapshot.

## 2026-06-14 ΓÇö install blocker resolved

- `npm install` was failing because `@testing-library/react@^16.6.0` does not exist in the npm registry.
- The pin was corrected to `^16.3.2`, and `npm install --no-audit --no-fund` then completed successfully in this workspace.
- NPM still prints peer-dependency override warnings during install; they did not block bootstrapping.

## 2026-06-13 ΓÇö Layer manager parity increment

- **Added a compact layer manager to the live unified planner right rail.** `features/planner/editor/PlannerWorkspace.tsx` now passes the live editor into the visibility panel and mounts a new `LayerManagerPanel`, giving the planner local shape-management actions imported from the 0504 direction without replacing the current inspector shell.
- **New live planner behavior:** users can now select all canvas items, fit the current selection, lock or unlock the selection, align selected items, distribute multi-selection spacing, filter the layer list by category, search layer rows by name/detail, browse grouped layer sections for larger plans, collapse or expand each visible group, expand or collapse all visible groups at once, keep the active layer filter/search/collapsed-group state across the local session, build multi-selection directly from the layer list with Ctrl/Cmd-click and Shift-click, select an entire visible group from its header, fit a visible group to view, lock or unlock a whole visible group, read selected-vs-total counts per group, and reorder individual items front/back directly from the right-side planner panel. Layer rows also show planner-friendly labels and basic geometry detail through `features/planner/editor/layerManagerEntries.ts`.
- **Blueprint import parity improved:** `features/planner/editor/BlueprintPanel.tsx` now accepts PDF underlays as well as images, renders page 1 of uploaded PDFs through `features/planner/lib/blueprintPdf.ts`, and shows small loading/validation feedback for unsupported or oversized files. Pure import validation lives in `features/planner/editor/blueprintImport.ts`.
- **Blueprint transform controls improved:** the live blueprint panel now supports underlay scale control, quick directional nudges, centering/reset actions, and render-time scale application in `features/planner/editor/BlueprintUnderlay.tsx`. Pure transform helpers live in `features/planner/editor/blueprintTransform.ts`.
- **Multi-page PDF session support added:** the blueprint panel now keeps the currently imported PDF in local session state, exposes page navigation for multi-page PDFs, records source page metadata in workspace blueprint state, and resets blueprint calibration when switching files or pages so stale scale data does not leak across underlays.
- **Canvas-side underlay positioning added:** the blueprint panel now exposes a temporary "Move on canvas" mode, and `features/planner/editor/BlueprintMoveCapture.tsx` lets users drag the underlay directly on the planner canvas in page space without interfering with calibration mode.
- **Canvas-side underlay affordances improved:** move mode now draws a visible dashed blueprint frame, a center marker, and a scale badge on canvas so repositioning has clear feedback instead of invisible drag-only behavior.
- **Tracing workflow guidance improved:** the live canvas now shows a context-aware blueprint trace guide when an underlay is loaded and the user switches to wall or room drawing, with different cues for calibrated vs uncalibrated tracing so the blueprint workflow is connected to actual drawing mode.
- **Trace guide upgraded into a quick-action HUD:** the blueprint trace overlay now lets users calibrate, enter move mode, hide/show the underlay, and step opacity directly from the canvas while staying in wall or room mode.
- **Verified after this increment:** `npm.cmd run typecheck` Γ£à and `npm.cmd run test:planner` Γ£à (181/181).
- **Still blocked at lint for repo-wide quality gate:** `npm.cmd run lint` exits early with the same `eslint-plugin-react` crash in `react/display-name` while linting `app/(site)/backend-architecture/page.tsx`, so full lint status remains unproven by planner-only work.

## 2026-06-13 ΓÇö 0504 planner parity repair status

- **TypeScript breakage from the 0504 planner import is fixed.** Repaired the imported planner layer by restoring the live `/planner` entrypoint, adding compatibility shims for `components/draw/types`, `lib/getProducts`, and browser session user access, and merging the planner document / managed-product contracts so both the live unified planner and the imported 0504 files compile against one model.
- **Verified after repair:** `npm.cmd run typecheck` Γ£à and `npm.cmd run test:planner` Γ£à (159/159).
- **Remaining blocker:** `npm.cmd run lint` still fails before planner-specific linting begins because `eslint-plugin-react` crashes inside the `react/display-name` rule (`contextOrFilename.getFilename is not a function`) while linting site pages such as `app/(site)/access/page.tsx`. This is a tooling/config issue, not a planner rule regression proven by this batch.

## 2026-06-13 ΓÇö 0504 planner import verification failures

- **Imported `Final_oando_0504` main planner files into the live repo at the user's request.** Copied 40 unique files from `E:\Goodsites\Final_oando_0504\src\features\planner` / `src\app\planner` and overwrote 5 shared planner files with an archive snapshot saved at `archive/imports/2026-06-13-0504-main-import/`.
- **`npm.cmd run typecheck` now fails after the import.** The 0504 planner expects legacy modules and contracts that do not exist in the current flat-root app, including `@/components/draw/types`, `@/components/draw/SmartdrawPlannerShell`, `@/lib/getProducts`, and `getBrowserSessionUser` from `@/lib/supabase/client`. It also reintroduces planner document/type mismatches (`title`, `status`, `validatePlannerDocument`, `assertPlannerDocument`, `PlannerManagedProduct`) against the current canonical planner model.
- **`npm.cmd run lint` remains unverified as a planner-quality signal.** In this environment it exits early with a tooling error from `eslint-plugin-react` (`react/display-name`: `contextOrFilename.getFilename is not a function`) while linting `app/(site)/about/page.tsx`, so it did not reach planner-specific findings.
- **Rollback path is preserved.** Pre-import copies of the 5 overwritten live planner files are stored under `archive/imports/2026-06-13-0504-main-import/previous-live/features/planner/`.

## 2026-06-13 ΓÇö Verified failures found and fixed (cloud agent)

- **Planner crashed on furniture placement / reload (core flow).** `features/planner/editor/layerVisibility.ts` wrote `layerWasLocked: undefined` into tldraw shape `meta`, which is not JSON-serializable. Once any layered shape (e.g. furniture) existed, `applyLayerVisibility` threw `ValidationError: At shape(type = planner-furniture).meta: Expected json serializable value, got undefined` and crashed the canvas (cascade of `AtomMap: key [object Object] not found`). Introduced by merged commit `c676bd6`. **Fixed**: omit the key instead of nulling it; extracted pure `nextLayerVisibilityUpdate` + added `tests/planner/layerVisibility.test.ts`. Verified in Chromium: place 5 furniture ΓåÆ reload ΓåÆ no error, furniture restored.
- **`getPlannerProjectId` regression + contradictory tests.** Returned the raw `planId` for all modes, contradicting the documented design (guest keeps guest key; member `?id=` scopes the member key). Two test files asserted opposite results, so the suite could not be green. **Fixed** the function, threaded `planId` through `PlannerWorkspaceRoute ΓåÆ UnifiedPlannerPage ΓåÆ PlannerWorkspace`, made `/planner/canvas` read `searchParams.id`, removed contradictory assertions, rebuilt `tests/unit/plannerAutosaveIdentity.test.tsx`. Verified at runtime: guest at `?id=plan-A` still autosaves under `planner-guest-local`.

## 2026-06-13 ΓÇö Stale claims corrected

- `npm run lint` now **passes** here (the `state`-dir arg was dropped on `main`); the older "36 errors block release:gate" note below is stale.
- `npm run dev` (Turbopack) panics on `app/(site)/css/index.css` `@source "../../../../../packages"` at `/workspace`; use `npx next dev --webpack`. See `AGENTS.md`.
- `npm run build` / `release:gate` were NOT verified: they require Supabase env vars (eager init in `platform/drizzle/db.ts`). Not available in this environment.

## 2026-06-13 ΓÇö Known issues NOT yet fixed (out of scope)

- `?id=` has no producer and does not hydrate a cloud plan; `/api/plans` (structured geometry) and the canvas (tldraw snapshot) are two divergent data models.
- Cosmetic: furniture renders an overlapping long product-name label; restored shapes appear smaller after reload.

## Open ΓÇö dual planner / consolidation

| Item | Status | Notes |
|---|---|---|
| Legacy route trees | **Archived** | `app/buddy-planner/*`, `app/oando-planner/*` removed 2026-06-12; 301s in `config/build/next.config.js`; mirrors in `archive/app/`. |
| `features/oando-planner/` shims | **Archived** | Shim re-exports moved to `archive/features/oando-planner/shim-exports-2026-06-12/`; canonical `@/features/planner`. |
| `features/buddy-planner/` shims | **Archived** | Shim re-exports moved to `archive/features/buddy-planner/shim-exports-2026-06-12/`. |
| `features/planner-shared/` shims | **Archived** | Re-exports moved to `archive/features/planner-shared/`; canonical `@/features/planner/shared`. |
| `/oando-planner/shared` | **Fixed** | Now redirects to `/planner/canvas/` (was live Smartdraw shell). |
| Choose-product two-card UX | **Fixed** | Single unified planner entry; uses `PRODUCT_SUITE.planner`. |
| Portal page | **Stub** | `PortalPageView` = "coming soon"; plans/saves not wired to unified canvas. |
| Retired planner orphans | **Archived** | `archive/features/planner/retired-2026-06-12/` (BuddyViewer, EmptyCanvasState, duplicate advisors, etc.). |
| `plannerIdentity` tests | **May drift** | Model updated to `/planner/*`; archive tests may still expect legacy paths. |

## Open ΓÇö alignment / polish

| Item | Status | Notes |
|---|---|---|
| Site typography sweep | **Partial** | Marketing pages tokenized (`section-y`, `typ-*`, route CSS); catalog `FilterGrid.tsx` still 2,613 lines + `neutral-*` hardcoding ΓÇö follow-up split required. |
| Editor chrome tokens | **Pending** | Legacy nemotron drift removed with buddy archive; canvas UI token pass still open. |
| Catalog finesse | **Pending** | Flat ingest list; no taxonomy UX. |
| `PlannerDocument` bridge | **Partial** | `buildPlannerDocumentFromEditor` embeds tldraw snapshot + workspace; per-shape schema mapping still open. |
| SVG visual QA | **Automated** | `npm run test:planner` ΓåÆ `svg-qa.test.ts` (105+ items); sheet `results/actual_engine_blocks.svg` via `catalog:blocks:qa` |
| GuestΓåÆauth migration | **IndexedDB claim done** | `migrateGuestProjectToMember()` + `guestToAuthMigration.test.ts`; server `planner_saves` path still open |
| Drizzle `plans` table | **Bootstrapped** | Legacy DB had `profiles` but no `plans`; `npm run db:ensure-plans` applied 2026-06-12 |
| `npm run lint` | **Fail** | 36 errors block `release:gate` (M6) |
| Visual snap indicators | **Done** | `SnapIndicatorOverlay` on wall/room/door/zone tools |
| Quality ledger ΓëÑ 4.0 | **Not run** | Historical ledger is archived at `archive/docs/plans/remaining-2026-06-13/03-PLANNER-QUALITY-LEDGER.md`; current ledger is `docs/new/quality-evidence/03-QUALITY-LEDGER.md`. |

## Deployment check (2026-06-12)

| Item | Status | Notes |
|---|---|---|
| `npm run typecheck` | **Pass** | Re-verified during deployment prep |
| `npm run lint` | **Pass** | 0 errors, 0 warnings |
| `npm run build` | **Pass** | 176 static pages; Next.js 16.2.9 Turbopack |
| `npm run test:planner` | **Pass** | 145/145 (12 files) |
| `npm run test:a11y` | **Pass** | 1/1 |
| `npm run test:e2e:nav` | **Pass** | 5/5 (after hero fallback fix) |
| `npm run test:planner-catalog` | **Pass** | 7/7 |
| `npm run launch:env` | **Pass** | All required public + server env vars present locally |
| `npm run db:test` | **Pass** | `plans` + `profiles` reachable |
| `npm run audit:hosted:runtime` | **Pass** | `workingoando.vercel.app` routes 200; `_next/image` optimizer 404 on one sample (non-blocking) |
| Missing `hero-1.webp` fallback | **Fixed** | Replaced with `DEFAULT_HERO_FALLBACK` ΓåÆ `dmrc-hero.webp` in 5 call sites |
| `npm run lint:secrets` | **Pass** | Full-repo scan ~12 min locally; exit 0, no findings |
| Concurrent `next build` lock | **Env** | Multiple agents/processes can leave `.next/lock`; clear before local E2E if webServer fails |

## Skipped this batch

- Deleting `app/buddy-planner/` and `app/oando-planner/` route folders (redirect shells kept for bookmarks).
- Moving `features/oando-planner/` admin/export into `features/planner/` (large refactor; out of scope).
- Full portal implementation.
- Full `npm run release:gate` ΓÇö blocked at lint (36 planner errors); typecheck/build/tests pass.
- Multi-viewport homepage screenshot matrix (single full-page capture at `results/home-stop-7.png`).

## Homepage recovery (2026-06-12)

| Item | Status | Notes |
|---|---|---|
| Phase A restore from `main` | **Done** | Commit `b99a4a0` on `recovery/from-transcript` |
| Phase B homepage redesign | **Done** | Branch `homepage-v2`; all STOPs 0ΓÇô7 complete |
| Hero carousel ghosting | **Fixed** | Removed duplicate static fallback layer |
| Contact heading split | **Fixed** | `ContactTeaser` uses `home-heading` with lead + accent |
| Responsive screenshots | **Done** | `results/responsive/home-*.png` |
| Dev hydration overlay on `/` | **Open** | Next.js dev overlay at `app/(site)/layout.tsx`; verify on prod build |
| `npm run release:gate` | **Skipped** | Pre-existing planner workspace TS errors on recovery branch |
