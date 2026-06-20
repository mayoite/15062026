# Fresh Baseline Failures — 2026-06-19

Complete command output is retained in the four `baseline-*.txt` files in this directory.

| Command | Exit | Confirmed result |
|---|---:|---|
| `npm.cmd run typecheck` | 0 | Passed. |
| `npm.cmd run lint` | 1 | 4 errors, 0 warnings. |
| `npm.cmd run test` | 1 | 3 failed files, 200 passed; 3 failed tests, 1363 passed; 1 unhandled worker error. |
| `npm.cmd run test:planner` | 1 | 3 failed files, 135 passed; 3 failed tests, 910 passed; 1 unhandled worker error. |

## Lint failures

All four are `@typescript-eslint/ban-ts-comment` violations for `@ts-nocheck` at line 1:

- `features/planner/hooks/usePlannerWorkspace.ts`
- `features/planner/lib/editorTools.ts`
- `features/planner/lib/measurements.ts`
- `features/planner/ui/LayersPanel.tsx`

## Full test failures

- `tests/navigation-data.test.ts`: expected three footer navigation sections; received four.
- `tests/planner-editor-exportActions.test.ts`: expected depth `4000`; received `4040`.
- `tests/planner-editor-PlannerLeftPanel.test.tsx`: expected `AI assist drawer` after selecting the AI Assist tab; element was absent.
- Vitest reported one worker exiting unexpectedly after a JavaScript heap out-of-memory failure. The output also contains localhost connection-refused diagnostics.

## Planner test failures

- `tests/planner-catalog-exports.test.ts`: timed out after 5000 ms.
- `tests/planner-editor-exportActions.test.ts`: expected depth `4000`; received `4040`.
- `tests/planner-editor-PlannerLeftPanel.test.tsx`: expected `AI assist drawer` after selecting the AI Assist tab; element was absent.
- Vitest reported one worker exiting unexpectedly after a JavaScript heap out-of-memory failure. The output also contains localhost connection-refused diagnostics.

The full and planner suites were captured concurrently. Resource-related worker and timeout failures therefore require sequential confirmation.

## Sequential focused rerun

The three failed files from the full `npm.cmd run test` baseline were rerun one at a time with `--maxWorkers=1 --fileParallelism=false`. Each failure reproduced with exit code 1, and none of these focused runs produced the earlier worker/OOM error:

| File | Exit | Exact result | Evidence |
|---|---:|---|---|
| `tests/navigation-data.test.ts` | 1 | 1 failed, 24 passed; expected 3 footer sections, received 4. | `baseline-rerun-navigation-data.txt` |
| `tests/planner-editor-exportActions.test.ts` | 1 | 1 failed, 3 passed; expected depth `4000`, received `4040`. | `baseline-rerun-planner-editor-exportActions.txt` |
| `tests/planner-editor-PlannerLeftPanel.test.tsx` | 1 | 1 failed, 1 passed; `AI assist drawer` remained absent. | `baseline-rerun-planner-editor-PlannerLeftPanel.txt` |

These three assertion/UI failures are deterministic in the current workspace. The baseline-wide worker/OOM error is not required to reproduce them. The separate `tests/planner-catalog-exports.test.ts` timeout from `test:planner` was not part of this three-file rerun and remains unconfirmed in isolation.
