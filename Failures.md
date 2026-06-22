# Failures, Blockers, and Follow-ups

This file documents critical blockers, failed parameters, and required follow-ups identified during repository audits.

## Live Blockers & Failures

### Planner workspace interaction gaps (2026-06-22)
- **Status:** `[~] Partially fixed`
- **Fixed this pass:** Tool rail was never mounted; planner store tools did not reach Fabric; pan mode missing; catalog drops ignored cursor position; AI Assist “Apply to canvas” was hard-blocked by `!editor` (always null in Fabric shell).
- **Still open:** Product/inventory management (admin `/admin/inventory` is route CSV only, not SKU stock). BOM/PDF export UI exists (`ExportModal` via subtopbar Export) but needs live verification with catalog placements. AI chat/LLM layout still needs provider env vars (`resolveProviderChain`); grid-pack fallback works offline. Wall/room architectural tools (`wc` walls controller) remain stubbed — draw tools create annotations/lines only.

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

### Toolbar utility cleanup
- **Status:** `[x] Resolved` (2026-06-22)
- **Files:** `features/planner/shared/components/editor/Toolbar.tsx`, `app/css/core/planner/editor-chrome.css`
- **Note:** Replaced repeated toolbar icon sizing utilities with a shared chrome CSS class. Verification was intentionally skipped because Playwright/test runs were not permitted for this task.

### Planner panel orchestrator refactor completed
- **Status:** `[x] Resolved` (2026-06-22)
- **Files:** `features/planner/ui/PlannerDesktopPanels.tsx`, `features/planner/ui/PlannerMobilePanels.tsx`
- **Note:** Rewrapped the desktop/mobile planner panel orchestrators to reduce wrapper noise without changing catalog, inspector, layers, or session dialog code. Verification was not run because explicit permission was not given.

### Site assistant shell refactor
- **Status:** `[~] Not verified` (2026-06-22)
- **Files:** `app/css/core/chrome/shell/assistant.css`, `app/css/index.css`, `features/site-assistant/UnifiedAssistant.tsx`, `features/site-assistant/AdvancedBot.tsx`
- **Note:** Repeated assistant UI styling moved out of TSX into shared chrome-shell CSS utilities. Playwright and other tests were not run because explicit permission was not granted.

### Lint check surfaced unrelated planner-admin hook errors
- **Status:** `[~] Open`
- **Files:** `features/planner/admin/AdminAnalyticsPageView.tsx`, `features/planner/admin/AdminCatalogListView.tsx`, `features/planner/admin/AdminFeatureFlagsPageView.tsx`, `features/planner/editor/usePlannerSessionHandlers.ts`
- **Note:** `npm run lint` still fails on pre-existing `react-hooks/set-state-in-effect` and `react-hooks/exhaustive-deps` violations outside the assistant refactor; I left those untouched to stay in scope.

### Generated hardcoded audit CSV refreshed successfully
- **Status:** `[x] Resolved` (2026-06-22)
- **File:** `results/hardcoded-audit-detail.csv`, `results/hardcoded-audit-summary.csv`
- **Note:** The audit was regenerated after the lock cleared, and the stale `data/site/*` hit now points at `lib/site-data/*` in the generated output.
- **Action:** Keep the generator on the atomic temp-file write path so future refreshes survive transient file locks.

### Hardcoded audit rerun hit a locked CSV
- **Status:** `[~] Follow-up`
- **File:** `results/hardcoded-audit-detail.csv`, `results/hardcoded-audit-summary.csv`
- **Note:** A fresh audit pass for TSX plus non-base CSS failed to overwrite the canonical CSV because the destination file was locked (`EPERM` on rename). The same scan completed successfully when written to alternate temp outputs.
- **Action:** Re-run the audit after the lock clears, or keep using an alternate output path when the canonical CSV is held open.

### 1. Stale root test/typecheck artifacts
- **Status:** `[x] Resolved` (2026-06-22)
- **Guards:** `.gitignore` scratch patterns; `npm run test:clean` + `pretest`; coverage/Playwright scripts call `test:clean`; `tests/root-configs.test.ts` + `tests/unit/clean-test-artifacts.test.ts`; `docs/TESTING.md`.
- **Canonical outputs:** `results/tests/` (Vitest), `results/test-results/` (Playwright), `results/coverage*`.

### 5. Test folder docs are out of sync with the live tree
- **Status:** `[x] Resolved` (2026-06-22)
- **Action:** Removed stale `tests/CONTENTS.md` and `tests/INVENTORY.md`; layout guarded by `npm run test:layout:check`.

### 6. Planner asset pipeline still references separate `/models/chairs` GLB assets
- **Status:** `[ ] Open`
- **Files:** `features/planner/lib/assetPipeline.ts`, `tests/unit/planner-lib-assetPipeline.test.ts`
- **Finding:** The planner asset pipeline still points at `/models/chairs/*.glb` and `*-thumb.webp`, but the duplicate cleanup in this pass only removed identical `.dwg`/`.max` files from `public/models/chairs/`.
- **Action:** Audit whether the GLB/thumb asset set is missing, needs generation, or should be repointed to a different canonical location.

## Security & Resilience Audits Follow-ups (Parameters 31-40)

### 2. Unused CSRF Protection on Mutating Endpoints (Parameter 32)
- **File:** `lib/security/csrf.ts`, `lib/api/browserApi.ts`, `app/api/csrf/route.ts`
- **Status:** `[x] Resolved` (2026-06-22)
- **Protected (session/admin mutations):** `app/api/plans/route.ts` POST; `app/api/plans/[id]/route.ts` PUT/DELETE; `app/api/admin/plans/**`; `app/api/admin/themes/publish/route.ts`; `app/api/theme/manage/route.ts` POST; `app/api/audit/route.ts` POST; `app/api/customer-queries/manage/route.ts` PATCH.
- **Client wiring:** `GET /api/csrf/` issues cookie + token; `browserApiFetch` sends `x-csrf-token`; `CsrfBootstrap` prefetches on site/planner/crm/ops/admin layouts.
- **Intentionally unprotected (public/rate-limited/anonymous):** `customer-queries` POST, `tracking` POST, `log-error` POST, `nav-search` POST, `filter` POST, `recommendations` POST, `generate-alt` POST, `configurator/smart-wizard` POST.

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
