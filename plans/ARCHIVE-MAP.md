# Archived plans — crosswalk to live `plans/`

*2026-06-15 — read-only index. Do not edit files under `archive/docs/`; update this map when live plans change.*

## Where archived plans live

| Location | Retired | Contents |
|----------|---------|----------|
| `archive/docs/plans/` | 2026-06-13 | Numbered pack `00-INDEX` … `06-COVERAGE-TO-75` |
| `archive/docs/plans/remaining-2026-06-13/` | 2026-06-13 | Last copy of planner impl + quality ledger |
| `archive/docs/plans-retired-2026-06-14/` | 2026-06-14 | Former `docs/new/` categorized pack (site, planner, migration, coverage) |
| `archive/docs/new-pruned-2026-06-13/` | 2026-06-13 | Duplicate governance / handover / testing (superseded by root `docs/`) |

**Live roadmaps:** `plans/TESTING-PLAN.md`, `plans/REPO-STRUCTURE-PLAN.md`. **Live ops:** `docs/Handover.md`, `docs/Failures.md`.

## Supersession table

| Archived file | Live owner | Archive claim | Verified 2026-06-15 |
|---------------|------------|---------------|---------------------|
| `06-COVERAGE-TO-75.md` | `TESTING-PLAN.md` T2–T3 | Jest 75% on `features/planner` | **Vitest v8** — planner **18.3%** (`features/planner/**` only); Jest removed |
| `05-REPOSITORY-REMEDIATION.md` | `REPO-STRUCTURE-PLAN.md` | One planner, thin routes, repo gates | Steps 00–02 done; 03–06 open |
| `05-PHASE0-STATUS.md` | `REPO-STRUCTURE-PLAN.md` step **01** | Root cruft | **Done** (`a8d44a5`) |
| `MIGRATION-STATUS.md` / `12-MIGRATION-STATUS.md` | `REPO-STRUCTURE-PLAN.md` step **02** | 3 live `buddy-planner` imports | **0** live imports in `app/` + `features/` (shim cleanup done) |
| `13-REPO-CLEANUP.md` | `REPO-STRUCTURE-PLAN.md` | Folder map, FOCSS at `app/css/` | FOCSS + unified `/planner` done; step **03** `CONTENTS.md` open |
| `10-MIGRATION-PHASES.md` | `docs/Handover.md` CSS section | Phase 0–7 migration | CSS phases 1–4 + 6 done; Phase 5 hardcoding in progress |
| `05-BACKEND-AND-DATA.md` | `docs/Handover.md` Persistence | `planner_saves` vs Drizzle `plans` | **Unified on Drizzle `plans`** (`plannerPersistence.ts`) |
| `02-PLANNER-IMPLEMENTATION.md` / `02-PLANNER.md` | `docs/Handover.md` M4–M5 | Editor, catalog, AI, export | Live at `/planner`; FilterGrid split open |
| `08-GEOMETRY-STATUS.md` | `docs/Failures.md` | Opening collision P1 gap | **Still open** |
| `07-CAPABILITY-MATRIX.md` | — (no live plan) | Ship/Partial/Gap matrix | Historical; verify in code before use |
| `15-STRATEGIC-GAPS.md` | — (no live plan) | India INR/GST, delivery zones | Product backlog — not in active `plans/` |
| `03-QUALITY-LEDGER.md` | — | Scored 1–5 release gate | Retired; use `npm run test` + `release:gate` |
| `01-SITE-IMPLEMENTATION.md` / `01-SITE-UI.md` | `docs/CSS-ARCHITECTURE.md` | Homepage, catalog typography | Homepage pass done; FilterGrid structural split open |

## Archive blockers — resolved vs still open

| Archive blocker (2026-06-11–14) | Today |
|-----------------------------------|-------|
| `planner_saves` no migration | Resolved — Drizzle `plans` + `/api/plans` |
| 3 `buddy-planner` import sites | Resolved — zero live feature imports |
| `drizzle.config.ts` / typecheck | Resolved — `npm run typecheck` passes |
| Jest 181 planner tests | Superseded — **480/480** Vitest (70 files) |
| `git bad object HEAD` | Resolved in this worktree (`a8d44a5`) |
| Lint 25 errors blocking gate | **Re-verify** before ship — `npm run lint` not re-run in 2026-06-15 doc pass |
| `docs:routes` empty on Windows | Resolved — `[/\\]` matchers in `generate-route-classification.mjs` |
| Opening collision detection | **Open** — `docs/Failures.md` |
| Coverage ≥ 75% | **Open** — `TESTING-PLAN.md` T3 |
| `release:gate` without Vitest | **Open** — `TESTING-PLAN.md` T4 |
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