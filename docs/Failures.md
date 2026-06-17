# Failures

*Open issues and dev gotchas. Resolved items live in **git history**, not here.*

When you fix something: remove its row from **Open**, commit with a clear message. Optional one-line in commit body — do not grow a "Fixed" wall in this file.

**Past detail:** `git log --oneline -- docs/Failures.md` · frozen log: `archive/docs/recovered-2026-06-15/FAILURES-HISTORY.md`

## Open

| Issue | Notes |
|---|---|
| Local dev reliability | Multiple `next dev` / `next start` processes on ports 3000–3001 cause stale UI and “nothing works” reports. Kill all `node` on those ports, then run **one** server: `npm.cmd run build && npm.cmd run start` (verify) or `npm.cmd run dev` (now defaults to `--webpack`). Hard-refresh after CSS changes. |
| Guest planner gate | `/planner/guest/` blocks canvas until project name is set; guest mode now pre-fills **Guest workspace** (2026-06-16). |
| Planner coverage branches <75% | Advanced to ~69.5% (stmts/fn/lines ≥75% at 78%); added tests for low coverage modules (onboarding, document, landing). See updated `PLANNER-COVERAGE-75.md`. Gate wired. |
| Full `release:gate` (coverage steps + DB Playwright) | Vitest + basic e2e + coverage now in (per package.json update); full plan routes need `DATABASE_URL` for some specs. |

## Dev gotchas

- **Local env present:** this workspace `.env.local` already provides `DATABASE_URL` and Supabase env vars. If catalog data still falls back locally, treat it as a connectivity/data-source issue, not a missing-env issue.
- **Stale dev servers:** multiple `next dev` instances can cause EADDRINUSE, stale UI, or Turbopack cache corruption. For Playwright, prefer a fresh `.next` cleanup and production `npm run build && npm run start` instead of reusing `next dev`.
- **Planner localhost checks:** an older `next dev` process can keep the workspace lock while `http://localhost:3000` still refuses connections; restart the active dev server before browser verification if localhost looks dead.
- **Planner layout not updating in browser:** uncommitted worktree vs production; multiple stale `next dev` on port 3000; wrong URL (`/planner` vs `/planner/guest/`). Use `http://localhost:3000/planner/guest/`, hard refresh, single dev server.
- **TypeScript:** stay on **6.x**; do not upgrade to TS 7 without an explicit decision.
