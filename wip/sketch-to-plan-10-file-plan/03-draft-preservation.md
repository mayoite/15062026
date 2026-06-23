# Draft Preservation

## Objective

Preserve the uploaded sketch and current planner draft before conversion starts.

## Files

- `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- `E:\16062026\features\planner\lib\floorPlanImageImport.ts`
- `E:\16062026\features\planner\editor\usePlannerSessionHandlers.ts`

## Required Behavior

- Store the upload payload before the API call.
- Capture the current draft before applying any generated geometry.
- Do not clear the workspace on conversion failure.
- Keep manual edits separate from generated output.

## State Model

The recovery state should make these transitions explicit:
- `idle -> converting`
- `converting -> preview`
- `converting -> fallback`
- `preview -> accepted`
- `preview -> rejected`

The previous draft snapshot and the upload payload should survive long enough to support reject and retry.

## State Requirement

Track a local sketch-recovery state with at least:
- `idle`
- `converting`
- `preview`
- `fallback`
- `accepted`
- `rejected`

## Rule

Failure must degrade to recovery, not reset.

## Implementation Steps

1. Identify where `PlannerWorkspace.tsx` starts sketch upload and conversion.
2. Preserve the raw upload payload before the request leaves the client.
3. Capture the previous draft before any generated result is staged.
4. Keep generated output and user-authored state separate enough to restore on reject.
5. Ensure failure state does not wipe the current editing session.

## Truth / Evidence

- Workspace orchestration: `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- Session/draft handling: `E:\16062026\features\planner\editor\usePlannerSessionHandlers.ts`
- Upload payload handling: `E:\16062026\features\planner\lib\floorPlanImageImport.ts`
- Existing workspace test anchor: `E:\16062026\tests\integration\planner-editor-PlannerWorkspace.test.tsx`

## Do Not Break

- existing autosave/session restoration behavior
- non-sketch import flows
- current draft content when recovery mode is entered

## Proof Target

Proof for this file is strong only if a reviewer can show:
- where the previous draft snapshot is captured
- where the upload payload is retained for retry
- where failure avoids clearing the workspace

## Completion Checklist

- [ ] Upload payload is preserved before conversion starts.
- [ ] Previous draft is captured before generated geometry is staged.
- [ ] Failure paths do not clear the workspace.
- [ ] Recovery state is explicit and durable enough for retry/reject.
