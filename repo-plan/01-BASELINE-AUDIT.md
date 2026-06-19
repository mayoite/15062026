# 01 Baseline and Repository Audit

## Scope

Classify every active path, establish current failures, and prevent unverified deletion or movement.

## Inventory

- Active paths: 4,144
- Planner files: 332
- Tests: 215
- Public assets: 2,941
- Protected paths: 102
- Lexical migration-review matches: 168

`Migration review` is not a deletion verdict. It means a file contains a marker such as `tldraw`, `legacy`, `deprecated`, `stub`, `@ts-nocheck`, or disabled behavior.

## Tasks

- [ ] Run `npm.cmd run typecheck` and save output to `results/repo-audit/baseline-typecheck.txt`.
- [ ] Run `npm.cmd run lint` and save output to `results/repo-audit/baseline-lint.txt`.
- [ ] Run `npm.cmd run test` and save output to `results/repo-audit/baseline-test.txt`.
- [ ] Run `npm.cmd run test:planner` and save output to `results/repo-audit/baseline-planner.txt`.
- [ ] Generate direct and dynamic import references for every migration-review path.
- [ ] Classify each path as canonical, compatibility, stale, generated, protected, or false positive.
- [ ] Record duplicate filenames and duplicate responsibilities separately.
- [ ] Detect circular imports across `app`, `features`, `components`, and `lib`.
- [ ] Publish counts, paths, and decisions in `/repo-store`.

## Current Confirmed Blockers

- `app/(site)/portal/page.tsx` imports a missing planner persistence export.
- Planner lint reports hook, unused import, `@ts-nocheck`, and immutability failures.
- The previous wiring subagent disconnected and produced no complete ledger.

## Exact Review Commands

```powershell
rg --files app components features lib data tests scripts config platform project
rg -l "tldraw|@ts-nocheck|legacy|deprecated|stub|not yet available|disabled until" features/planner app/planner
rg "from ['\"]@/features/planner" app features tests
git status --short
```

## Acceptance Gate

- Every active source file has an owner and status.
- Baseline failures are reproducible and stored under `results/repo-audit/`.
- No file is moved based only on a lexical marker.
