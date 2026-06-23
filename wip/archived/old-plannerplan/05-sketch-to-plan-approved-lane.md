# Sketch-to-Plan Approved Lane

## Objective

Deliver the explicitly approved sketch-to-plan lane as a separate planner feature lane with safe fallback, typed failure handling, preview, rollback, retry constraints, and visible workspace recovery.

## Why This Is Separate

Editable sketch conversion is a scope expansion beyond baseline AI reliability.
It changes:
- UX contract
- route/API contract
- planner state behavior
- canvas application behavior
- test surface

It belongs in the unified planner packet only as a clearly named approved lane.

## Files

- `E:\16062026\lib\api\schemas.ts`
- `E:\16062026\features\planner\ai\sketchToPlan.ts`
- `E:\16062026\app\api\planner\sketch-to-plan\route.ts`
- `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- `E:\16062026\features\planner\lib\floorPlanImageImport.ts`
- `E:\16062026\features\planner\canvas-fabric\hooks\floorplanCanvasTypes.ts`
- `E:\16062026\features\planner\canvas-fabric\hooks\floorplanCanvas.ts`
- `E:\16062026\features\planner\editor\PlannerTopBar.tsx`
- `E:\16062026\tests\unit\planner-ai-sketchToPlan.test.ts`
- `E:\16062026\tests\integration\planner-editor-PlannerWorkspace.test.tsx`
- `E:\16062026\tests\unit\floorplanCanvas.test.ts`

## Required Outcomes

- uploaded sketch is preserved before conversion starts
- fallback keeps the sketch as a locked reference underlay
- user can trace manually without reload
- conversion success enters preview, not auto-commit
- user can accept or reject generated geometry
- retry does not erase manual work
- failure copy is visible inside the workspace, not hidden behind a secondary surface

## Typed Failure Taxonomy

Use an explicit failure taxonomy in the request/response contract and UI state:
- `missing_provider`
- `timeout`
- `invalid_response`
- `low_confidence`
- `unsupported_input`
- `server_error`

Expected route behavior:
- request validation failures stay `400`
- recoverable sketch conversion failures return a recoverable response, not one generic hidden failure path
- unexpected server failures may still use `503`, but the UI must receive enough reason data to enter workspace recovery state honestly

## Recovery State Machine

The workspace state for sketch conversion should be explicit, not implied:

```ts
type SketchRecoveryState =
  | { status: "idle" }
  | { status: "converting"; fileName: string }
  | {
      status: "preview";
      fileName: string;
      generatedDraftJson: string;
      previousDraftJson: string;
      warnings: string[];
    }
  | {
      status: "fallback";
      fileName: string;
      reason:
        | "missing_provider"
        | "timeout"
        | "invalid_response"
        | "low_confidence"
        | "unsupported_input"
        | "server_error";
      message: string;
    }
  | { status: "accepted"; fileName: string }
  | { status: "rejected"; fileName: string };
```

Required transitions:
- upload starts: `idle -> converting`
- converted response: `converting -> preview`
- recoverable failure: `converting -> fallback`
- unexpected route/runtime failure: `converting -> fallback`
- accept: `preview -> accepted`
- reject: `preview -> rejected`

## Underlay-First Rule

Before `fetch` or equivalent sketch conversion request:
- preserve the upload payload
- call the underlay/reference plumbing first
- keep the sketch visible even if the API never returns
- do not clear existing user geometry when setting the underlay

The workspace must never become a dead end while waiting for conversion.

## Preview, Accept, Reject, and Retry Rules

### Preview

- capture the current draft before staging generated geometry
- import generated geometry only as preview state
- do not auto-commit generated geometry as final truth
- surface warnings alongside preview actions

### Accept

- keep the generated geometry
- clear the recovery error state
- set a truthful success status such as `Sketch conversion accepted: <fileName>`

### Reject

- restore the previous draft snapshot
- keep the sketch underlay visible
- move the user toward wall/room tracing tools if available
- set a truthful status such as `Sketch kept as reference: <fileName>`

### Retry Constraints

- retry reuses the stored upload payload
- retry must not erase manual objects created after the first failure
- retry success still goes through preview/accept, not auto-commit
- save-and-resume or queue/degraded mode may exist only if they are honestly implemented and visible

## Workspace Recovery Actions and Copy

The recovery UI belongs in the workspace near the canvas stage or top workspace shell.

Required actions:
- `Trace manually`
- `Retry conversion`
- `Dismiss`

Required copy:
- missing provider: `AI conversion is unavailable. The sketch is kept as a reference so you can trace it manually.`
- timeout or server: `Conversion did not finish. The sketch is kept as a reference and you can retry.`
- invalid response or low confidence: `The conversion was not reliable enough to apply. The sketch is kept as a reference.`

Optional but safe recovery helpers:
- scale-first recovery
- save and resume later

## Fallback Hierarchy

Primary:
- reference underlay
- manual trace mode
- optional scale-first recovery

Secondary:
- retry
- save and resume later
- queue/degraded mode only if honestly implemented

## Implementation Steps

1. Add the typed failure taxonomy to schemas, route behavior, and runtime classification.
2. Preserve upload payload and previous draft before staging generated output.
3. Apply the underlay before or alongside conversion so the workspace never becomes a dead end.
4. Route success into preview with accept/reject and warning display.
5. Route failure into visible workspace recovery with exact copy and actions.
6. Constrain retry so it cannot erase manual work and still requires preview accept.
7. Add targeted proof or log the exact verification gap.

## Do Not Break

- baseline AI reliability lane boundaries
- current draft/session safety
- planner route usability when AI is unavailable
- existing underlay/reference behavior unrelated to sketch conversion

## Proof Target

Proof for this file is strong only if a reviewer can show:
- typed failure states
- underlay applied before or at the start of conversion
- upload preserved on failure
- preview before commit
- rollback on reject
- retry preserving manual work
- visible recovery inside the planner workspace

## Permission-Gated Proof

Named tests to run only after explicit user permission:
- `tests/unit/planner-ai-sketchToPlan.test.ts`
- `tests/integration/planner-editor-PlannerWorkspace.test.tsx`
- `tests/unit/floorplanCanvas.test.ts`

Expected proof coverage:
- classified response states
- failed fetch keeps the underlay and shows trace/retry actions
- converted response enters preview
- reject restores the previous draft
- retry does not erase manual objects
- `setFloorPlanUnderlay` does not clear existing user objects

## Completion Checklist

- [x] Sketch lane is treated as a separate approved lane, not hidden inside baseline AI reliability.
- [x] Typed failure taxonomy exists and is reflected in the workspace state.
- [x] Upload preservation and no-AI fallback both exist.
- [x] Underlay is applied before or at conversion start and does not clear user geometry.
- [x] Generated geometry never becomes final without explicit user acceptance.
- [x] Reject restores the prior draft and keeps the sketch available.
- [x] Retry does not erase manual work and still routes through preview.
- [ ] Workspace recovery copy and actions are visible in the planner shell. <!-- partial: source wiring exists, but browser proof is still missing -->
- [ ] Permission-gated proof exists or the exact gap is logged. <!-- partial: the exact gap is logged in Failures.md, but the gated tests were not run -->
