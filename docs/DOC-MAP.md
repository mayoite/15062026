# Documentation map

*Reference: `docs/`. Roadmaps: `plans/`. Generated data: `results/` + `tests/INVENTORY.md`.*

## How `docs/` is organized

Three layers — do not mix them:

| Layer | What | Where | Edit when |
|-------|------|-------|-----------|
| **Live ops** | Current milestones + open breakages | `Handover.md`, `Failures.md` | Something changes today |
| **Reference** | How the repo works (stable how-to) | `TESTING.md`, `SCRIPTS.md`, `CSS-ARCHITECTURE.md` | Tooling or layout changes |
| **Ops evidence** | Point-in-time audits + context tables | `ops/audits/`, `ops/context/` | After an audit run |

**Not in `docs/`:** phased roadmaps → `plans/`. Retired plans and recovered session logs → `archive/docs/`.

```
docs/
├── DOC-MAP.md              ← you are here
├── Handover.md             ← live: milestones, verified state
├── Failures.md             ← live: open issues + dev gotchas only
├── TESTING.md              ← reference: test layout & commands
├── SCRIPTS.md              ← reference: npm scripts
├── CSS-ARCHITECTURE.md     ← reference: CSS import map
├── CONTENTS.md             ← generated folder blurb
└── ops/
    ├── audits/             ← Supabase audit snapshots (md + json)
    └── context/            ← reference tables (e.g. route classification)
```

## Root markdown (repo root, not `docs/`)

| File | Role |
|------|------|
| `Readme.md` | Orientation |
| `AGENTS.md` | Agent rules |
| `CONTENTS.md` | Generated repo map |

## Read order

1. `Readme.md` → 2. `AGENTS.md` → 3. `docs/Handover.md` → 4. `docs/Failures.md` → 5. this file

## Past failures — what goes where

| Need | Use |
|------|-----|
| **Open** issues right now | `docs/Failures.md` only |
| **When** something was fixed | **Git** — `git log -- docs/Failures.md` then `git show <sha>:docs/Failures.md` |
| **Why** a fix landed | Commit message + that `git show` snapshot |
| Long recovered log (2026-06-12–14) | `archive/docs/recovered-2026-06-15/FAILURES-HISTORY.md` (read-only; do not extend) |

Do **not** keep appending fixed issues to `Failures.md` — it becomes a second git. Log the fix in a commit message; trim `Failures.md` when the row is resolved.

## Git history — what it is for

Git is the **canonical history** for docs and code:

- Every commit stores the full file at that moment (`git show <sha>:path`)
- `git log --oneline -- docs/` shows when ops docs changed
- **`main`** on `origin` — planner feat + docs/plans sync merged 2026-06-15. Primary clone: `E:\Goodsites\13062026`; this folder is a worktree on the same repo.

Markdown under `archive/` is a **frozen snapshot** for things worth keeping readable without digging git — not a live log.

## Where things live

| Need | File |
|------|------|
| Agent rules | `AGENTS.md` (root) |
| Milestones | `docs/Handover.md` |
| Open breakages | `docs/Failures.md` |
| How tests work | `docs/TESTING.md` |
| npm scripts | `docs/SCRIPTS.md` |
| Program dashboard | `plans/MASTER-PLAN.md` |
| Test/coverage roadmap | `plans/TESTING-PLAN.md` |
| Folder cleanup roadmap | `plans/REPO-STRUCTURE-PLAN.md` |
| Hardcoding inventory | `docs/HARDCODING-INVENTORY.md` |
| Hardcoding remediation plan | `plans/HARDCODING-PLAN.md` |
| Archived plans crosswalk | `plans/ARCHIVE-MAP.md` |
| Test file list | `tests/INVENTORY.md` or `results/test-inventory.json` |
| Coverage baseline | `results/coverage-summary.json` |
| Coverage report (per-metric remarks) | `results/COVERAGE-REPORT.md` — `npm run docs:sync:coverage` |
| Coverage handover / close block | `docs/Handover.md` § Coverage close block · `plans/SITE-COVERAGE.md` |
| Recovered session logs | `archive/docs/recovered-2026-06-15/` |
| Historical plans | `archive/docs/plans/`, `archive/docs/plans-retired-2026-06-14/` — see `plans/ARCHIVE-MAP.md` |

## Sync (one script, one pass)

`scripts/generate-docs.mjs` — **no separate check that regenerates again.**

| Command | When |
|---------|------|
| `npm run docs:sync` | **Default** — after add/remove/rename tests (~1s) |
| `npm run docs:sync:all` | After editing folder manifest in `generate-contents-md.mjs` |
| `npm run docs:sync:coverage` | Coverage baseline update |
| `npm run docs:check` | CI — sync + fail if inventory artifacts ≠ git |
| `npm run docs:check:coverage` | CI — sync coverage + fail if stale |

Do **not** hand-edit `INVENTORY.md` or `results/test-*.json`.

---
*Edit this file when adding a doc or plan. Edit `scripts/generate-contents-md.mjs` for new folders.*