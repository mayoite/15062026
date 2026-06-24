# AGENTS-MIGRATION.md
# Agent rules for the Root + 6 Folder migration
# Read this file FIRST, then AGENTS.md, then Readme.md, then the files you will touch.

## Standing Rules (from AGENTS.md — never override)
- No task starts until AGENTS.md is read.
- Re-read AGENTS.md before every retry, task switch, or new instruction.
- No claim without proof.
- Make minimum necessary changes.
- No commit, push, publish, migration apply, or destructive change unless explicitly requested.
- Stay in scope. Do not silently fix unrelated files.
- Log failures, skips, blockers in docs/Failures.md.
- Prefer archiving over deleting unless deletion is explicitly requested.
- Do NOT run Playwright or any test without explicit user permission.

## Migration-Specific Rules

### Branch discipline
- Every phase runs on its own branch: `migration/phase-N`
- Never commit directly to `main` or `migration/root-6-folder` during a phase
- Merge only after human approval of the phase report

### Move discipline
- Always use `git mv` — never shell `mv` or file manager moves
- Never edit file contents during a move phase
- If a source path does not exist, skip it and log the skip in docs/Failures.md

### Config repair discipline (Phase 7a–7d only)
- Change only the paths that break due to the move
- Do not refactor, rename variables, or clean up unrelated code
- Show before/after diff for every changed line

### Test discipline
- Phases 0–10: no test execution without explicit permission
- Phase 11: unit + vitest only (no Playwright)
- Phase 13: release:gate only after typed user permission in chat

### Logging
Every phase must append to docs/Failures.md under its own section:
  ## Phase N – <name>
  - Skips: <list or "none">
  - Blockers: <list or "none">
  - Risks: <list or "none">

### Report format (end of every phase)
- Done: what was completed
- Verified: what was confirmed
- Skipped: what was skipped and why
- Risks: what could go wrong next
- Next: what phase follows
