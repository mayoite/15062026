# Active plans

*Entry point: [`MASTER-PLAN.md`](MASTER-PLAN.md) — program dashboard, metrics, critical path.*

## Why this folder exists

Phased roadmaps with acceptance criteria. Reference how-to stays in `docs/`.

## What is here

| File | Role |
|------|------|
| **MASTER-PLAN.md** | Program charter, metrics, initiative status, next 3 PRs |
| **COVERAGE-PLAN.md** | Two-track coverage strategy (planner 75% + site 50%) |
| **TESTING-PLAN.md** | Vitest/Playwright phases T0–T4 + S0–S4, gate wiring |
| **PLANNER-COVERAGE-75.md** | Planner execution: slices A–F, ratchet, PR stack |
| **SITE-COVERAGE.md** | Site execution: slices S0–S4, Playwright split |
| **REPO-STRUCTURE-PLAN.md** | Folder layout steps 00–06 (**complete**) |
| **HARDCODING-PLAN.md** | Literal remediation steps 00–06 |
| **ARCHIVE-MAP.md** | Crosswalk from `archive/docs/plans*` to live plans |

**Supporting inventory:** [`docs/HARDCODING-INVENTORY.md`](../docs/HARDCODING-INVENTORY.md)

**Not live plans** (backlog in `docs/Handover.md` / `docs/Failures.md` or archive only): opening collision, INR/GST quote schema (`archive/.../STRATEGIC-GAPS.md`).

## Rules

- One plan file per initiative; strategy vs execution split as in `MASTER-PLAN.md`
- Historical plans: `archive/docs/plans/`
- Do not duplicate `docs/TESTING.md` or `docs/SCRIPTS.md` command tables

## See also

- `docs/DOC-MAP.md`
- `docs/TESTING.md`
- `docs/Handover.md`

---
*Update manifest in `scripts/generate-contents-md.mjs`, then `npm run docs:sync:all` if regenerating.*