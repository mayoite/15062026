# 11 — Test Coverage Plan

*Created: 2026-06-11 — Drive planner test coverage to ≥75% and lock threshold in CI.*
*Updated: 2026-06-12 — Vitest is primary; Jest features config secondary; baseline not yet captured.*

## Objective

Drive **`features/planner/**`** test coverage to **≥75%** across branches, functions, lines, and statements, and lock the threshold in CI.

---

## Live Status (2026-06-12)

| Item | State |
|---|---|
| Primary test runner | **Vitest** (`npm run test`, `npm run test:planner`) |
| Planner tests in CI path | `tests/planner/` — **67 tests**, 4 files |
| Co-located planner tests | `features/planner/**/*.test.ts` — **exist but not in Vitest `include`** |
| Jest features config | `config/build/jest.features.config.js` — matches `features/planner/**` tests only |
| `npm run test:coverage:features` | **Does not exist** in `package.json` |
| `npm run test:coverage` | Vitest v8 → `results/coverage/` |
| Baseline log | **Not captured** — Phase 1 open |
| Threshold locked at 75% | **No** |

**Honest count today:** meaningful planner behavior is covered by 67 Vitest tests + visual QA scripts (`catalog:qa:sheet`), not by a measured 75% line coverage gate.

---

## Target

| Setting | Value |
|---|---|
| Scope | `features/planner/**/*.{ts,tsx}` excluding `*.d.ts`, `*.test.*`, `*.spec.*` |
| Threshold | **75%** global (branches, functions, lines, statements) |
| Runner | **Vitest** (preferred) — align `vitest.config.ts` `coverage.include` with scope |
| Legacy | Jest `jest.features.config.js` — keep until Vitest threshold is locked |

---

## Definition of Done

All four must be reproducible:

1. `npm run test:coverage` (or dedicated `test:coverage:planner`) reports all four metrics ≥75% for `features/planner/**`
2. Threshold enforced in `vitest.config.ts` `coverage.thresholds` (or CI script)
3. `results/coverage/coverage-summary.json` committed with totals ≥75
4. No empty assertions; tests exercise real behavior (`06-TESTING.md` rules)

---

## Out of Scope

- Site coverage (separate target in legacy `jest.config.js`)
- `features/buddy-planner/**`, `features/oando-planner/**` except where archived
- Full Tldraw tool DOM integration (cost > value unless gap cannot close otherwise)
- `archive/**`

---

## Approach

### Phase 1 — Baseline (open)

```bash
npm run test:coverage
```

Capture:
- Aggregate totals for `features/planner/**`
- Per-file 0% list (files > 50 lines)
- Co-located tests currently **excluded** from run:

| File | Why it matters |
|---|---|
| `features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge.test.ts` | SH/NS chair counts, canvas unit repair |
| `features/planner/shared/boq/quoteCartBridge.test.ts` | Quote bridge |
| `features/planner/shared/export/exportBoq.test.ts` | BOQ export |
| `features/planner/shared/catalog/catalogAdapter.test.ts` | Catalog adapter |
| `features/planner/shared/plannerShared.test.tsx` | Shared UI |

**Output:** `results/coverage-baseline.log` + summary JSON.

### Phase 2 — Close the Vitest include gap

**Before writing new tests:**
1. Extend `vitest.config.ts` `include` to `features/planner/**/*.test.ts` **or** move tests to `tests/planner/`
2. Re-run `npm run test:planner` — expect count > 67
3. Re-run coverage baseline

### Phase 3 — Slice the gap

| Slice | Path | Priority |
|---|---|---|
| S1 Stores | `features/planner/store/` | High — pure logic |
| S2 Model | `features/planner/model/` | High — zod + validators |
| S3 Persistence | `plannerPersistence.ts`, `persistence.ts`, `plannerSaves.ts` | High — M4 |
| S4 Data / catalog | `features/planner/data/`, `lib/catalog/` used by planner | Medium |
| S5 Editor UI | `features/planner/editor/` | Low — prefer Playwright for UI |

### Phase 4 — Lock threshold

When aggregate ≥75%:
1. Set `coverage.thresholds.global` in `vitest.config.ts`
2. Add optional `test:coverage:planner` script scoped to planner include
3. Wire into `release:gate` only after lint is green

---

## Current Test Inventory (verified)

### `tests/planner/` (in CI)

| File | Focus |
|---|---|
| `buildBlock2D.test.ts` | SH/NS, meeting flip-tops, cabin, 2.5D |
| `geometry.test.ts` | dist, projectT, segment snap, sanitizeTags |
| `svg-qa.test.ts` | 121 catalog items → inline SVG |
| `guestToAuthMigration.test.ts` | IndexedDB guest → member claim |

### `tests/unit/` (site + planner data)

| File | Focus |
|---|---|
| `planner-landing-data.test.ts` | Marketing data |
| `plannerPublish.test.ts` | Publish helpers |
| `planner-catalog.test.ts` | Catalog structure |
| `planner-state.test.ts` | State helpers |
| `homepage-data.test.ts`, `navigation-data.test.ts` | Site (not planner coverage) |

### Scripts (not unit coverage)

| Command | Output |
|---|---|
| `npm run catalog:qa:sheet` | `results/catalog-qa/` |
| `npm run catalog:blocks:qa` | `results/actual_engine_blocks.svg` |

---

## Verification (proof, not claims)

Report raw Vitest coverage totals row:

```
All files  | % Stmts | % Branch | % Funcs | % Lines |
```

Until that row shows ≥75 on all four columns **and** threshold-locked run passes, this doc stays **open**.

---

## Risks

- **Split runners:** Jest features vs Vitest — measuring the wrong runner gives false confidence
- **Orphan co-located tests:** SH bridge tests pass locally if run manually but not in CI
- **Persistence tests need DB mocks:** Drizzle must be mocked at boundary; no live DB in unit tests
- **UI-heavy editor:** Coverage % may require shallow render tests with low value — prefer E2E for canvas

---

## Status Checklist

- [ ] Phase 1 — Baseline captured (`results/coverage-baseline.log`)
- [ ] Phase 2 — Co-located tests in Vitest CI path
- [ ] Phase 3 — Slice tests written; coverage rises
- [ ] Phase 4 — Threshold 75% locked in `vitest.config.ts`
- [ ] `release:gate` includes coverage step (after lint fixed)

---

## Cross-References

| Topic | Doc |
|---|---|
| CI gate | `06-TESTING.md` |
| Phase 0 tooling | `10-MIGRATION-PHASES.md` |
| Orphan bridge tests | `10-MIGRATION-PHASES.md` Phase 0 |
