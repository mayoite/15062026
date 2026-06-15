# 10 - Repository Migration Phases

*Created: 2026-06-11 - Step-by-step migration sequence with verification gates.*
*Rewritten: 2026-06-13 - Single phase authority; Phase 0 status folded in; duplicate phase report archived.*

## Purpose

This is the only active phase plan. It turns the repository into one understandable, testable Next.js product with:

- one planner at `/planner/**`
- one canonical `PlannerDocument`
- thin routes
- explicit module ownership
- reliable validation through `06-TESTING.md`
- no active code hidden behind legacy roots or suppressed TypeScript errors

The old standalone Phase 0 report was archived to `archive/docs/new-pruned-2026-06-13/phase-status/09-PHASE0-STATUS.md`.

## Phase Dashboard

| Phase | Name | Status | Exit gate |
|---|---|---|---|
| 0 | Restore Trust | **Current** | Typecheck, lint, planner tests, build, release gate, and Git state are trustworthy |
| 1 | Canonical Contracts | **Partial** | One planner document contract feeds save, load, export, and donor adapters |
| 2 | Remove Legacy Dependencies | **Partial** | Zero active non-archive imports from retired planner roots |
| 3 | Consolidate Planner Runtime | **Partial** | One editor, one catalog source, one persistence flow, one 2D-to-3D bridge |
| 4 | Backend Alignment | **Partial** | Save ownership, quote handoff, API tests, and permissions are clear |
| 5 | Archive Legacy Trees | **Partial** | Compatibility trees are proven unused, then archived |
| 6 | Optional Source Move | **Deferred** | Only after Phases 0-5 pass and a target state is approved |
| 7 | Ops Portal Decision | **Deferred** | Keep integrated unless an independent deploy case is proven |

## Phase 0 - Restore Trust

**Goal:** Make health claims reproducible before more product work.

**Current proof (2026-06-13):**

| Check | Result |
|---|---|
| `npm.cmd run typecheck` | Pass |
| `npm.cmd run test:planner` | Pass, 181/181 |
| `npm.cmd run lint` | Fail, 25 current errors |
| `npm.cmd run build` | Needs re-run after 0504 parity repairs |
| `npm.cmd run release:gate` | Blocked at lint |
| `git status --short` | Fails with `fatal: bad object HEAD` |

**Work items:**

| ID | Work | Status | Proof / target |
|---|---|---|---|
| P0.1 | Fix current lint errors | Open | `npm.cmd run lint` exits 0 |
| P0.2 | Repair or document broken Git metadata | Open | `git status --short` works, or a recovery path is written |
| P0.3 | Re-run build after 0504 parity repairs | Open | `npm.cmd run build` passes |
| P0.4 | Re-run full release gate | Open | `npm.cmd run release:gate` passes or exact blocker is logged |
| P0.5 | Keep TypeScript visible and clean | Done | `npm.cmd run typecheck` passes |
| P0.6 | Keep planner regression suite meaningful | Done | `npm.cmd run test:planner` passes |
| P0.7 | Re-check Drizzle `plans` bootstrap | Partial | `db:ensure-plans` is known idempotent; latest DB check not re-run |
| P0.8 | Decide admin `planner_saves` ownership | Open | Migration or explicit admin-only contract |
| P0.9 | Move/include orphan bridge tests | Open | SH/NS bridge tests run in CI path |
| P0.10 | Break `shared` -> `app/` import | Open | `SuiteLoginPage.tsx` no longer imports from `app/(site)` |

**Already completed in Phase 0:**

- Drizzle config dotenv path fixed.
- `planner_saves` / `plans` contract documented in `05-BACKEND-AND-DATA.md`.
- Drizzle `plans` table bootstrapped through `db:ensure-plans`.
- User `/api/plans` confirmed on Drizzle path.
- Jest roots, aliases, setup, and result folders established.
- `@/components/draw/*` active alias removed or shimmed away from hard failure.
- 0504 import TypeScript breakage repaired enough for typecheck.

## Phase 1 - Canonical Contracts

**Goal:** One planner document model across canvas, export, save, load, and donor compatibility.

| ID | Work | Status | Proof / target |
|---|---|---|---|
| P1.1 | Use `features/planner/model/plannerDocument.ts` as canonical | Done | Current model is chosen |
| P1.2 | Deprecate `features/planner/shared/document/types.ts` | Open | No active imports from duplicate contract |
| P1.3 | Keep 0504 session/document compatibility behind adapters | Partial | Typecheck passes; lint cleanup remains |
| P1.4 | Complete `buildPlannerDocumentFromEditor` bridge | Partial | Snapshot + workspace in `sceneJson`; deeper shape mapping open |
| P1.5 | Add canvas -> document -> Drizzle -> document -> canvas test | Open | Round-trip test passes |
| P1.6 | Add schema-version adapters for saved documents | Open | Older saved documents load through tested adapters |
| P1.7 | Decide `planner_saves` vs `plans` ownership | Open | Single owner or documented boundary |

**Exit gate:** one exported `PlannerDocument`; persistence/export both consume it; legacy formats only enter through tested adapters.

## Phase 2 - Remove Legacy Dependencies

**Goal:** Retired planner roots no longer participate in active code.

| ID | File | Legacy dependency | Target | Status |
|---|---|---|---|---|
| P2.1 | `features/planner/tldraw/shapes.ts` | `buddy-planner/shapes/shapeUtils` | Move shape utils into `features/planner/tldraw/` | Open |
| P2.2 | `features/planner/data/csvCatalogIngest.ts` | `buddy-planner/ui/catalog/catalogData` types | `features/planner/data/workspaceCatalog` types | Open |
| P2.3 | `tools/scripts/ingest-planner-catalog.ts` | Same catalog legacy types | Same current catalog target | Open |
| P2.4 | Lint/import boundary | Retired roots allowed by convention only | No `@/features/buddy-planner` or `@/features/oando-planner` outside archive | Open |

**Route rule:** `/buddy-planner/**` and `/oando-planner/**` remain redirects only.

**Exit gate:** zero active non-archive legacy planner imports.

## Phase 3 - Consolidate Planner Runtime

**Goal:** One live planner runtime, not a stitched mix of legacy and donor systems.

| ID | Work | Status | Proof / target |
|---|---|---|---|
| P3.1 | Keep canonical editor in `features/planner/` + `app/planner/` | Done | Live `/planner/**` uses canonical route |
| P3.2 | Treat Tldraw as editor adapter and R3F as viewer adapter | Partial | Current structure mostly follows this |
| P3.3 | Keep 0504 parity features inside canonical runtime only | Partial | Layer/blueprint features adapted; lint/browser audit open |
| P3.4 | Migrate buddy shape utilities into planner-owned files | Open | No buddy shape imports remain |
| P3.5 | Split files above 700 lines where practical | Open | File-size reason or split is documented |
| P3.6 | Prove admin/portal references do not revive old planner runtime | Open | Route/import audit |

**Exit gate:** one placement flow, one catalog source, one persistence flow, one 2D-to-3D bridge.

## Phase 4 - Backend Alignment

**Goal:** Saves, quote handoff, and permissions become trustworthy.

| ID | Work | Status | Proof / target |
|---|---|---|---|
| P4.1 | Keep user plan API thin | Done | `app/api/plans/route.ts` delegates to planner save logic |
| P4.2 | Align admin plan API or document admin-only store | Open | Migration or explicit contract |
| P4.3 | Add server save round-trip test | Open | Save -> load -> compare `PlannerDocument` |
| P4.4 | Add RLS/permission tests for planner saves | Open | User A cannot read User B |
| P4.5 | Move quote handoff server-side | Open | Critical quote path is not localStorage-only |
| P4.6 | Complete guest -> signup -> server write path | Open | Guest plan survives registration into server save |

**Exit gate:** API contract tests pass; no browser import of server credentials; no duplicate persistence logic.

## Phase 5 - Archive Legacy Trees

**Goal:** Archive legacy only after proof.

| ID | Work | Status | Proof / target |
|---|---|---|---|
| P5.1 | Keep already archived oando editor tree in archive | Done | `archive/features/oando-planner/` |
| P5.2 | Prove zero active consumers for buddy shape shims | Open | `rg` / import graph evidence |
| P5.3 | Archive redirect route folders only after redirect ownership is clear | Open | Route smoke tests pass |
| P5.4 | Update `13-REPO-CLEANUP.md` after each archive move | Open | Cleanup map stays current |

**Stop and confirm before moving protected paths** listed in `AGENTS.md` and `13-REPO-CLEANUP.md`.

**Exit gate:** import graph clean; route smoke tests pass; archive map updated.

## Phase 6 - Optional `src/` Move

**Status:** Deferred.

Do not start until Phases 0-5 pass. This would change top-level structure, so it requires:

- explicit user approval
- written target state
- path map
- import migration plan
- rollback plan
- full verification gate

## Phase 7 - Ops Portal Decision

**Goal:** Decide whether ops stays integrated or gets its own deployment.

| ID | Work | Status | Proof / target |
|---|---|---|---|
| P7.1 | Keep ops integrated by default | Current | `app/ops/` remains part of one app |
| P7.2 | Define independent deploy case if needed | Deferred | Written cost/benefit and auth/data plan |
| P7.3 | Thin ops scope doc | Open | Admin/CRM/catalog responsibilities clear |

**Exit gate:** ops/admin auth, route, and data responsibilities are explicit.

## Next Work Queue

Do these in order. Do not pull later phases forward while Phase 0 is red.

| Order | Phase | Item |
|---|---|---|
| 1 | P0 | Fix the 25 current ESLint errors |
| 2 | P0 | Repair Git metadata or write an explicit recovery/review path |
| 3 | P0 | Re-run `npm.cmd run build` after 0504 parity repairs |
| 4 | P0 | Run `npm.cmd run release:gate` and log exact result |
| 5 | P0/P2 | Move or include `catalogBlockBridge.test.ts` so SH/NS bridge tests run |
| 6 | P2 | Remove last 3 buddy-planner imports |
| 7 | P1 | Deprecate duplicate `features/planner/shared/document/types.ts` |
| 8 | P4 | Decide admin `planner_saves` migration vs explicit dual-store contract |
| 9 | P4 | Add live DB round-trip test for planner saves |
| 10 | P0/P2 | Break `shared` -> `app` import in `SuiteLoginPage.tsx` |
| 11 | P2 | Add import-boundary lint rule for retired planner roots |

## Dependency Direction Rules

```text
app -> features/*/ui or application
ui -> application + domain
application -> domain + declared ports
infrastructure -> domain + external libraries
server -> application + infrastructure
shared -> no feature imports
domain -> no React, Next.js, Supabase, Tldraw, or R3F imports
```

**Forbidden:** shared -> feature; feature -> feature internals; route handlers with business logic; compatibility roots owning active behavior.

## Cross-References

| Topic | Doc |
|---|---|
| Test gate | `06-TESTING.md` |
| Persistence and DB risks | `05-BACKEND-AND-DATA.md` |
| Legacy import tracker | `12-MIGRATION-STATUS.md` |
| Archive / cleanup map | `13-REPO-CLEANUP.md` |
| Product direction | `15-STRATEGIC-GAPS.md` |
