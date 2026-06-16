# Failures

*Open issues and dev gotchas. Resolved items live in **git history**, not here.*

When you fix something: remove its row from **Open**, commit with a clear message. Optional one-line in commit body — do not grow a "Fixed" wall in this file.

**Past detail:** `git log --oneline -- docs/Failures.md` · frozen log: `archive/docs/recovered-2026-06-15/FAILURES-HISTORY.md`

## Open

| Issue | Notes |
|---|---|
| `npm.cmd run test:planner-catalog` | Rechecked on `2026-06-16` after deleting `.next` and forcing a fresh Playwright build/start (`$env:CI='1'`). Current single blocker: `tests/planner-chrome.spec.ts` `view switching keeps chrome and renders a nonblank 3D scene` fails the WebGL pixel assertion (`webglEvidence?.pixels.some((value) => value > 0)` stays `false`). `33` tests pass; `1` fails; `1` is skipped after the failure. |

## Dev gotchas

- **Local env present:** this workspace `.env.local` already provides `DATABASE_URL` and Supabase env vars. If catalog data still falls back locally, treat it as a connectivity/data-source issue, not a missing-env issue.
- **Stale dev servers:** multiple `next dev` instances can cause EADDRINUSE, stale UI, or Turbopack cache corruption. For Playwright, prefer a fresh `.next` cleanup and production `npm run build && npm run start` instead of reusing `next dev`.
- **Planner localhost checks:** an older `next dev` process can keep the workspace lock while `http://localhost:3000` still refuses connections; restart the active dev server before browser verification if localhost looks dead.
- **Planner layout not updating in browser:** uncommitted worktree vs production; multiple stale `next dev` on port 3000; wrong URL (`/planner` vs `/planner/guest/`). Use `http://localhost:3000/planner/guest/`, hard refresh, single dev server.
- **Vitest in `.grok/worktrees/` junction:** `tests/setup.ts` may fail to resolve via `E:/16062026` path — run tests from canonical repo root `E:\16062026` if setup import breaks.
- **TypeScript:** stay on **6.x**; do not upgrade to TS 7 without an explicit decision.
