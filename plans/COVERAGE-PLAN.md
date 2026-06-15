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

## Baseline (verified 2026-06-15)

| Item | Planner track | Main site track |
|------|---------------|-----------------|
| Vitest files | **~58** planner suites | **~17** site-adjacent (`npm run test:unit`) |
| `npm run test` | **75** files, **542** tests (all tracks) | same suite |
| Coverage today | **22.3%** stmts on `features/planner/**` | **24.0%** on `scopes.site` (`test:coverage:site`) |
| Playwright | **4** specs (catalog, guest workspace, landing screenshots, marketing a11y) + `navigation-smoke` (planner landing) | **3** specs (site nav smoke/screenshots) + `accessibility` (site-wide a11y) |
| Source files (approx) | **309** planner modules | **~265** non-planner (`app` 119, `components` 54, `lib` 75, `data` 13, `features/*` 52 excl. planner) |

---

## Track 1 — Planner → 75%

**Detail:** [`plans/PLANNER-COVERAGE-75.md`](PLANNER-COVERAGE-75.md)

| Phase | Focus |
|-------|--------|
| T3-A–F | `store/` → `hooks/` → `tldraw/tools/` → `editor/lib` → catalog gaps → defer ui/viewer |
| Gate | `vitest.config.ts` thresholds ratchet on `features/planner/**` until **75%** |
| Command | `npm run test:coverage:planner` (alias of default today) |

**Done when:** `results/coverage-summary.json` → `scopes["features/planner"]` all metrics ≥ 75% and thresholds pass.

---

## Track 2 — Main site → 50% (site-logic scope)

**Detail:** [`plans/SITE-COVERAGE.md`](SITE-COVERAGE.md)

Main site is **not** held to 75% on all of `app/` + `components/`. Routes and marketing shells are validated by **Playwright**; Vitest targets **pure logic and thin UI** that unit tests can reach without a full Next harness.

| Phase | Focus | Status |
|-------|--------|--------|
| S0 | Site `coverage.include`, `scopes["site"]`, `test:coverage:site` | **Done** |
| S1 | `data/site/**`, `lib/catalog/**`, `features/catalog/**` — extend site-unit tests |
| S2 | `features/shared/**` (auth shell, GuestBadge, provider chain) |
| S3 | `features/site-assistant/**`, `features/ops/**`, `lib/configurator/**` pure modules |
| S4 | Playwright: site nav, products, contact; keep planner specs separate in `release:gate` |

**Done when:** `scopes["site"]` ≥ **50%** all metrics (intermediate ratchet milestones in `SITE-COVERAGE.md`); site Playwright smoke green in `release:gate`.

---

## Release gate (both tracks)

Current `release:gate`: lint + typecheck + **`test`** + build + Playwright (T4.1 ✓). Coverage steps T4.2–T4.3 open.

Target order:

```
lint:secrets → lint → typecheck → test → build
  → test:a11y          (site)
  → test:e2e:nav       (site nav + planner landing smoke)
  → test:planner-catalog
```

Add `test:coverage:planner` when planner thresholds stable (~40%+). Add `test:coverage:site` when site scope and baseline exist (~25%+).

Blockers: `DATABASE_URL` / Supabase env — `docs/Failures.md`.

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
npm.cmd run test:coverage              # planner gate (today)
npm.cmd run test:coverage:site
npm.cmd run test:unit                 # site-adjacent Vitest only
npm.cmd run test:planner              # planner Vitest only
npm.cmd run docs:sync:coverage
```

---

## See also

- `plans/MASTER-PLAN.md` — program dashboard & critical path
- `plans/TESTING-PLAN.md` — phased T0–T4 overview
- `plans/PLANNER-COVERAGE-75.md` — planner slices A–F
- `plans/SITE-COVERAGE.md` — site slices S0–S4
- `docs/TESTING.md` — commands, naming
- `tests/INVENTORY.md` — file counts by category