# Failure Contract

## Objective

Replace one generic sketch-conversion failure path with classified recovery states the workspace can act on.

## Files

- `E:\16062026\lib\api\schemas.ts`
- `E:\16062026\features\planner\ai\sketchToPlan.ts`
- `E:\16062026\app\api\planner\sketch-to-plan\route.ts`

## Required Failure Reasons

- `missing_provider`
- `timeout`
- `invalid_response`
- `low_confidence`
- `unsupported_input`
- `server_error`

## Required Response Shape

- `status: "converted" | "fallback"`
- `objects`
- `warnings`
- `confidence?`
- `failureReason?`
- `recoveryMessage?`

## Expected Runtime Meaning

- `converted` means the response may be previewed, not auto-committed.
- `fallback` means the workspace must stay usable without AI output.
- `warnings` are user-visible if preview is shown.
- `recoveryMessage` should be usable directly by the workspace banner when appropriate.

## Implementation Steps

1. Add or tighten typed schema support in `lib/api/schemas.ts`.
2. Update `features/planner/ai/sketchToPlan.ts` to classify failures instead of collapsing them.
3. Update `app/api/planner/sketch-to-plan/route.ts` so recoverable failures become fallback responses.
4. Make sure unsafe or empty geometry cannot pass as a successful conversion.

## Rules

- Validation errors stay `400`.
- Recoverable conversion failures return `200` with `status: "fallback"`.
- Only unexpected server failure should stay a real server error.
- Empty or unsafe geometry counts as fallback, not success.

## Truth / Evidence

- Schema source of truth: `E:\16062026\lib\api\schemas.ts`
- Provider/request logic: `E:\16062026\features\planner\ai\sketchToPlan.ts`
- Route contract surface: `E:\16062026\app\api\planner\sketch-to-plan\route.ts`
- Current unit test anchor: `E:\16062026\tests\unit\planner-ai-sketchToPlan.test.ts`

## Do Not Break

- request validation for existing route callers
- successful converted-response handling
- planner AI code outside sketch-to-plan

## Proof Target

Proof for this file is strong only if someone can point to:
- the schema that names the failure reasons
- the runtime code that emits them
- the route code that preserves the distinction between validation failure and recovery fallback

## Completion Checklist

- [ ] Failure reasons are typed in the schema and runtime code.
- [ ] The route distinguishes validation errors from recoverable fallback states.
- [ ] Empty, invalid, or unsafe geometry cannot be returned as success.
- [ ] Tests or logged skips cover the failure classification contract.
