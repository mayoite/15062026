# 99 Handover

## Current Objective

Consolidate the Oando repository according to the numbered files in this folder. Begin at `00-START-HERE.md` and execute in order.

## Current Verified State

- Fabric drives the active planner 2D workspace.
- Fabric state feeds the current R3F viewer path.
- Duplicate planner persistence, document bridge, 3D, and catalog layers remain.
- Complete inventory: `results/repo-audit/active-files.md` and `.csv`.
- `/repo-store` displays workflow, audit, phases, blockers, and inventory counts.
- Test reports and screenshots are configured under `results/`.
- Targeted Repo Store lint and route checks passed.
- Full repo typecheck and lint previously failed from planner migration debt.

## Start Next

1. Read `01-BASELINE-AUDIT.md`.
2. Capture fresh typecheck, lint, test, and planner-test output.
3. Validate lexical inventory classifications.
4. Do not move implementation files until the quality baseline is reproducible.

## Protected Paths

Do not edit without explicit approval: `proxy.ts`, `app/api/`, `config/build/`, `platform/`, `project/`, auth/session behavior, database migrations, or generated schema.

## Working Tree Safety

- Assume unrelated dirty changes belong to the user.
- Never revert them.
- Do not commit or push without explicit instruction.
- Use `npm.cmd` on PowerShell.
- Keep generated evidence under `results/`.

## Completion Definition

One active site, planner, catalog, document contract, state layer, persistence layer, and 3D renderer; no active tldraw runtime; no duplicate implementations; all release gates pass; Repo Store shows current evidence.
