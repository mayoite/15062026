# 03 — Quality Ledger

*Created: 2026-06-11 — Scored release gate for all shippable surfaces.*

## How to Use

Score each category **1–5** at the end of every meaningful batch. A surface cannot ship if:

- **Average < 4.0**, or
- **Any single category < 3**

Update the score log table with the date, phase label, scores, and a link to evidence (screenshot, test output, PR).

---

## Category Definitions

### Site UI Categories

| Category | 1 (unacceptable) | 5 (flagship) |
|---|---|---|
| **Homepage** | Broken layout, missing sections | Premium hero, smooth carousel, all sections pixel-perfect at all breakpoints |
| **Planner landing** | Stub or wrong styles | Homepage-grade hero, features grid, steps, closing CTA, LCP < 2.5 s |
| **Nav/Footer** | Broken links, wrong bg | Sticky nav, active states, mobile drawer, dark footer, all links functional |
| **Typography** | Raw Tailwind sizes, no token use | All copy uses `typ-*` utilities; correct scale at all breakpoints |
| **Components** | Inconsistent cards/buttons | All cards use design system tokens; hover/focus states correct |
| **Mobile** | Broken at 375 px | All routes correct at 375 px, 768 px, 1280 px |
| **Performance** | LCP > 4 s | LCP < 2.5 s; CLS < 0.1; TBT < 200 ms |
| **A11y** | Critical axe violations | 0 critical/serious axe violations on all public routes |

### Planner Categories

| Category | 1 (unacceptable) | 5 (flagship) |
|---|---|---|
| **Editor UX** | Dead clicks, blank canvas | Tooling obvious; ghost drag; save indicator; undo works |
| **Blocks** | Raster/blocky symbols | SVG QA sheet approved; mm-accurate; readable at 32 px |
| **3D** | Missing or broken | Split view < 1 s; orbit controls; materials on top items |
| **AI** | Mock or unwired | Chat + furnish + wizard; ghost apply; < 3 s response |
| **Help** | Unrouted or stale | 15+ sections, search, site-styled |
| **Export** | Broken PDF | Branded 300 DPI + itemised BOQ |
| **Canvas Perf** | TTI > 4 s | TTI < 2 s; lazy Tldraw bundle |
| **Catalog** | Empty or unsearchable | 105+ items, filter < 100 ms, drag-drop functional |
| **Conversion Funnel** | No tracking, >70% drop-off | < 40% drop-off landing→save; < 25% save→export; analytics verified |

---

## Score Log

### Site UI

| Date | Phase | Homepage | Landing | Nav/Footer | Typography | Components | Mobile | Perf | A11y | Avg | Ship? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-06-11 | audit | — | — | — | — | — | — | — | — | — | pending |

### Planner

| Date | Phase | Editor | Blocks | 3D | AI | Help | Export | Perf | Catalog | Avg | Ship? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-06-10 | 0 start | — | — | — | — | — | — | — | — | — | — |
| 2026-06-10 | 0 batch 1 | 3 | 2 | 3 | 2 | 4 | 2 | 3 | — | 2.7 | no |
| 2026-06-11 | 0 batch 2 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | 4 | 3.9 | no |
| 2026-06-12 | release-gate verification | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4.0 | **withdrawn** — gate passed but evidence checklist incomplete; duplicate inspector panels still open |
| 2026-06-12 | inspector + token batch | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4.0 | no — M2 SVG QA, guest→auth migration, admin `planner_saves` path still open |
| 2026-06-12 | M4–M6 verification | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4.0 | no — build+tests pass; lint blocks gate; admin `planner_saves` open; site evidence partial |

---

## Evidence Checklist (current phase)

### Site UI
- [x] Homepage renders at 375/1280 px — `results/responsive/home-mobile.png`, `home-desktop.png` (2026-06-12)
- [ ] Homepage 768/1680 px matrix — add to `results/audits/` when captured
- [ ] Planner landing renders correctly at 375/768/1280 px
- [ ] Nav sticky + mobile drawer tested
- [ ] Footer all links functional
- [ ] Lighthouse run on `/` — scores recorded above
- [ ] Lighthouse run on `/planner` — scores recorded above
- [ ] Zero axe violations on `/` and `/planner`

### Planner
- [x] Right rail shows one properties panel (no duplicate ElementInspector + PropertiesInspector) — `PlannerWorkspace.tsx` 2026-06-12
- [ ] `/planner/canvas` loads in < 2 s (DevTools Network tab) — re-verify after inspector merge
- [x] Guest IndexedDB → member slot claim on first `/planner/canvas` visit — `migrateGuestProjectToMember()` 2026-06-12
- [x] M2 SVG QA automated — `tests/planner/svg-qa.test.ts` + `npm run catalog:qa:sheet` (121 items, 0 failures)
- [x] Drizzle `plans` persistence path — `npm run db:test` (2026-06-12)
- [x] Snap visual indicator during wall/room/door draw — `SnapIndicatorOverlay` 2026-06-12
- [x] Drag from catalog → block placed on canvas
- [x] Block dimensions match catalog mm values
- [x] Autosave fires; "Saved" indicator visible
- [x] Session survives reload
- [x] BOQ PDF exports with Oando branding and itemised list
- [x] Split 3D view opens without error
- [x] AI chat responds to freeform room request

---

## Scoring Notes

- A score of 3 means "functional but not flagship" — acceptable during active development, not for release.
- A score of 5 means no reviewer would find a flaw that a benchmark product (RoomSketcher, Planner 5D) doesn't also have.
- Evidence links must point to reproducible results — not memory.
