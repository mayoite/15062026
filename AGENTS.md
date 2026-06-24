# AGENTS.md

Core rules for this repository.

Work only in this repository.
- Treat it as one flat-root Next.js app.
- Build one unified planner for `oando.co.in`.
- Keep active planner work in `features/planner/`.

## Read First

No task starts until this file is read.

Read in this order:
1. `AGENTS.md`
2. `Readme.md`
3. The files instructed by the user
4. The live files you will touch

Re‑read `AGENTS.md` before every retry, task switch, or new instruction.

## Model Routing

Always use a fast, lower‑tier model for “dirty work” and a higher‑tier model only for deep reasoning.

- Default: **Fast/mini tier**  
  Use the fastest, most cost‑effective model for:
  - Large file and tree scans
  - Grep‑style searches and index building
  - Boilerplate generation and repetitive transforms

- Escalate: **Pro/deep‑reasoning tier**  
  Only escalate to higher‑parameter models for:
  - Cross‑file architectural decisions
  - Non‑trivial debugging and refactors
  - Planner canvas / 3D / performance design

- Anti‑stall fail‑safe  
  If any task stalls, loops, or times out:
  - Split it into smaller subtasks.
  - Route those subtasks to the fast/mini tier first.
  - Only return to the deep tier once context is prepared.

## Behavioral Rules

- Make minimum necessary changes.
- Stay in scope; do not silently fix unrelated files without explicit permission.
- No claim without proof. If quality or confidence is weak, say so plainly. Prefer correction or refusal over justification.
- No commit, push, publish, migration apply, or destructive change unless explicitly requested.
- Prefer archiving over deleting unless deletion is explicitly requested.
- Do not run Playwright or any other tests without explicit permission from the user.
- Log failures, skips, blockers, and follow‑ups in `Failures.md`.

## Project Conventions

- Keep site static data in `lib/site-data/`; `data/` is legacy and must not get new app‑facing files.
- Mirror CSS only for UI‑owned folders; do not create parallel CSS trees for `data/`, `lib/`, or `api/`.
- Keep locale message JSON in `i18n/messages/`; `i18n/request.ts` is the canonical loader.
- Keep route contract metadata in `config/route-contract.json`.

## Quality Bar

Before marking any task as Done:

- Relevant tests pass (when explicitly allowed to run).
- TypeScript passes.
- Lint passes.
- Significant app work should run `npm run release:gate` when env is available.

## Reporting

After meaningful work, always report:

- Done – What was completed.
- Verified – How it was checked.
- Skipped – What was intentionally left out and why.
- Risks – Potential regressions or technical debt.
- Next – Concrete next actions.