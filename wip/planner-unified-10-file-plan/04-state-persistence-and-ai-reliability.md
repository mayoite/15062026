# State, Persistence, Offline Sync, and Baseline AI Reliability

## Objective

Make planner recovery deterministic across reload, offline edits, sync retries, hydration conflicts, AI fallback, aborts, stale responses, and apply-to-canvas behavior.

This file contains two separate lanes executed in order:
- lane 3: state, persistence, autosave, offline sync
- lane 4: baseline AI reliability

Do not treat this as one blended pass.
Lane 4 starts only after lane 3 proof exists or the exact gap is logged.

## Shared Seams In This File

- `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- `E:\16062026\features\planner\editor\usePlannerSessionHandlers.ts`
- `E:\16062026\features\planner\store\plannerPersistence.ts`
- `E:\16062026\features\planner\canvas-fabric\hooks\floorplanCanvas.ts`

If lane 3 changes a shared seam, lane 4 must work with that settled contract instead of reopening it casually.

## Lane 3: State, Persistence, Autosave, and Offline Sync

### Files

- `E:\16062026\features\planner\store\plannerPersistence.ts`
- `E:\16062026\features\planner\store\offlineStorage.ts`
- `E:\16062026\features\planner\persistence\cloudPlanHydration.ts`
- `E:\16062026\features\planner\store\syncQueueProcessor.ts`
- `E:\16062026\features\planner\hooks\usePlannerFabricAutosave.ts`
- `E:\16062026\features\planner\editor\usePlannerSessionHandlers.ts`
- `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- `E:\16062026\features\planner\ui\PlannerSaveIndicator.tsx` if present
- `E:\16062026\features\planner\ui\PlannerSessionDialog.tsx` if present

### Required Outcomes

- one canonical planner state envelope exists for local draft, hydration, queue, and cloud sync metadata
- local-first autosave is durable even when enqueue or cloud sync fails
- hydration chooses the newest valid state instead of the first available state
- conflict state is explicit instead of silent overwrite
- queue state survives reload and resumes cleanly
- visible save/sync states tell the truth about what happened

### Canonical State Envelope

Use one shared contract for the local draft record, sync queue entry metadata, and hydrated cloud record metadata.

Minimum required fields:
- `schemaVersion`
- `planId` or project identifier
- `source`
  - expected values: `local`, `cloud`, `queue`, `recovered`, or another explicitly named source
- `updatedAt`
- `contentHash`
- `remoteRevision` or equivalent sync token when available
- `localSaveState`
  - expected values: `dirty`, `saving_local`, `saved_local`, `local_save_failed`
- `syncState`
  - expected values: `idle`, `queued`, `syncing`, `synced`, `sync_failed`, `conflict`
- `syncErrorCode` or equivalent sync-failure metadata when sync fails
- the planner draft payload itself

Keep the envelope small and shared.
Do not let local storage, IndexedDB, queue records, and cloud hydration each invent their own freshness metadata.

### Local-First Save Order

The save order must be explicit:
1. serialize and validate the current planner draft
2. write the canonical envelope to local durable storage first
3. update visible state to `saved locally` only after local durability succeeds
4. enqueue cloud sync as a separate side effect
5. mark the envelope `queued for sync` only after the queue write succeeds
6. let the background sync processor move `queued -> syncing -> synced` or `queued -> sync_failed`

Cloud enqueue or cloud sync failure must not erase or downgrade a valid local draft.

### Queue Expectations

- queue identity is explicit
  - use plan identity plus current content identity, not a vague append-only list
- repeated rapid edits compact to the newest pending state instead of creating unbounded duplicate queue entries
- queue compaction must preserve the newest draft payload and metadata needed for retry
- queue state survives reload and resumes cleanly
- retry logic must back off or clearly stop; do not hammer indefinitely without a visible failure state
- if a sync token or revision proves the queue item is stale, drop or replace it intentionally instead of replaying blind writes

### Hydration Precedence Ranking

Hydration must choose a winner in this order:
1. valid schema only
2. newest `updatedAt` among valid records
3. use `remoteRevision` and `contentHash` as conflict evidence, not as silent overwrite permission
4. use explicit source preference only as the final tie-breaker when the records are otherwise equivalent

Do not use "first source to load wins".

### Conflict Handling Expectations

- same `contentHash`: no real conflict, newer metadata may win
- same logical plan but diverging timestamps only: compare metadata and choose deterministically
- different `contentHash` or `remoteRevision` mismatch: surface explicit conflict state
- if safe auto-resolution cannot be proved, preserve both sides and ask for an explicit choice
- silent overwrite is not an acceptable default

### Visible Status States

The planner UI should be able to distinguish at least:
- `saving locally`
- `saved locally`
- `queued for sync`
- `syncing`
- `sync failed`
- `conflict`

If the UI cannot surface one of these honestly yet, log the exact gap instead of collapsing states into one generic "saved" message.

### Lane 3 Implementation Steps

1. Define or tighten the canonical planner state envelope.
2. Make autosave local-first and separate durable local save from queue/cloud work.
3. Add explicit queue identity, dedupe, compaction, reload resume, and failure classification.
4. Make hydration precedence deterministic and explainable.
5. Add explicit conflict handling instead of silent overwrite.
6. Wire truthful visible save/sync states into the planner shell.

### Lane 3 Do Not Break

- current saved drafts that still parse
- offline queue recovery
- existing planner routes that depend on a valid draft load

### Lane 3 Proof Target

Proof for lane 3 is strong only if a reviewer can show:
- the canonical state envelope fields
- the local-first save order
- queue dedupe/compaction/reload behavior
- deterministic hydration winner selection
- explicit conflict behavior
- truthful visible save/sync states

### Lane 3 Permission-Gated Proof

Named tests to run only after explicit user permission:
- `tests/unit/planner-state-envelope.test.ts`
- `tests/unit/planner-autosave-local-first.test.ts`
- `tests/unit/planner-hydration-precedence.test.ts`
- `tests/integration/planner-offline-sync-recovery.test.tsx`
- `tests/integration/planner-conflict-branch.test.tsx`

### Lane 3 Completion Checklist

- [x] Canonical state envelope exists with shared freshness metadata.
- [x] Local durability no longer depends on cloud success.
- [x] Queue dedupe/compaction/reload behavior is explicit.
- [x] Hydration precedence is explicit and deterministic.
- [x] Conflict handling is explicit instead of silent overwrite.
- [ ] Visible save/sync states are truthful or the exact UI gap is logged. <!-- partial: source wiring added, runtime UI proof is still missing -->
- [ ] Permission-gated proof exists or the exact gap is logged. <!-- partial: the exact gap is logged in Failures.md, but the gated tests were not run -->

## Lane 4: Baseline AI Reliability

### Files

- `E:\16062026\app\api\planner\ai-advisor\route.ts`
- `E:\16062026\features\planner\ai\spaceSuggest.ts`
- `E:\16062026\features\planner\ai\prompts.ts`
- `E:\16062026\features\planner\ai\applySuggestedLayout.ts`
- `E:\16062026\features\planner\ai\extractCanvasPlacements.ts`
- `E:\16062026\features\planner\ai\AIAssistDrawer.tsx`
- `E:\16062026\features\planner\ai\AiAdvisorChatPane.tsx`
- `E:\16062026\features\planner\canvas-fabric\hooks\floorplanCanvas.ts`
- `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`

### Required Outcomes

- provider fallback is classified instead of hidden behind one generic failure state
- aborted or stale AI responses cannot overwrite newer user work
- invalid AI output cannot mutate canvas state
- apply-to-canvas is deterministic for the same validated input
- AI status states are visible in the UI

### Baseline AI Reliability Scope

This lane owns:
- provider fallback classification
- abort/cancel hygiene
- schema validation
- deterministic apply-to-canvas
- visible baseline AI status states

This lane does not own:
- editable sketch conversion
- sketch preview/rollback
- sketch recovery banner copy
- sketch upload retry flow

Those belong to file `05`.

### Required AI Status States

The planner UI should distinguish at least:
- `live success`
- `degraded fallback`
- `request aborted`
- `invalid AI response`
- `hard failure`

### Lane 4 Implementation Steps

1. Classify live success, degraded fallback, abort, invalid response, and hard failure separately.
2. Cancel or ignore in-flight work on resubmit, drawer close, panel switch, or unmount.
3. Keep a strict schema gate between AI output and canvas mutation.
4. Make apply-to-canvas a deterministic transform with stable ordering and stable identity rules where possible.
5. Wire visible AI status states into the planner shell or drawer UI.

### Lane 4 Do Not Break

- planner AI flows unrelated to sketch conversion
- the settled draft authority model from lane 3
- current user work when an AI request is cancelled, stale, or invalid

### Lane 4 Proof Target

Proof for lane 4 is strong only if a reviewer can show:
- provider fallback classification
- stale-response rejection
- abort/cancel hygiene
- schema validation before canvas mutation
- deterministic apply behavior
- visible AI status states

### Lane 4 Permission-Gated Proof

Named tests to run only after explicit user permission:
- `tests/unit/planner-ai-provider-fallback.test.ts`
- `tests/integration/planner-ai-abort-hygiene.test.tsx`
- `tests/unit/planner-ai-schema-validation.test.ts`
- `tests/unit/planner-ai-deterministic-apply.test.ts`

### Lane 4 Completion Checklist

- [x] Provider fallback, abort, invalid response, and hard failure are distinct.
- [x] Stale AI responses cannot win over newer user work.
- [x] Validation gates block invalid canvas mutation.
- [x] Apply-to-canvas is deterministic for the same validated input.
- [ ] Visible AI status states are truthful or the exact UI gap is logged. <!-- partial: source status text is in place, but no browser proof exists -->
- [x] Sketch conversion is not silently mixed into this lane.
- [ ] Permission-gated proof exists or the exact gap is logged. <!-- partial: the exact gap is logged in Failures.md, but the gated tests were not run -->
