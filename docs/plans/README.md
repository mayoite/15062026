# CSS Hardcoding Plan

This folder holds the three-phase plan for fixing the CSS hardcoding problem and keeping the repo structure stable afterward.

## Phases

1. [01-hardcoding.md](./01-hardcoding.md) - fix the highest-impact hardcoded styling clusters
2. [02-docs.md](./02-docs.md) - document the folder rules and the CSS ownership model
3. [03-guardrails.md](./03-guardrails.md) - add regeneration and drift checks so the cleanup stays permanent

## Checklist

- [CHECKLIST.md](./CHECKLIST.md) - working checklist for the cleanup and documentation pass

## Status review

- Run `npm run failures:sync` after changing `Failures.md`.
- Use `results/failures-index.csv` for resolved/pending status review.
- Use `results/pending-failures.csv` for the pending-only view.
