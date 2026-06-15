# Handover — historical log (2026-06-12 – 2026-06-14)

*Superseded by `docs/Handover.md` for current state. Kept so session narrative is not lost after doc syncs.*

## 2026-06-13 — Cloud agent verification

The "release:gate passes" / "planner verified" claims in older entries were **not reproducible** in the Cursor Cloud VM; the planner crashed on basic use until fixed. Re-verified state at the time:

- **Planner core flow fixed.** Placing furniture (or reloading with furniture saved) crashed with a tldraw `ValidationError` (`meta` contained `undefined`) from `features/planner/editor/layerVisibility.ts`. Fixed + regression test added.
- **`getPlannerProjectId` autosave-identity regression fixed**; `planId` threaded through the canvas route; contradictory tests rebuilt.
- **Verified then:** `npm run lint`, `npm run typecheck`, `npm run test` (193 passed), `tests/navigation-smoke.spec.ts`, `npx next dev --webpack` on planner routes.
- **Not verified then:** `npm run build` / `npm run release:gate` without full Supabase/Drizzle env in cloud VM.

## 2026-06-12 — Homepage recovery & deployment prep

- Branch context: `homepage-v2` off `recovery/from-transcript`
- Homepage: hero glass panel, one-row categories, 4 projects, contact form, trimmed footer
- Deployment prep: hero fallback fix (`DEFAULT_HERO_FALLBACK` → `dmrc-hero.webp`), typecheck, lint, build (176 pages at the time), planner tests, a11y, e2e:nav, planner-catalog, `launch:env`, `db:test`
- Homepage recovery table: Phase A restore `b99a4a0`, Phase B redesign complete, hero carousel ghosting fixed, responsive screenshots in `results/responsive/`

## 2026-06-14 — Candidate batch (GST, AI stabilize, M4 evidence)

- GST + grandTotal in `features/planner/shared/boq`
- AI stabilize: `isSuggestedLayoutJson` guard in `spaceSuggest`
- M4 evidence: create+normalize roundtrip in `plannerDocument.test.ts`
- Proof at the time: `test:planner` 182/182, eslint on touched files, typecheck pass

## Note on `docs/new/`

Older entries reference `docs/new/` as an active plan pack. That tree was **not** carried forward — live roadmaps are `plans/`; retired material is under `archive/docs/`.

---
*Source: recovered from pre-sync worktree + git `5f37db6`. Current milestones: `docs/Handover.md`.*