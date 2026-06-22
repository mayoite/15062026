# Phase 1 - Hardcoding Cleanup

## Goal

Reduce the worst CSS hardcoding and utility noise in TSX by moving repeated visual patterns into the nearest shared CSS layer.

## Scope

- Use `results/hardcoded-audit-detail.csv` as the work list
- Use `results/failures-index.csv` to track resolved vs pending status while you work
- Use `results/pending-failures.csv` when you only want the open items
- Fix repeated spacing, radius, gap, card, and button patterns first
- Keep one-off page-only styling local when it does not repeat
- Prefer the nearest existing CSS home:
  - `app/css/core/components/`
  - `app/css/core/utilities/`
  - `app/css/core/site/`
  - `app/css/core/planner/`

## Exit Criteria

- The top repeated hardcoded patterns are moved out of TSX
- The remaining utility usage is either intentional or truly local
- The audit list and failures index both point at the current work, not stale paths
