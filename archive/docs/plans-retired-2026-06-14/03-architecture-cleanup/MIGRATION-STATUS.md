# 12 — Phase 2 Migration Status

*Source: archive/docs/plans/MIGRATION-STATUS.md — Created: 2026-06-11*
*Updated: 2026-06-12 — Live import audit; most editor code already archived.*

## Executive Summary

| Metric | 2026-06-11 doc | 2026-06-12 live |
|---|---|---|
| Legacy import count cited | **176** | **3 active import sites** (non-archive) |
| `oando-planner` editor in tree | Active under `features/` | **Archived** under `archive/features/oando-planner/` |
| Canonical editor | Partial | **`features/planner/`** — live at `/planner/canvas` |
| Blocker | Phase 3 modules missing | **Narrow** — buddy shape shim + catalog types remain |

**Strategy (revised):** Finish **3-import cleanup** (Step 1), then Phase 1 document dedup, then archive remaining `buddy-planner` shims (Phase 5).

---

## Active Legacy Imports (2026-06-12 audit)

Only these **non-archive** files import `@/features/buddy-planner` or `@/features/oando-planner`:

| # | File | Import | Canonical target |
|---|---|---|---|
| 1 | `features/planner/tldraw/shapes.ts` | `buddy-planner/shapes/shapeUtils` | `features/planner/tldraw/shapes/shapeUtils/` (move or re-export locally) |
| 2 | `features/planner/data/csvCatalogIngest.ts` | `buddy-planner/ui/catalog/catalogData` types | `features/planner/data/workspaceCatalog.ts` types |
| 3 | `tools/scripts/ingest-planner-catalog.ts` | same catalog types | same |

**Comments only (no import):** `app/admin/plans/page.tsx`, `app/(site)/portal/[id]/page.tsx` — reference `features/oando-planner/` in comments; implementations may still live outside archive (audit separately).

**Compatibility strings (not imports):** `plannerIdentity.ts`, `proxy.ts`, `RouteChrome.tsx` — legacy route paths for redirects.

---

## What Was Migrated (implicit)

Large `oando-planner` editor batch (~40 files listed in 2026-06-11 doc) now lives under **`archive/features/oando-planner/ui/editor/`** — no longer active imports from app/features/lib.

Canonical equivalents in use:

| Concern | Canonical path |
|---|---|
| Editor shell | `features/planner/editor/PlannerWorkspace.tsx` |
| Tldraw canvas | `features/planner/tldraw/` |
| 3D viewer | `features/planner/viewer/` |
| Catalog store | `features/planner/store/`, `data/workspaceCatalog.ts` |
| Persistence | `features/planner/data/persistence.ts`, `store/plannerPersistence.ts` |
| Export | `features/planner/editor/exportActions.ts`, `shared/export/` |

---

## What CANNOT Migrate Yet

### Buddy shape utils (blocking import #1)

`ALL_SHAPE_UTILS` still re-exported from buddy-planner. Must copy or move shape util registrations into `features/planner/tldraw/shapes/shapeUtils/` before deleting shim.

### Admin / portal surfaces

| Surface | Location | Status |
|---|---|---|
| Admin plans UI | `app/admin/plans/` + `features/oando-planner/admin/` (verify) | Uses Supabase `planner_saves` |
| Portal viewer | `app/(site)/portal/` stub | Not wired to unified canvas |

### Modules still in archive only (Phase 3 if needed)

From archived `oando-planner/lib/`: `quoteEngine`, `quoteSubmission`, `aiService`, `shareProject`, export helpers — re-home to `features/planner/` only if still required by live routes.

---

## Shared Auth Cycle

**2026-06-11:** 10 imports from `features/shared/auth/` → buddy-planner.

**2026-06-12:** No `buddy-planner` imports found under `features/shared/auth/`. Cycle **reduced or resolved** for auth — re-verify with:

```bash
rg "buddy-planner" features/shared --glob "*.{ts,tsx}"
```

Remaining dependency violation: `features/shared/entry/SuiteLoginPage.tsx` → `app/(site)/login/LoginForm` (`10-MIGRATION-PHASES.md` Phase 0).

---

## Step-by-Step Execution Plan (revised)

### Step 1 — Clear 3 active imports ← **NEXT**
- **Risk:** Low–medium (shapes.ts is critical path)
- **Validation:** `npm run typecheck` + `npm run test:planner` + manual canvas smoke

### Step 2 — Vitest include co-located tests
- Move or include `catalogBlockBridge.test.ts` and `features/planner/shared/**/*.test.*`
- **Validation:** test count > 67

### Step 3 — Deprecate `planner/shared/document/types.ts`
- Grep consumers; point to `model/plannerDocument.ts`

### Step 4 — Archive remaining `features/buddy-planner/` (after Step 1)
- Keep redirect shims until `proxy.ts` verified

### Step 5 — Archive legacy route folders
- `app/buddy-planner/`, `app/oando-planner/` → `archive/app/` when redirects stable

---

## Progress Tracking

| Step | Status | Date | Notes |
|---|---|---|---|
| 1 — 3 active imports | **TODO** | — | Down from ~176 |
| 2 — Co-located tests in CI | **TODO** | — | `10-MIGRATION-PHASES.md` Phase 0 |
| 3 — Document dedup | **TODO** | — | Phase 1 |
| 4 — Archive buddy-planner | **TODO** | — | After shapes migrated |
| 5 — Archive route apps | **TODO** | — | Phase 5 |

oando-planner editor archive | **DONE** (de facto) | 2026-06-12 | Under `archive/features/oando-planner/`

---

## Validation Checkpoints

After each step:

```bash
npm run typecheck
npm run build
npm run test:planner
rg "@/features/(buddy-planner|oando-planner)" --glob "*.{ts,tsx}" --glob "!archive/**"
```

**Acceptance:** Active import grep returns **zero** lines outside `archive/` and explicit compatibility shims documented in this file.

---

## Rollback Plan

Unchanged from 2026-06-11 — per-step `git checkout` on touched files; archive restores via `git mv` from `archive/features/`.

---

## Cross-References

| Topic | Doc |
|---|---|
| Phase sequence | `10-MIGRATION-PHASES.md` |
| Archive steps | `13-REPO-CLEANUP.md` |
| Phase 0 gates | `10-MIGRATION-PHASES.md` |
