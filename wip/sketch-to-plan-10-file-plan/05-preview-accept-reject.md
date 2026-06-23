# Preview, Accept, Reject

## Objective

Stage generated geometry as a preview instead of importing it as final editable truth.

## Files

- `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- `E:\16062026\features\planner\ai\sketchToPlan.ts`

## Required Behavior

- Build a generated draft separately from the current draft.
- Enter preview state when conversion succeeds.
- Show warnings before acceptance.
- Require explicit user choice to accept or reject.

## Decision Rule

Generated geometry has three valid outcomes only:
- previewed and accepted
- previewed and rejected
- never shown because the response falls back

There is no valid path where generated geometry becomes final without an explicit user decision.

This comes directly from the source review finding that the current direct-import path is too risky.

## Accept

- Keep generated geometry.
- Clear the recovery warning.
- Keep the sketch available if needed for comparison.

## Reject

- Restore the previous draft.
- Keep the sketch underlay visible.
- Leave the user in a manual recovery path.

## Rule

Preview first. Commit only on explicit accept.

## Implementation Steps

1. Capture the pre-preview draft snapshot.
2. Build or import generated geometry into a preview path.
3. Surface warnings and actions in the workspace.
4. Keep accept and reject behavior deterministic.
5. Restore prior state on reject without losing the sketch reference.

## Truth / Evidence

- Preview orchestration: `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- Generated geometry source: `E:\16062026\features\planner\ai\sketchToPlan.ts`
- Existing workspace test anchor: `E:\16062026\tests\integration\planner-editor-PlannerWorkspace.test.tsx`

## Do Not Break

- current editable draft before preview starts
- ability to reject bad conversion without data loss
- warning visibility when generated output is questionable

## Proof Target

Proof for this file is strong only if a reviewer can show:
- where preview begins
- where accept commits the preview
- where reject restores the prior draft

## Completion Checklist

- [ ] Converted output enters preview instead of final commit.
- [ ] Accept keeps generated geometry only after explicit user action.
- [ ] Reject restores the previous draft.
- [ ] Sketch reference remains available after rejection.
