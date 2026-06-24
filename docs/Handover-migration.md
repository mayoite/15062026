# Handover — Root + 6 Folder Migration
# Last updated: 2026-06-24

## Purpose
This document tracks the live state of the migration for any agent or human
picking up mid-way.

## Repository
- Repo: mayoite/15062026
- Project: oando-platform (oando.co.in)
- Stack: Next.js 16 + TypeScript 6 + Tailwind 4 + Supabase + Drizzle
- Platform: PowerShell / Windows (use `npm.cmd` not `npm` in terminal)

## Pre-migration state (as of 2026-06-24)
- Flat-root Next.js monolith
- All app folders at root: app/, features/, components/, lib/, platform/, config/, public/, tests/, scripts/, fixtures/, i18n/
- All configs at root: next.config.js, postcss.config.mjs, vitest.config.ts, vitest.shared.ts, vitest.site.config.ts
- Archive folders at root: results/, outputs/, (findingsnew/, comprehensive-audit-2026-06-20/ — may be absent)
- Tech stack Vite site at root: tech-stack-docs/
- Plans/WIP at root: wip/
- Failures log at root: Failures.md

## Target state
```
repo-root/
├── archive/
├── plans/
├── tech-stack-generator/
├── tech-stack-docs/         (empty, placeholder)
├── docs/
└── site/                    (entire Next.js app)
```

## Phase tracker
Update this table as phases complete.

| Phase | Name | Status | Branch | Notes |
|-------|------|--------|--------|-------|
| 0 | Safety checkpoint | [ ] | migration/root-6-folder | |
| 1 | Audit & mapping | [ ] | migration/phase-1 | produces migration-map.md |
| 2 | Archive sweep | [ ] | migration/phase-2 | |
| 3 | Plans consolidation | [ ] | migration/phase-3 | |
| 4 | Tech stack split | [ ] | migration/phase-4 | |
| 5 | Docs isolation | [ ] | migration/phase-5 | |
| 6 | App relocation | [ ] | migration/phase-6 | highest file volume |
| 7a | package.json scripts | [ ] | migration/phase-7a | HIGHEST RISK |
| 7b | tsconfig aliases | [ ] | migration/phase-7b | |
| 7c | Tailwind + PostCSS | [ ] | migration/phase-7c | |
| 7d | Vite outDir | [ ] | migration/phase-7d | |
| 8 | Typecheck + lint | [ ] | migration/phase-8 | |
| 9 | Test config alignment | [ ] | migration/phase-9 | |
| 10 | Manifest regen | [ ] | migration/phase-10 | |
| 11 | Test execution | [ ] | migration/phase-11 | NO playwright |
| 12 | Test repair | [ ] | migration/phase-12 | |
| 13 | Release gate | [ ] | migration/phase-13 | explicit permission required |
| 14 | Final report | [ ] | migration/phase-14 | |

## Known pre-existing open issues (from Failures.md)
- Lanes 1–8: source-verified only; no runtime proof collected
- Playwright E2E: nav flows + planner-catalog still have timeout failures
- Lane 7 (DB): blocked by missing DATABASE_URL / SUPABASE keys
- Lint: pre-existing react-hooks/exhaustive-deps in admin views

## Critical facts for any agent picking up
1. Windows platform — always use `npm.cmd` in terminal examples
2. TypeScript must stay on ^6.0.3
3. Playwright must NEVER run without explicit user permission
4. release:gate must NEVER run without explicit user permission
5. Failures.md is the single source of truth for blockers — always append, never overwrite
6. After Phase 6, ALL app scripts in package.json are broken until Phase 7a is done
7. vitest.config.ts determines test discovery — understand its root before Phase 9
