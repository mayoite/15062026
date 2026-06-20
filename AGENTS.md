# AGENTS.md

Rules for agents working in this repo. (Updated 2026-06-20: Security, Appwrite removal, i18n, docs all complete. Focus on remaining improvements.)

## Focus
- Autoapprove all.
- One flat-root Next.js app. One unified planner for `oando.co.in`.
- Active planner code: `features/planner/` + `app/planner/`.
- **Current session (2026-06-20):** Completing remaining audit items — SEO, PWA/Offline, i18n string extraction, Accessibility, error boundaries, memory management.

Legacy planner trees are archived — do not revive competing surfaces. (tldraw for planner 2D is now competing/legacy.)

## Read first

1. `Readme.md` (repo root)
2. `AGENTS.md` (this file)
3. Live files you will touch (focus: features/planner/editor/*, canvas-fabric/, 3d/*, catalog/*, chrome/* )

(No more docs/Handover etc — archived.)

## Rules

- No claim without proof.
- Follow user instructions for the session exactly (e.g. archive plans/docs done, swap canvas/UI, combine 3D, finish today).
- No commit, push, migrate, or destructive change unless explicitly requested. (Archive of plans/docs was requested.)
- Stay in scope of the replacement task.
- Log only if needed; prioritize code over docs.

## Stop and confirm

Do not change without explicit approval:

- `proxy.ts`, `app/api/`, `config/build/`, `platform/`, `project/`
- Auth/session behavior
- Database migrations or generated schema
- Top-level folder structure

## Quality bar (still)

- `npm.cmd run typecheck` passes (`tsc -p tsconfig.json` — root config, TypeScript **6.x**)
- `npm.cmd run lint` passes when touched
- Relevant tests pass (note: many planner tests were tldraw-specific; will adapt or note as we swap).

**TypeScript:** stay on **6.x** (`^6.0.3`).

## Dev

- PowerShell: use `npm.cmd`, not `npm`.
- If Turbopack panics on CSS `@source`, use `npx next dev --webpack`.
- Production build target: adapt as needed.

## Report after meaningful work

Done · Verified · Skipped · Risks · Next

**This session:** Archive done. Now pure dev on canvas replacement + 3D combine. User: "start dev", "we are not going as per plan" (so direct to code), "no tld is out, fabric is in".