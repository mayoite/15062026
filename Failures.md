# Failures, Blockers, and Follow-ups

This file documents critical blockers, failed parameters, and required follow-ups identified during repository audits.

## Live Blockers & Failures

### Lane 2 startup performance (2026-06-23)
- **Status:** `[!] Skipped per user instruction`
- **Reason:** User explicitly instructed to skip Lane 2 and execute Lane 3 instead
- **Action:** Lane 2 (startup performance) to be executed after Lane 3 is complete, if required

### Lane 3 state/persistence/offline sync pass (2026-06-23)
- **Status:** `[~] Source-verified only`
- **Files:** `features/planner/store/offlineStorage.ts`, `features/planner/store/syncQueueProcessor.ts`, `features/planner/persistence/cloudPlanHydration.ts`, `features/planner/hooks/usePlannerFabricAutosave.ts`
- **Changes implemented:**
  - Added canonical state envelope: schemaVersion, source (local|cloud|queue|recovered), contentHash (SHA256), remoteRevision, localSaveState, syncState, syncErrorCode
  - Implemented queue dedup/compaction: rapid edits to same plan are replaced (not duplicated) if same contentHash, or compacted to newest if different
  - Implemented deterministic hydration in cloudPlanHydration.ts: chooses newest valid state by updatedAt, uses contentHash/remoteRevision as conflict evidence
  - Implemented explicit conflict handling: detects content divergence and surfaces conflict state instead of silent overwrite
  - Updated usePlannerFabricAutosave to export envelopeStatus type and return envelope status for truthful UI states (localSaveState, syncState)
  - Updated sync queue processor to track plan syncState and update on success/failure
- **Proof gaps:** Source-level changes only; no tests, lint, or Playwright verification performed per AGENTS.md rules
- **Action:** Run Lane 3 permission-gated tests when user approves (tests/unit/planner-state-envelope.test.ts, tests/unit/planner-autosave-local-first.test.ts, tests/unit/planner-hydration-precedence.test.ts, tests/integration/planner-offline-sync-recovery.test.tsx, tests/integration/planner-conflict-branch.test.tsx)

### Lane 3 state/persistence/offline sync follow-up pass (2026-06-23)
- **Status:** `[~] Source-verified only`
- **Files:** `features/planner/persistence/persistence.ts`, `features/planner/hooks/usePlannerFabricAutosave.ts`, `features/planner/editor/PlannerTopBar.tsx`, `features/planner/ui/PlannerSaveIndicator.tsx`, `features/planner/editor/usePlannerSessionHandlers.ts`, `features/planner/editor/PlannerWorkspace.tsx`
- **Changes implemented:**
  - Threaded envelopeStatus from autosave into the top-bar save pill so it can distinguish saving locally, saved locally, queued for sync, syncing, sync failed, and conflict states.
  - Added generation-safe autosave callbacks so stale saves from a previous mount cannot update a newer planner mount.
  - Promoted the local autosaver to report success/error back into the shell instead of relying on a fixed timer for completion.
  - Surfaced offline plan sync state in the session hub entry list so queued/syncing/sync failed/conflict states are visible instead of collapsed into a generic units label.
  - Removed the broken `hydrateCloudPlanIntoIndexedDb(planId, guestMode)` bootstrap call from `PlannerWorkspace.tsx`; the helper now remains source-available for deterministic hydration logic without a signature mismatch at runtime.
- **Proof gaps:** No permission-gated tests, lint, or browser verification were run, so the new visible-state wiring is source-verified only.
- **Action:** Verify the lane-3 autosave and sync UI in a permitted verification pass when user approval exists.

### Lane 4 baseline AI reliability pass (2026-06-23)
- **Status:** `[~] Source-verified only`
- **Files:** `features/planner/ai/aiStatus.ts`, `features/planner/ai/spaceSuggest.ts`, `features/planner/ai/applySuggestedLayout.ts`, `features/planner/ai/AIAssistDrawer.tsx`, `features/planner/ai/AiAdvisorChatPane.tsx`
- **Changes implemented:**
  - Provider fallback classification now exposes invalid-response vs degraded-fallback states instead of collapsing all fallback cases into one generic label.
  - Chat-pane requests now use generation-safe abort handling and stale-response rejection so older AI responses cannot overwrite newer work.
  - Layout application no longer uses wall names derived from `Date.now()`, making apply-to-canvas deterministic for the same validated layout input.
  - Visible AI status text now covers live success, degraded fallback, request aborted, invalid response, and hard failure in both AI assistant surfaces.
- **Proof gaps:** No permission-gated AI tests or browser verification were run, so the AI reliability changes are source-verified only.
- **Exact missing proof:** no runtime proof of provider fallback classification, no abort/stale-response browser proof, no schema-validation golden output, no before/after deterministic apply trace, and no browser capture proving the visible AI status states.
- **Action:** Verify the lane-4 named tests and browser flow only after explicit user approval.

### Lane 1 runtime cleanup pass (2026-06-23)
- **Status:** `[~] Source-verified only`
- **Files:** `features/planner/canvas-fabric/context/FloorplanContext.tsx`, `features/planner/editor/usePlannerSessionHandlers.ts`, `features/planner/editor/usePlannerPanels.ts`
- **Note:** Added cleanup for the delayed grid-visibility and clone timers in `FloorplanContext`, mount-guards around async session state writes in `usePlannerSessionHandlers`, and a cancelled hydration microtask in `usePlannerPanels`. I did not run tests, lint, or Playwright because explicit permission was not granted, so proof is source-level only.
- **Action:** Verify the lane-1 cleanup behavior in a permitted verification pass when user approval exists.

### Lane 1 runtime cleanup follow-up pass (2026-06-23)
- **Status:** `[~] Source-verified only`
- **Files:** `features/planner/persistence/persistence.ts`, `features/planner/catalog/catalogStore.ts`, `features/planner/editor/PlannerWorkspace.tsx`, `features/planner/editor/usePlannerSessionHandlers.ts`, `features/planner/canvas-fabric/hooks/floorplanCanvas.ts`, `features/planner/canvas-fabric/context/FloorplanContext.tsx`
- **Note:** Tightened stale-work prevention for autosave, catalog hydration, workspace bootstrap, session auth/catalog loads, pending Fabric RAF restore, and post-unmount canvas/provider callbacks. The cleanup now ignores stale async completion instead of letting it write into a newer mount.
- **Proof gaps:** No tests, lint, or Playwright were run because explicit permission was not granted.
- **Action:** Verify the lane-1 cleanup behavior in a permitted verification pass when user approval exists.

### Lane 2 startup performance pass (2026-06-23)
- **Status:** `[~] Source-verified; build blocked by unrelated schema error`
- **Files:** `features/planner/ui/PlannerWorkspaceRoute.tsx`, `features/planner/ui/UnifiedPlannerPage.tsx`, `features/planner/editor/PlannerWorkspace.tsx`, `features/planner/catalog/usePlannerCatalogHydration.ts`, `features/planner/hooks/usePlannerFabricAutosave.ts`, `features/planner/editor/usePlannerPanels.ts`, `features/planner/hooks/usePlannerSession.ts`, `features/planner/hooks/useAssetLoader.ts`, `features/planner/canvas-fabric/FloorplanCanvas.tsx`, `features/planner/3d/Planner3DViewer.tsx`, `features/planner/editor/usePlannerSessionHandlers.ts`
- **Note:** Moved `PlannerCanvasEnhancements` behind dynamic imports in both planner entry surfaces, added a first-paint gate in `PlannerWorkspace` so non-urgent preferences/catalog/autosave/session bootstrap waits until the shell is visible, and added named performance marks for shell-visible, Fabric-ready, and 3D-ready milestones.
- **Build blocker:** `npm run build` failed before startup metrics could be harvested because `lib/api/schemas.ts` defines `SketchToPlanRequestSchema`, `SketchToPlanResponseSchema`, `SketchToPlanRouteResponseSchema`, and `SketchToPlanRouteErrorSchema` multiple times. This is outside Lane 2 scope.
- **Validation gap:** No throttled browser validation was run because explicit permission was not granted.
- **Exact missing proof:** no before/after bundle metric, no before/after timing metric, no chunk-graph or import trace diff from a successful build, no throttled shell-first browser validation, and no cold-start network comparison.
- **Action:** Re-run build/verification after the unrelated schema duplication is resolved or separately approved.

### Lane 5 sketch-to-plan recovery pass (2026-06-23)
- **Status:** `[~] Not verified`
- **Files:** `lib/api/schemas.ts`, `features/planner/ai/sketchToPlan.ts`, `app/api/planner/sketch-to-plan/route.ts`, `features/planner/editor/PlannerWorkspace.tsx`, `features/planner/canvas-fabric/hooks/floorplanCanvas.ts`
- **Note:** Added the lane-5 recovery contract, recoverable route envelopes, timeout/fallback classification, underlay-first upload handling, preview accept/reject flow, retry reuse, and the visible workspace recovery panel. I did not run tests or Playwright because explicit permission was not granted, so proof is source-level only.
- **Exact missing proof:** no runtime proof of the typed failure taxonomy, no browser proof that the underlay is visible before conversion returns, no preview-vs-commit capture, no reject-restore capture, no retry-vs-manual-work preservation capture, and no workspace recovery UI capture.
- **Action:** Verify the named lane-5 unit/integration tests only after user permission is granted.

### Lane 6 catalog and asset pipeline proof (2026-06-23)
- **Status:** `[✓] Source-verified`
- **Files:** `scripts/ingest-planner-catalog.ts`, `features/planner/catalog/ingest/csvCatalogIngest.ts`, `features/planner/catalog/generatedCatalogItems.ts`, `features/planner/catalog/generatedCatalogItemsPart1.ts`, `features/planner/catalog/generatedCatalogItemsPart2.ts`, `results/audits/planner-catalog-golden.json`, `results/audits/planner-catalog-ingest-report.json`, `results/audits/planner-catalog-ingest-report.md`, `results/audits/planner-asset-registry-audit.json`, `results/audits/planner-asset-registry-audit.md`
- **Note:** Canonical ingest now emits inside `features/planner/catalog/`, parses and validates all ten planner CSV source families, dedupes by the catalog identity key, and writes golden + duplicate/source-validation + asset-registry audits. The asset registry still reports five missing chair assets, which is visible in the audit rather than hidden.
- **Proof gaps:** none at the source/report level; no tests or Playwright were run because explicit permission was not granted.
- **Action:** Keep lane 6 closed unless a later lane changes the catalog or asset registry contract.

### Lane 7 database and query optimization pass (2026-06-23)
- **Status:** `[~] Source-verified only`
- **Files:** `platform/drizzle/schema.ts`, `platform/drizzle/migrations/0001_add_missing_indexes.sql`, `platform/drizzle/db.ts`, `app/api/plans/route.ts`, `app/api/plans/[id]/route.ts`, `app/api/admin/plans/route.ts`, `app/api/admin/plans/[id]/route.ts`, `app/api/planner/catalog/route.ts`, `lib/api/routeObservability.ts`, `features/planner/store/plannerPersistence.ts`, `features/planner/store/plannerSaves.ts`
- **Changes implemented:**
  - Split planner/admin list paths onto summary projections so the hot list reads no longer hydrate full `PlannerDocument` payloads when only summary fields are needed.
  - Kept detail routes on explicit full-row/document reads so individual plan loads and saves still return the complete document contract.
  - Flattened JSON search predicates in the admin list query into explicit `payload ->> ...` columns for `projectName`, `clientName`, and `preparedBy`, with the existing `plans_user_id_status_idx` / `plans_user_id_created_at_idx` / `plans_status_idx` coverage still in place for the main filter/sort paths.
  - Added `plans_user_id_updated_at_idx` to match the user summary list filter/sort pattern (`user_id` + newest-first `updated_at`) instead of relying only on the older `user_id + created_at` composite.
  - Added route-level telemetry headers (`Server-Timing`, `X-Planner-Route`, `X-Planner-Query-Shape`, `X-Planner-Query-Duration-Ms`, `X-Planner-Row-Count`, `X-Planner-Source`) across planner, admin, and catalog hot routes so the query shape is visible instead of assumed.
  - Verified connection reuse is source-stable: `platform/drizzle/db.ts` caches the Drizzle client, and `lib/supabase/server.ts` / `lib/supabase/client.ts` keep Supabase client construction centralized.
- **Proof gaps:** no live database environment is available here (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` are unset), so I could not produce before/after `EXPLAIN` / `EXPLAIN ANALYZE`, route latency comparisons, or response-header captures from running requests.
- **Exact missing proof:** no before/after query evidence per hot route, no runtime confirmation that the intended indexes are hit, no live route-header capture proving the observability headers, and no database-side RLS-policy verification.
- **Action:** Run a permitted verification pass against a configured database to collect the missing runtime evidence before calling the lane complete.

### Lane 8 verification and governance pass (2026-06-23)
- **Status:** `[✓] Governance updated`
- **Files:** `wip/planner-unified-10-file-plan/09-handover.md`, `Failures.md`
- **Note:** Reviewed the prior lane evidence and rewrote the canonical handover to show the true resume point, the complete/incomplete split, and the lane 6 / lane 8 completion state. No new implementation work was required.
- **Proof gaps:** no new gaps; all unresolved runtime / test / browser / query-plan gaps remain exactly as logged under lanes 1 through 7.
- **Action:** Treat `wip/planner-unified-10-file-plan/09-handover.md` as the authoritative resume guide for the next lane.

### Planner AI assist + sketch upload (2026-06-22)
- **Status:** `[~] Code fixed; env may still block live AI`
- **Root cause (proved):** Default model `gemini-1.5-flash` returns 404; local `OPENROUTER_API_KEY` / `NOVA_ACT_API_KEY` return 401; `GOOGLE_API_KEY` hits 429 quota on `gemini-2.0-flash-lite`.
- **Fixed:** Default model → `gemini-2.0-flash-lite`; OpenAI added to provider chain; space-suggest uses JSON mode; client uses `browserApiFetch` (trailing slash); degraded fallback surfaces a note in chat; ROOM inserts draw on Fabric (templates/AI apply); wall/line draw no longer jumps on mouse-up; **Upload sketch or plan** adds a locked-underlay image (JPG/PNG/WebP/GIF) — not branded as blueprint.
- **Follow-up:** Code now also accepts the documented Gemini alias `GOOGLE_GENERATIVE_AI_API_KEY` so local env setup matches onboarding docs.
- **Action:** Set a working `GOOGLE_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` (with quota) or `OPENAI_API_KEY` in `.env.local`; optional `GOOGLE_MODEL=gemini-2.0-flash-lite`.

### Planner workspace interaction gaps (2026-06-22)
- **Status:** `[~] Partially fixed`
- **Fixed this pass:** Tool rail was never mounted; planner store tools did not reach Fabric; pan mode missing; catalog drops ignored cursor position; AI Assist “Apply to canvas” was hard-blocked by `!editor` (always null in Fabric shell). **Catalog footprint:** library cards and canvas placement now use `resolveCatalogPlacementFootprintMm` (seat bays × module length) instead of showing every desk as 1200 mm; properties panel dimension fields are editable (controlled inputs + active-selection resize).
- **Still open:** Guest autosave still restores on load unless cleared via **New blank layout** (session dialog) or `?fresh=1` URL. Configurator catalog (`configurator_products`) not yet merged into workspace library (standard managed products are). BOM/PDF export needs live verification.

### Playwright e2e failures after path repair (2026-06-22)
- **Status:** `[ ] Open`
- **Finding:** `npm run test:e2e:nav` — 3 passed / 5 failed (products nav, mega menu, planner hero CTA timeout). `npm run test:planner-catalog` — 35 failed (mostly `page.goto` timeouts to `/planner/` and guest workspace).
- **Note:** Spec paths are fixed (`tests/e2e/...`); failures are app/test assertions, not missing spec files.
- **Action:** Triage flaky timeouts vs UI regressions; ensure production `npm run start` server is healthy under parallel load.

---

## Performance & UX Follow-ups

### 1. Font Format Compression Optimization (Parameter 12)
- **File:** `lib/fonts.ts`
- **Status:** `[ ] Open`
- **Description:** Several weights use `.otf` / `.ttf` instead of `.woff2`.
- **Action:** Convert local font assets to WOFF2 and update paths in `fonts.ts`.

## Repo Hygiene Follow-ups


### Site assistant shell refactor
- **Status:** `[~] Not verified` (2026-06-22)
- **Files:** `app/css/core/chrome/shell/assistant.css`, `app/css/index.css`, `features/site-assistant/UnifiedAssistant.tsx`, `features/site-assistant/AdvancedBot.tsx`
- **Note:** Repeated assistant UI styling moved out of TSX into shared chrome-shell CSS utilities. Playwright and other tests were not run because explicit permission was not granted.

### Lint check surfaced unrelated planner-admin hook errors
- **Status:** `[~] Open`
- **Files:** `features/planner/admin/AdminAnalyticsPageView.tsx`, `features/planner/admin/AdminCatalogListView.tsx`, `features/planner/admin/AdminFeatureFlagsPageView.tsx`, `features/planner/editor/usePlannerSessionHandlers.ts`
- **Note:** `npm run lint` still fails on pre-existing `react-hooks/set-state-in-effect` and `react-hooks/exhaustive-deps` violations outside the assistant refactor; I left those untouched to stay in scope.


### Hardcoded audit rerun hit a locked CSV
- **Status:** `[~] Follow-up`
- **File:** `results/hardcoded-audit-detail.csv`, `results/hardcoded-audit-summary.csv`
- **Note:** A fresh audit pass for TSX plus non-base CSS failed to overwrite the canonical CSV because the destination file was locked (`EPERM` on rename). The same scan completed successfully when written to alternate temp outputs.
- **Action:** Re-run the audit after the lock clears, or keep using an alternate output path when the canonical CSV is held open.

### 6. Planner asset pipeline still references separate `/models/chairs` GLB assets
- **Status:** `[ ] Open`
- **Files:** `features/planner/lib/assetPipeline.ts`, `tests/unit/planner-lib-assetPipeline.test.ts`
- **Finding:** The planner asset pipeline still points at `/models/chairs/*.glb` and `*-thumb.webp`, but the duplicate cleanup in this pass only removed identical `.dwg`/`.max` files from `public/models/chairs/`.
- **Action:** Audit whether the GLB/thumb asset set is missing, needs generation, or should be repointed to a different canonical location.

## Security & Resilience Audits Follow-ups (Parameters 31-40)


### 4. Unused IndexedDB Storage & Sync Queue (Parameter 38)
- **Files:** `features/planner/store/offlineStorage.ts`, `features/planner/store/syncQueueProcessor.ts`, `features/planner/editor/usePlannerSessionHandlers.ts`
- **Status:** `[~] Partial` (2026-06-22)
- **Enabled:** `supabaseSync` + `offlineMode` default flags on; cloud save/load/delete wired in session handlers; offline queue syncs on reconnect.

### 5. Missing Internet Connectivity Monitoring (Parameter 40)
- **File:** `features/planner/hooks/usePlannerSession.ts`
- **Status:** `[ ] Open`
- **Description:** No online/offline status surfaced in planner chrome.
- **Action:** Add `useOnlineStatus` hook and toolbar warning when offline.

## Spreadsheet Work Follow-up

- **File:** `outputs/2026-06-22-scripts-inventory/scripts-inventory.xlsx`
- **Status:** `[~] Verified structurally`
- **Note:** The workbook package was checked and opens as a valid XLSX with 3 sheets, but the visual render pass was skipped because the spreadsheet artifact tool is not available in this environment.
- **File:** `outputs/2026-06-22-txt-inventory/txt-files-inventory.xlsx`
- **Status:** `[~] Verified structurally`
- **Note:** The workbook package was checked and opens as a valid XLSX with 2 sheets, but the visual render pass was skipped for the same reason.

## Agent Plan Follow-up

- **Files:** `wip/sketch-to-plan-10-file-plan/*.md`
- **Status:** `[~] Not verified` (2026-06-23)
- **Note:** Wrote a standalone 10-file sketch-to-plan execution packet under `wip/`, then reread the original source packet and folded its key truths back in: underlay-plus-trace fallback priority, secondary save/retry paths, the review finding that preview/rollback is mandatory, and the failure-visibility problem behind Session Hub. This was still a planning/docs pass only, so no tests were run.

### Unified planner packet created
- **Files:** `wip/planner-unified-10-file-plan/*.md`
- **Status:** `[~] Not verified` (2026-06-23)
- **Note:** Revised the unified planner packet to restore the correct lane split between state/persistence/offline sync and baseline AI reliability, deepen the persistence and sketch lanes with executable contract details, strengthen startup/catalog/database proof requirements, and tighten verification/handover rules so the packet stands on its own. This was still a docs/planning pass only, so no tests were run.
