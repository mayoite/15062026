# Failures

*Open issues and dev gotchas. Resolved items live in **git history**, not here.*

When you fix something: remove its row from **Open**, commit with a clear message. Optional one-line in commit body — do not grow a "Fixed" wall in this file.

**Past detail:** `git log --oneline -- docs/Failures.md` · frozen log: `archive/docs/recovered-2026-06-15/FAILURES-HISTORY.md`

## Open

| Issue | Notes |
|---|---|
| Cosmetic | Restored shapes may render slightly smaller after reload when `widthMm`/`heightMm` were stored as true mm (≥1000) — `plannerCanvasUnits` normalizes legacy ×10 values |
| Opening collision detection | Backlog — wall opening overlap rules |
| FilterGrid split | Typography tokenized; file still ~2.6k lines — structural split pending |
| `release:gate` | Needs `DATABASE_URL` for Drizzle plan routes; Supabase optional for catalog |
| `planner-catalog.spec.ts` | Redirect expectation may not match `/access` route — verify when running full gate |

## Dev gotchas

- **Turbopack:** may panic on CSS `@source` — use `npx next dev --webpack`.
- **FOCSS path:** `app/css/index.css` (`@source "../../components"` + `"../.."`).
- **No Supabase env:** catalog falls back to local seed data; `DATABASE_URL` still required for Drizzle plan APIs.
- **Stale dev servers:** multiple `next dev` instances cause EADDRINUSE / stale UI — prefer `next start` after a fresh build for Playwright.
- **TypeScript:** stay on **6.x**; do not upgrade to TS 7 without an explicit decision.