# 04 — Handover

*Last updated: 2026-06-13 — Initial pack creation. Re-baseline before trusting gate claims.*

---

## Operator summary

**Project:** Oando Platform (`oando-platform`) — unified Next.js app: marketing site + workspace planner + CRM/admin.

**Plan pack:** `docs/new/` (8 files). Start with `02-START-RULES.md`; finish with `03-FINISH-RULES.md`.

**North star:** Real Oando catalog planner with mm accuracy, INR/GST BOQ, plan→quote→showroom loop — exceed RoomSketcher / Planner 5D / SmartDraw on measurable dimensions, never copy them.

**Current phase:** Foundation — P0 security + performance before planner Wave A surfaces.

---

## Active batch

| Field | Value |
|---|---|
| Status | **None** — awaiting operator pick from `05-EXECUTION-CHECKLIST.md` |
| Recommended first item | `P0-BASE` — install deps + `npm run release:gate` baseline |
| Operator | — |
| Started | — |

---

## Verification (re-baseline required)

*Claims below are from repo inspection 2026-06-13. Not re-run this session.*

| Gate | Last known | Evidence | Trust level |
|---|---|---|---|
| `npm install` | Not confirmed | — | ⚠️ `tsc` not found without install |
| `typecheck` | 0 errors (2026-06-11 cert) | `results/CERTIFICATION.md` | Stale |
| `lint` | 2 errors (2026-06-11 cert) | `results/lint-final.txt` | Stale |
| `test:planner` | Green (recent merges) | git log layer-visibility tests | Partial |
| `release:gate` | Unknown | — | **Not verified** |
| Lighthouse `/` | Perf 69 | `results/audits/lighthouse-audit.md` | 2026-06-11 |
| Lighthouse `/products` | Perf 52 | same | 2026-06-11 |
| Lighthouse `/planner` | Perf 75 | same | 2026-06-11 |
| Security audit | 3 critical, 3 high open | `results/audits/security-audit.md` | Open |
| A11y audit | 2 P1 open | `results/audits/accessibility-audit.md` | Open |

**Action for next operator:** Run `npm install` then `npm run release:gate`. Paste output to `results/release-gate-2026-06-13.txt` and update this table.

---

## Architecture (quick)

| Layer | Tech | Notes |
|---|---|---|
| Frontend | Next.js 16 App Router, React 19, Tailwind 4 | Single app, no monorepo |
| Planner canvas | Tldraw 5, custom shapes/tools | `features/planner/` |
| 3D | React Three Fiber, drei | `features/planner/viewer/` |
| Auth | Appwrite | `/access`, `/login` |
| App DB | Drizzle + Postgres (`DATABASE_URL`) | `plans`, profiles, teams |
| Catalog DB | Supabase | Products, categories, images |
| Admin DB | Supabase admin | CRM, planner_saves, quotes (partial) |
| Deploy | Vercel (`vercel:prod` runs release gate) | No `render.yaml` |

**Route contract:** `project/route-contract.json` — canonical planner at `/planner/**`; legacy buddy/oando redirect.

---

## What is working (evidenced)

- Unified planner at `features/planner/` + `app/planner/` (Tldraw + 3D + catalog + AI shell)
- Site nav E2E smoke 5/5 (`changes-by-chapter.md`, 2026-06-12)
- Planner unit tests: wall openings, layers, guest migration, SVG QA, templates, etc.
- 121+ catalog symbols with SVG QA pipeline (`npm run catalog:qa:sheet`)
- Legacy redirects: `/buddy-planner/*`, `/oando-planner/*` → `/planner/**`

---

## What is not done (priority order)

1. **P0** — Security: unauthenticated write APIs, weak admin tokens, hardcoded Supabase fallback
2. **P0** — Performance: catalog Lighthouse 52; tldraw/three not dynamically imported
3. **P1** — Planner Wave A: landing hero rebuild, editor chrome, 3D quality, help/features pages
4. **P1** — INR/GST BOQ confirmation in quote PDF
5. **P1** — Dual persistence: Drizzle `plans` vs admin `planner_saves`
6. **P1** — Quotes still partially localStorage (see archived `quoteSubmission.ts` TODO)
7. **P2** — Governance docs were removed from repo root 2026-06-12; restored in `docs/new/`

---

## Env (operator)

Required for full gate (see `npm run launch:env`):

- `DATABASE_URL` — Drizzle / plans
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — catalog
- Appwrite project + endpoint — auth
- Admin tokens — **must be rotated** (security audit: trivial values)

Do not commit `.env.local`. Do not commit real secrets in `.env.example`.

---

## Hot files (coordinate before edit)

- `features/planner/planner.css`, `planner-shell.css`, `planner-responsive.css`
- `features/planner/editor/PlannerWorkspace.tsx`
- `features/planner/landing/plannerLandingData.ts`
- `config/build/next.config.js`

---

## Next recommended items

| Order | ID | Item | Why |
|---|---|---|---|
| 1 | `P0-BASE` | `npm install` + `release:gate` baseline | Unknown current health |
| 2 | `P1-S1.1` | Rotate secrets, purge `.env.example` leak | 3 critical security |
| 3 | `P2-P2.1` | Dynamic import tldraw/three | Biggest perf win |
| 4 | `P3-W-A1` | Planner landing hero rebuild | Core conversion surface |

Full list: `05-EXECUTION-CHECKLIST.md`.

---

## References

| Topic | Doc |
|---|---|
| Strategy | `01-MASTER-PLAN.md` |
| Checklist | `05-EXECUTION-CHECKLIST.md` |
| Gates | `06-TESTING-AND-EVIDENCE.md` |
| Blockers | `07-FAILURES-AND-RISKS.md` |
| Historical plans | `archive/docs/plans/` |
