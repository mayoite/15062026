# 00 Start Here

## Objective

Turn `E:\16062026` into one maintainable Next.js application with one active planner, one catalog contract, one document contract, explicit ownership, and enforceable release evidence.

## Read Order

1. `00-START-HERE.md`
2. `01-BASELINE-AUDIT.md`
3. `02-PLANNER-CONSOLIDATION.md`
4. `03-CATALOG-SITE-CONSOLIDATION.md`
5. `04-PLATFORM-BOUNDARIES.md`
6. `05-TESTING-RELEASE.md`
7. `06-REPO-STORE-TRACKING.md`
8. `99-HANDOVER.md`

## Sources of Truth

- Repository rules: `AGENTS.md`
- Repository orientation: `Readme.md`
- Complete active-file inventory: `results/repo-audit/active-files.md`
- Machine-readable inventory: `results/repo-audit/active-files.csv`
- Operational dashboard: `/repo-store`

## Target Ownership

```text
app/                         route entrypoints and composition
features/site/               site-owned UI and content
features/catalog/            canonical catalog domain
features/planner/canvas/     Fabric 2D runtime
features/planner/scene/      canonical R3F runtime
features/planner/document/   PlannerDocument contract
features/planner/state/      Zustand runtime state
features/planner/persistence save, load, import, export, cloud
features/planner/catalog/    planner-specific placement adapters
features/planner/ui/         workspace shell and controls
components/ui/               domain-neutral UI primitives
lib/                         shared infrastructure only
tests/                       tests grouped by domain and runner
results/                     all generated evidence
archive/                     inactive history
```

## Non-Negotiable Rules

- Fabric is the only active 2D engine.
- R3F consumes the same canonical document as Fabric.
- One domain responsibility has one implementation owner.
- Compatibility files are temporary re-exports, never duplicate implementations.
- No generated test or report folder returns to repo root.
- Characterization tests precede ownership moves.
- Protected paths require explicit approval before modification.
- No commit, push, migration, or destructive action without explicit approval.

## Execution Sequence

```text
Baseline -> Quality gate -> Planner state -> Planner document -> Fabric/3D
-> Catalog -> Site -> Platform audit -> Tests -> Repo Store -> Release
```

Do not start a later stage until the current stage's acceptance gate passes.
