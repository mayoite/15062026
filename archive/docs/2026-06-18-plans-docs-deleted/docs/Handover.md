# Handover

*2026-06-16 — Planner canvas-first shell + custom tldraw tools (v0). Run `git log -1 --oneline` for HEAD.*

## If you're lost

| Question | Answer |
|----------|--------|
| Where is the real repo? | **`E:\16062026`** — on **`main`**, should match `origin/main` |
| What is the Cursor folder? | Should be **`E:\16062026`** — if you are under `.grok\worktrees\`, reopen this path |
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
| Planner UI | Canvas-first shell (`planner-canvas-layout.css`); dockable chrome v0; slide-over panels; `planner-shell.css` + `planner-workflow.css` + `planner-typography.css` in workspace bundle |
| Planner tools | Custom tldraw tools merged with `defaultTools`; native select/pan/erase; visibility dropdown wired; Playwright `planner-custom-tools.spec.ts` **17/17** |
| Static catalog pages | **341** build pages via `buildProductStaticParams()` (Supabase rows merged with `localCatalogIndex.json` fallback) |
| TypeScript | **6.x** (`^6.0.3`); root `tsconfig.json` — paths with `./` prefixes, no `baseUrl` |

## Milestones

| M | Status | Notes |
|---|---|---|
| M4 Persistence | In progress | Drizzle `plans` for canvas, admin API, and session cloud save/load; live DB integration test in CI |
| M5 Alignment | In progress | Marketing + planner typography largely tokenized; `FilterGrid` structural split landed |
| M6 Launch | **Advanced / Plans closed** | Vitest **1789/1789** (235+ files); planner **~78%** (branches ~69.5% near) / site **96.6%** stmts; coverage gate wired in release:gate; plans/ folder fully refreshed and remaining items closed via test additions. See updated `plans/MASTER-PLAN.md` etc. |

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
| **Verified** | Rollup **78.1%** stmts · **75.6%** fn · **69.5%** branches · **80.1%** lines (product target **75%**; fresh `docs:sync:coverage` 2026-06-16) |
| **Remaining** | `ui/`, `viewer/`, `3d/`, `admin/`, `persistence/`, `onboarding/` — ratchet planner CI thresholds (esp. branches) |

**Plans refresh (2026-06-16):** Audit of docs/ + plans/ confirms correct separation (non-plan reference/ops docs like Handover/Failures/TESTING.md/CSS/DOC-MAP/HARDCODING-INVENTORY + workflow/ops/ in `docs/`; all planning-related like *-PLAN.md/MASTER/ARCHIVE-MAP etc. in `plans/` or historical archive). REPO/CHROME/HOMEPAGE + site-design archived to completed-2026-06-16/; SITE-COVERAGE closed. (See updated DOC-MAP, ARCHIVE-MAP, MASTER etc.)

Reports: `results/COVERAGE-REPORT.md` · `results/coverage-summary.json` · regen `npm run docs:sync:coverage`.

## Planner chrome layout (2026-06-16) — M0–M6 landed (plan archived to completed-2026-06-16/)

**Plan:** (archived to completed-2026-06-16/) — benchmark vs Planner 5D / RoomSketcher / Floorplanner; incremental milestones. (v0/M0-M6 done)

| | |
|---|---|
| **Done (M0–M6)** | Full-bleed canvas; chrome in `features/planner/editor/chrome/`; smart docking (center snap, collision stagger, panel-aware clamp, edge preview); trust controls (reset layout, keyboard nudge, `aria-live`, focus rings); benchmark parity (left rail collapse, inspector-on-select, furniture→library, catalog recents, units/grid/snap labels); 3D render evidence via `data-render-evidence` on `Planner3DViewer` |
| **Verified** | `npm.cmd run typecheck` pass · `npm.cmd run lint` pass · Vitest `tests/planner-chrome-layout.test.ts` **12/12** · Playwright `tests/planner-chrome.spec.ts` **11/11** · Playwright `tests/planner-custom-tools.spec.ts` **17/17** (fresh `npm run build && npm run start`) |
| **Desktop defaults** | Draw: panels closed, wall tool · Place: library open · Review: inspector open · Right panel auto-opens on shape select outside Review |
| **Storage** | Reads legacy `planner-chrome-dock-v1`; writes `planner-chrome-layout-v2`; recents in `planner-catalog-recent` |
| **3D evidence** | `Planner3DViewer` sets `data-render-evidence=ready` + `data-render-luma` after first nonblank frame (`addAfterEffect` + `preserveDrawingBuffer`) |

**Key files:** `features/planner/editor/PlannerWorkspace.tsx`, `features/planner/editor/chrome/`, `usePlannerPanels.ts`, `plannerTldrawRegistration.ts`, `app/css/core/planner/planner-canvas-layout.css`, `app/css/core/planner/planner-chrome.css`.

**Dev note:** Hard-refresh `/planner/guest/` after CSS changes; kill stale `node` on port 3000 if UI looks unchanged.

## Verified (2026-06-16) — databases & catalog data

- `npm.cmd run db:test` — DigitalOcean Postgres OK; Drizzle tables: `profiles`, `plans`, `teams`, `team_members`, `invites`, `audit_events` (0 plan rows)
- `npm.cmd run db:sync-drizzle` — schema complete (no-op)
- `npm.cmd run db:apply` / `db:apply:admin` — migrations up to date (`platform/supabase/migrations*`)
- `npm.cmd run audit:supabase:catalog` — 85 products; **missing alt text 0**, **missing primary image 0**
- `npm.cmd run audit:supabase:admin` — `customer_queries` OK on admin project (1 row)
- `npm.cmd run alt:sync:apply` — 85 alt rows written
- `npm.cmd run supabase:backfill:images` — 83 image sets written; 2 unresolved (`oando-storage/Metal`, `Wooden`)
- Docs: `docs/workflow/START-HERE.md` + `database.md`; deduped `backend.md` / audit runtime stub

## Verified (2026-06-15)

- `npm.cmd run test` — **1787/1787** (235 Vitest files)
- `npm.cmd run typecheck` — pass (`tsc -p tsconfig.json`)
- `npm.cmd run build` — **341** static pages (Next.js 16.2.9; TypeScript step green)
- `npm.cmd run test:coverage` — pass; planner **78.3%** stmts (`results/coverage-summary.json`)
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
- [x] `FilterGrid` structural split into wrapper + inner/helpers/components (2026-06-16)
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
- [x] `plans/ARCHIVE-MAP.md` — archive crosswalk to live plans (updated 2026-06-16 for completed batch)
- [x] REPO Phases 2–5 — ownership `CONTENTS.md`, scripts flat-root, proxy trim, `test:layout:check` (2026-06-15)
- [x] TESTING T3-1 partial — `plannerStore` + `catalog/plannerCatalogCore` tests; planner **21.1%** (2026-06-15)
- [x] `docs:routes` Windows matcher fix in `generate-route-classification.mjs` (2026-06-15)
- [x] T4.1 — `npm run test` in `release:gate` after typecheck, before build (2026-06-15)
- [x] `plans/MASTER-PLAN.md` — program dashboard, metrics, critical path (2026-06-15)
- [x] Site coverage S0–S5 — **96.6%** site rollup; `plans/SITE-COVERAGE.md` block closure (2026-06-15)
- [x] Planner coverage slices — `store`, `hooks`, `tldraw`, `lib`, `catalog`, `editor` ≥85% (2026-06-15)
- [x] `results/COVERAGE-REPORT.md` + `scripts/coverage-metrics.mjs` (lines from `statementMap`) (2026-06-15)
- [x] **218** Vitest files / **1685** tests; PlannerWorkspace flake fix (60s timeout) (2026-06-15)
- [x] Planner custom tldraw tools — `defaultTools` merge, furniture/door/window/zone/measure, native select/pan/erase (2026-06-16)
- [x] Canvas-first workspace shell + dockable chrome v0 + slide-over panels (2026-06-16)
- Restored from git remote (git reset --hard origin/main + recover via reflog to ee80d51 tip) per explicit request; re-applied targeted lint fixes from session (2026-06-18)
- Decision: use the custom (fabric) canvas from `E:\floorplan-react` (user: "we will use that canvas, the theme is also nice"). Core files ported under `features/planner/canvas-fabric/` (with reexports, "use client", path fixes). Deps added + installed. Prototype remains reference; active surface stays tldraw until W2 complete and port evaluated. (2026-06-18)
- [x] Playwright `planner-custom-tools.spec.ts` — 17 browser tests for tools, visibility, up/left drag (2026-06-16)
- [x] Playwright `planner-chrome.spec.ts` — 4 browser tests for AccessChrome openers and v2 layout persistence (2026-06-16)
- [x] `plans/PLANNER-CHROME-LAYOUT.md` (archived) — competitive benchmark + M1–M5 roadmap (2026-06-16)
- [x] Planner chrome M1 — extracted chrome module + dedicated `planner-chrome.css` + storage/layout tests (2026-06-16)
- [x] Planner chrome M2 — draggable `AccessChrome` + v2 layout storage migration + Playwright access-strip coverage (2026-06-16)
- [x] Guest workspace browser flow aligned to canvas-first draw mode; library opener now lands on Library tab (2026-06-16)
- [x] Plans folder refresh + autopilot finish: added tests for coverage gaps (onboardingcoach, documentbridge, landingdemo); wired coverage to release:gate in package.json; updated all plans/ docs + Handover/Failures to close remaining (T3, P75, hardcoding advanced, etc.) (2026-06-16)
- [x] Archived completed plans (REPO-STRUCTURE-PLAN, PLANNER-CHROME-LAYOUT, HOMEPAGE-LAYOUT-TYPOGRAPHY + site-design/) to archive/docs/plans/completed-2026-06-16/ per user request to delete completed from active plans. Updated manifests, ARCHIVE-MAP, MASTER etc. (2026-06-16)
- [x] Audit + polish update of `docs/` folder (DOC-MAP, Handover, TESTING, HARDCODING-INVENTORY + root cross-refs): confirmed correct separation (non-plan reference/ops docs + workflow/ops/ in `docs/`; all planning-related in `plans/` or historical archive under docs/plans/completed-*/); reinforced in tables/diagrams/lists/see-also with archive notes and separation rules. No files moved (already correct); re-ran docs:sync:all. (2026-06-16)

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
| `plans/` | Planning-related roadmaps (phased plans, MASTER, ARCHIVE-MAP etc.) — only active: MASTER, TESTING, COVERAGE, PLANNER-COVERAGE-75, SITE-COVERAGE, HARDCODING, ARCHIVE-MAP | (non-plan reference/ops stay in `docs/`; completed planning archived to completed-2026-06-16/) |
| `results/` | Generated JSON — `test-inventory.json`, `coverage-summary.json`, `COVERAGE-REPORT.md` |

## 2026-06-18 Session Target (per explicit instruction)

**Canvas & UI Replacement**: Swap the tldraw 2D engine + dependent UI affordances for the fabric.js canvas + interface from the `E:\floorplan-react` prototype (the "new interface" user selected).

- "we will use that canvas, the theme is also nice"
- "lets change tld for the new interface and combine it with 3rf"
- "its a replacement, we are swapping the old canvas and ui with this"
- "start dev"

Keep/adapt the recent dockable chrome shell, left catalog panel, workflow/status, 3D (r3f Planner3DViewer) around the new canvas. Wire catalog placement, basic tools (edit room for walls), grid/undo, and live 3D sync (convert fabric objects/room to 3D scene items with mm scaling).

Stated target: Make `/planner/guest` (and workspace) render the new fabric canvas as primary 2D surface, with 2D/3D/split views functional for basic flow (room + catalog furniture placement → visible 3D meshes).

Follow-ups after swap: persistence migration (new serializer), full tool parity, e2e test updates, performance, calibration (fabric design-units ↔ real mm).

## Skipped / backlog

- `npm.cmd run test:planner-catalog` still has one fresh-server blocker: `tests/planner-chrome.spec.ts` 3D nonblank-scene pixel assertion (note: will be re-targeted post-swap)
- Planner rollup **78.3%** → large additional test work still needed for any honest push toward **90%**; biggest gaps remain `viewer/`, `3d/`, `landing/`, `ui/`, `persistence/`, `onboarding/`
- Site S4 — Playwright site-only CI script; wire `test:coverage:site` into `release:gate`
- Planner chrome benchmark parity follow-through — see (archived `plans/PLANNER-CHROME-LAYOUT.md`)
