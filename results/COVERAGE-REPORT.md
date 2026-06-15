# Coverage report (Vitest v8)

Regenerate: `npm run docs:sync:coverage` · Source: `results/coverage-summary.json` · **2026-06-15T09:36:05.068Z**

## Executive summary

| Track | Scope | Statements | Functions | Branches | Lines | Gate target | CI threshold | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Planner | `features/planner/**` | 78.4% (9436/12034) | 74.3% (2216/2982) | 70.1% (5715/8158) | 80.4% (8544/10627) | 75% | 20 / 21 / 20 / 21 (statements / functions / branches / lines) | At or above product target |
| Site | site-logic include (see `vitest.site.config.ts`) | 96.6% (2220/2297) | 96.3% (441/458) | 87.9% (1747/1988) | 97.8% (1971/2015) | 50% | 14 / 14 / 7 / 15 | At or above product target |

### Cross-cutting remarks

1. **Statements** are the most reliable rollup column — they count whether each executable statement ran at least once.
2. **Functions** track whether each declared function body was entered; re-export-only files can show 0 functions despite imports.
3. **Branches** count each outcome of conditionals (`if`, `?:`, `&&`, `||`, `switch`); this repo's UI and config code has many branches per statement, so branch % often trails statement % by 5–10 pts.
4. **Lines** match Vitest's `lines` threshold — derived from `statementMap` when `l` is absent in `coverage-final.json` (Vitest v8 default).
5. **59 / 309** planner files and **0 / 71** site files have **0% statements** — target large zero-coverage modules first.
6. Product targets (75% planner / 50% site) are **not** CI thresholds yet; see `plans/MASTER-PLAN.md` critical path.

## Planner track

**Files in scope:** 309 · **Zero-statement files:** 59

### Rollup by metric

| Metric | Covered / Total | % | Target | Remarks |
| --- | --- | --- | --- | --- |
| Statements | 9436 / 12034 | 78.4% | 75% | 78.4% — near or above target; maintain on new code. 59 file(s) at 0% statements in this bucket. |
| Functions | 2216 / 2982 | 74.3% | 75% | 74.3% — good function reach; watch thin wrappers re-exporting untested deps. |
| Branches | 5715 / 8158 | 70.1% | 75% | 70.1% — strong branch coverage; keep edge-case tables in tests. |
| Lines | 8544 / 10627 | 80.4% | 75% | 80.4% — aligns with Vitest `lines` CI threshold; keep new code on green paths. |

**Lines source:** Counts above use `scripts/coverage-metrics.mjs` — reads `l` when present, otherwise derives from `statementMap` + `s` (same basis as Vitest's `lines` threshold).

### By subfolder

| Subfolder | Statements | Functions | Branches | Lines | Files | 0% files | Remarks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `store/` | 93.7% (1750/1868) | 91.8% (628/684) | 85.1% (999/1174) | 94.5% (1506/1594) | 45 | 0 | Near target — protect with threshold ratchet. |
| `hooks/` | 98.4% (793/806) | 99.2% (125/126) | 91.6% (435/475) | 99.5% (734/738) | 5 | 0 | Near target — protect with threshold ratchet. |
| `tldraw/` | 90.9% (2018/2219) | 91.8% (393/428) | 80.6% (1001/1242) | 93% (1878/2020) | 43 | 0 | Near target — protect with threshold ratchet. |
| `ui/` | 18.2% (71/390) | 12.4% (20/161) | 23.8% (129/541) | 20.5% (67/327) | 16 | 10 | Majority of files (10/16) at 0% — slice tests here for fast gains. |
| `admin/` | 0% (0/18) | 0% (0/9) | 0% (0/0) | 0% (0/18) | 9 | 9 | Entire bucket untested — high ROI if in critical path. |
| `3d/` | 20.6% (52/253) | 28.6% (14/49) | 30.7% (43/140) | 21.9% (49/224) | 3 | 1 | Early slice candidate per PLANNER-COVERAGE-75 / SITE-COVERAGE plans. |
| `components/` | 6% (5/84) | 7.1% (2/28) | 0% (0/47) | 6.6% (5/76) | 5 | 4 | Majority of files (4/5) at 0% — slice tests here for fast gains. |
| `editor/` | 88.9% (1664/1872) | 91.5% (408/446) | 80.4% (1127/1401) | 91.7% (1523/1660) | 42 | 0 | Near target — protect with threshold ratchet. |
| `lib/` | 95.5% (1438/1505) | 98.5% (265/269) | 86.1% (784/911) | 98.1% (1297/1322) | 28 | 0 | Near target — protect with threshold ratchet. |
| `catalog/` | 98.1% (658/671) | 97.6% (161/165) | 85.7% (478/558) | 99% (566/572) | 19 | 0 | Near target — protect with threshold ratchet. |
| `persistence/` | 42.6% (229/538) | 31.8% (35/110) | 44.6% (139/312) | 46.7% (219/469) | 7 | 2 | Already partially covered — extend existing test files. |
| `shared/` | 50.5% (236/467) | 32.5% (39/120) | 34.3% (147/428) | 54.5% (224/411) | 34 | 8 | Already partially covered — extend existing test files. |
| `viewer/` | 18.5% (73/394) | 9.2% (9/98) | 32.1% (52/162) | 17.5% (62/355) | 8 | 6 | Majority of files (6/8) at 0% — slice tests here for fast gains. |
| `ai/` | 52.8% (196/371) | 44.7% (46/103) | 37.1% (93/251) | 55.2% (181/328) | 13 | 1 | Already partially covered — extend existing test files. |
| `model/` | 82.8% (212/256) | 79.5% (62/78) | 79.5% (272/342) | 87.1% (196/225) | 8 | 0 | Near target — protect with threshold ratchet. |
| `onboarding/` | 15.3% (26/170) | 14% (6/43) | 14.6% (15/103) | 15.6% (23/147) | 5 | 4 | Majority of files (4/5) at 0% — slice tests here for fast gains. |
| `landing/` | 11.9% (14/118) | 6% (3/50) | 2.4% (1/41) | 11.7% (13/111) | 11 | 9 | Majority of files (9/11) at 0% — slice tests here for fast gains. |
| `help/` | 0% (0/14) | 0% (0/7) | 0% (0/10) | 0% (0/13) | 2 | 2 | Entire bucket untested — high ROI if in critical path. |
| `document/` | 0% (0/11) | 0% (0/2) | 0% (0/20) | 0% (0/10) | 1 | 1 | Entire bucket untested — high ROI if in critical path. |
| `templates/` | 20% (1/5) | 0% (0/4) | 0% (0/0) | 33.3% (1/3) | 2 | 0 | Early slice candidate per PLANNER-COVERAGE-75 / SITE-COVERAGE plans. |
| `portal/` | 0% (0/4) | 0% (0/2) | 0% (0/0) | 0% (0/4) | 2 | 2 | Entire bucket untested — high ROI if in critical path. |
| `index.ts/` | 0% (0/0) | 0% (0/0) | 0% (0/0) | 0% (0/0) | 1 | 0 | Early slice candidate per PLANNER-COVERAGE-75 / SITE-COVERAGE plans. |

### Largest untested files (by statement count)

| File | Statements | Remarks |
| --- | --- | --- |
| `features/planner/3d/planner3dviewer.tsx` | 192 | Quick win — small isolated module |
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
| `features/planner/shared/document/documentbridge.ts` | 33 | Quick win — small isolated module |
| `features/planner/onboarding/projectsetupstep.tsx` | 32 | Quick win — small isolated module |
| `features/planner/landing/plannerfeaturedemo.tsx` | 31 | Quick win — small isolated module |
| `features/planner/landing/plannerlandingpage.tsx` | 30 | Quick win — small isolated module |

## Site track

**Files in scope:** 71 · **Zero-statement files:** 0

### Rollup by metric

| Metric | Covered / Total | % | Target | Remarks |
| --- | --- | --- | --- | --- |
| Statements | 2220 / 2297 | 96.6% | 50% | 96.6% — near or above target; maintain on new code. |
| Functions | 441 / 458 | 96.3% | 50% | 96.3% — good function reach; watch thin wrappers re-exporting untested deps. |
| Branches | 1747 / 1988 | 87.9% | 50% | 87.9% — strong branch coverage; keep edge-case tables in tests. |
| Lines | 1971 / 2015 | 97.8% | 50% | 97.8% — aligns with Vitest `lines` CI threshold; keep new code on green paths. |

**Lines source:** Counts above use `scripts/coverage-metrics.mjs` — reads `l` when present, otherwise derives from `statementMap` + `s` (same basis as Vitest's `lines` threshold).

### By subfolder

| Subfolder | Statements | Functions | Branches | Lines | Files | 0% files | Remarks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `data/site/` | 100% (116/116) | 100% (14/14) | 100% (11/11) | 100% (114/114) | 13 | 0 | Near target — protect with threshold ratchet. |
| `lib/catalog/` | 95.3% (804/844) | 95.3% (102/107) | 82.5% (624/756) | 96.4% (731/758) | 13 | 0 | Near target — protect with threshold ratchet. |
| `lib/configurator/` | 100% (120/120) | 100% (23/23) | 100% (83/83) | 100% (109/109) | 4 | 0 | Near target — protect with threshold ratchet. |
| `features/catalog/` | 97.5% (544/558) | 98.4% (120/122) | 90.8% (514/566) | 99.1% (442/446) | 7 | 0 | Near target — protect with threshold ratchet. |
| `features/shared/` | 98.6% (208/211) | 100% (60/60) | 96.5% (166/172) | 100% (203/203) | 29 | 0 | Near target — protect with threshold ratchet. |
| `features/site-assistant/` | 94.5% (291/308) | 90.9% (90/99) | 86.8% (250/288) | 95.9% (260/271) | 3 | 0 | Near target — protect with threshold ratchet. |
| `features/ops/` | 97% (96/99) | 96.7% (29/30) | 81.7% (58/71) | 97.7% (85/87) | 1 | 0 | Near target — protect with threshold ratchet. |
| `features/ai/` | 100% (41/41) | 100% (3/3) | 100% (41/41) | 100% (27/27) | 1 | 0 | Near target — protect with threshold ratchet. |

### Largest untested files (by statement count)

_None — all files with statements have some coverage._

