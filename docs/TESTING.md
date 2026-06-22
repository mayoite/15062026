# Testing

## Run commands (use these — not raw redirects)

| Task | Command |
|------|---------|
| Vitest (unit/integration) | `npm test` |
| Vitest watch | `npm run test:watch` |
| Coverage (planner) | `npm run test:coverage` |
| Coverage (site) | `npm run test:coverage:site` |
| Playwright e2e / a11y | `npm run test:e2e:nav`, `npm run test:a11y`, `npm run test:planner-catalog` |
| Typecheck | `npm run typecheck`, `npm run typecheck:scripts` |
| Lint | `npm run lint` |
| Full gate | `npm run release:gate` |

Do **not** pipe tool output to repo-root files (`tsc > tsc-errors.txt`, `eslint -f json > lint-results.json`, etc.). Those paths are stale scratch and are removed automatically before test runs.

## Canonical output locations

All generated test artifacts belong under `results/`, not the repo root.

| Tool | Output |
|------|--------|
| Vitest JSON | `results/tests/vitest-results.json` |
| Vitest site JSON | `results/tests/vitest-site-results.json` |
| Vitest CSV/HTML | `results/tests/vitest-results.{csv,html}` (from `posttest` / report script) |
| Vitest raw coverage (planner) | `results/coverage/` |
| Vitest raw coverage (site) | `results/coverage-site/` |
| Coverage reports (planner) | `results/coverage-reports/planner/coverage-report.{csv,html,json}` |
| Coverage reports (site) | `results/coverage-reports/site/coverage-report.{csv,html,json}` |
| Playwright traces/screenshots | `results/test-results/` |
| Playwright HTML report | `results/playwright-report/` |
| Playwright JSON (ops portal) | `results/audits/raw-playwright.json` |
| App pages inventory | `results/app-pages-inventory.csv` (`npm run inventory:app-pages`) |
| Scripts inventory | `results/scripts-inventory.csv` (`npm run inventory:scripts`) |
| R2 object count | `results/audits/r2-object-count.json` (`npm run assets:r2:count`) |
| Planner screenshot | `results/screenshots/planner-guest-left-panel.png` (`npm run screenshot:planner`) |
| Results hub | `/results` — live index of everything under `results/` |

Configs that enforce these paths:

- `vitest.shared.ts` + `vitest.config.ts` / `vitest.site.config.ts`
- `config/build/playwright.config.ts`
- `tests/root-configs.test.ts` (guards Vitest + Playwright paths)

## Stale root artifacts (auto-cleaned)

`npm run test:clean` (also runs as `pretest` before `npm test`) deletes these if they appear at repo root:

- `tsc-errors.txt`, `errors.txt`, `scripts_errors.txt`
- `lint-results.json`, `test-results.json`, `test-results2.json`, `test-output.txt`
- `scratch_*` files
- `test-results/`, `playwright-report/`, `coverage/` directories at root (wrong cwd)

`.gitignore` also ignores these patterns so they are not committed accidentally.

## Test layout

- All tests live under `tests/` (`unit/`, `integration/`, `e2e/`, `fixtures/`).
- No co-located `*.test.*` under `app/`, `features/`, etc. (`npm run test:layout:check`).
