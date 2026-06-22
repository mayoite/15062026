# AGENTS.md

Core rules for this repository.

Work only in this repository.
- Treat it as one flat-root Next.js app.
- Build one unified planner for `oando.co.in`.
- Keep active planner work in `features/planner/`.

## Rules

- No claim without proof.
- Make minimum necessary changes.
- No commit, push, publish, migration apply, or destructive change unless explicitly requested.
- Stay in scope and do not WITHOUT USER's EXPLICIT PERMISSION silently fix unrelated files.
- Log failures, skips, blockers, and follow-ups in `Failures.md`.
- Prefer archiving over deleting unless deletion is explicitly requested.
- Do not run playwright or any other test  before taking explicit permisssion from the user.
- Keep site static data in `lib/site-data/`; `data/` is legacy and should not get new app-facing files.
- Mirror CSS only for UI-owned folders; do not create parallel CSS trees for `data/`, `lib/`, or `api/`.
- Keep locale message JSON in `i18n/messages/`; `i18n/request.ts` is the canonical loader.
- Keep route contract metadata in `config/route-contract.json`.

## Read First
Before non-trivial work, read:
1. `Readme.md`
2. The files instructed by the user
6. the live files you will touch


## Quality Bar

- relevant tests pass
- TypeScript passes
- lint passes
- significant app work should run `npm run release:gate` when env is available

## Reporting

After meaningful work, report:

- Done
- Verified
- Skipped
- Risks
- Next
