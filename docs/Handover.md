# Handover

*2026-06-15 — Vitest coverage close block posted (site S0–S5 + planner slices). Run `git log -1 --oneline` for HEAD.*

## If you're lost

| Question | Answer |
|----------|--------|
| Where is the real repo? | **`E:\Goodsites\13062026`** — on **`main`**, should match `origin/main` |
| What is the Cursor folder? | Git **worktree** (same repo, detached or non-`main` branch) — run `git worktree list` before checkout |
| Past failures / old handover text? | **Git:** `git log -- docs/Failures.md` · snapshot: `archive/docs/recovered-2026-06-15/` |
| What do I read first? | `Readme.md` → `AGENTS.md` → this file → `docs/Failures.md` → `docs/DOC-MAP.md` |

## Current state

| Area | Status |
|---|---|
| Unified planner | Live at `/planner`, `/planner/canvas`, `/planner/guest` |
| Guest onboarding | `ProjectSetupGate` blocks canvas until project named |
| AI assist | Wired on workspace top bar |
| Shared CSS | `app/css/` (moved from `app/(site)/css/`) |
| Legacy planners | Archived; 301s to `/planner/*` |
| Homepage | `homepage-v2` — hero, collections, projects, contact; `homepage.css` imports `routes/home/base.css` |
| Site typography | Default colors on `typ-*` utilities; `--text-muted` / `--text-subtle` darkened in `theme.css` |
| Planner UI | `planner-shell.css` typography tokens + `--planner-*` aliases; `planner-workflow.css` for right-panel step bar; `planner-typography.css` imported last in workspace bundle |
| Static catalog pages | **341** build pages via `buildProductStaticParams()` (Supabase rows merged with `localCatalogIndex.json` fallback) |
| TypeScript | **6.x** (`^6.0.3`); root `tsconfig.json` — paths with `./` prefixes, no `baseUrl` |

## Milestones

| M | Status | Notes |
|---|---|---|
| M4 Persistence | In progress | Drizzle `plans` for canvas, admin API, and session cloud save/load; live DB integration test in CI |
| M5 Alignment | In progress | Marketing + planner typography largely tokenized; FilterGrid structural split still open |
| M6 Launch | In progress | Vitest **1685/1685** (218 files); planner **78.4%** / site **96.6%** stmts; see `plans/MASTER-PLAN.md` |

## Coverage close block (2026-06-15)

### Site track — **closed** (`plans/SITE-COVERAGE.md` S0–S5)

| | |
|---|---|
| **Done** | All `vitest.site.config.ts` include folders tested |
| **Verified** | **96.6%** stmts · **96.3%** fn · **87.9%** branches · **97.8%** lines · **0** zero-stmt files |
| **CI** | `vitest.site.config.ts` thresholds **90 / 80 / 90 / 90** |
| **Remaining** | S4 Playwright site-only script; `test:coverage:site` in `release:gate` |

Per-folder: `data/site` **100%** · `lib/catalog` **95%** · `features/catalog` **97.5%** · `features/shared` **99%** · `site-assistant` **95%** · `ops` **97%** · `configurator` **100%** · `aiAdvisor` **100%**.

### Planner track — **in progress** (`plans/PLANNER-COVERAGE-75.md`)

| | |
|---|---|
| **Done** | Slices: `store/` **94%** · `hooks/` **98%** · `tldraw/` **91%** · `lib/` **96%** · `catalog/` **98%** · `editor/` **89%** |
| **Verified** | Rollup **78.4%** stmts · **74.3%** fn · **70.1%** branches · **80.4%** lines (product target **75%**) |
| **Remaining** | `ui/`, `viewer/`, `3d/`, `admin/`, `persistence/`, `onboarding/` — ratchet planner CI thresholds |

Reports: `results/COVERAGE-REPORT.md` · `results/coverage-summary.json` · regen `npm run docs:sync:coverage`.

## Verified (2026-06-15)

- `npm.cmd run test` — **1685/1685** (218 Vitest files)
- `npm.cmd run typecheck` — pass (`tsc -p tsconfig.json`)
- `npm.cmd run build` — **341** static pages (Next.js 16.2.9; TypeScript step green)
- `npm.cmd run test:coverage` — pass; planner **78.4%** stmts (`results/coverage-summary.json`)
- `npm.cmd run test:coverage:site` — pass; site **96.6%** stmts; thresholds **90/80/90/90**
- Playwright smoke — pass when server is fresh (`tests/guestProjectSetup.ts`; use `next start` on a clean port if dev servers are stale)
- `/`, `/planner/`, `/planner/guest/`, `/solutions/` — load without Supabase
- `/products` — loads with local catalog fallback when `NEXT_PUBLIC_SUPABASE_URL` is missing

## Dev

Use `npx next dev --webpack`. `npm run dev` (Turbopack) may panic on `app/css/index.css` `@source`.

For E2E against a production build: `npm run build && npm run start` (often port 3000; set `PLAYWRIGHT_BASE_URL` if different).

## CSS migration (2026-06-14–15)

- **CSS tree:** `app/css/base/` at root (primitives); `app/css/core/` — `tokens/`, `chrome/`, `site/`, `planner/`.
- **Phase 4 done:** `planner/bundles/workspace.css` only on `app/planner/(workspace)/layout.tsx`; marketing routes load `marketing.css` only.
- **Step 6 done:** buddy aliases in `core/tokens/theme.css`; planner accent override on `body.planner-workspace`; duplicate `@theme` removed from planner workspace rules.
- **Phase 2 done:** `app/css/routes/legacy/` removed; ported to `routes/site/`, `routes/pdp/`, `routes/home/base.css`, `routes/catalog/cards.css`.
- **Homepage fix (2026-06-15):** `homepage.css` re-imports `routes/home/base.css` (hero layout, `home-hero-title-homepage`, scrim/gradient).
- **Planner workflow panel (2026-06-15):** `planner-workflow.css` + `PlannerWorkflowPanel` markup — fixes concatenated “Current step: Catalog” text in right rail.
- **Archived:** `archive/css/legacy-ported-2026-06-14/`, `legacy-unused-2026-06-14/`, `routes-unused-2026-06-14/`.

## Done (recent)

- [x] Phase 4: split planner marketing vs workspace CSS imports (2026-06-14)
- [x] REPO Step 6: merge `workspace.css` `@theme` into `app/css/core/tokens/theme.css` (2026-06-14)
- [x] M5 typography on catalog filters (FilterGrid + loading skeletons tokenized 2026-06-14)
- [x] `?id=` cloud plan hydration — `GET /api/plans/[id]` + IndexedDB seed before restore (2026-06-14)
- [x] Build/catalog without `NEXT_PUBLIC_SUPABASE_URL` — lazy client + local fallback (2026-06-14)
- [x] Admin `planner_saves` → Drizzle `plans` via `/api/admin/plans` (2026-06-14)
- [x] Session cloud save/load → `/api/plans` PUT/GET/DELETE (2026-06-14)
- [x] Server round-trip mapping test in CI (2026-06-14)
- [x] Static product pages — `buildProductStaticParams()` merges Supabase + local catalog (**341** pages, 2026-06-14)
- [x] `CategoryPageView` extracted from category `page.tsx` (Next.js extra-export build fix, 2026-06-14)
- [x] Homepage hero + site section typography/color pass (2026-06-15)
- [x] Planner workspace typography + workflow panel spacing (2026-06-15)
- [x] TypeScript 6 config — root `tsconfig.json` without deprecated `baseUrl` (2026-06-15)
- [x] REPO Phase 0 — root cruft removed; `project-tree.csv` → `results/` (`a8d44a5`)
- [x] Vitest T1 — all four former excludes re-enabled; **477/477** (`397150d`)
- [x] `docs/ops/context/route-classification.md` — live route tables (7 planner, 41 site, 34 API)
- [x] `plans/ARCHIVE-MAP.md` — archive crosswalk to live plans (2026-06-15)
- [x] REPO Phases 2–5 — ownership `CONTENTS.md`, scripts flat-root, proxy trim, `test:layout:check` (2026-06-15)
- [x] TESTING T3-1 partial — `plannerStore` + `catalog/plannerCatalogCore` tests; planner **21.1%** (2026-06-15)
- [x] `docs:routes` Windows matcher fix in `generate-route-classification.mjs` (2026-06-15)
- [x] T4.1 — `npm run test` in `release:gate` after typecheck, before build (2026-06-15)
- [x] `plans/MASTER-PLAN.md` — program dashboard, metrics, critical path (2026-06-15)
- [x] Site coverage S0–S5 — **96.6%** site rollup; `plans/SITE-COVERAGE.md` block closure (2026-06-15)
- [x] Planner coverage slices — `store`, `hooks`, `tldraw`, `lib`, `catalog`, `editor` ≥85% (2026-06-15)
- [x] `results/COVERAGE-REPORT.md` + `scripts/coverage-metrics.mjs` (lines from `statementMap`) (2026-06-15)
- [x] **218** Vitest files / **1685** tests; PlannerWorkspace flake fix (60s timeout) (2026-06-15)

## Persistence (unified on Drizzle `plans`)

| Surface | Path |
|---|---|
| Canvas autosave / `?id=` load | Drizzle via `/api/plans/[id]` + IndexedDB hydration |
| Session dialog cloud save/load | `/api/plans` PUT/GET/DELETE |
| Admin plan list/review/analytics | `/api/admin/plans`, `/api/admin/analytics` |

## Docs layout

| Location | Role |
|---|---|
| Repo root | `Readme.md`, `AGENTS.md`, `CONTENTS.md` (generated) |
| `docs/` | `Handover.md`, `Failures.md`, `DOC-MAP.md`, `TESTING.md`, `SCRIPTS.md`, `CSS-ARCHITECTURE.md` |
| `plans/` | Roadmaps — `TESTING-PLAN.md`, `REPO-STRUCTURE-PLAN.md`, `ARCHIVE-MAP.md` |
| `results/` | Generated JSON — `test-inventory.json`, `coverage-summary.json`, `COVERAGE-REPORT.md` |

## Skipped / backlog

- `release:gate` still needs `DATABASE_URL` for Drizzle plan routes
- Planner rollup **78.4%** → ratchet CI thresholds + `ui`/`viewer`/`3d` slices for stable **75%+**
- Site S4 — Playwright site-only CI script; wire `test:coverage:site` into `release:gate`
- Opening collision detection
- FilterGrid file split (~2.6k lines) — typography done, structural split pending
- Shape size on reload when legacy mm values ≥ 1000 (see `plannerCanvasUnits`)