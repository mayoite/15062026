# Failures, Blockers, and Follow-ups

This file documents critical blockers, failed parameters, and required follow-ups identified during repository audits.

## Live Blockers & Failures

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

### Planner panel orchestrator refactor completed
- **Status:** `[x] Resolved` (2026-06-22)
- **Files:** `features/planner/ui/PlannerDesktopPanels.tsx`, `features/planner/ui/PlannerMobilePanels.tsx`
- **Note:** Rewrapped the desktop/mobile planner panel orchestrators to reduce wrapper noise without changing catalog, inspector, layers, or session dialog code. Verification was not run because explicit permission was not given.

### Generated hardcoded audit CSV refreshed successfully
- **Status:** `[x] Resolved` (2026-06-22)
- **File:** `results/hardcoded-audit-detail.csv`, `results/hardcoded-audit-summary.csv`
- **Note:** The audit was regenerated after the lock cleared, and the stale `data/site/*` hit now points at `lib/site-data/*` in the generated output.
- **Action:** Keep the generator on the atomic temp-file write path so future refreshes survive transient file locks.

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
