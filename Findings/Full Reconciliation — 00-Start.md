# Option C: Full Reconciliation — 00-Start

## What This Is

A complete architectural cleanup of the Oando planner. Goal: one `PlannerDocument`, one 3D viewer (`Planner3DViewer`), one persistence barrel, zero tldraw residue, and all features wired (templates, blueprint calibration, AI placement).

## Execution Order

Execute phases in this order. Phases marked with `‖` can run in parallel.

| Order | Phase | File | Hours | Parallel |
|-------|-------|------|-------|----------|
| 1 | CSS & Foundation | `01-Phase-CSS-Foundation.md` | 2–3 | — |
| 2 | 3D Viewer Swap | `02-Phase-3D-Viewer-Swap.md` | 4–6 | ‖ with Phase 5 after Phase 1 |
| 3 | tldraw Purge | `05-Phase-tldraw-Purge.md` | 3–4 | ‖ with Phase 2 after Phase 1 |
| 4 | Document Bridge Unification | `03-Phase-Bridge-Unification.md` | 6–8 | after Phase 2 |
| 5 | Persistence Cleanup | `04-Phase-Persistence-Cleanup.md` | 4–6 | after Phase 3 |
| 6 | Feature Completion | `06-Phase-Feature-Completion.md` | 4–6 | after Phase 4 |
| 7 | Test Reorganization | `07-Phase-Test-Reorganization.md` | 4–6 | after all implementation |
| 8 | Final Validation | `08-Phase-Final-Validation.md` | 2–3 | sequential gate |

**Dependency flow:**

```
Phase 1 ─┬─→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 6 ──→ Phase 7 ──→ Phase 8
         └─→ Phase 5 ─────────────────────────────────────────────────────────────↑
```

## How to Use This Plan

1. **Read `00-Start.md`** (this file) for context and order.
2. **Open the phase file** for the work you are doing. Each phase is self-contained.
3. **Check `10-Checklist.md`** to track overall progress across all phases.
4. **Read `09-Notes.md`** for risks, constraints, and reference material.
5. **Write `11-Handover.md`** when you stop work, so the next person knows what is done and what is left.

## Gate Rules

- **No phase may start** until all prior phases in the dependency chain are complete.
- **Each phase must end** with `npm run typecheck` and `npm run lint` passing.
- **Phase 8 (Final Validation)** is the only phase that runs `npm run build` and `npm run test`.
- If a phase cannot finish, document the blocker in `11-Handover.md` and stop.

## Quick Reference

| Concern | See File |
|---------|----------|
| Which phase do I run first? | This file (execution order table) |
| What files do I touch in Phase 3? | `03-Phase-Bridge-Unification.md` |
| What are the risks? | `09-Notes.md` → Risks section |
| What is the overall progress? | `10-Checklist.md` |
| What did the last person finish? | `11-Handover.md` |
| What CSS classes are missing? | `01-Phase-CSS-Foundation.md` |
| What is the 3D viewer swap strategy? | `02-Phase-3D-Viewer-Swap.md` |
| What tldraw files must be deleted? | `05-Phase-tldraw-Purge.md` |
| What tests must be deleted? | `07-Phase-Test-Reorganization.md` |
| What is the final smoke-test list? | `08-Phase-Final-Validation.md` |

## Baseline

- **Branch:** `main` (at time of plan creation, 2026-06-19)
- **TypeScript:** `tsc` exits 0
- **ESLint:** `--max-warnings=0` passes
- **Tests:** 903/906 pass (3 failures: case-sensitive imports, mock mismatches)
- **Build:** Not verified yet (`next build` never run in audit)

## Person Working on This Plan

Write your name, date, and phase in `11-Handover.md` when you start. Update it when you stop.