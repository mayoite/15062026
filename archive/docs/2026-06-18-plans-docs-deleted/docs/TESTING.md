# Testing

*Updated: 2026-06-16 — flat `tests/`, Vitest only. Index: `docs/DOC-MAP.md`. Roadmap: `plans/TESTING-PLAN.md`. Structure: `plans/REPO-STRUCTURE-PLAN.md` (archived; see archive/docs/plans/completed-2026-06-16/).*

## Principle

All tests live in one folder: `tests/`. No subfolders (`tests/unit/`, `tests/planner/`, etc.).

- **Vitest** — `*.test.ts`, `*.test.tsx`
- **Playwright** — `*.spec.ts`

Jest removed. No co-located `*.test.*` under `features/` or `lib/`.

## Layout & file list

```
tests/
  setup.ts, guestProjectSetup.ts   helpers only
  *.test.ts(x)                     Vitest
  *.spec.ts                        Playwright
```

**Folder guide:** `tests/CONTENTS.md`. **File list & counts:** `tests/INVENTORY.md` or `results/test-inventory.json`. After test changes: `npm run docs:sync`.

## Naming

| Pattern | Meaning | Example |
|---|---|---|
| `planner-*.test.ts` | Editor / canvas (old `tests/planner/`) | `planner-layerCounts.test.ts` |
| `planner*.test.ts` | Data / persistence (no hyphen after `planner`) | `plannerPersistence.test.ts` |
| `planner-{area}-*.test.ts` | Old `features/planner/{area}/` | `planner-store-plannerCatalog.test.ts` |
| `shared-*.test.*` | Shared auth / components | `shared-auth-components-AuthShell.test.tsx` |
| `site-assistant-*.test.*` | Site assistant | `site-assistant-AdvancedBot.test.tsx` |
| `ops-*.test.*` | Ops views | `ops-CustomerQueriesOpsPageView.test.tsx` |
| plain name | Site / catalog unit (old `tests/unit/`) | `catalogMatch.test.ts` |
| `*.spec.ts` | Playwright e2e / a11y | `navigation-smoke.spec.ts` |

Rule: join old path segments with `-` → `features/planner/store/foo.test.ts` → `tests/planner-store-foo.test.ts`.

## Commands

| Script | What it runs |
|---|---|
| `npm run test` | All Vitest suites |
| `npm run test:watch` | Vitest watch |
| `npm run test:unit` | Vitest, excludes `**/planner*` |
| `npm run test:planner` | Vitest, `planner` in path/name |
| `npm run test:coverage` | Vitest v8 → `results/coverage/` |
| `npm run test:a11y` | Playwright a11y |
| `npm run test:e2e:nav` | Playwright nav smoke |
| `npm run test:planner-catalog` | Playwright planner browser suite: catalog, guest workspace, custom tools, chrome |
| `npm run release:gate` | lint + typecheck + test + build + a11y + e2e + planner-catalog |

```bash
npx vitest run planner-layerCounts
npx playwright test tests/navigation-smoke.spec.ts -c config/build/playwright.config.ts
```

## Config

| Tool | File | Notes |
|------|------|--------|
| Vitest | `vitest.config.ts` | `include: tests/**/*.test.{ts,tsx}`, `tests/setup.ts`, `happy-dom` |
| Playwright | `config/build/playwright.config.ts` | `testDir: ./tests` — **not** root `playwright.config.ts` |
| Coverage | `vitest.config.ts` | Vitest v8 only → `results/coverage/`; **include:** `features/planner/**` |

**Vitest excludes:** none (all `*.test.*` under `tests/` run). Playwright `*.spec.ts` files are separate.

See `vitest.config.ts` and `results/test-inventory.json`.

## Coverage

**Policy:** coverage is **Vitest v8 only**. Playwright specs in `release:gate` are E2E/a11y smoke — they do **not** feed coverage percentages. There is no second Istanbul/Jest runner.

**Two tracks** (see `plans/COVERAGE-PLAN.md`):

| Track | Scope | Target | Plan |
|-------|--------|--------|------|
| Planner | `features/planner/**` | **≥ 75%** | `plans/PLANNER-COVERAGE-75.md` |
| Main site | site-logic modules (`data/site`, `lib/catalog`, `features/catalog`, …) | **≥ 50%** | `plans/SITE-COVERAGE.md` |

| Item | State |
|------|--------|
| Runner | `npm run test:coverage` / `test:coverage:planner` (planner gate today) |
| Site runner | `test:coverage:site` — planned in SITE-COVERAGE S0 |
| CI threshold | Planner ~19% in `vitest.config.ts` (ratchet toward 75%) |
| Reports | `results/coverage/`, rollup `results/coverage-summary.json`, remarks `results/COVERAGE-REPORT.md` |

### Why many tests but low %

Vitest counts **test cases**, not source files. Most suites hit pure planner logic (`model/`, `store/`, `lib/`). Hooks, workspace UI, and tldraw tools need React/canvas harnesses — still thin. The old wide include (`app/`, `components/`, …) inflated the denominator with **0%** route/UI code Vitest never imports; coverage scope is now planner-only so the % matches the 75% goal.

### Baseline

```bash
npm run test:coverage
npm run docs:sync:coverage
```

`docs:sync:coverage` runs the same Vitest coverage pass and writes `results/coverage-summary.json` → `scopes["features/planner"]`.

**Phased work** (stale suites, ratchet, 75% target, gate): `plans/TESTING-PLAN.md`.

## Migration status

**Done** — `ba8b0f3`: 33 co-located `features/**/*.test.*` → flat `tests/`.

- **Pair map (JSON):** `results/test-migration-map.json` (`npm run docs:sync`)
- **Verify a future move:** `git show --name-status --diff-filter=D <commit> -- "features/**/*.test.*"` — each `D` needs a `tests/` partner

Removed: `tests/unit|planner|features|playwright/`, Jest configs/packages.

## Current status (2026-06-15)

| Suite | Result |
|---|---|
| `npm run test` | **218** Vitest files, **1685/1685** tests (2026-06-15) |
| `npm run test:unit` | 64 site-adjacent Vitest files (excludes `planner*`) |
| `npm run test:coverage` | Pass — planner **78.4%** stmts (`results/coverage-summary.json`) |
| `npm run test:coverage:site` | Pass — site **96.6%** stmts; thresholds **90/80/90/90** |
| `npm run test:planner-catalog` | Playwright planner browser suite, including `planner-chrome.spec.ts` |
| `npm run typecheck` | Pass |
| `npm run build` | Pass — **341** static pages |

Open blockers for `release:gate`: `npm.cmd run test:planner-catalog` is currently blocked by the `planner-chrome.spec.ts` 3D nonblank-scene assertion (`docs/Failures.md`).

## Playwright

Guest specs: `import { enterGuestPlannerWorkspace } from "./guestProjectSetup";`  
Used by `navigation-smoke.spec.ts`, `planner-guest-workspace.spec.ts`.

## Adding a test

1. `tests/<name>.test.ts(x)` or `.spec.ts`
2. `@/` imports only — never under `features/`
3. Run `npm run docs:sync`

## Generated artifacts

Sync commands: `docs/DOC-MAP.md` § Sync.

## See also

- `plans/COVERAGE-PLAN.md` — planner + main site tracks (TLDR)
- `plans/TESTING-PLAN.md` — coverage phases, CI wiring, PR order
- `plans/PLANNER-COVERAGE-75.md` — planner slices A–F → 75%
- `plans/SITE-COVERAGE.md` — main site slices S0–S4 → 50%
- `docs/DOC-MAP.md` — which doc owns what (avoid duplicate tables)
- `docs/Failures.md` — open failures
- `docs/Handover.md` — milestones
