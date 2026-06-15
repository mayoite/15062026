# 05 — Execution Checklist

*Mark `[x]` only after `03-FINISH-RULES.md` is complete and evidence path is filled.*
*Legend: P0 = launch-blocking foundation · P1 = product/revenue · P2 = consolidation*

---

## P0 — Baseline (do first)

| ID | Item | Owner | Status | Evidence |
|---|---|---|---|---|
| P0-BASE | `npm install` + `npm run release:gate` full baseline | | [ ] | `results/release-gate-*.txt` |
| P0-BASE-LINT | Fix any lint regressions from baseline | | [ ] | `npm run lint` output |
| P0-BASE-TC | Fix any typecheck errors from baseline | | [ ] | `npm run typecheck` output |

---

## P1 — Security & data integrity (P0 pillar)

| ID | Item | Owner | Status | Evidence |
|---|---|---|---|---|
| P1-S1.1 | Remove real secret from `.env.example`; rotate Appwrite key | | [ ] | Security audit re-scan; git diff |
| P1-S1.2 | Replace weak `ADMIN_TOKEN` / `CUSTOMER_QUERIES_ADMIN_TOKEN` with ≥32-char random | | [ ] | Env rotation note in handover |
| P1-S1.3 | Auth-gate `app/api/admin/themes/publish` | | [ ] | 401 without session test |
| P1-S1.4 | Auth-gate `app/api/theme/manage` | | [ ] | 401 without session test |
| P1-S1.5 | Auth + rate limit `app/api/planner/ai-advisor` | | [ ] | Route test or curl log |
| P1-S1.6 | Auth + rate limit `app/api/tracking` | | [ ] | Route test |
| P1-S1.7 | Auth + rate limit `app/api/audit` | | [ ] | Route test |
| P1-S1.8 | Remove hardcoded Supabase URL fallback in `platform/drizzle/db.ts` | | [ ] | Code review; fail-loud test |
| P1-S1.9 | Document or migrate admin `planner_saves` → Drizzle `plans` | | [ ] | Migration or signed contract in handover |
| P1-S1.10 | Planner save round-trip test (client → server → reload) | | [ ] | `tests/planner/` or new test output |
| P1-S1.11 | Migrate quotes off localStorage to Supabase `quotes` | | [ ] | API test + DB row |

---

## P2 — Performance & launch gates (P0 pillar)

| ID | Item | Owner | Status | Evidence |
|---|---|---|---|---|
| P2-P2.1 | `next/dynamic` for tldraw, three, R3F (ssr: false) | | [ ] | Bundle analyzer or build log |
| P2-P2.2 | `optimizePackageImports` in `next.config.js` | | [ ] | Config diff |
| P2-P2.3 | Move catalog client bundle to RSC/fetch | | [ ] | Bundle size before/after |
| P2-P2.4 | Replace raw `<img>` with `<Image>` (3 files per audit) | | [ ] | File paths + Lighthouse |
| P2-P2.5 | Remove `ignoreBuildErrors: true` from next config | | [ ] | Clean `npm run build` |
| P2-P2.6 | Fix `CategoryGrid.tsx` empty alt (P1 a11y) | | [ ] | `test:a11y` + code |
| P2-P2.7 | Lighthouse `/` perf ≥ 85 | | [ ] | `results/audits/lighthouse-home.*` |
| P2-P2.8 | Lighthouse `/products` perf ≥ 80 | | [ ] | `results/audits/lighthouse-products.*` |
| P2-P2.9 | Lighthouse `/planner` perf ≥ 90, LCP < 2.5s | | [ ] | `results/audits/lighthouse-planner.*` |
| P2-P2.10 | `release:gate` in CI on PR to main | | [ ] | Workflow file path |

---

## P3 — Planner product excellence (P1 pillar)

### Wave A — Surface quality (parallel)

| ID | Item | Owner | Status | Evidence |
|---|---|---|---|---|
| P3-W-A1 | Landing: SSR animated product vignette hero (not photo carousel) | | [ ] | Screenshots 375/1280; Lighthouse |
| P3-W-A2 | Landing: H1 visible at SSR (no opacity-0 pending hydration) | | [ ] | View-source or SSR screenshot |
| P3-W-A3 | Landing: `prefers-reduced-motion` honoured | | [ ] | Manual + CSS review |
| P3-W-A4 | Editor: re-enable action-triggered onboarding (non-modal) | | [ ] | Screenshot; no competitor copy |
| P3-W-A5 | Editor: single-key bindings V/W/R/D/F/M + `?` overlay | | [ ] | Unit test or screenshot |
| P3-W-A6 | Editor: status bar live mm cursor + selection W×D | | [ ] | Screenshot |
| P3-W-A7 | 3D: per-category materials + shadows on top 20 SKUs | | [ ] | Before/after screenshots |
| P3-W-A8 | 3D: split view < 1s; 2D→3D sync < 500ms | | [ ] | Timing capture in `results/` |
| P3-W-A9 | Feature pages `/planner/features/*` rebuilt with Oando visuals | | [ ] | Build + screenshots |
| P3-W-A10 | Help `/planner/help` — 15+ sections, search, fresh copy | | [ ] | Screenshot + content review |

### Wave B — Geometry & export

| ID | Item | Owner | Status | Evidence |
|---|---|---|---|---|
| P3-W-B1 | Opening collision: reject overlapping doors/windows on wall | | [ ] | `tests/planner/wallOpenings.test.ts` extended |
| P3-W-B2 | INR/GST BOQ in quote PDF matches catalog | | [ ] | PDF in `results/` + assertion test |
| P3-W-B3 | Command palette Ctrl/⌘+K (tools, catalog, export) | | [ ] | Screenshot + binding test |
| P3-W-B4 | Auto-dimension labels on walls | | [ ] | Canvas screenshot |
| P3-W-B5 | Catalog "Recent" row | | [ ] | Screenshot |
| P3-W-B6 | Touch drag audit on catalog tiles | | [ ] | Manual mobile test note |

### Wave C — Differentiation

| ID | Item | Owner | Status | Evidence |
|---|---|---|---|---|
| P3-W-C1 | GLB asset pipeline (glTF Transform) | | [ ] | Load time + 3D screenshots |
| P3-W-C2 | Read-only share link `/planner/share/[token]` | | [ ] | Route test |
| P3-W-C3 | AI furnish: ghost preview + explicit approval | | [ ] | Flow screenshot |
| P3-W-C4 | Showroom handoff CTA + funnel events | | [ ] | Analytics spec + UI screenshot |

### Wave gates

| ID | Item | Status | Evidence |
|---|---|---|---|
| P3-GATE-A | Wave A ledger average ≥ 4.9, no cat < 4 | [ ] | `06` score log row |
| P3-GATE-B | Wave B ledger average ≥ 4.9, no cat < 4 | [ ] | `06` score log row |
| P3-GATE-C | Wave C ledger average ≥ 4.9, no cat < 4 | [ ] | `06` score log row |

---

## P4 — Commercial funnel (P1 pillar)

| ID | Item | Owner | Status | Evidence |
|---|---|---|---|---|
| P4-C4.1 | Quote cart → CRM pipeline end-to-end | | [ ] | E2E test or manual script |
| P4-C4.2 | BOQ export → quote cart bridge | | [ ] | Test + screenshot |
| P4-C4.3 | Customer queries admin uses session auth (not static token) | | [ ] | Route test |
| P4-C4.4 | Client portal `/portal/guest/view/[id]` verified | | [ ] | Smoke test |
| P4-C4.5 | WhatsApp CTA on planner export flow | | [ ] | Screenshot |
| P4-C4.6 | Analytics events: quote_submit, plan_export, auth_login | | [ ] | Event taxonomy doc |

---

## P5 — Site conversion (P1 pillar)

| ID | Item | Owner | Status | Evidence |
|---|---|---|---|---|
| P5-S5.1 | Homepage first-viewport CTA hierarchy (mobile calm) | | [ ] | Screenshots 375/1280 |
| P5-S5.2 | Product pages: dimensions, materials, lead times | | [ ] | Sample product URL |
| P5-S5.3 | Trust surfaces: named projects with permission | | [ ] | Content + legal note |
| P5-S5.4 | Site assistant wired to planner AI advisor | | [ ] | Chat screenshot |
| P5-S5.5 | JSON-LD on product pages (SEO ≥ 95 catalog) | | [ ] | Rich results test |
| P5-S5.6 | Quote flow E2E smoke test | | [ ] | Playwright spec path |

---

## P6 — Platform consolidation (P2 pillar)

| ID | Item | Owner | Status | Evidence |
|---|---|---|---|---|
| P6-PC6.1 | Zero runtime imports from `archive/features/buddy-planner` | | [ ] | `rg` audit output |
| P6-PC6.2 | Zero runtime imports from `archive/features/oando-planner` | | [ ] | `rg` audit output |
| P6-PC6.3 | Database responsibility map written in handover | | [ ] | `04-HANDOVER.md` §Architecture |
| P6-PC6.4 | Planner files >500 lines split or waived with reason | | [ ] | File list |
| P6-PC6.5 | Planner test coverage ≥ 75% on `features/planner/` | | [ ] | `npm run test:coverage` |
| P6-PC6.6 | Launch 5-phase governance review complete | | [ ] | `docs/ops/audits/website-launch-5-phase-governance-and-metrics.md` sign-off |

---

## Cut list (do not check off — out of scope)

- [ ] DWG / CAD import
- [ ] Photo-to-floorplan computer vision
- [ ] AR / WebXR viewer
- [ ] Multi-tenant team workspaces
- [ ] IT network / cabling configuration
- [ ] Full audit log system

---

## Progress summary

| Pillar | Total | Done | % |
|---|---|---|---|
| P0 Baseline | 3 | 0 | 0% |
| P1 Security | 11 | 0 | 0% |
| P2 Performance | 10 | 0 | 0% |
| P3 Planner | 23 | 0 | 0% |
| P4 Commercial | 6 | 0 | 0% |
| P5 Site | 6 | 0 | 0% |
| P6 Platform | 6 | 0 | 0% |
| **Total** | **65** | **0** | **0%** |

*Update the progress table when marking items `[x]`.*

---

## Batch log

| Date | Operator | Items closed | Gate result | Notes |
|---|---|---|---|---|
| 2026-06-13 | — | Pack created | not run | Awaiting P0-BASE |
