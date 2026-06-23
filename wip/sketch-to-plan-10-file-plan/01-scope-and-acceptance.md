# Scope and Acceptance

## Scope

Focus only on the sketch-to-plan upload flow in the planner.

Primary route:
- `E:\16062026\app\api\planner\sketch-to-plan\route.ts`

Primary feature area:
- `E:\16062026\features\planner\`

## In Scope

- upload preservation
- failure classification
- locked sketch underlay
- manual trace fallback
- preview before apply
- accept and reject controls
- retry without erasing manual work
- visible inline recovery messaging

## Current Truth

- The planner already has a sketch-to-plan route and runtime surfaces.
- The risky area is not feature absence; it is unsafe behavior when conversion fails or returns weak output.
- The implementation must improve reliability without turning this into a broader planner rewrite.
- The original source packet consistently treats upload preservation, fallback visibility, and no auto-commit as the non-negotiable truths.

## Out of Scope

- unrelated planner cleanup
- broad AI feature redesign
- catalog or marketing-site changes
- browser automation

## Acceptance

- The upload survives every failure path.
- The current draft survives every failure path.
- AI failure leaves the sketch usable as a reference.
- Low-confidence or invalid output is not auto-applied.
- The user can accept or reject generated geometry.
- The user can continue manually without leaving the planner.

## Required Implementation Outcome

When a user uploads a sketch:
- the sketch becomes a durable asset for the current editing session
- the user gets either a safe preview or a safe fallback
- no failure path silently destroys work

When conversion is weak or unavailable:
- the user does not land on a dead screen
- the user does not lose manual progress
- the user does not have to hunt in another surface for the failure explanation

When a user resumes later:
- the plan packet still points to the exact repo files and proof surfaces needed to continue

## Truth / Evidence

- API entry: `E:\16062026\app\api\planner\sketch-to-plan\route.ts`
- Planner workspace: `E:\16062026\features\planner\editor\PlannerWorkspace.tsx`
- Session handlers: `E:\16062026\features\planner\editor\usePlannerSessionHandlers.ts`
- Canvas runtime: `E:\16062026\features\planner\canvas-fabric\hooks\floorplanCanvas.ts`
- Existing integration test surface: `E:\16062026\tests\integration\planner-editor-PlannerWorkspace.test.tsx`

## Do Not Break

- existing planner route flow outside sketch upload
- current draft/session behavior unrelated to sketch recovery
- manual planner editing when AI is never used

## Completion Standard

This file is satisfied only if the downstream implementation files together cover:
- route contract behavior
- workspace state behavior
- canvas underlay behavior
- preview/reject behavior
- verification and logging

## Completion Checklist

- [ ] Scope stays limited to sketch-to-plan upload and recovery flow.
- [ ] Every changed repo file is named in the relevant downstream plan file.
- [ ] Acceptance criteria are still true after the implementation pass.
- [ ] No unrelated planner or site work is mixed into this lane.
