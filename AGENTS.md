# AGENTS.md

Rules for agents working in this repo.

## Focus

- One flat-root Next.js app. One unified planner for `oando.co.in`.
- Active planner code: `features/planner/` + `app/planner/`.
- Legacy planner trees are archived — do not revive competing surfaces.

## Read first

1. `Readme.md` (repo root)
2. `AGENTS.md` (this file)
3. `docs/DOC-MAP.md` — docs vs plans index
4. `docs/Handover.md` — milestones
5. `docs/Failures.md` — open breakages
6. Live files you will touch

CSS layout reference: `docs/CSS-ARCHITECTURE.md`. Test counts: `docs/TESTING.md` (not this file).

## Rules

- No claim without proof.
- No broad refactor without a stated target.
- No commit, push, migrate, or destructive change unless explicitly requested.
- Stay in scope; do not silently fix unrelated files.
- Archive instead of delete unless deletion is requested.
- Log failures, skips, and blockers in `docs/Failures.md`.

## Stop and confirm

Do not change without explicit approval:

- `proxy.ts`, `app/api/`, `config/build/`, `platform/`, `project/`
- Auth/session behavior
- Database migrations or generated schema
- Top-level folder structure

## Quality bar

- `npm.cmd run typecheck` passes (`tsc -p tsconfig.json` — root config, TypeScript **6.x**)
- Relevant tests pass — see `docs/TESTING.md` § Current status for live counts
- `npm.cmd run lint` passes when touched
- Use `npm.cmd run release:gate` before ship when env is available

**TypeScript:** stay on **6.x** (`^6.0.3`). Do not upgrade to TS 7 unless explicitly requested. Root `tsconfig.json` has path aliases with `./` prefixes and no `baseUrl`.

**Known blocker (2026-06-15):** `platform/drizzle/drizzle.config.ts` may fail typecheck — see `docs/Failures.md` before claiming build/typecheck green.

## Dev

- PowerShell: use `npm.cmd`, not `npm`.
- If Turbopack panics on CSS `@source`, use `npx next dev --webpack`.
- Production build target: **~341** static pages when catalog merge + typecheck succeed.

## Report after meaningful work

Done · Verified · Skipped · Risks · Next