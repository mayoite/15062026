# Failures, Blockers, and Follow-ups

This file records the current packet blockers, proof gaps, and the historical notes that still matter for the Unified Planner Packet.

## Current Packet Lanes

### Lane 1 - Runtime Cleanup (2026-06-23)
- Status: [~] Source-verified only
- Files touched: `features/planner/canvas-fabric/context/FloorplanContext.tsx`, `features/planner/editor/usePlannerSessionHandlers.ts`, `features/planner/editor/usePlannerPanels.ts`, `features/planner/persistence/persistence.ts`, `features/planner/catalog/catalogStore.ts`, `features/planner/editor/PlannerWorkspace.tsx`, `features/planner/canvas-fabric/hooks/floorplanCanvas.ts`
- Proof gaps: no runtime remount / teardown proof; no strict-mode repeated remount proof; no 2D/3D switch teardown proof; stale async cancellation proof is source-only
- Action needed: run lane-1 runtime verification only after permission is granted

### Lane 2 - Startup Performance (2026-06-23)
- Status: [!] Blocked
- Files touched: `features/planner/ui/PlannerWorkspaceRoute.tsx`, `features/planner/ui/UnifiedPlannerPage.tsx`, `features/planner/editor/PlannerWorkspace.tsx`, `features/planner/catalog/usePlannerCatalogHydration.ts`, `features/planner/hooks/usePlannerFabricAutosave.ts`, `features/planner/editor/usePlannerPanels.ts`, `features/planner/hooks/usePlannerSession.ts`, `features/planner/hooks/useAssetLoader.ts`, `features/planner/canvas-fabric/FloorplanCanvas.tsx`, `features/planner/3d/Planner3DViewer.tsx`, `features/planner/editor/usePlannerSessionHandlers.ts`
- Proof gaps: no bundle metric, no timing metric, no chunk-graph or import-trace proof, no throttled shell-first validation, no cold-start network comparison
- Blocker: `lib/api/schemas.ts` still has duplicate `SketchToPlan*` schema definitions that block the normal build path used for measurement
- Action needed: resolve the unrelated schema duplication or use another approved verification path, then collect before/after metrics

### Lane 3 - State, Persistence, Autosave, Offline Sync (2026-06-23)
- Status: [~] Source-verified only
- Files touched: `features/planner/store/offlineStorage.ts`, `features/planner/store/syncQueueProcessor.ts`, `features/planner/persistence/cloudPlanHydration.ts`, `features/planner/hooks/usePlannerFabricAutosave.ts`, `features/planner/persistence/persistence.ts`, `features/planner/editor/usePlannerSessionHandlers.ts`, `features/planner/editor/PlannerWorkspace.tsx`, `features/planner/editor/PlannerTopBar.tsx`, `features/planner/ui/PlannerSaveIndicator.tsx`
- Proof gaps: source-only changes; no permission-gated tests, no browser proof of truthful save/sync UI states, no runtime deterministic recovery proof
- Action needed: run the named lane-3 tests and browser verification when permission is granted

### Lane 4 - Baseline AI Reliability (2026-06-23)
- Status: [~] Source-verified only
- Files touched: `features/planner/ai/aiStatus.ts`, `features/planner/ai/spaceSuggest.ts`, `features/planner/ai/applySuggestedLayout.ts`, `features/planner/ai/AIAssistDrawer.tsx`, `features/planner/ai/AiAdvisorChatPane.tsx`
- Proof gaps: no runtime proof of provider fallback classification, no abort / stale-response browser proof, no schema-validation golden output, no deterministic apply trace, no browser capture proving the visible AI status states
- Action needed: verify the lane-4 named tests and browser flow only after explicit user approval

### Lane 5 - Sketch-to-Plan Approved Lane (2026-06-23)
- Status: [~] Source-verified only
- Files touched: `lib/api/schemas.ts`, `features/planner/ai/sketchToPlan.ts`, `app/api/planner/sketch-to-plan/route.ts`, `features/planner/editor/PlannerWorkspace.tsx`, `features/planner/canvas-fabric/hooks/floorplanCanvas.ts`
- Proof gaps: no runtime proof of the typed failure taxonomy, no browser proof that the underlay is visible before conversion returns, no preview-vs-commit capture, no reject-restore capture, no retry-vs-manual-work preservation capture, no workspace recovery UI capture
- Action needed: verify the named lane-5 unit/integration tests only after user permission is granted

### Lane 6 - Catalog and Asset Pipeline (2026-06-23)
- Status: [~] Source-verified only
- Files touched: `scripts/ingest-planner-catalog.ts`, `features/planner/catalog/ingest/csvCatalogIngest.ts`, `features/planner/catalog/generatedCatalogItems.ts`, `features/planner/catalog/generatedCatalogItemsPart1.ts`, `features/planner/catalog/generatedCatalogItemsPart2.ts`, `results/audits/planner-catalog-golden.json`, `results/audits/planner-catalog-ingest-report.json`, `results/audits/planner-catalog-ingest-report.md`, `results/audits/planner-asset-registry-audit.json`, `results/audits/planner-asset-registry-audit.md`
- Proof gaps: none at the source/report level; no tests or Playwright were run
- Action needed: keep lane 6 closed unless a later lane changes the catalog or asset registry contract

### Lane 7 - Database and Query Optimization (2026-06-23)
- Status: [!] Blocked
- Files touched: `platform/drizzle/schema.ts`, `platform/drizzle/migrations/0001_add_missing_indexes.sql`, `platform/drizzle/db.ts`, `app/api/plans/route.ts`, `app/api/plans/[id]/route.ts`, `app/api/admin/plans/route.ts`, `app/api/admin/plans/[id]/route.ts`, `app/api/planner/catalog/route.ts`, `lib/api/routeObservability.ts`, `features/planner/store/plannerPersistence.ts`, `features/planner/store/plannerSaves.ts`
- Proof gaps: no before/after query evidence per hot route, no runtime confirmation that intended indexes are hit, no live route-header capture, no RLS-policy verification, no EXPLAIN / EXPLAIN ANALYZE evidence
- Blocker: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` are unset here, so live database proof cannot be collected in this environment
- Action needed: provision a configured database environment and collect query-plan, route-observability, and connection-reuse evidence

### Lane 8 - Verification and Governance (2026-06-23)
- Status: [~] Source-verified only
- Files touched: `wip/planner-unified-10-file-plan/09-handover.md`, `Failures.md`
- Proof gaps: no new proof gaps; this lane was a governance / handover update only
- Action needed: keep the handover aligned with the actual packet state and resume point

## Historical / Cross-Cutting Open Items

### Planner AI Assist + Sketch Upload (2026-06-22)
- Status: [~] Code fixed; env may still block live AI
- Files touched: `features/planner/ai/*`, `app/api/planner/ai-advisor/route.ts`, `app/api/planner/sketch-to-plan/route.ts`
- Proof gaps: live provider proof still depends on working model/API keys and quota
- Action needed: set a working `GOOGLE_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` with quota, or `OPENAI_API_KEY`, before claiming live AI readiness

### Planner Workspace Interaction Gaps (2026-06-22)
- Status: [~] Partially fixed
- Files touched: `features/planner/editor/PlannerWorkspace.tsx`, `features/planner/editor/usePlannerSessionHandlers.ts`, `features/planner/catalog/catalogStore.ts`, `features/planner/hooks/usePlannerSession.ts`
- Proof gaps: guest autosave still restores on load unless cleared via a fresh layout path; configurator catalog is not fully merged into the workspace library; BOM / PDF export still needs live verification
- Action needed: validate the remaining workspace flows in a permitted runtime pass

### Playwright E2E Failures After Path Repair (2026-06-22)
- Status: [ ] Open
- Files touched: `tests/e2e/*`
- Proof gaps: `tests/e2e` nav flows still have route/assertion failures; `tests/e2e/test:planner-catalog` still has multiple `page.goto` timeouts
- Action needed: triage flaky timeouts versus UI regressions after the app is healthy under load

### Site Assistant Shell Refactor
- Status: [~] Not verified
- Files touched: `app/css/core/chrome/shell/assistant.css`, `app/css/index.css`, `features/site-assistant/UnifiedAssistant.tsx`, `features/site-assistant/AdvancedBot.tsx`
- Proof gaps: no runtime verification was run
- Action needed: verify the styling refactor in a permitted browser pass if it remains important

### Lint Check Surfaced Unrelated Planner-Admin Hook Errors
- Status: [~] Open
- Files touched: `features/planner/admin/AdminAnalyticsPageView.tsx`, `features/planner/admin/AdminCatalogListView.tsx`, `features/planner/admin/AdminFeatureFlagsPageView.tsx`, `features/planner/editor/usePlannerSessionHandlers.ts`
- Proof gaps: `npm run lint` still fails on pre-existing `react-hooks/set-state-in-effect` and `react-hooks/exhaustive-deps` issues outside the lane work
- Action needed: keep those separate unless explicitly asked to clean them up

### Hardcoded Audit Rerun Hit a Locked CSV
- Status: [~] Follow-up
- Files touched: `results/hardcoded-audit-detail.csv`, `results/hardcoded-audit-summary.csv`
- Proof gaps: the canonical CSV was locked during a rerun (`EPERM` on rename)
- Action needed: rerun the audit after the lock clears, or keep using an alternate output path

### Planner Asset Pipeline Still References Separate `/models/chairs` GLB Assets
- Status: [ ] Open
- Files touched: `features/planner/lib/assetPipeline.ts`, `tests/unit/planner-lib-assetPipeline.test.ts`
- Proof gaps: the planner asset pipeline still points at `/models/chairs/*.glb` and `*-thumb.webp`
- Action needed: audit whether the GLB/thumb set is missing, needs generation, or should be repointed

### Unused IndexedDB Storage & Sync Queue (Parameter 38)
- Status: [~] Partial
- Files touched: `features/planner/store/offlineStorage.ts`, `features/planner/store/syncQueueProcessor.ts`, `features/planner/editor/usePlannerSessionHandlers.ts`
- Proof gaps: the offline queue is wired, but the broader storage / sync story still needs proof if it is to be called complete
- Action needed: verify the offline queue behavior if that work becomes a release gate

### Missing Internet Connectivity Monitoring (Parameter 40)
- Status: [ ] Open
- Files touched: `features/planner/hooks/usePlannerSession.ts`
- Proof gaps: no online/offline status is surfaced in planner chrome
- Action needed: add a `useOnlineStatus` hook and planner warning when offline

### Spreadsheet Work Follow-up
- Status: [~] Verified structurally
- Files touched: `outputs/2026-06-22-scripts-inventory/scripts-inventory.xlsx`, `outputs/2026-06-22-txt-inventory/txt-files-inventory.xlsx`
- Proof gaps: the visual render pass was skipped because the spreadsheet artifact tool is not available here
- Action needed: rerun a visual render pass only if spreadsheet presentation becomes a deliverable

### Agent Plan Follow-up
- Status: [~] Not verified
- Files touched: `wip/sketch-to-plan-10-file-plan/*.md`
- Proof gaps: planning / docs only; no runtime verification
- Action needed: keep these packet drafts aligned with the executed lanes if they are reused

### Unified Planner Packet Created
- Status: [~] Not verified
- Files touched: `wip/planner-unified-10-file-plan/*.md`
- Proof gaps: docs/planning pass only
- Action needed: keep the packet synchronized with the actual repo state and logged evidence
