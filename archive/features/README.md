# Archived feature modules

Moved here instead of deleted. Canonical planner code lives in `features/planner/`.

| Path | Archived | Reason |
|---|---|---|
| `buddy-planner/` | 2026-06-12 | Retired editor; smart wizard logic moved to `lib/configurator/` |
| `oando-planner/` | 2026-06-12 | Retired editor; shims were re-exporting `features/planner/` |
| `material-studio/` | 2026-06-12 | No live routes or imports |

Legacy URL entry points remain under `app/buddy-planner/` and `app/oando-planner/` as thin `redirect()` routes only.
