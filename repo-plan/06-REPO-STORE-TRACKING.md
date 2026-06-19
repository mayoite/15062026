# 06 Repo Store Tracking

## Purpose

`/repo-store` is the operational dashboard for consolidation work. It must display evidence, not manually optimistic status.

## Required Sections

- Canonical ownership map.
- Complete file inventory counts and paths.
- Wired, partial, stale, protected, unreferenced, and generated classifications.
- Duplicate ownership findings.
- Current work package and next action.
- Typecheck, lint, test, build, accessibility, and navigation results.
- Remaining compatibility files.
- Exact screenshot/report paths.
- Protected-path approval requirements.

## Status Values

```text
not-started
active
blocked
verified
complete
```

## Completion Record Per Work Package

- Exact files changed.
- Exact commands run.
- Exit status and failures.
- Visual evidence path when applicable.
- Compatibility files remaining.
- Acceptance gate result.
- Next action.

## Acceptance Gate

The page can answer: what exists, what is duplicated, what is wired, what is blocked, what changed, what passed, and what happens next.
