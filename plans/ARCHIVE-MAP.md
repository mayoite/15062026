# Archived plans — crosswalk to live `plans/`

*2026-06-16 — read-only index. Do not edit files under `archive/docs/`; update this map when live plans change.*

## Where archived plans live

| Location | Retired | Contents |
|----------|---------|----------|
| `archive/docs/plans/` | 2026-06-13 | Numbered pack `00-INDEX` … `06-COVERAGE-TO-75` |
| `archive/docs/plans/remaining-2026-06-13/` | 2026-06-13 | Last copy of planner impl + quality ledger |
| `archive/docs/plans-retired-2026-06-14/` | 2026-06-14 | Former `docs/new/` categorized pack (site, planner, migration, coverage) |
| `archive/docs/new-pruned-2026-06-13/` | 2026-06-13 | Duplicate governance / handover / testing (superseded by root `docs/`) |
| `archive/docs/plans/completed-2026-06-16/` | 2026-06-16 | Completed full plans: REPO-STRUCTURE-PLAN.md, PLANNER-CHROME-LAYOUT.md (M0-M6 done), HOMEPAGE-LAYOUT-TYPOGRAPHY.md (all waves), and site-design/ execution detail |

**Live roadmaps:** `plans/MASTER-PLAN.md`, `plans/TESTING-PLAN.md`, `plans/COVERAGE-PLAN.md`, `plans/PLANNER-COVERAGE-75.md`, `plans/SITE-COVERAGE.md`, `plans/HARDCODING-PLAN.md`, `plans/ARCHIVE-MAP.md`. **Live ops:** `docs/Handover.md`, `docs/Failures.md`. (Completed plans archived to `archive/docs/plans/completed-2026-06-16/`)

## Supersession table

| Archived file | Live owner | Archive claim | Verified 2026-06-16 |
|---------------|------------|---------------|---------------------|
| `06-COVERAGE-TO-75.md` | `TESTING-PLAN.md` / `PLANNER-COVERAGE-75.md` | Jest 75% on `features/planner` | **Vitest v8** — planner **78.1%** stmts (branches 69.5% gap); all 4 metrics target open |
| `05-REPOSITORY-REMEDIATION.md` | — (REPO-STRUCTURE-PLAN.md archived) | One planner, thin routes, repo gates | **All 00–06 Complete** (archived 2026-06-16) |
| `05-PHASE0-STATUS.md` | — (REPO-STRUCTURE-PLAN.md archived) | Root cruft | **Done** (`a8d44a5`) |
| `MIGRATION-STATUS.md` / `12-MIGRATION-STATUS.md` | — (REPO-STRUCTURE-PLAN.md archived) | 3 live `buddy-planner` imports | **0** live imports in `app/` + `features/` (shim cleanup done) |
| `13-REPO-CLEANUP.md` | — (REPO-STRUCTURE-PLAN.md archived) | Folder map, FOCSS at `app/css/` | FOCSS + unified `/planner` + CONTENTS done; **REPO complete** (archived) |
| `10-MIGRATION-PHASES.md` | `docs/Handover.md` CSS section | Phase 0–7 migration | CSS phases 1–4 + 6 done; Phase 5 (hardcoding P3) + homepage typography done |
| `05-BACKEND-AND-DATA.md` | `docs/Handover.md` Persistence | `planner_saves` vs Drizzle `plans` | **Unified on Drizzle `plans`** (`plannerPersistence.ts`) |
| `02-PLANNER-IMPLEMENTATION.md` / `02-PLANNER.md` | `docs/Handover.md` M4–M5 + chrome | Editor, catalog, AI, export | Live at `/planner`; chrome v0/M0-M6 + custom tools **Done** (17/17 + 11/11 tests); FilterGrid split done |
| `08-GEOMETRY-STATUS.md` | `docs/Failures.md` | Opening collision P1 gap | **Still open** |
| `07-CAPABILITY-MATRIX.md` | — (no live plan) | Ship/Partial/Gap matrix | Historical; verify in code before use |
| `15-STRATEGIC-GAPS.md` | — (no live plan) | India INR/GST, delivery zones | Product backlog — not in active `plans/` |
| `03-QUALITY-LEDGER.md` | — | Scored 1–5 release gate | Retired; use `npm run test` + `release:gate` |
| `01-SITE-IMPLEMENTATION.md` / `01-SITE-UI.md` | `docs/CSS-ARCHITECTURE.md` | Homepage, catalog typography | Homepage pass + typography waves done; FilterGrid structural split done |
| `REPO-STRUCTURE-PLAN.md` | — (archived) | All repo structure steps 00-06 | **Complete** (archived to completed-2026-06-16/) |
| `PLANNER-CHROME-LAYOUT.md` | — (archived) | Planner canvas-first shell + dockable chrome M0-M6 | **Done** (verified tests 12/12 + 11/11; archived 2026-06-16) |
| `HOMEPAGE-LAYOUT-TYPOGRAPHY.md` | — (archived) | `/` homepage layout + typography spec + waves | **All waves done** (site-design/ execution archived with it) |

## Archive blockers — resolved vs still open (2026-06-16)

| Archive blocker (2026-06-11–14) | Today |
|-----------------------------------|-------|
| `planner_saves` no migration | Resolved — Drizzle `plans` + `/api/plans` |
| 3 `buddy-planner` import sites | Resolved — zero live feature imports |
| `drizzle.config.ts` / typecheck | Resolved — `npm run typecheck` passes |
| Jest 181 planner tests | Superseded — **1789/1789** Vitest (235 files) |
| `git bad object HEAD` | Resolved in this worktree (`a8d44a5`) |
| Lint 25 errors blocking gate | Re-verify on clean tree; current typecheck/lint/test green on dirty (homepage/chrome work) |
| `docs:routes` empty on Windows | Resolved — `[/\\]` matchers in `generate-route-classification.mjs` |
| Opening collision detection | **Open** — `docs/Failures.md` |
| Coverage ≥ 75% (all 4 metrics) | **Open** (planner branches 69.5%; stmts/fn/lines ok; site closed) — `PLANNER-COVERAGE-75.md` |
| `release:gate` full (coverage + DB Playwright) | **Open** — `TESTING-PLAN.md` T4 / Failures |
| INR/GST quote schema | **Open** — archive only (`15-STRATEGIC-GAPS.md`) |

## When to read archive

- **History / rationale** — why a folder was archived, old phase numbering, 0504 donor notes
- **Product ideas** — capability matrix, strategic gaps, UX patterns
- **Do not** treat archive status tables as current — always verify with `docs/Handover.md` + commands in `docs/TESTING.md`

## Read order (archive deep-dive)

1. This file
2. `archive/docs/plans-retired-2026-06-14/00-start-here/INDEX.md` (retired pack index)
3. Topic file from supersession table above
4. Live `plans/TESTING-PLAN.md` or `plans/REPO-STRUCTURE-PLAN.md` for what to do next