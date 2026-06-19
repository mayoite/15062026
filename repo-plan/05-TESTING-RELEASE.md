# 05 Testing and Release

## Target Evidence Layout

```text
tests/unit/
tests/integration/
tests/e2e/
results/coverage/
results/playwright-report/
results/test-results/
results/screenshots/
results/repo-audit/
```

## Test Migration

- [ ] Classify all tests by domain and runner before moving them.
- [ ] Remove tests that assert retired tldraw implementation details.
- [ ] Preserve behavior coverage for routes, planner documents, persistence, Fabric, catalog identity, BOQ, 3D, accessibility, and navigation.
- [ ] Update Vitest patterns only after destination folders exist.
- [ ] Update Playwright paths and reporters so evidence stays under `results/`.
- [ ] Verify coverage does not drop because of file moves.

## Verification Matrix

| Area | Commands | Evidence |
|---|---|---|
| Baseline | `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test` | Stored command output |
| Persistence | `npm.cmd run test:planner` | Save/reload/import proof |
| Document | focused Vitest round-trip tests | Same IDs and dimensions after reload |
| Fabric | focused planner Playwright specs | Desktop/mobile screenshots |
| 3D | planner chrome/catalog specs | Nonblank canvas and matched item count |
| Catalog | catalog tests and planner catalog E2E | Same ID across all surfaces |
| Site | site tests and `npm.cmd run test:e2e:nav` | Homepage/product screenshots |
| Accessibility | `npm.cmd run test:a11y` | No critical violations |
| Release | full gate below | Repo Store updated |

## Final Gate

```powershell
npm.cmd run lint:secrets
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run test:planner
npm.cmd run test:a11y
npm.cmd run test:e2e:nav
npm.cmd run build
```

## Rollback Rules

- Never use `git reset --hard` or discard unrelated worktree changes.
- Restore a compatibility export if a mechanical move breaks imports.
- Keep a versioned import adapter if saved plans fail after schema consolidation.
- Keep the currently mounted 3D renderer if the replacement fails visual checks.
- Stop and define an explicit ID migration if catalog identity changes.

## Acceptance Gate

All final commands pass and every generated artifact lands under `results/`.
