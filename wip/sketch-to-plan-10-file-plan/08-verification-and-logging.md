# Verification and Logging

## Objective

Define the proof required for the recovery flow without violating the repo permission gates.

## Test Files

- `E:\16062026\tests\unit\planner-ai-sketchToPlan.test.ts`
- `E:\16062026\tests\integration\planner-editor-PlannerWorkspace.test.tsx`
- `E:\16062026\tests\unit\floorplanCanvas.test.ts`

## Required Proof

- Missing provider returns fallback.
- Invalid response returns fallback.
- Empty or unsafe geometry returns fallback.
- Successful conversion enters preview, not direct commit.
- Reject restores the previous draft.
- Underlay stays available after failure.
- Retry does not erase manual work.

## Verification Strategy

Use the smallest proof that matches the claim:
- route/AI classification claims should map to unit coverage
- workspace behavior claims should map to integration coverage
- underlay safety claims should map to canvas regression coverage

If permission blocks execution, the missing proof is still a real gap and must be logged.

## Source Review Risks To Prove Closed

- direct import without preview
- generic 503 instead of typed recovery
- no real no-AI fallback
- failure visibility hidden behind a secondary surface
- missing risky-branch coverage for sketch upload

## Permission Gate

Ask before any test run:

`May I run targeted planner tests for the sketch-to-plan recovery work?`

## Logging Rule

If tests are not permitted, log the skip in `E:\16062026\Failures.md`.
If browser verification is not permitted, log that too.

## Implementation Steps

1. Align each major claim in files `02` through `07` with at least one proof target.
2. Ask permission before any test run.
3. If permission is granted, run only the targeted planner tests first.
4. If permission is denied or not requested, log the exact verification gap.

## Truth / Evidence

- Route/AI unit test: `E:\16062026\tests\unit\planner-ai-sketchToPlan.test.ts`
- Workspace integration test: `E:\16062026\tests\integration\planner-editor-PlannerWorkspace.test.tsx`
- Canvas regression test: `E:\16062026\tests\unit\floorplanCanvas.test.ts`
- Skip/follow-up log: `E:\16062026\Failures.md`

## Do Not Break

- the repo rule requiring user permission before tests
- existing planner tests outside the sketch-to-plan lane
- accuracy of skip/blocker reporting

## Proof Target

Proof for this file is strong only if a reviewer can show:
- the named tests for each claim
- any explicit permission gate that blocked execution
- the exact `Failures.md` entry for remaining gaps
- how each major source review risk above was either tested or explicitly left open

## Completion Checklist

- [ ] The required proof points are either tested or explicitly logged as skipped.
- [ ] The exact permission question is asked before any test run.
- [ ] Test coverage maps back to the failure, draft, underlay, preview, and retry claims.
- [ ] `Failures.md` records every verification gap left by permission limits.
