# 00 - Plan Index

*Created: 2026-06-11 - Authoritative plan pack for oando-consolidated.*
*Updated: 2026-06-14 - Active docs moved into category folders under `docs/new/`.*

## Purpose

This directory (`docs/new/`) is the authoritative plan pack for the oando-consolidated repository. `00-INDEX.md` stays at the root as the entrypoint; the other active docs now live in category folders beneath it. Treat `archive/docs/plans/` as historical reference only.

## Why These Files Remain

`docs/new/` is now the active reference pack, not a scratch area. The remaining files are grouped by job:

| Category | Files | Use when |
|---|---|---|
| Start here | `00-INDEX.md`, `start-here/15-STRATEGIC-GAPS.md` | You need orientation, current blockers, product direction, or read order |
| Product surfaces | `product-surfaces/01-SITE-UI.md`, `product-surfaces/02-PLANNER.md`, `product-surfaces/07-CAPABILITY-MATRIX.md`, `product-surfaces/08-GEOMETRY-STATUS.md`, `product-surfaces/14-UX-PATTERNS.md` | You are changing the public site, planner, geometry, UX, or capability roadmap |
| Quality and evidence | `quality-evidence/03-QUALITY-LEDGER.md`, `quality-evidence/06-TESTING.md`, `quality-evidence/11-COVERAGE.md` | You are verifying, scoring, testing, or re-baselining |
| Architecture and cleanup | `architecture-cleanup/04-DESIGN-SYSTEM.md`, `architecture-cleanup/05-BACKEND-AND-DATA.md`, `architecture-cleanup/10-MIGRATION-PHASES.md`, `architecture-cleanup/12-MIGRATION-STATUS.md`, `architecture-cleanup/13-REPO-CLEANUP.md` | You are touching tokens, backend, persistence, migration, imports, or repo structure |

Archived on 2026-06-13 because they duplicated or conflicted with the current pack:

| Archived group | Location | Why archived |
|---|---|---|
| Governance/meta pack | `archive/docs/new-pruned-2026-06-13/governance/` | Duplicated root `AGENTS.md`, root `Handover.md`, root `Failures.md`, `06-TESTING.md`, and this index |
| Phase 0 status report | `archive/docs/new-pruned-2026-06-13/phase-status/` | Folded into `10-MIGRATION-PHASES.md` so phases have one authority |
| Review and brainstorm notes | `archive/docs/new-pruned-2026-06-13/reference/` | Useful historical ideas, not active operating instructions |

Do not add new active docs here unless `00-INDEX.md` is updated with the category and owner.

## Folder Layout

| Folder | Purpose |
|---|---|
| `docs/new/` | Entry index only |
| `docs/new/start-here/` | Orientation and strategy |
| `docs/new/product-surfaces/` | Site, planner, geometry, UX, capability docs |
| `docs/new/quality-evidence/` | Testing, coverage, quality ledger |
| `docs/new/architecture-cleanup/` | Backend, migration, import cleanup, repo cleanup |

## Files in This Pack

| # | Path | Scope | Owner |
|---|---|---|---|
| 00 | `00-INDEX.md` | This file - master index and status | Both |
| 01 | `product-surfaces/01-SITE-UI.md` | Public marketing site - homepage, planner landing, nav, footer, typography, mobile | UI lead |
| 02 | `product-surfaces/02-PLANNER.md` | Workspace planner - editor shell, catalog, blocks, 3D, AI, export | Planner lead |
| 03 | `quality-evidence/03-QUALITY-LEDGER.md` | Scored release gate (1-5) for every shippable phase | Both |
| 04 | `architecture-cleanup/04-DESIGN-SYSTEM.md` | Token contract, typography, buttons, cards, animation | UI lead |
| 05 | `architecture-cleanup/05-BACKEND-AND-DATA.md` | Auth, three databases, storage, API contracts, env vars, known risks | Backend lead |
| 06 | `quality-evidence/06-TESTING.md` | Test matrix, coverage targets, CI gate, known Jest/E2E gaps | Both |
| 07 | `product-surfaces/07-CAPABILITY-MATRIX.md` | Competitive matrix + live Ship/Partial/Gap status | Product lead |
| 08 | `product-surfaces/08-GEOMETRY-STATUS.md` | P0 geometry inventory + snap overlay + P1 collision gaps | Planner lead |
| 10 | `architecture-cleanup/10-MIGRATION-PHASES.md` | Single phase authority; Phase 0 through Phase 7; dual-write partial | Both |
| 11 | `quality-evidence/11-COVERAGE.md` | Vitest coverage plan - 75% target; baseline not captured | QA lead |
| 12 | `architecture-cleanup/12-MIGRATION-STATUS.md` | 3 active legacy imports; oando editor archived | Planner lead |
| 13 | `architecture-cleanup/13-REPO-CLEANUP.md` | Folder map, archive plan, live cleanup status | Both |
| 14 | `product-surfaces/14-UX-PATTERNS.md` | UX spec + live audit (autosave, coach, guest claim) | UI lead |
| 15 | `start-here/15-STRATEGIC-GAPS.md` | Vision, India gaps, suppressors corrected, roadmap | Product lead |

## Current Status (2026-06-14)

| Surface | TypeScript | Lint | Last Quality Score |
|---|---|---|---|
| Site public | 0 errors | Lint has site/API findings | Not formally scored |
| Planner | 0 errors | Lint has planner findings | Not formally scored |
| Ops portal | Not re-verified in this batch | Not re-verified in this batch | Not formally scored |
| Shared FOCSS | **`app/css/`** | Moved from `app/(site)/css/` | `04-DESIGN-SYSTEM.md` §0 |

Live verification on 2026-06-13 (local PowerShell, `npm.cmd`):
- `npm.cmd run typecheck` — pass
- `npm.cmd run test:planner` — 181/181 pass across 22 files
- `npm.cmd run lint` — fail with 25 concrete errors, including planner lint issues and site/API `no-useless-assignment`; this replaces the stale "36 planner errors" and earlier plugin-crash claims.
- `git status --short` — fail (`fatal: bad object HEAD`); do not rely on Git state until repository metadata is repaired.

Older 2026-06-12 proof remains useful for historical build/DB context, but any ship claim must be re-run after the 0504 import and parity repairs.

Treat older comments about suppressed planner errors as historical unless re-proven from the live repo.

## Milestone Snapshot (M4–M6)

| Milestone | Status | Key evidence |
|---|---|---|
| M4 Export/Persistence | In progress | `buildPlannerDocumentFromEditor`, Drizzle `plans` live, 0504 draft/session pieces compile, admin `planner_saves` still separate |
| M5 Site alignment | In progress | Homepage recovery done; catalog filters/downloads typography open |
| M6 Launch | In progress | Typecheck + planner tests pass; lint blocks full gate; latest build/release gate not re-run |

## Critical Blockers (Current)

1. Admin Supabase `planner_saves` — no tracked migration; admin API still uses it.
2. `npm.cmd run lint` — 25 current errors block `release:gate` (M6).
3. Server save round-trip + RLS tests still missing (`plannerSavesRLS.test.ts`).
4. Site UI evidence checklist incomplete (Lighthouse, full viewport matrix).
5. Drizzle `0000` full migration vs partial legacy schema — use `db:ensure-plans` bootstrap until reconciled.
6. Git metadata is unhealthy (`fatal: bad object HEAD`); verification and change review cannot depend on Git until repaired.

## 0504 Revision Rationale (2026-06-13)

`E:\Goodsites\Final_oando_0504` was reviewed as a donor/reference snapshot, not a replacement architecture. It brought useful planner product ideas and files around draft/session handling, layer management, mobile panels, 3D viewer direction, quote bridge, compliance checks, and import/export polish. Direct import was risky because the donor assumed a `src/` app, old compatibility imports (`@/components/draw/*`, `@/lib/getProducts`), and its own planner contracts. Therefore the current plan is selective parity inside `features/planner/`, preserving the flat-root Next.js app and the canonical `PlannerDocument`.

## How to Use This Pack

1. Read the relevant numbered file before touching code in that area.
2. Validate all status claims against live files and current `npm run typecheck` + `npm run lint` output - never trust doc comments alone.
3. After any meaningful batch of work, update the score log in `quality-evidence/03-QUALITY-LEDGER.md`.
4. Blockers and skipped items go in root `Failures.md`. Handover state goes in root `Handover.md`.
5. Do not create new plan files outside this directory without updating this index.

## Read Order for New Contributors

1. This file (`00-INDEX.md`)
2. `start-here/15-STRATEGIC-GAPS.md` - understand what we're building and why
3. `architecture-cleanup/13-REPO-CLEANUP.md` - understand where everything lives
4. `architecture-cleanup/04-DESIGN-SYSTEM.md` - understand the token/component contract
5. `architecture-cleanup/10-MIGRATION-PHASES.md` - understand the migration sequence
6. The file relevant to your task
7. Live source files you will touch

## Coverage vs Archived Plans

| Archived plan file | Covered in docs/new/ |
|---|---|
| `00-INDEX.md` | This file |
| `01-SITE-IMPLEMENTATION.md` | `product-surfaces/01-SITE-UI.md` |
| `02-PLANNER-IMPLEMENTATION.md` | `product-surfaces/02-PLANNER.md` |
| `03-PLANNER-QUALITY-LEDGER.md` | `quality-evidence/03-QUALITY-LEDGER.md` |
| `04-PLANNER-CAPABILITY-MATRIX.md` | `product-surfaces/07-CAPABILITY-MATRIX.md` |
| `04-P0-GEOMETRY-STATUS.md` | `product-surfaces/08-GEOMETRY-STATUS.md` |
| `05-PHASE0-STATUS.md` | `architecture-cleanup/10-MIGRATION-PHASES.md` Phase 0 section |
| `05-REPOSITORY-REMEDIATION.md` | `architecture-cleanup/10-MIGRATION-PHASES.md` + `architecture-cleanup/13-REPO-CLEANUP.md` |
| `06-COVERAGE-TO-75.md` | `quality-evidence/11-COVERAGE.md` |
| `MIGRATION-STATUS.md` | `architecture-cleanup/12-MIGRATION-STATUS.md` |
| `PLANNER-SAVES-SCHEMA.md` | `architecture-cleanup/05-BACKEND-AND-DATA.md` section 3 |
| `HONEST-ASSESSMENT.md` | `start-here/15-STRATEGIC-GAPS.md` |
| `IDEAL-APPROACH.md` | `start-here/15-STRATEGIC-GAPS.md` |

Note: the final live `docs/plans/` files were archived on 2026-06-13 under `archive/docs/plans/remaining-2026-06-13/`.
