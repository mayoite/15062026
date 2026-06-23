# Workspace Copy and Actions

## Objective

Make failure and recovery visible inside the planner workspace instead of hiding it behind a secondary surface.

## Files

- `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- `E:\16062026\features\planner\editor\PlannerTopBar.tsx`

## Required Copy

- Missing provider: `AI conversion is unavailable. The sketch is kept as a reference so you can trace it manually.`
- Timeout or server delay: `Conversion did not finish. The sketch is kept as a reference and you can retry.`
- Invalid or low confidence: `The conversion was not reliable enough to apply. The sketch is kept as a reference.`

## Required Actions

- `Trace manually`
- `Retry conversion`
- `Dismiss`

## Placement Rule

Recovery copy and actions should appear where the user is already working.
Do not rely on a secondary hub, background toast only, or hidden diagnostic panel.

This rule exists because the original review report called out the current failure visibility as too easy to miss.

## Rule

Visible recovery beats hidden explanation.

## Implementation Steps

1. Choose one stable workspace surface for recovery messaging.
2. Bind failure reasons to user-facing copy without hiding the cause.
3. Make the three actions reachable from the failure state.
4. Ensure dismiss removes the message, not the recovery assets.

## Truth / Evidence

- Workspace UI: `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- Top bar/upload affordance: `E:\16062026\features\planner\editor\PlannerTopBar.tsx`
- Existing integration test anchor: `E:\16062026\tests\integration\planner-editor-PlannerWorkspace.test.tsx`

## Do Not Break

- upload entry labels the user already relies on
- workspace usability when there is no failure
- visibility of recovery state after dismissal rules are applied

## Proof Target

Proof for this file is strong only if a reviewer can show:
- where the recovery banner or panel renders
- how failure type maps to copy
- why dismiss is non-destructive
- why the user no longer has to depend on Session Hub alone to understand the failure

## Completion Checklist

- [ ] Failure copy is visible in the workspace, not hidden elsewhere.
- [ ] `Trace manually`, `Retry conversion`, and `Dismiss` actions are present.
- [ ] Failure copy matches the actual failure type.
- [ ] Dismiss does not destroy the sketch or current draft.
