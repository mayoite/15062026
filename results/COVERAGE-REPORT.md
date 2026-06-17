# Coverage report (Vitest v8)

Regenerate: `npm run docs:sync:coverage` · Source: `results/coverage-summary.json` · **2026-06-16T17:54:41.126Z**

## Executive summary

| Track | Scope | Statements | Functions | Branches | Lines | Gate target | CI threshold | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Planner | `features/planner/**` | 78% (10511/13469) | 75.1% (2450/3261) | 69.3% (6673/9629) | 80% (9536/11914) | 75% | 20 / 21 / 20 / 21 (statements / functions / branches / lines) | At or above product target |
| Site | site-logic include (see `vitest.site.config.ts`) | 96.6% (2221/2298) | 96.3% (441/458) | 88.1% (1752/1988) | 97.8% (1972/2016) | 50% | 14 / 14 / 7 / 15 | At or above product target |

### Cross-cutting remarks

1. **Statements** are the most reliable rollup column — they count whether each executable statement ran at least once.
2. **Functions** track whether each declared function body was entered; re-export-only files can show 0 functions despite imports.
3. **Branches** count each outcome of conditionals (`if`, `?:`, `&&`, `||`, `switch`); this repo's UI and config code has many branches per statement, so branch % often trails statement % by 5–10 pts.
4. **Lines** match Vitest's `lines` threshold — derived from `statementMap` when `l` is absent in `coverage-final.json` (Vitest v8 default).
5. **60 / 341** planner files and **0 / 71** site files have **0% statements** — target large zero-coverage modules first.
6. Product targets (75% planner / 50% site) are **not** CI thresholds yet; see `plans/MASTER-PLAN.md` critical path.

## Planner track

**Files in scope:** 341 · **Zero-statement files:** 60

### Rollup by metric

| Metric | Covered / Total | % | Target | Remarks |
| --- | --- | --- | --- | --- |
| Statements | 10511 / 13469 | 78% | 75% | 78% — near or above target; maintain on new code. 60 file(s) at 0% statements in this bucket. |
| Functions | 2450 / 3261 | 75.1% | 75% | 75.1% — good function reach; watch thin wrappers re-exporting untested deps. |
| Branches | 6673 / 9629 | 69.3% | 75% | 69.3% — strong branch coverage; keep edge-case tables in tests. |
| Lines | 9536 / 11914 | 80% | 75% | 80% — aligns with Vitest `lines` CI threshold; keep new code on green paths. |

**Lines source:** Counts above use `scripts/coverage-metrics.mjs` — reads `l` when present, otherwise derives from `statementMap` + `s` (same basis as Vitest's `lines` threshold).

### By subfolder

| Subfolder | Statements | Functions | Branches | Lines | Files | 0% files | Remarks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `store/` | 95.7% (1789/1869) | 96.6% (661/684) | 85.9% (1009/1174) | 96.6% (1540/1595) | 45 | 0 | Near target — protect with threshold ratchet. |
| `hooks/` | 98.4% (793/806) | 99.2% (125/126) | 91.6% (435/475) | 99.5% (734/738) | 5 | 0 | Near target — protect with threshold ratchet. |
| `tldraw/` | 89.7% (2117/2359) | 90.2% (423/469) | 78.1% (1091/1397) | 91.6% (1973/2155) | 48 | 0 | Near target — protect with threshold ratchet. |
| `ui/` | 18% (71/394) | 12.3% (20/162) | 23.8% (129/543) | 20.2% (67/331) | 17 | 11 | Majority of files (11/17) at 0% — slice tests here for fast gains. |
| `admin/` | 0% (0/18) | 0% (0/9) | 0% (0/0) | 0% (0/18) | 9 | 9 | Entire bucket untested — high ROI if in critical path. |
| `3d/` | 17.7% (52/293) | 25% (14/56) | 26.2% (43/164) | 19% (49/258) | 3 | 1 | Early slice candidate per PLANNER-COVERAGE-75 / SITE-COVERAGE plans. |
| `components/` | 6% (5/84) | 7.1% (2/28) | 0% (0/47) | 6.6% (5/76) | 5 | 4 | Majority of files (4/5) at 0% — slice tests here for fast gains. |
| `editor/` | 84.3% (2207/2619) | 88.6% (503/568) | 75.5% (1637/2167) | 86.7% (2021/2331) | 56 | 0 | Near target — protect with threshold ratchet. |
| `lib/` | 93.7% (1577/1683) | 97.3% (286/294) | 83.8% (897/1071) | 96.6% (1425/1475) | 31 | 0 | Near target — protect with threshold ratchet. |
| `catalog/` | 96.8% (705/728) | 96.2% (176/183) | 85.2% (511/600) | 97.8% (609/623) | 23 | 0 | Near target — protect with threshold ratchet. |
| `persistence/` | 42.6% (229/538) | 31.8% (35/110) | 44.6% (139/312) | 46.7% (219/469) | 7 | 2 | Already partially covered — extend existing test files. |
| `shared/` | 50.9% (256/503) | 32.6% (43/132) | 34.4% (166/483) | 55.2% (244/442) | 35 | 8 | Already partially covered — extend existing test files. |
| `model/` | 83.5% (330/395) | 83.3% (85/102) | 75.8% (428/565) | 87.7% (306/349) | 10 | 0 | Near target — protect with threshold ratchet. |
| `viewer/` | 18.5% (73/394) | 9.2% (9/98) | 32.1% (52/162) | 17.5% (62/355) | 8 | 6 | Majority of files (6/8) at 0% — slice tests here for fast gains. |
| `ai/` | 52.8% (196/371) | 44.7% (46/103) | 37.1% (93/251) | 55.2% (181/328) | 13 | 1 | Already partially covered — extend existing test files. |
| `onboarding/` | 35.2% (83/236) | 30.5% (18/59) | 29.7% (41/138) | 36.8% (75/204) | 6 | 4 | Majority of files (4/6) at 0% — slice tests here for fast gains. |
| `landing/` | 18.6% (27/145) | 6.3% (4/63) | 4% (2/50) | 18.2% (25/137) | 12 | 9 | Majority of files (9/12) at 0% — slice tests here for fast gains. |
| `help/` | 0% (0/14) | 0% (0/7) | 0% (0/10) | 0% (0/13) | 2 | 2 | Entire bucket untested — high ROI if in critical path. |
| `document/` | 0% (0/11) | 0% (0/2) | 0% (0/20) | 0% (0/10) | 1 | 1 | Entire bucket untested — high ROI if in critical path. |
| `templates/` | 20% (1/5) | 0% (0/4) | 0% (0/0) | 33.3% (1/3) | 2 | 0 | Early slice candidate per PLANNER-COVERAGE-75 / SITE-COVERAGE plans. |
| `portal/` | 0% (0/4) | 0% (0/2) | 0% (0/0) | 0% (0/4) | 2 | 2 | Entire bucket untested — high ROI if in critical path. |
| `index.ts/` | 0% (0/0) | 0% (0/0) | 0% (0/0) | 0% (0/0) | 1 | 0 | Early slice candidate per PLANNER-COVERAGE-75 / SITE-COVERAGE plans. |

### Largest untested files (by statement count)

| File | Statements | Remarks |
| --- | --- | --- |
| `features/planner/3d/planner3dviewer.tsx` | 232 | High mass — single file test can move rollup % |
| `features/planner/ui/catalogpanel.tsx` | 97 | Quick win — small isolated module |
| `features/planner/viewer/instancedfurniturerenderer.tsx` | 83 | Quick win — small isolated module |
| `features/planner/ui/layerspanel.tsx` | 74 | Quick win — small isolated module |
| `features/planner/viewer/plannerscenesync.ts` | 72 | Quick win — small isolated module |
| `features/planner/onboarding/onboardingcoach.tsx` | 65 | Quick win — small isolated module |
| `features/planner/viewer/furnituremesh3d.tsx` | 62 | Quick win — small isolated module |
| `features/planner/viewer/fixturemeshes.tsx` | 57 | Quick win — small isolated module |
| `features/planner/shared/components/editor/toolbar.tsx` | 54 | Quick win — small isolated module |
| `features/planner/components/workspacethemeprovider.tsx` | 50 | Quick win — small isolated module |
| `features/planner/viewer/plannerviewer.tsx` | 38 | Quick win — small isolated module |
| `features/planner/onboarding/projectsetupstep.tsx` | 33 | Quick win — small isolated module |
| `features/planner/shared/document/documentbridge.ts` | 33 | Quick win — small isolated module |
| `features/planner/landing/plannerfeaturedemo.tsx` | 31 | Quick win — small isolated module |
| `features/planner/landing/plannerlandingpage.tsx` | 30 | Quick win — small isolated module |

## Site track

**Files in scope:** 71 · **Zero-statement files:** 0

### Rollup by metric

| Metric | Covered / Total | % | Target | Remarks |
| --- | --- | --- | --- | --- |
| Statements | 2221 / 2298 | 96.6% | 50% | 96.6% — near or above target; maintain on new code. |
| Functions | 441 / 458 | 96.3% | 50% | 96.3% — good function reach; watch thin wrappers re-exporting untested deps. |
| Branches | 1752 / 1988 | 88.1% | 50% | 88.1% — strong branch coverage; keep edge-case tables in tests. |
| Lines | 1972 / 2016 | 97.8% | 50% | 97.8% — aligns with Vitest `lines` CI threshold; keep new code on green paths. |

**Lines source:** Counts above use `scripts/coverage-metrics.mjs` — reads `l` when present, otherwise derives from `statementMap` + `s` (same basis as Vitest's `lines` threshold).

### By subfolder

| Subfolder | Statements | Functions | Branches | Lines | Files | 0% files | Remarks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `data/site/` | 100% (117/117) | 100% (14/14) | 100% (11/11) | 100% (115/115) | 13 | 0 | Near target — protect with threshold ratchet. |
| `lib/catalog/` | 95.3% (804/844) | 95.3% (102/107) | 83.2% (629/756) | 96.4% (731/758) | 13 | 0 | Near target — protect with threshold ratchet. |
| `lib/configurator/` | 100% (120/120) | 100% (23/23) | 100% (83/83) | 100% (109/109) | 4 | 0 | Near target — protect with threshold ratchet. |
| `features/catalog/` | 97.5% (544/558) | 98.4% (120/122) | 90.8% (514/566) | 99.1% (442/446) | 7 | 0 | Near target — protect with threshold ratchet. |
| `features/shared/` | 98.6% (208/211) | 100% (60/60) | 96.5% (166/172) | 100% (203/203) | 29 | 0 | Near target — protect with threshold ratchet. |
| `features/site-assistant/` | 94.5% (291/308) | 90.9% (90/99) | 86.8% (250/288) | 95.9% (260/271) | 3 | 0 | Near target — protect with threshold ratchet. |
| `features/ops/` | 97% (96/99) | 96.7% (29/30) | 81.7% (58/71) | 97.7% (85/87) | 1 | 0 | Near target — protect with threshold ratchet. |
| `features/ai/` | 100% (41/41) | 100% (3/3) | 100% (41/41) | 100% (27/27) | 1 | 0 | Near target — protect with threshold ratchet. |

### Largest untested files (by statement count)

_None — all files with statements have some coverage._

