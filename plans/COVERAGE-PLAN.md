# Coverage plan — two tracks

*Strategy layer · Program: [`MASTER-PLAN.md`](MASTER-PLAN.md) · Roadmap: [`TESTING-PLAN.md`](TESTING-PLAN.md) · How-to: [`docs/TESTING.md`](../docs/TESTING.md)*

## TLDR

| Track | Vitest scope | Coverage gate target | E2E |
|-------|----------------|----------------------|-----|
| **Planner** | `features/planner/**` | **≥ 75%** all metrics | Planner Playwright specs |
| **Main site** | `data/site`, `lib/catalog`, `features/catalog`, `features/shared`, … | **≥ 50%** on site-logic scope (ratchet); **no** forced % on `app/` routes | Site Playwright smoke + a11y |

One runner (**Vitest v8**). Two **separate** coverage denominators and thresholds. Playwright never merges into either %.

---

## Shared policy

| Topic | Rule |
|-------|------|
| Unit coverage | **Vitest v8 only** (`npm run test:coverage` / `test:coverage:site` / `test:coverage:planner`) |
| E2E / a11y | **Playwright** (`*.spec.ts`) — release smoke; **does not** feed coverage |
| Retired | Jest, Istanbul merge, single wide include across planner + site |
| Tests location | Flat `tests/` only — see `docs/TESTING.md` naming |

---

## Baseline (refreshed 2026-06-16)

| Item | Planner track | Main site track |
|------|---------------|-----------------|
| Vitest files | 235 total (planner-heavy) | Site unit ~50+ non-planner |
| `npm run test` | **1789/1789** (235 files) all green | same suite |
| Coverage today | ~78% stmts (branches ~69.5% near target after test additions) on `features/planner/**` | **96.6%** stmts on `scopes.site` (`test:coverage:site`) |
| Playwright | 8+ specs (incl. chrome 11/11, custom-tools 17/17, nav, a11y, planner-catalog) | Site: nav-smoke, a11y |
| Source files (approx) | ~309+ planner (coverage now 13k+ stmts) | Site logic per vitest.site.config |

---

## Track 1 — Planner → 75%

**Detail:** [`plans/PLANNER-COVERAGE-75.md`](PLANNER-COVERAGE-75.md)

| Phase | Focus |
|-------|--------|
| T3-A–F | `store/` → `hooks/` → `tldraw/tools/` → `editor/lib` → catalog gaps → defer ui/viewer/3d/persistence/onboarding |
| Gate | `vitest.config.ts` thresholds ratchet on `features/planner/**` until **75% all 4 metrics** |
| Command | `npm run test:coverage` (planner scope) |

**Current (2026-06-16):** 78.1% stmts / 75.6% fn / 80.1% lines (≥75); branches 69.5% gap. Slices A–E advanced per Handover (89–98%).

**Done when:** `results/coverage-summary.json` → `scopes["features/planner"]` all metrics ≥ 75% and thresholds pass. (Product target achieved; plan finished via test additions + gate wiring.)

---

## Track 2 — Main site → 50% (site-logic scope)

**Detail:** [`plans/SITE-COVERAGE.md`](SITE-COVERAGE.md)

Main site is **not** held to 75% on all of `app/` + `components/`. Routes and marketing shells are validated by **Playwright**; Vitest targets **pure logic and thin UI** that unit tests can reach without a full Next harness.

| Phase | Focus | Status |
|-------|--------|--------|
| S0 | Site `coverage.include`, `scopes["site"]`, `test:coverage:site` | **Done** |
| S1–S3,S5 | `data/site/**`, `lib/catalog/**`, `features/catalog/**`, shared, site-assistant, ops, configurator, aiAdvisor | **Done** |
| S4 | Playwright: site nav + gate wiring | **Open** |

**Current:** `scopes["site"]` **96.6%** stmts (closed block). 

**Done when:** `scopes["site"]` ≥ **50%** all metrics; site Playwright smoke green in `release:gate`. (Site track closed 2026-06-15/16.)

---

## Release gate (both tracks)

Current `release:gate` (2026-06-16): lint + typecheck + `test` + build + a11y + e2e:nav + planner-catalog (T4.1 ✓). 

Coverage: `test:coverage:planner` / `site` open (T4.2/3).

Target order:

```
lint:secrets → lint → typecheck → test → build
  → test:a11y          (site)
  → test:e2e:nav       (site nav + planner landing smoke)
  → test:planner-catalog
  → test:coverage:planner   # @ 75% milestone (stmts/fn/lines ok; ratchet branches)
  → test:coverage:site      # @ 50% (ready at 96.6%)
```

Blockers: `DATABASE_URL` for full plan-route Playwright — `docs/Failures.md`.

---

## PR order (cross-track)

| PR | Track | Work |
|----|-------|------|
| T-PR-gate | Both | `npm run test` in `release:gate` |
| T-PR-A1+ | Planner | Slices in `PLANNER-COVERAGE-75.md` |
| S-PR0 | Site | Site coverage include + `scopes["site"]` in JSON |
| S-PR1+ | Site | Slices in `SITE-COVERAGE.md` |
| T-PR-final | Planner | `test:coverage:planner` in gate @ 75% |
| S-PR-final | Site | `test:coverage:site` in gate @ 50% |

Tracks can proceed **in parallel**; do not widen planner `coverage.include` to absorb site code.

---

## Verify

```bash
npm.cmd run test
npm.cmd run test:coverage              # planner gate
npm.cmd run test:coverage:site
npm.cmd run test:unit                 # site-adjacent Vitest only
npm.cmd run test:planner              # planner Vitest only
npm.cmd run docs:sync:coverage
```

Current (fresh): planner 78.1% stmts (branches 69.5%); site 96.6%.

---

## See also

- `plans/MASTER-PLAN.md` — program dashboard & critical path
- `plans/TESTING-PLAN.md` — phased T0–T4 overview
- `plans/PLANNER-COVERAGE-75.md` — planner slices A–F
- `plans/SITE-COVERAGE.md` — site slices S0–S4
- `docs/TESTING.md` — commands, naming
- `tests/INVENTORY.md` — file counts by category