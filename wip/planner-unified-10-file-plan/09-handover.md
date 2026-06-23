# Unified Planner Handover

Live packet for the planner workspace. Active code continues in `features/planner/` and `app/planner/`.

## Current Resume Point

Next lane to run: `02-runtime-cleanup.md`

Canonical resume order:
1. `02-runtime-cleanup.md`
2. `03-startup-performance.md`
3. `04-state-persistence-and-ai-reliability.md` lane 3
4. `04-state-persistence-and-ai-reliability.md` lane 4
5. `05-sketch-to-plan-approved-lane.md`
6. `06-catalog-and-asset-pipeline.md`
7. `07-database-and-query-optimization.md`
8. `08-verification-and-governance.md`

Reason: lane 1 is still the first incomplete lane in the canonical order.

## What Is Actually Complete

- Lane 6 is complete and source-verified.
  - Canonical ingest output is named and used.
  - Source-family validation is explicit.
  - Normalization happens at ingest, not runtime.
  - Golden-output proof exists.
  - Duplicate, invalid-row, stale-artifact, and missing-asset audits exist.
- Lane 8 is complete.
  - The governance pass reviewed the logged evidence.
  - The handover now reflects the true packet state instead of assuming completion.

## Lane Status Summary

| Lane | Status | Proof level | Remaining gaps |
|---|---|---|---|
| 1 | incomplete | source-only | No runtime remount/teardown proof; no async-stale-mutation proof |
| 2 | incomplete | source-only | No bundle/timing/chunk/network proof; no throttled shell-first validation; source blocker resolved at source level |
| 3 | incomplete | source-only | No permission-gated verification; visible save/sync UI proof is missing |
| 4 | incomplete | source-only | No runtime/browser proof for fallback classification, abort hygiene, schema gating, deterministic apply, or visible AI status states |
| 5 | incomplete | source-only | No runtime/browser proof for typed failure taxonomy, underlay-first behavior, preview/rollback, retry preservation, or workspace recovery UI |
| 6 | complete | source-verified | No packet-level gap currently open |
| 7 | incomplete | source-only | No before/after query evidence, no live RLS proof, no live route-header capture, no EXPLAIN evidence, no DB env for runtime query proof |
| 8 | complete | verified | No packet-level gap currently open |

## Open Gaps and Blockers

### Lane 1
- Runtime cleanup changes are source-only.
- Missing proof: repeated remount / strict-mode teardown proof, 2D/3D switch teardown proof, and stale async cancellation proof.

### Lane 2
- Startup performance changes are source-only.
- Missing proof: before/after bundle metric, before/after timing metric, chunk-graph or import-trace proof, throttled shell-first validation, and cold-start network comparison.
- Source blocker resolved: `lib/api/schemas.ts` now has one clean definition for each `SketchToPlan*` schema, so the remaining work is metrics and runtime proof.

### Lane 3
- State/persistence changes are source-only.
- Missing proof: canonical state envelope verification, local-first save proof, queue dedupe/compaction proof, deterministic hydration proof, conflict-branch proof, and visible save/sync state proof.
- Named permission-gated tests were not run:
  - `tests/unit/planner-state-envelope.test.ts`
  - `tests/unit/planner-autosave-local-first.test.ts`
  - `tests/unit/planner-hydration-precedence.test.ts`
  - `tests/integration/planner-offline-sync-recovery.test.tsx`
  - `tests/integration/planner-conflict-branch.test.tsx`

### Lane 4
- Baseline AI reliability changes are source-only.
- Missing proof: provider fallback classification, abort/stale-response rejection, schema-validation proof, deterministic apply trace, and visible AI status proof.
- Named permission-gated tests were not run:
  - `tests/unit/planner-ai-provider-fallback.test.ts`
  - `tests/integration/planner-ai-abort-hygiene.test.tsx`
  - `tests/unit/planner-ai-schema-validation.test.ts`
  - `tests/unit/planner-ai-deterministic-apply.test.ts`

### Lane 5
- Sketch-to-plan changes are source-only.
- Missing proof: typed failure taxonomy proof, underlay-before-fetch proof, preview-before-commit proof, reject-rollback proof, retry-preserves-manual-work proof, and visible workspace recovery proof.
- Named permission-gated tests were not run:
  - `tests/unit/planner-ai-sketchToPlan.test.ts`
  - `tests/integration/planner-editor-PlannerWorkspace.test.tsx`
  - `tests/unit/floorplanCanvas.test.ts`

### Lane 7
- Query optimization changes are source-only.
- Missing proof: per-route before/after query evidence, live route-observability capture, RLS policy-column verification, and EXPLAIN / EXPLAIN ANALYZE evidence.
- Runtime database proof is blocked here because `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` are unset in this environment.

### Cross-cutting open items from `Failures.md`
- Planner AI assist + sketch upload still may be blocked by missing or quota-limited AI environment variables (`GOOGLE_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `OPENAI_API_KEY`).
- Planner workspace interaction gaps remain:
  - guest autosave still restores unless cleared via a fresh layout path
  - configurator catalog is not fully merged into the workspace library
  - BOM / PDF export still needs live verification
- Playwright e2e failures remain open:
  - `tests/e2e` nav flows have route/assertion failures
  - `tests/e2e/test:planner-catalog` has multiple `page.goto` timeouts
- Most lanes are still source-verified only; no build or runtime verification has been run for them.
- The `tests/` tree still exists in this checkout, but recent history shows file-level deletions inside it, so any missing test-file references should be treated as historical rather than a full folder deletion.
- Site assistant shell refactor is not verified.
- Lint still surfaces unrelated planner-admin hook errors.
- The hardcoded audit rerun hit a locked CSV output.
- The planner asset pipeline still references separate `/models/chairs` GLB assets.
- Missing Internet Connectivity Monitoring remains open in `features/planner/hooks/usePlannerSession.ts`.
- Unused IndexedDB storage / sync queue is still only partial.

## Risks

- The packet cannot be called fully complete because lanes 1, 2, 3, 4, 5, and 7 still lack the proof type their own packet files require.
- Lane 2 still needs metrics and runtime proof, but the schema duplication blocker is resolved at source level.
- Lane 7 cannot be closed honestly until a configured database environment is available for query-plan and route-observability evidence.
- Any attempt to promote source-only changes to "complete" would violate the packet rules.

## Recommended Next Steps

1. Resume at `02-runtime-cleanup.md`.
2. If lane 2 is revisited, collect the bundle/timing evidence now that the schema blocker is resolved at source level.
3. When a lane requires runtime proof, run only the permission-gated verification for that lane.
4. If lane 7 is revisited, provision the database environment and capture before/after query evidence plus route headers.
5. Keep lane 5 separate from baseline AI work; do not merge sketch conversion back into lane 4.
6. Treat `Failures.md` as the source of truth for every open blocker until the proof is actually collected.

## Reporting Template

Done:
- Lane 6 completed with source/report proof.
- Lane 8 completed with governance and handover proof.
- The packet lives in `wip/planner-unified-10-file-plan/`.

Verified:
- The canonical resume point is still `02-runtime-cleanup.md`.
- Lane 2's schema blocker is resolved at source level.
- The remaining lanes are still incomplete or blocked where proof is missing.

Skipped:
- Tests
- Playwright
- Lint
- Typecheck
- Runtime browser verification
- Runtime database verification

Risks:
- Source-only progress remains unclosed for lanes 1, 2, 3, 4, 5, and 7.
- Lane 2 still lacks the metrics needed to call it complete.

Next:
- Start `02-runtime-cleanup.md` unless a higher-priority blocker is intentionally being cleared first.
