<!-- ============================================================ -->
<!-- APPEND THIS BLOCK TO THE TOP OF YOUR EXISTING Failures.md   -->
<!-- ============================================================ -->

## Migration – Pre-flight Snapshot
- Pre-migration SHA: <!-- paste `git rev-parse HEAD` output here -->
- Branch: migration/root-6-folder
- Date: 2026-06-24
- Working tree clean: <!-- YES / NO -->

## Phase 0 – Safety Checkpoint
- Skips: none
- Blockers: <!-- any uncommitted changes? -->
- Risks: none

## Phase 1 – Audit & Mapping
- Skips: <!-- list any absent folders -->
- Blockers: none
- Risks: none

## Phase 2 – Archive Sweep
- Skips:
- Blockers:
- Risks:

## Phase 3 – Plans Consolidation
- Skips:
- Blockers:
- Risks:

## Phase 4 – Tech Stack Split
- Skips:
- Blockers:
- Risks:

## Phase 5 – Docs Isolation
- Skips:
- Blockers:
- Risks:

## Phase 6 – App Relocation
- Skips:
- Blockers:
- Risks:

## Phase 7 – Known Risks
- next.config.js must be found by Next.js CLI at invocation time.
  All scripts must use `cd site && next dev` pattern.
  If dev server silently falls back to defaults, this is the cause.
- eslint script references `app components features lib tests` at root.
  After Phase 6 these folders are under site/. Phase 7a rewrites this.
- playwright.config.ts path in 40+ scripts becomes site/config/build/playwright.config.ts.
- scripts/generate-docs.mjs likely hardcodes root-level folder paths.

## Phase 7a – Root package.json Scripts
- Skips:
- Blockers:
- Risks:

## Phase 7b – site/tsconfig aliases
- Skips:
- Blockers:
- Risks:

## Phase 7c – Tailwind + PostCSS
- Skips:
- Blockers:
- Risks:

## Phase 7d – Vite outDir
- Skips:
- Blockers:
- Risks:

## Phase 8 – Typecheck + Lint
- Skips:
- Blockers:
- Risks:

## Phase 9 – Test Config Alignment
- Skips:
- Blockers:
- Risks:

## Phase 10 – Manifest Regeneration
- Skips:
- Blockers:
- Risks:

## Phase 11 – Test Execution
- Skips:
- Blockers:
- Risks:

## Phase 12 – Test Repair
- Post-migration test blockers:
  <!-- paste failing test traces here -->

## Phase 13 – Release Gate
- Skips:
- Blockers:
- Risks:

## Phase 14 – Final Report
- Migration complete: <!-- YES / NO -->
- Remaining open items:
