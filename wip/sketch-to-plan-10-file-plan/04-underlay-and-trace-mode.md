# Underlay and Trace Mode

## Objective

Make the uploaded sketch immediately usable as a locked underlay so the user can continue even if AI never returns.

## Files

- `E:\16062026\features\planner\canvas-fabric\hooks\floorplanCanvas.ts`
- `E:\16062026\features\planner\canvas-fabric\hooks\floorplanCanvasTypes.ts`
- `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`

## Required Behavior

- Apply the sketch underlay before or alongside conversion.
- Keep existing planner objects intact.
- Keep the underlay locked and non-editable.
- Surface manual wall/room tracing without forcing navigation.

## User Experience Expectation

If AI is slow, unavailable, or unsafe:
- the sketch is still visible
- the current workspace still exists
- the user can begin tracing immediately

The fallback must feel like degraded assistance, not failed entry.

## Preferred Fallback

Use:
- reference underlay
- manual trace tools
- optional scale calibration

Do not use:
- blank dead-end error state
- destructive reset

## Secondary Recovery Options

These came from the source packet and may be used only if they stay subordinate to the main fallback:
- save and resume later
- retry with degraded mode
- queue and notify for temporary outages
- guided anchors or scale-first calibration

These are not replacements for underlay + trace mode.

## Rule

The no-AI path must still feel like the same workflow.

## Implementation Steps

1. Confirm the existing underlay API can place the sketch without clearing current geometry.
2. If needed, tighten the underlay contract in `floorplanCanvasTypes.ts`.
3. Apply the underlay from `PlannerWorkspace.tsx` before relying on a successful AI response.
4. Ensure the UI can place the user into a manual trace posture after fallback.
5. If scale calibration already has a natural home, keep it reachable from the fallback path instead of creating a detached wizard.

## Truth / Evidence

- Underlay/canvas behavior: `E:\16062026\features\planner\canvas-fabric\hooks\floorplanCanvas.ts`
- Canvas types/contracts: `E:\16062026\features\planner\canvas-fabric\hooks\floorplanCanvasTypes.ts`
- Workspace UI handoff: `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- Current canvas regression anchor: `E:\16062026\tests\unit\floorplanCanvas.test.ts`

## Do Not Break

- existing canvas objects already in the workspace
- underlay behavior for other planner image/reference flows
- normal tool switching after the fallback UI appears

## Proof Target

Proof for this file is strong only if a reviewer can show:
- the underlay callsite
- the canvas behavior that preserves existing objects
- the reachable manual path after fallback

## Completion Checklist

- [ ] Sketch underlay appears even if conversion never succeeds.
- [ ] Existing objects remain intact when the underlay is applied.
- [ ] Underlay is locked and not treated as editable geometry.
- [ ] Manual trace path is reachable without reload or route change.
