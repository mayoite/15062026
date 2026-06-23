# Retry, Resume, and Queue

## Objective

Let the user retry conversion or pause safely without losing recovered work.

## Files

- `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- `E:\16062026\features\planner\lib\floorPlanImageImport.ts`
- `E:\16062026\features\planner\ai\sketchToPlan.ts`

## Required Behavior

- Retry must reuse the stored upload payload.
- Retry must not erase manual edits made after fallback.
- Retry success must still go through preview.
- Resume-later flow is allowed if provider/service availability is the blocker.

## Retry Policy

Retry is a second attempt at conversion, not a reset of the workspace.

That means:
- do not force a second upload when one payload is already available
- do not clear trace work or manual corrections before retry
- do not bypass preview on retry success

The source packet treats `save-and-retry` as a secondary recovery path, not the primary one.
That priority should stay intact here.

## Merge Rule

- Never overwrite manual work silently.
- If later AI output conflicts with current work, prefer explicit preview and user choice.

## Secondary Path

If queue/resume is not implemented in this pass, keep the shape open but do not fake availability.

## Implementation Steps

1. Retain enough upload state to retry without reselecting the file.
2. Ensure retry starts from the current safe workspace state.
3. Route any successful retry through preview again.
4. If resume-later is not delivered, make the UI honest about that limitation.

## Truth / Evidence

- Retry orchestration: `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- Upload reuse surface: `E:\16062026\features\planner\lib\floorPlanImageImport.ts`
- Provider retry behavior: `E:\16062026\features\planner\ai\sketchToPlan.ts`
- Existing workspace test anchor: `E:\16062026\tests\integration\planner-editor-PlannerWorkspace.test.tsx`

## Do Not Break

- manual edits created after fallback
- deterministic preview gate on every successful retry
- honesty about queue/resume support if it is not actually shipped

## Proof Target

Proof for this file is strong only if a reviewer can show:
- where retry gets its payload
- why retry does not wipe manual edits
- that preview is still mandatory after retry

## Completion Checklist

- [ ] Retry reuses stored upload data instead of forcing re-upload.
- [ ] Retry does not erase manual work added after fallback.
- [ ] Retry success still goes through preview and explicit accept.
- [ ] Any resume-later behavior is real, or clearly omitted and logged.
