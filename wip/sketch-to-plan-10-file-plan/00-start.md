# Sketch-to-Plan Start

## Goal

Make sketch upload recoverable when AI fails or returns unsafe geometry.

This packet is standalone and canonical.
It must remain usable even if earlier draft/source planning files are deleted.

The user must be able to:
- keep the uploaded sketch
- keep the current draft
- trace manually without reload
- preview generated geometry before accepting it

## Planning Basis

- Treat AI conversion as optional, not required.
- Preserve the upload and current draft before any conversion attempt.
- Use locked sketch underlay plus trace mode as the default fallback.
- Stage generated geometry in preview before any commit.
- Keep failure handling visible inside the workspace.

## Recovered Source Truths

- The core recovery pattern is `reference underlay + trace mode`, with retry or save-for-later as secondary paths.
- The current risk is not only provider failure. Wrong conversion and low-confidence output are equally important failure modes.
- A dead-end failure screen is not acceptable.
- A hidden error state behind a secondary surface is not acceptable.
- The strongest safe direction is staged import, preview, rollback, and visible fallback inside the planner route.

## Working Method

Execute this packet in order.

For each file:
- read the stated repo surfaces first
- make only the changes that file calls for
- satisfy the completion checklist before moving on
- if proof cannot be gathered, log the gap in `E:\16062026\Failures.md`

This packet is intentionally redundant where handoff safety needs it.
It should be possible to resume from any file without reopening deleted source drafts.

## Hard Stops

- No tests without explicit user permission.
- No Playwright without explicit user permission.
- No commit without explicit user permission.
- Log skips, blockers, and follow-ups in `E:\16062026\Failures.md`.

## Execution Order

1. `01-scope-and-acceptance.md`
2. `02-failure-contract.md`
3. `03-draft-preservation.md`
4. `04-underlay-and-trace-mode.md`
5. `05-preview-accept-reject.md`
6. `06-retry-resume-and-queue.md`
7. `07-workspace-copy-and-actions.md`
8. `08-verification-and-logging.md`
9. `09-handover.md`

## Rule

Do not auto-commit AI geometry to editable truth.

## Exit Condition

This packet is complete only when:
- files `01` through `08` are individually complete
- all unresolved verification gaps are logged
- `09-handover.md` reflects the true state of the work
