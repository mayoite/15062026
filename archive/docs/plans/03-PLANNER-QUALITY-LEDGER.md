# 03 — Planner Quality Ledger

*Created: 2026-06-10 — Scored release gate for unified workspace planner.*

## How to use

Score each category **1–5** at the end of every phase. A phase cannot ship if:

- **Average < 4.0**, or
- **Any category < 3**

Update scores in the table below with date and evidence (test output, screenshot, PR link).

## Categories

| Category | 1 (unacceptable) | 5 (flagship) |
|---|---|---|
| **Landing** | Stub or redirect only | Homepage-grade hero, motion, CTAs, LCP < 2.5s |
| **Editor UX** | Dead clicks, blank canvas | Tooling obvious; ghost drag; save indicator |
| **Blocks** | Raster/blocky symbols | SVG QA sheet approved; mm-accurate |
| **3D** | Missing or broken | Split view instant; materials on top items |
| **AI** | Mock or unwired | Chat + furnish + wizard; ghost apply |
| **Help** | Unrouted or stale | 15 sections, search, site-styled |
| **Export** | Broken PDF | Branded 300 DPI + BOQ |
| **Perf** | Canvas > 4s TTI | Canvas < 2s; lazy Tldraw bundle |
| **A11y** | Critical axe violations | 0 critical/serious on public routes |
| **SEO** | No metadata/sitemap | OG, canonical, JSON-LD, sitemap |
| **Code health** | `@ts-nocheck`, lint fail | `release:gate` clean in `features/planner/` |

## Score log

| Date | Phase | Landing | Editor | Blocks | 3D | AI | Help | Export | Perf | A11y | SEO | Code | Avg | Ship? |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-06-10 | 0 start | — | — | — | — | — | — | — | — | — | — | — | — | — |
| 2026-06-10 | 0 batch 1 | 4 | 3 | 2 | 3 | 2 | 4 | 2 | 3 | 3 | 4 | 4 | 3.0 | no |
| 2026-06-11 | 0 batch 2 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | 5 | 5 | 5 | 4.2 | **yes** |

## Phase 0 evidence checklist

- [ ] `/planner` landing live with site FOCSS
- [ ] `/planner/canvas` and `/planner/guest` use `UnifiedPlannerPage`
- [ ] Redirects from `/oando-planner/*` and `/buddy-planner/*`
- [ ] Sitemap includes `/planner` and `/planner/help`
- [ ] Canvas routes `noindex`
