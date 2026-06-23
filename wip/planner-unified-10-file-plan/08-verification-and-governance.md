# Verification and Governance

## Objective

Keep the unified planner packet honest by mapping each lane to proof, rollback awareness, explicit gap logging, and clear pass/fail rules when permission or tooling blocks verification.

## Global Proof Rules

- cleanup claims need runtime/remount proof
- performance claims need before/after measurement plus import-path proof
- state/persistence claims need deterministic recovery proof
- baseline AI claims need validation, fallback, abort, and stale-response proof
- sketch claims need underlay, preview, rollback, retry, and visible-recovery proof
- catalog claims need canonical output, validation, and audit proof
- database claims need query-plan, route-observability, and connection-reuse proof

## Per-Lane Evidence Expectations

### Lane 1: Runtime cleanup

- retained-resource inventory
- strict-mode or repeated remount proof
- 2D and 3D switch teardown proof
- async cancellation or stale-owner proof

### Lane 2: Startup performance

- at least one bundle metric
- at least one timing metric
- chunk-graph or equivalent import proof
- throttled shell-first validation
- cold-start network comparison

### Lane 3: State, persistence, autosave, offline sync

- canonical state envelope proof
- local-first save order proof
- queue dedupe or compaction proof
- hydration precedence proof
- conflict branch proof
- visible save and sync state proof

Named permission-gated tests:
- `tests/unit/planner-state-envelope.test.ts`
- `tests/unit/planner-autosave-local-first.test.ts`
- `tests/unit/planner-hydration-precedence.test.ts`
- `tests/integration/planner-offline-sync-recovery.test.tsx`
- `tests/integration/planner-conflict-branch.test.tsx`

### Lane 4: Baseline AI reliability

- provider fallback classification proof
- abort or stale-response proof
- schema-validation proof
- deterministic apply proof
- visible AI status state proof

Named permission-gated tests:
- `tests/unit/planner-ai-provider-fallback.test.ts`
- `tests/integration/planner-ai-abort-hygiene.test.tsx`
- `tests/unit/planner-ai-schema-validation.test.ts`
- `tests/unit/planner-ai-deterministic-apply.test.ts`

### Lane 5: Sketch-to-plan approved lane

- typed failure taxonomy proof
- underlay-before-fetch proof
- preview before commit proof
- reject rollback proof
- retry-preserves-manual-work proof
- visible workspace recovery proof

Named permission-gated tests:
- `tests/unit/planner-ai-sketchToPlan.test.ts`
- `tests/integration/planner-editor-PlannerWorkspace.test.tsx`
- `tests/unit/floorplanCanvas.test.ts`

### Lane 6: Catalog and asset pipeline

- canonical output proof
- source-family validation proof
- golden-output proof
- duplicate report
- missing-asset audit
- stale-generated-artifact retirement or deprecation proof

### Lane 7: Database and query optimization

- per-route before and after query evidence
- summary vs detail field proof
- JSON search flattening decision proof
- RLS policy-column decision proof
- route-level observability proof
- connection reuse proof

## Permission Gate

Before any test run, ask:

`May I run the targeted planner tests for this lane?`

Do not run Playwright unless explicitly permitted.

## Pass, Fail, and Gap Rules

- a lane is not complete if its proof target is missing
- a lane is not complete if the claimed behavior contradicts the gathered evidence
- if a named test was not run, log the exact test file or command that was skipped
- if only manual proof exists, name the manual scenario explicitly
- if a proof type is impossible in the current environment, log the exact missing tool or environment dependency

## Logging Rule

If proof cannot be gathered:
- log the exact missing proof in `E:\16062026\Failures.md`
- name the lane
- name the blocked file, route, command, or test surface
- state whether the gap is due to permission, missing tooling, or unresolved implementation work
- do not silently promote the lane to complete

## Review Questions

- Did the lane stay inside its scope?
- Did it change a shared seam?
- Did it preserve the previous lane's exit criteria?
- Did it add a rollback or controlled failure path where needed?
- Did it leave a clear follow-up when something was deferred?
- Is the handover based on evidence, not assumption?

## Truth / Evidence

- `E:\16062026\Failures.md`
- planner unit and integration tests under `E:\16062026\tests\`
- route and build evidence from the repo commands named in `Readme.md`
- route-level observability or query notes for database work
- generated reports or audits for catalog work

## Do Not Break

- repo rule requiring explicit permission before tests
- honesty about verification gaps
- lane boundaries established earlier in this packet

## Proof Target

Proof for this file is strong only if a reviewer can show:
- each lane's intended proof type
- any permission gate that blocked verification
- the exact failure log entry for open proof gaps
- handover status derived from evidence instead of assumption

## Completion Checklist

- [x] Every lane has named evidence expectations.
- [x] Permission-gated verification is treated honestly.
- [x] `Failures.md` is updated for every real verification gap.
- [x] A missing proof keeps the lane incomplete.
- [x] Handover can be written from evidence, not assumption.
