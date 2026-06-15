# Changes by chapter

*Generated: 2026-06-12 — working tree snapshot (staged + unstaged)*

Evidence standard: `AGENTS.md` — no claim without proof. Playwright outputs and screenshot paths are pasted below.

---

## Chapter 1 — Site navigation E2E (`/products`)

### What changed

| File | Change |
|------|--------|
| `tests/site-navigation-smoke.spec.ts` | **New** — 4 smoke tests: homepage hero, `/products` category card, desktop mega-menu → `/products`, mobile drawer → `/products` |
| `tests/site-navigation-screenshots.spec.ts` | **New** — 25 full-page/viewport captures across 5 device profiles |
| `package.json` | `test:e2e:nav` now runs `site-navigation-smoke.spec.ts` **and** `navigation-smoke.spec.ts` |

### Playwright — nav smoke (proof)

Command: `npm run test:e2e:nav` (against `http://localhost:3000`)

```
Running 5 tests using 5 workers
  ok  site-navigation-smoke › /products catalog loads with first category card visible
  ok  site-navigation-smoke › homepage loads with hero and progress dots
  ok  site-navigation-smoke › desktop header All Products link reaches /products
  ok  site-navigation-smoke › mobile drawer opens and All Products closes drawer on /products
  ok  navigation-smoke › planner landing opens the planner canvas

  5 passed (4.2s)
```

Exit code: **0**

### Playwright — screenshot matrix (proof)

Command: `npx playwright test -c config/build/playwright.config.ts tests/site-navigation-screenshots.spec.ts`

```
  25 passed (8.8s)
```

Exit code: **0**

Output root: `results/screenshots/playwright-nav/`

| Viewport folder | Device profile | Size (W×H) | Shots |
|-----------------|----------------|------------|-------|
| `iphone/` | iPhone 14 | 390×844 | 5 |
| `android/` | Pixel 7 | 412×915 | 5 |
| `tablet-portrait/` | iPad portrait | 768×1024 | 5 |
| `tablet-landscape/` | iPad landscape | 1024×768 | 5 |
| `desktop/` | Desktop | 1280×800 | 5 |

#### iPhone (`iphone/`)

| File | Scenario |
|------|----------|
| `01-homepage.png` | `/` hero |
| `02-products.png` | `/products` catalog |
| `03-planner.png` | `/planner` landing |
| `04-mobile-drawer-open.png` | Mobile nav drawer open |
| `05-products-via-mobile-nav.png` | `/products` after drawer navigation |

![iPhone homepage](results/screenshots/playwright-nav/iphone/01-homepage.png)

![iPhone products](results/screenshots/playwright-nav/iphone/02-products.png)

![iPhone mobile drawer](results/screenshots/playwright-nav/iphone/04-mobile-drawer-open.png)

#### Android (`android/`)

| File | Scenario |
|------|----------|
| `01-homepage.png` | `/` hero |
| `02-products.png` | `/products` catalog |
| `03-planner.png` | `/planner` landing |
| `04-mobile-drawer-open.png` | Mobile nav drawer open |
| `05-products-via-mobile-nav.png` | `/products` after drawer navigation |

![Android homepage](results/screenshots/playwright-nav/android/01-homepage.png)

![Android products](results/screenshots/playwright-nav/android/02-products.png)

![Android mobile drawer](results/screenshots/playwright-nav/android/04-mobile-drawer-open.png)

#### Tablet portrait (`tablet-portrait/`)

| File | Scenario |
|------|----------|
| `01-homepage.png` | `/` full page |
| `02-products.png` | `/products` full page |
| `03-planner.png` | `/planner` landing |
| `04-tablet-header.png` | Homepage header fold |
| `05-products-category-grid.png` | Products category grid fold |

![Tablet portrait homepage](results/screenshots/playwright-nav/tablet-portrait/01-homepage.png)

![Tablet portrait products grid](results/screenshots/playwright-nav/tablet-portrait/05-products-category-grid.png)

#### Tablet landscape (`tablet-landscape/`)

| File | Scenario |
|------|----------|
| `01-homepage.png` | `/` hero |
| `02-products.png` | `/products` catalog |
| `03-planner.png` | `/planner` landing |
| `04-mega-menu-open.png` | Products mega-menu open |
| `05-products-via-mega-menu.png` | `/products` after mega-menu click |

![Tablet landscape homepage](results/screenshots/playwright-nav/tablet-landscape/01-homepage.png)

![Tablet landscape mega menu](results/screenshots/playwright-nav/tablet-landscape/04-mega-menu-open.png)

#### Desktop (`desktop/`)

| File | Scenario |
|------|----------|
| `01-homepage.png` | `/` hero |
| `02-products.png` | `/products` catalog |
| `03-planner.png` | `/planner` landing |
| `04-mega-menu-open.png` | Products mega-menu open |
| `05-products-via-mega-menu.png` | `/products` after mega-menu click |

![Desktop homepage](results/screenshots/playwright-nav/desktop/01-homepage.png)

![Desktop products](results/screenshots/playwright-nav/desktop/02-products.png)

![Desktop mega menu](results/screenshots/playwright-nav/desktop/04-mega-menu-open.png)

Regenerate: `npx playwright test -c config/build/playwright.config.ts tests/site-navigation-screenshots.spec.ts` (requires app on `:3000`).

### Full gallery (25/25)

#### iPhone — remaining

![iPhone planner](results/screenshots/playwright-nav/iphone/03-planner.png)

![iPhone products via nav](results/screenshots/playwright-nav/iphone/05-products-via-mobile-nav.png)

#### Android — remaining

![Android planner](results/screenshots/playwright-nav/android/03-planner.png)

![Android products via nav](results/screenshots/playwright-nav/android/05-products-via-mobile-nav.png)

#### Tablet portrait — remaining

![Tablet portrait products full](results/screenshots/playwright-nav/tablet-portrait/02-products.png)

![Tablet portrait planner](results/screenshots/playwright-nav/tablet-portrait/03-planner.png)

![Tablet portrait header](results/screenshots/playwright-nav/tablet-portrait/04-tablet-header.png)

#### Tablet landscape — remaining

![Tablet landscape products](results/screenshots/playwright-nav/tablet-landscape/02-products.png)

![Tablet landscape planner](results/screenshots/playwright-nav/tablet-landscape/03-planner.png)

![Tablet landscape products via mega](results/screenshots/playwright-nav/tablet-landscape/05-products-via-mega-menu.png)

#### Desktop — remaining

![Desktop planner](results/screenshots/playwright-nav/desktop/03-planner.png)

![Desktop products via mega](results/screenshots/playwright-nav/desktop/05-products-via-mega-menu.png)

---

## Chapter 2 — Planner guest workspace UI (unstaged)

### What changed

| File | Change |
|------|--------|
| `features/planner/catalog/CatalogSidebar.tsx` | Catalog sidebar UX (search, layout) |
| `features/planner/catalog/CatalogDropGhost.tsx` | Drop ghost styling/behavior |
| `features/planner/editor/PlannerWorkspace.tsx` | Workspace chrome wiring |
| `features/planner/editor/PlannerStatusBar.tsx` | Status bar metrics copy |
| `features/planner/editor/editorSelectionStatus.ts` | **New** — selection status helper |
| `features/planner/landing/plannerLandingData.ts` | Landing copy/data alignment |
| `features/planner/planner.css` | **+294 lines** — planner UI tokens, topbar, empty canvas, catalog |
| `lib/ui/OnboardingCoach.tsx` | Coach copy/placement tweak |
| `tests/planner-guest-workspace.spec.ts` | **New** — guest canvas E2E (topbar, empty state, catalog search, status bar) |
| `tests/planner/editorSelectionStatus.test.ts` | **New** — unit test for selection status |

*Playwright for `planner-guest-workspace.spec.ts` not re-run in this batch — run separately.*

---

## Chapter 3 — Planner archive consolidation (staged)

### What changed

Retired orphan modules moved to `archive/features/planner/retired-2026-06-12/`:

| Archived | Replaced by (live) |
|----------|-------------------|
| `viewer/BuddyViewer.tsx` | `features/planner/viewer/PlannerViewer.tsx` |
| `editor/EmptyCanvasState.tsx` | `features/planner/ui/PlannerEmptyCanvas.tsx` |
| `editor/inspector/ElementInspector.tsx` | Inspector via shape bridge |
| `ai/PlannerAdvisorChat.tsx` | `features/planner/ai/AiAdvisorChat.tsx` |
| `shared/components/AiAdvisorChat.tsx` | same |
| `ui/CatalogDropGhost.tsx` | `features/planner/catalog/CatalogDropGhost.tsx` |
| `tldraw/.../catalogBlockBridge.test.ts` | `tests/planner/catalogBlockBridge.test.ts` |

Also updated:

| File | Change |
|------|--------|
| `archive/ARCHIVED.md` | Index entry for retired batch |
| `docs/new/02-PLANNER.md` | Canonical paths; archive pointers |
| `features/planner/data/workspaceCatalog.ts` | Comment encoding fix (mojibake → ASCII dash) |
| `Failures.md` | Retired orphans marked **Archived** |
| `Handover.md` | `test:planner` count **79/79** |

---

## Chapter 4 — Tooling / audit artifacts

| File | Change |
|------|--------|
| `package.json` | `test:e2e:nav` target list (see Chapter 1) |
| `results/audits/raw-playwright.json` | Updated by Playwright JSON reporter after nav runs |

---

## Chapter 5 — UI best-practices audit + remediation batch

### Audit findings (2026-06-12)

A React/UI best-practices audit produced five findings, now being remediated by parallel agents:

| # | Finding | Location |
|---|---------|----------|
| 1 | File at 717 lines — over the 700-line hard cap | `features/planner/editor/PlannerWorkspace.tsx` |
| 2 | Stylesheet at 1,399 lines — over target | `features/planner/planner.css` |
| 3 | Global `console.warn` monkey-patch | `features/planner/editor/PlannerWorkspace.tsx` |
| 4 | Nested-interactive a11y issue (`CatalogTile`) | `features/planner/catalog/CatalogSidebar.tsx` |
| 5 | Hardcoded hex / inline styles | `lib/ui/OnboardingCoach.tsx` |

### Remediation batch (in flight — not yet landed)

Four agents running concurrently: workspace split (#1, #3), CSS modularization (#2), a11y + token fixes (#4, #5), and docs sync (this chapter, `Failures.md`, `Handover.md`). **None of the five findings is verified fixed yet** — re-run gates after the batch lands.

### Verification gates (run 2026-06-12, this session)

Command: `npm run typecheck` — exit code **0**

```
> oando-platform@0.1.0 typecheck
> tsc -p config/build/tsconfig.json --noEmit
```

Command: `npm run test:planner` — exit code **0**

```
 Test Files  7 passed (7)
      Tests  83 passed (83)
   Duration  2.18s
```

Command: `npm run lint` — exit code **1** (run twice, same result)

```
E:\Goodsites\oando-consolidated\features\planner\editor\PlannerWorkspace.tsx
  50:3  error  'buildCatalogShape' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

✖ 1 problem (1 error, 0 warnings)
```

Note: lint passed with 0 errors earlier today (36-error backlog cleared); the single error above appeared mid-session in the exact file the workspace-refactor agent is editing concurrently, so it is treated as a transient artifact of the in-flight split. It must be re-verified at 0 before the batch is called done.

---

## Summary matrix

| Area | Files touched | Verified in this doc |
|------|---------------|----------------------|
| Site nav E2E + `/products` | 3 new/edited test files, `package.json` | **Yes** — 5/5 nav + 25/25 screenshots |
| Planner guest UI | 10+ planner/lib files, 2 new tests | Listed; guest E2E not re-run here |
| Planner archive | 8 archived files + docs/logs | Staged; no runtime import |

---

## Risks / notes

1. Screenshot spec requires a running production server (`npm run start`) or Playwright `webServer` build — port `:3000` conflicts if another build is in flight.
2. First screenshot attempt used relative paths that did not persist; fixed with `path.resolve(process.cwd(), ...)`.
3. Large planner CSS + guest workspace changes are **unstaged** — review before commit.
