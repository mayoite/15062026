# Archive batch — 2026-06-12 site cleanup

## Removed from live tree (redirects preserved in `config/build/next.config.js`)

| Former live path | Replacement | Notes |
|---|---|---|
| `app/buddy-planner/**` | `/planner/canvas/` etc. | Redirect-only route shells; copies under `archive/app/buddy-planner/` |
| `app/oando-planner/**` | `/planner/` etc. | Redirect-only route shells; copies under `archive/app/oando-planner/` |
| `features/buddy-planner/**` | `@/features/planner` | Shim re-exports only; moved to `archive/features/buddy-planner/shim-exports-2026-06-12/` |
| `features/planner-shared/**` | `@/features/planner/shared` | Shim re-exports only; moved to `archive/features/planner-shared/` |
| `features/oando-planner/**` | `@/features/planner` | Shim re-exports only; moved to `archive/features/oando-planner/shim-exports-2026-06-12/` |

## Verification

- `npx tsc --noEmit -p config/build/tsconfig.json`
- Legacy URLs: `curl -I /buddy-planner`, `/oando-planner/canvas` → 301 to unified planner routes
