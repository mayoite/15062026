# Planner coverage to 75% — execution plan

*Execution · Program: [`MASTER-PLAN.md`](MASTER-PLAN.md) · Track 1 of [`COVERAGE-PLAN.md`](COVERAGE-PLAN.md) · How-to: [`docs/TESTING.md`](../docs/TESTING.md)*

> **Main site** (catalog, marketing data, shared auth, Playwright nav) is a **separate track** — see [`plans/SITE-COVERAGE.md`](SITE-COVERAGE.md). Do not widen this plan's `coverage.include` to `app/` or `components/`.

## Goal

Raise **Vitest v8** coverage on `features/planner/**` to **≥ 75%** on all four metrics (statements, branches, functions, lines), with thresholds enforced in `vitest.config.ts` and tracked in `results/coverage-summary.json`.

## Policy (non-negotiable)

| Topic | Rule |
|-------|------|
| Unit coverage runner | **Vitest v8 only** (`npm run test:coverage`) |
| Coverage scope | `features/planner/**` (`vitest.config.ts` → `coverage.include`) |
| E2E / a11y | **Playwright** (`*.spec.ts`) — release smoke only; **does not** feed coverage % |
| Retired | Jest, Istanbul merge, wide include (`app/`, `components/`, …) |

## Baseline (verified 2026-06-15)

| Item | Value |
|------|--------|
| `npm run test` | **75** Vitest files, **542/542** tests |
| Playwright (separate) | **8** `*.spec.ts` in `tests/` |
| Planner statements | **22.3%** (2,686 / 12,034) — `results/coverage-summary.json` |
| Planner files in scope | **309** |
| Files at **0%** statements | **~170** (~55%) — recheck after `docs:sync:coverage` |
| Thresholds | **20%** in `vitest.config.ts` (ratchet +2–3% per PR) |
| `store/` folder | **~49%** stmts after Slice A partial |

### Why % is low (root cause)

1. **498 tests ≠ 498 modules** — suites hit pure logic (`model/`, parts of `store/`, `lib/`).
2. **~58% of planner files never execute** under Vitest (hooks, editor UI, most tldraw tools).
3. **No workspace harness** — `usePlannerWorkspace`, canvas tools, and route shells need deliberate RTL / mock work.
4. **Not a broken runner** — v8 report matches what tests import.

### Coverage by folder (statement %)

| Folder | Stmts (approx) | % covered | Priority |
|--------|----------------|-----------|----------|
| `tldraw/` | 2,219 | 8.4 | C — batch tools |
| `editor/` | 1,872 | 11.3 | D — utilities first |
| `store/` | 1,868 | 26.2 | **A — highest ROI** |
| `lib/` | 1,505 | 13.4 | D |
| `hooks/` | 806 | 0.1 | **B** |
| `catalog/` | 671 | 24.4 | E — fill gaps |
| `persistence/` | 538 | 42.6 | mostly done |
| `shared/` | 467 | 50.5 | maintain |
| `viewer/` | 394 | 18.5 | F — defer |
| `ui/` | 390 | 7.9 | F — defer |
| `ai/` | 371 | 40.4 | maintain / edge branches |
| `model/` | 256 | **78.5** | done |

---

## Phase status

| Phase | Focus | Status |
|-------|--------|--------|
| T0 | Doc inventory + coverage JSON | Done |
| T1 | All Vitest suites green, no excludes | Done |
| T2 | Planner-only include + baseline thresholds | Partial |
| T3 | Slices A–F below → 75% | **Open** |
| T4 | `release:gate` + Vitest/coverage | Partial (T4.1 `test` in gate ✓) |

---

## Slice A — `store/` (highest ROI)

**Target lift:** planner statements **~25–35%**.

### Files (0% or thin today)

| File | Notes |
|------|--------|
| `store/plannerStore.ts` | Main facade — getters, tool wiring, domain delegation |
| `store/offlineStorage.ts` | IndexedDB / queue paths |
| `store/plannerProjectStore.ts` | Project lifecycle |
| `store/plannerUIStore.ts` | Panel / chrome state |
| `store/aiStore.ts`, `versionStore.ts` | Smaller stores |
| Gaps in `plannerGeometryStore.ts`, `plannerPersistence.ts` | Error branches |

### Test pattern

- New/extend: `tests/planner-store-*.test.ts`
- Import store modules directly; reset state in `beforeEach`
- **Gotcha:** do not `usePlannerStore.setState({ tool })` on the facade — breaks getter delegation; reset **domain stores** only

### Acceptance

- [x] `plannerStore.ts` statements **≥ 60%** (~48%+; extend in A3)
- [x] `offlineStorage.ts`, `plannerProjectStore.ts`, `plannerUIStore.ts` covered (A2)
- [x] `npm run test:coverage` passes
- [x] Ratchet `vitest.config.ts` thresholds (20% band)
- [x] `npm run docs:sync:coverage`; commit `results/coverage-summary.json`
- [ ] Slice A3: `aiStore`, `versionStore`, geometry/persistence gaps → `store/` **≥ 55%**

---

## Slice B — `hooks/`

**Target lift:** **~35–45%** overall after A+B.

### Files

| File | Notes |
|------|--------|
| `hooks/usePlannerWorkspace.ts` | Boot, route params, store hydration |
| `hooks/usePlannerSession.ts` | Auth/guest session |
| `hooks/usePlannerAutosave.ts` | Debounce, identity |
| `hooks/usePlannerUiState.ts` | Panel toggles |
| `hooks/usePlannerPanels.ts` | Layout state |

### Test pattern

- New: `tests/planner-hooks-*.test.tsx`
- `renderHook` from `@testing-library/react`
- Mock: `fetch`, Next navigation, child stores
- `happy-dom` (already in `vitest.config.ts`)

### Acceptance

- [ ] `hooks/` folder statements **≥ 40%**
- [ ] Threshold ratchet + coverage JSON commit

---

## Slice C — `tldraw/tools/`

**Target lift:** **~45–55%** overall (largest stmt bucket).

### Approach

- One PR batch per tool family (walls → placement → measurement → …)
- Follow `tests/planner-tldraw-tools-ClearanceChecker.test.ts` (50%+ on that file)
- Minimal editor mock — no full canvas unless unavoidable

### Priority tools (0% today)

`WallTool`, `PlannerRoomTool`, `FurniturePlacementTool`, `MeasurementTool`, `SelectionTool`, `tldrawSnap.ts`

### Acceptance

- [ ] `tldraw/` statements **≥ 25%** (intermediate), then **≥ 40%** before slice D
- [ ] Each new tool file has a dedicated test file or grouped suite

---

## Slice D — `editor/` + `lib/` utilities

**Target lift:** **~55–65%**.

### Order

1. Pure functions already partially covered: extend `planner-lib-*.test.ts`
2. `editor/` non-UI modules (selection, export helpers)
3. Light RTL for simple components (no tldraw mount)
4. Defer heavy panels (`BlueprintPanel`, `ExportModal`) until C is solid

### Acceptance

- [ ] `lib/` **≥ 35%**, `editor/` **≥ 25%** (intermediate milestones)

---

## Slice E — `catalog/` gaps

**Target lift:** incremental (+2–4% overall).

- `catalog/plannerCatalogCore.ts` (if still thin in catalog tree vs store re-export)
- Client ingest paths, `catalogStore.ts`
- Extend `planner-store-plannerCatalog.test.ts` — **do not** revive deleted duplicate catalog test

---

## Slice F — `ui/`, `viewer/`, `3d/` (defer)

Only after **A–C** or if a cheap harness exists.

- `Planner3DViewer.tsx`, `PlannerViewer.tsx`, `CatalogPanel.tsx` — need R3F/tldraw mocks
- Lower ROI per hour; schedule last or cover via thin wrapper tests

---

## Phase T4 — Release gate

Current `release:gate`: lint + typecheck + build + Playwright (no Vitest).

| Step | Action | Status |
|------|--------|--------|
| T4.1 | Add `npm run test` before or after build | Open |
| T4.2 | Add `npm run test:coverage` when thresholds stable (~40%+) | Open |
| T4.3 | Playwright `DATABASE_URL` blocker — `docs/Failures.md` | Open |
| T4.4 | Optional: wire `docs:check` on PR | Open |

Suggested `release:gate` order:

```
lint:secrets → lint → typecheck → test → build → test:a11y → test:e2e:nav → test:planner-catalog
```

Add `test:coverage` after T3 slice C when flakiness is low.

---

## PR stack (recommended)

| PR | Slice | Expected planner stmt % |
|----|-------|-------------------------|
| T-PR-gate | T4.1 — `npm run test` in `release:gate` | 18% (no coverage change) |
| T-PR-A1 | `plannerStore.ts` + facade getters | ~22–25% |
| T-PR-A2 | `offlineStorage`, `projectStore`, `plannerUIStore` | ~28–32% |
| T-PR-B | hooks (workspace + session) | ~35–42% |
| T-PR-C1 | tldraw tools batch 1 (wall, room, snap) | ~45–50% |
| T-PR-C2 | tldraw tools batch 2 (furniture, measurement) | ~55–60% |
| T-PR-D | editor/lib utilities | ~60–68% |
| T-PR-E | catalog + persistence edge cases | ~68–72% |
| T-PR-F | ui/viewer only if needed for 75% | ≥ 75% |
| T-PR-final | T4.2 coverage in gate; thresholds = 75% | **≥ 75%** all metrics |

Each PR must:

1. Add tests under `tests/` (flat naming — see `docs/TESTING.md`)
2. `npm run test` + `npm run test:coverage` + `npm run lint` + `npm run typecheck`
3. Ratchet `vitest.config.ts` `coverage.thresholds`
4. `npm run docs:sync:coverage` (and `docs:sync` if new test files)
5. Tick progress in `docs/Handover.md`

---

## Ratchet guide (`vitest.config.ts`)

After each merged coverage PR, set thresholds **~2% below** measured planner % (room for CI noise):

| Planner stmt % | Suggested `thresholds.statements` |
|----------------|----------------------------------|
| 18 | 15 |
| 25 | 22 |
| 35 | 32 |
| 50 | 47 |
| 65 | 62 |
| 75 | 75 |

Match `branches`, `functions`, `lines` to the same band.

---

## Verify (every PR)

```bash
npm.cmd run test
npm.cmd run test:coverage
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run docs:sync:coverage
# npm.cmd run docs:check
```

**Done when:**

```text
results/coverage-summary.json → scopes["features/planner"]
  statements, branches, functions ≥ 75%
vitest.config.ts coverage.thresholds ≥ 75% (all four)
npm.cmd run release:gate  (includes test + coverage)
```

---

## Out of scope

- Converting Playwright specs to Vitest
- Co-located `*.test.*` under `features/`
- Reviving `archive/**` Jest suites
- Widening `coverage.include` to `app/` or `components/`
- Database migrations or `proxy.ts` changes for coverage

---

## See also

- `plans/MASTER-PLAN.md` — program dashboard & next PRs
- `plans/COVERAGE-PLAN.md` — planner + main site tracks
- `plans/SITE-COVERAGE.md` — main site track (50% site-logic scope)
- `plans/TESTING-PLAN.md` — phase overview
- `docs/TESTING.md` — commands, naming, layout
- `docs/Failures.md` — `release:gate` blockers
- `plans/ARCHIVE-MAP.md` — retired Jest coverage docs