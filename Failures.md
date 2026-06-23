# Failures, Blockers, and Follow-ups

This file documents critical blockers, failed parameters, and required follow-ups identified during repository audits.

## Live Blockers & Failures

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
