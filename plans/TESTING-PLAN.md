# Testing & coverage — phased plan

*Strategy layer · Program: [`MASTER-PLAN.md`](MASTER-PLAN.md) · Coverage: [`COVERAGE-PLAN.md`](COVERAGE-PLAN.md) · How-to: [`docs/TESTING.md`](../docs/TESTING.md)*

## Goal

Green Vitest + Playwright gates, tracked inventory, **dual coverage tracks**, optional doc CI — gate catalog/lib merges until coverage milestones hit.

| Track | Scope | Target | Execution plan |
|-------|--------|--------|----------------|
| Planner | `features/planner/**` | **≥ 75%** | [`PLANNER-COVERAGE-75.md`](PLANNER-COVERAGE-75.md) |
| Main site | site-logic modules | **≥ 50%** | [`SITE-COVERAGE.md`](SITE-COVERAGE.md) |

Playwright is release smoke only — never merged into coverage %. Jest/Istanbul retired.

---

## Live metrics (2026-06-15)

| Item | Value |
|------|--------|
| `npm run test` | **542/542** · **75** Vitest files |
| Planner coverage | **22.3%** stmts (`vitest.config.ts` thresholds **20%**) |
| Site coverage | **24.0%** stmts (`vitest.site.config.ts` · `scopes.site`) |
| Playwright | **8** `*.spec.ts` |
| `release:gate` | `test` wired ✓ · full gate needs `DATABASE_URL` (`docs/Failures.md`) |

---

## Phase dashboard

| Phase | Focus | Status |
|-------|--------|--------|
| **T0** | Doc inventory + coverage CI tooling | Done |
| **T1** | All Vitest suites green | Done |
| **T2** | Planner baseline threshold | **In progress** (ratchet 20%) |
| **T3** | Planner → 75% (slices A–F) | **In progress** (Slice A ~70%) |
| **T4** | Gate: Vitest + coverage | Partial (T4.1 done) |
| **S0** | Site coverage profile | **Done** |
| **S1–S4** | Site → 50% | Open |

---

## T0 — Doc inventory ✓

`docs:sync`, `docs:check`, `docs:sync:coverage` — see `docs/DOC-MAP.md`. Optional: wire `docs:check` on PR.

---

## T1 — Vitest green ✓

No `vitest.config.ts` excludes. `jest` → `vi` in ops/catalog tests. Duplicate catalog suite removed.

---

## T2 — Planner threshold (open)

After each coverage PR:

1. Run `npm run test:coverage`
2. Set `vitest.config.ts` thresholds ~2% below measured planner %
3. `npm run docs:sync:coverage` → commit `results/coverage-summary.json`

---

## T3 — Planner 75%

**Detail:** [`PLANNER-COVERAGE-75.md`](PLANNER-COVERAGE-75.md)

| Slice | Area | Status |
|-------|------|--------|
| A | `store/` | **In progress** — facade + offline + project + UI done |
| B | `hooks/` | Open |
| C | `tldraw/tools/` | Open |
| D | `editor/`, `lib/` | Open |
| E | `catalog/` gaps | Open |
| F | `ui/`, `viewer/`, `3d/` | Defer |

**Done when:** `scopes.features.planner` ≥ 75% all metrics.

---

## S0–S4 — Site coverage

**Detail:** [`SITE-COVERAGE.md`](SITE-COVERAGE.md)

| Slice | Status |
|-------|--------|
| S0 Profile + `test:coverage:site` | **Done** |
| S1 Catalog + `data/site` | **Next** |
| S2 `features/shared` | Open |
| S3 site-assistant, ops | Open |
| S4 Playwright site specs | Open |

---

## T4 — Release gate

| Step | Action | Status |
|------|--------|--------|
| T4.1 | `npm run test` in `release:gate` | **Done** |
| T4.2 | `npm run test:coverage` @ planner ~40%+ | Open |
| T4.3 | `npm run test:coverage:site` @ site baseline | Open |
| T4.4 | `DATABASE_URL` / catalog redirect | Open (`docs/Failures.md`) |

---

## PR order

See [`MASTER-PLAN.md`](MASTER-PLAN.md) § Critical path. Summary:

1. P-PR-A3 → P-PR-B (planner store finish → hooks)
2. S-PR1 (site catalog/data)
3. T4.2–T4.3 when thresholds stable

---

## Verify

```bash
npm.cmd run test
npm.cmd run test:unit
npm.cmd run test:planner
npm.cmd run test:coverage
npm.cmd run test:coverage:site
npm.cmd run docs:check
```

Tick phases in `docs/Handover.md`.

---

*REPO layout complete — [`REPO-STRUCTURE-PLAN.md`](REPO-STRUCTURE-PLAN.md).*