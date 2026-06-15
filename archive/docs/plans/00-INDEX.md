# 00 - Plan Index

*Last verified: 2026-06-11*

## Active Plans

1. `01-SITE-IMPLEMENTATION.md`
2. `02-PLANNER-IMPLEMENTATION.md`
3. `03-PLANNER-QUALITY-LEDGER.md`
4. `04-PLANNER-CAPABILITY-MATRIX.md`
5. `05-REPOSITORY-REMEDIATION.md`
6. `06-COVERAGE-TO-75.md`

## Reference Documents

- `PLANNER-SAVES-SCHEMA.md` - Planner saves schema column contract.
- `HONEST-ASSESSMENT.md` - Honest assessment and path forward.
- `IDEAL-APPROACH.md` - Ideal-situation approach description.
- `MIGRATION-STATUS.md` - Phase 2 migration status tracker.

Older plan packs live under `archive/docs/plans/` and are reference material only.

## Purpose

This directory is the current active plan pack for the repository.

- `01-SITE-IMPLEMENTATION.md` covers the public site and ops-portal target state.
- `02-PLANNER-IMPLEMENTATION.md` covers planner architecture and execution target state.
- `03-PLANNER-QUALITY-LEDGER.md` records scored quality evidence.
- `04-PLANNER-CAPABILITY-MATRIX.md` compares market capabilities, current implementation, feasibility, licensing constraints, and recommended priority.
- `05-REPOSITORY-REMEDIATION.md` defines the target source tree, dependency rules, migration phases, and verification gates.
- `06-COVERAGE-TO-75.md` defines the plan to raise planner test coverage to 75%.
- `PLANNER-SAVES-SCHEMA.md` documents the column contract derived from persistence and schema files.
- `HONEST-ASSESSMENT.md` provides an honest assessment of current state and path forward.
- `IDEAL-APPROACH.md` describes the ideal-situation implementation approach.
- `MIGRATION-STATUS.md` tracks Phase 2 migration progress.

## Current Status Ownership

Verified 2026-06-11:

| Artefact | Typecheck Errors | Lint Errors | Lighthouse Scores |
| --- | --- | --- | --- |
| `Handover.md` | 0 | 0 | Captured |
| `Failures.md` | 0 | 0 | Captured |

Use:

- root `Handover.md` for the current operator summary
- root `Failures.md` for failures, skips, blockers, and follow-ups

## How To Use This Pack

1. Treat these plans as implementation targets, not proof that work is complete.
2. Validate all status claims against live code and current command output.
3. Use archived plans for history, checklists, and old design intent only.
