# 06 - Coverage to 75% (Planner)

*Created: 2026-06-11*
*Owner: in-progress*
*Hard deadline: today*

## Objective

Drive `features/planner/**` Jest coverage to **≥75%** across branches, functions, lines, and statements, and lock the threshold in CI so the bar holds.

## Target

- Config: `config/build/jest.features.config.js`
- Scope: `features/planner/**/*.{ts,tsx}` (excluding `*.d.ts`, `__tests__/`, `*.test.*`, `*.spec.*`)
- Current threshold: **70**
- New threshold: **75** (applied only after the run actually prints ≥75)

## Definition of Done

All four conditions must hold and be reproducible:

1. `npm run test:coverage:features` reports branches, functions, lines, statements all ≥75.
2. `coverageThreshold.global` in `jest.features.config.js` is set to 75 and the run still passes.
3. `results/coverage/features/coverage-summary.json` exists with totals ≥75 and is committed alongside the test files.
4. No test was added that doesn't actually exercise behavior (no empty assertions, no `expect(true).toBe(true)`).

## Out of Scope

- Site coverage (`jest.config.js`, threshold 85). Untouched.
- TypeScript error reduction beyond what's needed to make tests run. The 212 remaining tsc errors are tracked separately; tests don't go through `tsc -p config/build/tsconfig.json`.
- `features/buddy-planner/**`, `features/oando-planner/**`, `tests/features/**` — not in the features-config scope.
- tldraw tool tests (DoorWindowPlacementTool, MeasurementTool, etc.). They require canvas/DOM mocking that costs more time than they earn for hitting 75. Revisit only if the gap can't be closed without them.

## Approach

### Phase 1 — Baseline (now)

Run `npm run test:coverage:features` and capture:

- Per-file `% Stmts`, `% Branch`, `% Funcs`, `% Lines` from the text report
- Aggregate totals
- List of files with **0%** coverage that are large enough to move the needle

Output file: `results/coverage-baseline.log` and `results/coverage/features/coverage-summary.json`.

No code changes in this phase. Just the truth.

### Phase 2 — Slice the gap

Group uncovered surface area by character (each slice is non-overlapping so agents can't collide):

- **S1 — Stores**: `features/planner/store/*.ts` (Zustand stores, mostly pure logic, easiest test wins)
- **S2 — Model**: `features/planner/model/*.ts` (zod schemas, pure types, fast tests)
- **S3 — Persistence**: `features/planner/store/plannerPersistence.ts`, `plannerSaves.ts`, `syncQueueProcessor.ts` (already partially tested; finish the round-trip + error branches)
- **S4 — Editor / lib utilities**: `features/planner/editor/*.ts`, `features/planner/lib/**`
- **S5 — Catalog / data shape helpers**: `features/planner/catalog/**`, `features/planner/data/**`

For each slice we record: starting coverage %, target lines to add, files written.

### Phase 3 — Agent dispatch

Up to 5 agents in parallel, one per slice. Each agent:

1. Reads the source files in its slice and the existing test patterns in the repo.
2. Writes real tests using existing fixtures and shims (`tests/uuidShim.ts`, `tests/__mocks__/`, etc.).
3. Reports back exact files added with full content. The main agent applies them and runs `npm run test:coverage:features` to validate.

Validation gate per slice: coverage number must rise. If a slice's tests don't move the totals, they get rejected and rewritten.

### Phase 4 — Lock the threshold

Once aggregate totals show all four metrics ≥75:

1. Edit `coverageThreshold.global` from 70 to 75 in `jest.features.config.js`.
2. Re-run `npm run test:coverage:features`. Pass = done. Fail = revert and add more tests.
3. Save the final `coverage-summary.json` to `results/coverage/features/` for the deliverable.

## Verification (proof, not claims)

Each phase reports raw command output. The number that matters is the one Jest prints on the totals row:

```
All files       | XX.XX | XX.XX | XX.XX | XX.XX |
```

If that row says ≥75 across all four columns and the threshold-locked run passes, the goal is met. Anything else is not done.

## Risks

- **Persistence migration fallout**: tests that were passing pre-migration might fail because of the new `{ success: boolean }` API and dropped supabase client param. Surfacing in baseline.
- **Coverage measured but not enforced on `features/oando-planner/`** — if the partner who reviews coverage expects "the planner" to include both folders, the slice strategy needs to change. Confirm scope after baseline.
- **tldraw test cost**: if the gap can't close without testing tldraw tools, the only realistic path in one day is a small amount of light shape/state assertion testing rather than full DOM-driven flows.

## Status

- [x] Plan written
- [ ] Phase 1 — Baseline
- [ ] Phase 2 — Gap analysis
- [ ] Phase 3 — Tests written and applied
- [ ] Phase 4 — Threshold locked at 75
- [ ] Final coverage-summary.json captured

## Reporting Cadence

After each phase: Done / Verified (with the exact coverage numbers) / Skipped / Risks / Next.
