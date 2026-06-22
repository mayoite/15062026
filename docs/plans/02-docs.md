# Phase 2 - Docs and Structure

## Goal

Write down the CSS ownership model so the repo has a permanent rule for where styling belongs.

## Scope

- Document the CSS-first structure in `docs/architecture/`
- Keep `lib/site-data/`, `i18n/messages/`, and `config/route-contract.json` documented as canonical homes
- Explain the difference between:
  - shared CSS system
  - route-owned styling
  - pure config/data folders
- Keep `results/failures-index.csv` and `results/pending-failures.csv` as status-tracking outputs, not architecture docs

## Exit Criteria

- A new contributor can tell where a style belongs without guessing
- The plan and structure docs agree on the folder policy
- The docs mention the real canonical homes, not the legacy ones
