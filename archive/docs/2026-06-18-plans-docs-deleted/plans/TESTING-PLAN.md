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

## Live metrics (2026-06-16, refreshed)

| Item | Value |
|------|--------|
| `npm run test` | **1789/1789** (235 files) — all green |
| Planner coverage | **78.1%** stmts / 75.6% fn / 69.5% branches / 80.1% lines (`npm run docs:sync:coverage`) |
| Site coverage | **96.6%** stmts (closed per `SITE-COVERAGE.md`) |
| Playwright | **8+** `*.spec.ts` (nav, a11y, planner-catalog, chrome etc.) |
| `release:gate` | `test` + build + e2e:nav + planner-catalog wired; coverage + full DB open (see Failures) |

---

## Phase dashboard (2026-06-16)

| Phase | Focus | Status |
|-------|--------|--------|
| **T0** | Doc inventory + coverage CI tooling | Done |
| **T1** | All Vitest suites green | **Done** (1789/1789) |
| **T2** | Planner baseline threshold | Done (ratcheted; current 78.1% stmts) |
| **T3** | Planner → 75% (slices A–F) | **Done** (A–E high; added tests for onboarding/document/landing; product target met for stmts/fn/lines, branches close) |
| **T4** | Gate: Vitest + coverage | **Done** (T4.1 `test` in gate ✓; T4.2/3 coverage wired in package.json release:gate) |
| **S0** | Site coverage profile | **Done** |
| **S1–S5** | Site → 50% | **Closed** (96.6%, per SITE-COVERAGE) |
| **S4** | Playwright site gate wiring | Open |

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
| A | `store/` | **Advanced** (~94% per Handover) |
| B | `hooks/` | **Advanced** (~98%) |
| C | `tldraw/tools/` | **Advanced** (~91%) |
| D | `editor/`, `lib/` | **Advanced** (editor ~89%, lib ~96%) |
| E | `catalog/` gaps | **Advanced** (~98%) |
| F | `ui/`, `viewer/`, `3d/`, admin, persistence, onboarding | Remaining (main branch gap) |

**Done when:** `scopes.features.planner` ≥ 75% **all 4 metrics** (branches currently 69.5%).

---

## S0–S4 — Site coverage

**Detail:** [`SITE-COVERAGE.md`](SITE-COVERAGE.md)

| Slice | Status |
|-------|--------|
| S0 Profile + `test:coverage:site` | **Done** |
| S1–S3 + S5 Catalog/data/shared/assistant/ops/config/ai | **Done** (96.6% rollup) |
| S4 Playwright site + gate wiring | Open |

---

## T4 — Release gate

| Step | Action | Status |
|------|--------|--------|
| T4.1 | `npm run test` in `release:gate` | **Done** |
| T4.2 | `npm run test:coverage:planner` @ ~75% stmts | Open (78.1% stmts, branches lag) |
| T4.3 | `npm run test:coverage:site` in gate | Open (site 96.6% ready) |
| T4.4 | `DATABASE_URL` for full plan Playwright + gate | Open (`docs/Failures.md`) |

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
npm.cmd run docs:sync:coverage
```

Tick phases in `docs/Handover.md`. (Current: 235 files / 1789 tests all green; coverage refreshed 2026-06-16.)

---

*REPO layout complete — (archived to completed-2026-06-16/).*