# Main site coverage — execution plan

*Execution · Program: [`MASTER-PLAN.md`](MASTER-PLAN.md) · Track 2 of [`COVERAGE-PLAN.md`](COVERAGE-PLAN.md) · How-to: [`docs/TESTING.md`](../docs/TESTING.md)*

## Block closure (2026-06-15)

| | |
|---|---|
| **Done** | S0–S5 Vitest site scope — all folders in `vitest.site.config.ts` include list |
| **Verified** | Site rollup **96.6%** stmts · **96.3%** fn · **87.9%** branches · **97.8%** lines · **0** zero-statement files (`results/COVERAGE-REPORT.md`) |
| **Remaining** | S4 Playwright site-only CI script; wire `test:coverage:site` into `release:gate` |
| **Next** | S4 Playwright expansion; optional site threshold ratchet toward **90%** all metrics when `lib/catalog` branches ≥85% |

---

## Goal

Raise **Vitest v8** coverage on **site-logic modules** to **≥ 50%** (statements, branches, functions, lines), with thresholds in a **separate** site coverage profile — independent of the planner **75%** gate.

Routes, layouts, and heavy marketing UI under `app/` and `components/` are **out of scope** for the % gate; they are covered by **Playwright** smoke and a11y specs.

## Policy

| Topic | Rule |
|-------|------|
| Runner | Vitest v8 — same `tests/` suite as planner |
| Coverage scope | **Site-logic include** (below) — not `features/planner/**` |
| Target | **50%** all metrics on `scopes["site"]` (not 75%) |
| E2E | Playwright site specs — no Istanbul merge |
| Planner | Do not mix planner code into site thresholds |

### Site `coverage.include` (wired in S0 — `vitest.site.config.ts`)

```text
data/site/**
lib/catalog/**
lib/configurator/**          # .ts modules; skip heavy .tsx panels in v1
features/catalog/**
features/shared/**
features/site-assistant/**
features/ops/**
features/ai/aiAdvisor.ts     # pure advisor config/logic
```

**Explicitly excluded from site % gate (Playwright or defer):**

- `app/**` — Next routes, RSC, layouts (~119 files)
- `components/**` — marketing / layout chrome (~54 files)
- `features/admin/**`, `features/crm/**` — internal dashboards; add later if needed
- `lib/auth/**`, `lib/supabase/**` — server/session boundaries (mock in unit tests only when needed)

---

## Baseline (2026-06-15)

### Site rollup (`scopes["site"]`)

| Metric | Covered / Total | % | Product target | CI threshold (current) |
|--------|-----------------|---|----------------|------------------------|
| Statements | 2220 / 2297 | **96.6%** | 50% | 90 |
| Functions | 441 / 458 | **96.3%** | 50% | 90 |
| Branches | 1747 / 1988 | **87.9%** | 50% | 80 |
| Lines | 1971 / 2015 | **97.8%** | 50% | 90 |

Site-logic denominator: **2,297** statements across **71** files (**0** at 0% stmts). S0 baseline was **24.0%** stmts.

### By priority folder (verified)

| Folder | Stmts | Fn | Branches | Lines | Files | 0% files |
|--------|-------|-----|----------|-------|-------|----------|
| `data/site/` | **100%** (116/116) | 100% | 100% | 100% | 13 | 0 |
| `lib/catalog/` | **95.0%** (802/844) | 95.3% | 82.0% | 96.2% | 13 | 0 |
| `features/shared/` | **98.6%** (208/211) | 100% | 96.5% | 100% | 29 | 0 |
| `features/site-assistant/` | **94.5%** (291/308) | 90.9% | 86.8% | 95.9% | 3 | 0 |
| `features/ops/` | **97.0%** (96/99) | 96.7% | 81.7% | 97.7% | 1 | 0 |
| `features/catalog/` (site) | **97.5%** (544/558) | 98.4% | 90.8% | 99.1% | 7 | 0 |
| `lib/configurator/` | **100%** (120/120) | 100% | 100% | 100% | 4 | 0 |
| `features/ai/` | **100%** (41/41) | 100% | 100% | 100% | 1 | 0 |

`lib/catalog` + `features/catalog` combined: **62.8%** stmts (880/1402).

### Vitest suites (52 files — non-planner)

| Category | Count | Examples |
|----------|-------|----------|
| site-unit | 27 | `catalogMatch.test.ts`, `seo-helpers.test.ts`, `navigation-data.test.ts` |
| shared | 21 | `shared-auth-components-AuthShell.test.tsx`, `shared-providerChain.test.ts` |
| site-assistant | 3 | `site-assistant-AdvancedBot.test.tsx`, `site-assistant-UnifiedAssistant.test.tsx` |
| ops | 1 | `ops-CustomerQueriesOpsPageView.test.tsx` |

Run subset: `npm run test:unit` (excludes `**/planner*`). Full inventory: **206** Vitest active · **8** Playwright · **2** helpers (`tests/INVENTORY.md`).

### Playwright (site vs planner)

| Spec | Track | Gate script |
|------|-------|-------------|
| `accessibility.spec.ts` | Site (whole app a11y) | `test:a11y` |
| `site-navigation-smoke.spec.ts` | Site | `test:e2e:nav` |
| `site-navigation-screenshots.spec.ts` | Site | manual / optional CI |
| `navigation-smoke.spec.ts` | Planner landing → canvas | `test:e2e:nav` |
| `planner-catalog.spec.ts` | Planner | `test:planner-catalog` |
| `planner-guest-workspace.spec.ts` | Planner | `test:planner-catalog` |
| `planner-landing-screenshots.spec.ts` | Planner | manual |
| `planner-marketing-a11y.spec.ts` | Planner marketing | manual |

### Source inventory (non-planner, approx)

| Area | Files | Test strategy |
|------|-------|---------------|
| `data/site/` | 13 | Unit — mostly pure data/helpers |
| `lib/catalog/` + related | ~20+ | Unit — hierarchy, match, slug, geometry |
| `features/catalog/` | 8 | Unit — filters, traits, slugResolver (**mostly open**) |
| `features/shared/` | ~30 | RTL for auth/shell; pure types/index |
| `features/site-assistant/` | 3 | RTL + mock chat provider |
| `features/ops/` | 1 | RTL (existing ops test) |
| `lib/configurator/` | 4 | Pure wizard logic (**open**) |
| `app/` + `components/` | ~173 | **Playwright only** for coverage purposes |

---

## Phase status

| Phase | Focus | Status |
|-------|--------|--------|
| S0 | Site coverage profile + `scopes["site"]` in JSON | **Done** |
| S1 | `data/site` + `lib/catalog` + `features/catalog` | **Done** |
| S2 | `features/shared` auth + shell | **Done** |
| S3 | site-assistant, ops, configurator pure logic | **Done** |
| S5 | `features/catalog` (site) + `lib/configurator` + `aiAdvisor.ts` | **Done** |
| S4 | Playwright site expansion + gate split | **Open** |

---

## Slice S0 — Site coverage profile

**Do not** change default planner gate until this is isolated.

| Step | Action |
|------|--------|
| S0.1 | Add `vitest.site.config.ts` **or** env flag `VITEST_COVERAGE_SCOPE=site` swapping `coverage.include` to site list above |
| S0.2 | `package.json`: `"test:coverage:site": "vitest run --coverage --config vitest.site.config.ts"` (or equivalent) |
| S0.3 | Extend `scripts/generate-coverage-summary.mjs`: `targetSitePct: 50`, aggregate `scopes["site"]` from site include paths |
| S0.4 | Run baseline; commit `results/coverage-summary.json` with site scope (expect low % — many modules untested) |
| S0.5 | Site thresholds start **~5–10% below** measured site % (ratchet per PR) |

### Acceptance

- [x] `npm run test:coverage:site` passes with site-only include
- [x] Planner `npm run test:coverage` unchanged (still `features/planner/**`)
- [x] JSON documents both `scopes["features/planner"]` and `scopes["site"]`

---

## Slice S1 — Catalog + site data (highest ROI)

**Target lift:** site statements **~25–35%** → **achieved 69.3%** rollup (priority folders at 75–100%).

### Modules

| Path | Notes | Verified stmts |
|------|--------|----------------|
| `data/site/navigation.ts`, `homepage.ts`, `seo.ts` | Extend `navigation-data`, `homepage-data`, `seo-helpers` tests | **100%** |
| `lib/catalog/catalogTree.ts`, `productSlugResolver.ts` | Pair with `catalogHierarchy`, `catalogMatch` | **95%** (`lib/catalog/`) |
| `features/catalog/slugResolver.ts`, `filters.ts`, `traits.ts` | New `site-catalog-*.test.ts` or extend site-unit | **14%** (`features/catalog/`) — **next slice** |
| `lib/catalog/geometry.ts`, `blocks2d.ts` | Pure math — fast wins | Covered via `catalog-geometry`, `catalog-blocks2d` |

### Test pattern

- Prefer plain `tests/*.test.ts` names for site-unit (existing convention)
- Use `site-catalog-*` prefix when mirroring `features/catalog/` paths
- Mock `fetch` / Supabase at boundaries — no live DB in Vitest

### Acceptance

- [x] `data/site` statements **≥ 60%** — **100%** (116/116)
- [x] `lib/catalog` + `features/catalog` combined **≥ 40%** — **62.8%** (880/1402); `lib/catalog` alone **95%**
- [x] Ratchet site thresholds + `docs:sync:coverage` — thresholds still at S0 floor (14/7/14/15); **ratchet to 60–65% band recommended** (see Ratchet guide)

---

## Slice S2 — Shared auth + shell

**Target lift:** site **~35–45%** → **achieved** via `features/shared` **98.6%** stmts.

### Modules

| Path | Notes | Verified stmts |
|------|--------|----------------|
| `features/shared/auth/**` | Extend `shared-auth-components-AuthShell.test.tsx` | **~99%** (auth + shell suite) |
| `features/shared/components/GuestBadge.tsx` | Extend `shared-components-GuestBadge.test.tsx` | Covered |
| `features/shared/shell/GlobalNavHeader.tsx` | Light RTL — mock router | Covered |
| `lib/ai/providerChain.ts` | Extend `shared-providerChain.test.ts` | Covered |

### Test pattern

- `render` + `userEvent` with Next navigation mocks
- Do not mount full `app/layout.tsx`

### Acceptance

- [x] `features/shared` statements **≥ 35%** — **98.6%** (208/211)
- [x] Threshold ratchet — see Ratchet guide (pending config update)

---

## Slice S3 — Assistant, ops, configurator

**Target lift:** site **~45–50%** → **achieved 69.3%** rollup; assistant + ops at **~95–97%**.

| Path | Notes | Verified stmts |
|------|--------|----------------|
| `features/site-assistant/AdvancedBot.tsx` | Extend existing test; mock LLM/stream | **94.5%** (`features/site-assistant/`) |
| `features/ops/CustomerQueriesOpsPageView.tsx` | Extend ops test — table filters, empty state | **97.0%** (`features/ops/`) |
| `lib/configurator/smartWizard*.ts` | Pure wizard logic — `smartWizardConstants`, catalog picks | **0%** — **next slice** |

Defer `features/crm/**` and `features/admin/**` unless ops/dashboard work is in scope.

### Acceptance

- [x] `features/site-assistant` + `features/ops` **≥ 40%** — **94.5%** + **97.0%**
- [x] Site scope all metrics **≥ 50%** — stmts **69.3%** · fn **68.1%** · branches **60.8%** · lines **72.4%**

---

## Slice S4 — Playwright (site track)

Vitest will not cover most `app/` pages. Site quality gate = Playwright.

| Step | Action |
|------|--------|
| S4.1 | Keep `test:a11y` on `accessibility.spec.ts` |
| S4.2 | `test:e2e:nav` — site nav smoke + planner landing (`navigation-smoke`) — document split in `docs/TESTING.md` |
| S4.3 | Optional: `test:e2e:site` script — only `site-navigation-*.spec.ts` for site-only CI job |
| S4.4 | Products route: env-gated in `site-navigation-smoke` (`NEXT_PUBLIC_SUPABASE_URL`) — document in `docs/Failures.md` if skipped |

### Acceptance

- [ ] Homepage, products (when env present), key nav paths green
- [ ] Planner specs remain on `test:planner-catalog` — not merged into site job

---

## PR stack (site track)

| PR | Slice | Expected site stmt % | Status |
|----|-------|----------------------|--------|
| S-PR0 | S0 — profile + JSON scope | baseline (measure) | **Merged** |
| S-PR1 | S1 — catalog + data/site | ~25–35% | **Done** (69% rollup) |
| S-PR2 | S2 — shared auth/shell | ~35–45% | **Done** |
| S-PR3 | S3 — assistant + ops + configurator | **≥ 50%** | **Done** (configurator deferred) |
| S-PR4 | S4 — Playwright scripts/docs | no Vitest % change | **Open** |
| S-PR5 | `features/catalog` site + configurator + `aiAdvisor` | maintain ≥ 50% | **Next** |
| S-PR-final | `test:coverage:site` in `release:gate` | ≥ 50% enforced | **Open** |

Each PR:

1. Tests under `tests/` — site-unit or `site-*` / `shared-*` naming
2. `npm run test` + `npm run test:unit` + `npm run test:coverage:site`
3. Ratchet **site** thresholds only
4. `npm run docs:sync:coverage` if JSON shape changes
5. Tick `docs/Handover.md`

---

## Ratchet guide (site thresholds)

Set **~2–5% below** measured site % until target is stable, then lock at product target.

### Current measured (2026-06-15)

| Metric | Measured % | Suggested `vitest.site.config.ts` threshold |
|--------|------------|---------------------------------------------|
| Statements | 69.3 | **65** |
| Functions | 68.1 | **65** |
| Branches | 60.8 | **58** |
| Lines | 72.4 | **68** |

**Recommended band:** **60–65%** on statements/functions; branches **58%** (lags stmts by design in this repo).

Current config still at S0 floor (`14 / 7 / 14 / 15`) — update in the next PR that touches `vitest.site.config.ts`.

### Historical ladder

| Site stmt % | Suggested `thresholds.statements` |
|-------------|----------------------------------|
| 10 | 8 |
| 25 | 22 |
| 35 | 32 |
| 45 | 42 |
| 50 | 50 |
| **69** | **65** |

Match branches, functions, lines to the same band (branches typically 2–7 pts below statements).

---

## Verify

```bash
npm.cmd run test
npm.cmd run test:unit
npm.cmd run test:coverage:site    # after S0
npm.cmd run test:a11y
npm.cmd run test:e2e:nav
npm.cmd run docs:sync:coverage
```

**Done when:**

```text
results/coverage-summary.json → scopes["site"]
  statements, branches, functions ≥ 50%     ✓ verified 2026-06-15
site vitest profile thresholds ≥ 50%        → ratchet to 60–65% band (config still at 14%)
npm.cmd run release:gate  (includes test + test:coverage:site when wired)   → open
```

---

## Out of scope

- 75% on full `app/` + `components/` tree
- Merging site % into planner `vitest.config.ts` thresholds
- Converting Playwright specs to Vitest
- Co-located tests under `features/` or `app/`
- `proxy.ts`, `app/api/`, migrations — see `AGENTS.md` stop list

---

## See also

- `plans/COVERAGE-PLAN.md` — two-track overview
- `plans/PLANNER-COVERAGE-75.md` — planner track (75%)
- `plans/TESTING-PLAN.md` — T0–T4 + S0–S4 phases
- `tests/INVENTORY.md` — site-unit vs planner counts
- `results/COVERAGE-REPORT.md` — site track rollup and subfolder tables