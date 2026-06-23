# AGENTS.md

Core rules for this repository.

Work only in this repository.
- Treat it as one flat-root Next.js app.
- Build one unified planner for `oando.co.in`.
- Keep active planner work in `features/planner/`.

## Rules

- No task starts until `AGENTS.md` is read.
- Re-read `AGENTS.md` before every retry, task switch, or new instruction.
- No claim without proof.
- If quality is weak, say so plainly. If confidence is low, say so plainly. Do not defend the tool, the vendor, or prior output when the user is pointing at real failure. Prefer correction, proof, or refusal over justification.
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
Read in this order:
1. `AGENTS.md`
2. `Readme.md`
3. The files instructed by the user
4. The live files you will touch


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
