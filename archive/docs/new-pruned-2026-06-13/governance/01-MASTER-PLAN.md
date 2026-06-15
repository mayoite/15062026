# 01 — Master Plan

*Created: 2026-06-12 · Pack expanded: 2026-06-13*
*The plan for making the Oando planner objectively better than RoomSketcher, Planner 5D, SmartDraw, and 3D Planner, and this repository a showcase of engineering quality.*
*This file is the strategy contract. Execution lives in the 8-file pack — start `02-START-RULES.md`, finish `03-FINISH-RULES.md`, track `05-EXECUTION-CHECKLIST.md`.*

---

## 1. North Star

Oando's planner is a furniture-space planner for the Indian office market: millimetre-accurate plans of real Oando products, SH/NS workstation semantics encoded correctly (bays, depths, face-to-face occupancy), a BOQ that flows directly into an INR/GST quote, and branded client-ready output (300 DPI PDF + itemised BOQ). RoomSketcher, Planner 5D, SmartDraw, and 3D Planner are capability benchmarks to **exceed, never copy** — no competitor symbols, templates, taglines, screenshots, or disparaging claims on any Oando surface (`07-CAPABILITY-MATRIX.md` Product Lens, `16-LANDING-UX-RESEARCH.md` §d). The wedge no benchmark addresses: real manufacturer catalog data, India-market pricing and compliance, and a plan→quote→showroom loop.

### What "objectively better" means per benchmark

"Better" is a falsifiable side-by-side verdict on a named dimension, not a feeling. The dimension we must win, per competitor:

| Benchmark | Their strength | We win when (measurable) |
|---|---|---|
| RoomSketcher | Measurement rigor, blueprint trace | Typed mm lengths + two-point calibration + live cursor/selection readout + opening-overlap rejection, all verifiable in one session |
| Planner 5D | 3D visual quality, frictionless start | Split 2D/3D < 1 s with materials/shadows on top items **plus** guest canvas with zero signup wall before first placement |
| SmartDraw | Data-rich symbol libraries | 121+ real-SKU symbols carrying mm footprints, seat semantics, and INR data — not generic icons; SVG QA 0 failures every batch |
| 3D Planner | Fast 3D preview | 2D edit reflected in 3D in < 500 ms; no benchmark connects the 3D scene to a manufacturer BOQ — we do |

On every other dimension the rule is parity-or-better; a category scored 5 in the ledger means no reviewer finds a flaw a benchmark doesn't also have (`03-QUALITY-LEDGER.md` scoring notes).

## 2. Quality Contract

- **Ship gate:** ledger average **≥ 4.9 / 5** with **no category < 4** (partner directive 2026-06-12; gate and categories in `03-QUALITY-LEDGER.md`). No rounding up. Anything below the bar gets a revision pass and a re-score with fresh evidence.
- **Evidence rule:** every status claim in any doc requires pasted command output, a screenshot under `results/`, or a test file path. A claim without evidence is treated as false.
- **Failure rule:** every failure, skip, or blocker goes in `07-FAILURES-AND-RISKS.md` the moment it happens (`02-START-RULES.md` §8).
- **Code rule:** zero TypeScript errors, zero lint errors, relevant tests green, hand-written files under 500 lines (`02-START-RULES.md` §7).
- **Honesty rule:** a score of 5 means a reviewer comparing the surface side-by-side with the named benchmark would judge ours better on at least one stated dimension and worse on none.
- **Precedent:** a gate pass was withdrawn on 2026-06-12 because the evidence checklist was incomplete (`03-QUALITY-LEDGER.md` score log). That standard stands: score without evidence = no score.

### Repository showcase standard

The repo itself is a deliverable. Measurable expectations (`02-START-RULES.md`, `03-FINISH-RULES.md`):

- One application, one architecture — no hidden sub-applications, pseudo-monorepo structures, or standalone frontend runtimes inside feature folders.
- Canonical planner code lives in `features/planner/` + `app/planner/` only. Retired surfaces live under `archive/`, mirroring their original repo paths; deletion only on explicit instruction.
- Hand-written `.ts`/`.tsx`/`.css` files stay under 500 lines (stretch to 700 only with a written reason in `04-HANDOVER.md`).
- `docs/new/` is the single 8-file plan pack (`00-INDEX.md`); `archive/docs/plans/` is historical reference only.
- Truth logs stay current: `07-FAILURES-AND-RISKS.md` for failures/skips/blockers, `04-HANDOVER.md` for operator state. A reader of those two files plus this plan can reconstruct project state without asking anyone.
- No broad refactor without a written target state; restructuring requires an ownership map, migration sequence, compatibility plan, and verification gates first.

## 3. Surface-by-Surface Target State

Current-state column is sourced from `07-CAPABILITY-MATRIX.md` (verified 2026-06-12) and `16-LANDING-UX-RESEARCH.md`. "Flagship" means measurable, not aspirational. Each surface names the ledger row it is scored under.

### 3.1 Landing (`/planner`) — ledger row: Planner landing
- **Flagship:** hero is an animated product vignette (SSR'd inline SVG from `buildBlock2D` symbols — walls draw in, workstations snap, BOQ chip appears), not furniture photography. H1 visible at SSR (no `opacity: 0` pending hydration). Named social proof (real delivered projects, with permission). LCP < 2.5 s and CLS < 0.1 at 375 px and 1280 px, page JS < 300 KB compressed, one eager hero asset < 200 KB, `prefers-reduced-motion` honoured.
- **Current:** 3-photo crossfade carousel of finished interiors; H1 hidden until Framer Motion hydrates; all three hero images preloaded simultaneously; spec chips instead of proof (`16-LANDING-UX-RESEARCH.md` context + §c).
- **Gap:** full hero/story rebuild — Wave 1, workstream 1.

### 3.2 Editor Chrome (tool rail, inspector, layers, modals, AI chat shell) — ledger row: Editor UX
- **Flagship:** one coherent shell on site FOCSS tokens. Onboarding is action-triggered, non-blocking, max 1–2 hints per session, never modal, with copy free of competitor names. Single-key tool bindings (V/W/R/D/F/M) plus a `?` shortcut overlay. Status bar shows live cursor position in mm, selected-object W×D, and an active-tool hint; uncalibrated state is an explicit chip, not a parenthetical.
- **Current:** shell structurally strong (rail, catalog, inspector, status bar with area totals) but onboarding is disabled in `PlannerWorkspace.tsx`, coach copy is stale and names competitors, shortcuts exist only as tooltip text (`16-LANDING-UX-RESEARCH.md` §b).
- **Gap:** chrome rebuild — Wave 1, workstream 2. Command palette — Wave 2.

### 3.3 Canvas & Geometry — ledger rows: Editor UX, Canvas Perf
- **Flagship:** typed wall lengths; openings snap to walls **and are rejected on overlap**; automatic dimension labels; two-point calibration; undo/redo stable across 50+ operations; autosave fires within 2 s with visible indicator; canvas TTI < 2 s on a lazy Tldraw bundle.
- **Current:** Partial — custom shapes/tools and `SnapIndicatorOverlay` ship; blueprint underlay + calibration done (M3 in `02-PLANNER.md`); opening collision is a **Gap**, auto-dimension layout open (`08-GEOMETRY-STATUS.md`).
- **Gap:** opening collision — Wave 2.

### 3.4 Catalog — ledger rows: Catalog, Blocks
- **Flagship:** 121+ items, filter < 100 ms, seat-count badges on all SH/NS items, a "Recent" row, drag ghost at true mm scale, every symbol readable at 32 px, SVG QA at 0 failures on every batch.
- **Current:** **Ship** for symbol library (121 items, `tests/planner/svg-qa.test.ts` 0 failures, `npm run catalog:qa:sheet`); SH/NS semantics encoded and unit-tested (`07-CAPABILITY-MATRIX.md` Authoritative Product Rules); Recent row missing; touch drag partial.
- **Gap:** Recent row + touch drag audit — Wave 2 polish.

### 3.5 3D Viewer — ledger row: 3D
- **Flagship:** split view opens < 1 s; physically plausible lighting, per-category materials, and contact shadows on the top 20 catalog items; 2D edit reflected in 3D < 500 ms; orbit on touch and mouse.
- **Current:** Partial — extruded `FurnitureMesh3D` with category materials; lighting/material/shadow quality below Planner 5D; GLB pipeline not started (`07-CAPABILITY-MATRIX.md`).
- **Gap:** lighting/materials/shadows — Wave 1, workstream 3. GLB assets — Wave 3.

### 3.6 AI Assist — ledger row: AI
- **Flagship:** chat + `/furnish` + `/wizard`; proposed layouts apply as ghost previews with explicit user approval, never a silent overwrite; response < 3 s on a standard connection.
- **Current:** Partial — advisor wired at `/api/planner/ai-advisor`, rule-based rather than generative; chat surface included in the chrome rebuild.
- **Gap:** approval-gated furnish hardening — Wave 2/3 boundary (rule-based first, per `07-CAPABILITY-MATRIX.md` order).

### 3.7 Export & BOQ — ledger row: Export
- **Flagship:** branded PDF at 300 DPI equivalent with no pixelated text; itemised BOQ with INR line items and GST fields whose values match catalog data; JSON export reloads to an identical `PlannerDocument`.
- **Current:** Partial — branded PDF + BOQ ship from canvas; INR/GST in the quote PDF **not confirmed** (P0 gap, `07-CAPABILITY-MATRIX.md`).
- **Gap:** INR/GST BOQ — Wave 2.

### 3.8 Persistence — ledger rows: Editor UX (save trust), Conversion Funnel
- **Flagship:** IndexedDB autosave within 2 s of last edit with visible indicator; session survives reload; Drizzle `plans` is the single server store; guest work claimed on first member visit including a server write; save→load→compare round-trip test green against live DB.
- **Current:** Partial — `plans` verified via `npm run db:test`; guest claim tested client-side; admin APIs still read Supabase `planner_saves` (dual-store risk); round-trip test missing (`05-BACKEND-AND-DATA.md`).
- **Gap:** admin store decision + round-trip test — Wave 2.

### 3.9 Feature Pages (`/planner/features/*`) — ledger rows: Planner landing, Typography
- **Flagship:** every capability page demonstrates the feature with Oando product visuals (zero competitor assets), indexed with correct metadata, `typ-*` typography throughout, LCP < 2.5 s, correct at 375/768/1280 px.
- **Current:** routed and building (SSG slug fix 2026-06-12); content and visuals below landing grade.
- **Gap:** rebuild — Wave 1, workstream 4.

### 3.10 Help (`/planner/help`) — ledger row: Help
- **Flagship:** 15+ task-oriented sections, working search, site-styled, copy matches the shipped editor (no stale tool names, no competitor claims).
- **Current:** routed; depth and freshness unverified against the rebuilt editor.
- **Gap:** rebuild — Wave 1, workstream 4.

## 4. Six Pillars & Execution Waves

Every item ships through §5. Checklist IDs in `05-EXECUTION-CHECKLIST.md`. "Evidence" names the artifact required before `[x]`.

### 4.0 Six pillars (sequencing)

| Pillar | Priority | Checklist § | Timeline |
|---|---|---|---|
| **P1 Security & data** | P0 | `05` §P1 | Weeks 1–2 |
| **P2 Performance & launch gates** | P0 | `05` §P2 | Weeks 1–2 |
| **P3 Planner product** | P1 | `05` §P3 Waves A–C | Weeks 3–10 |
| **P4 Commercial funnel** | P1 | `05` §P4 | Weeks 7–8 |
| **P5 Site conversion** | P1 | `05` §P5 | Weeks 7–8 |
| **P6 Platform consolidation** | P2 | `05` §P6 | Weeks 9–12 |

**Month 1:** P1 + P2 + Planner Wave A · **Month 2:** Waves B + P4 + P5 · **Month 3:** Wave C + P6 + launch governance review.

### 4.1 Planner execution waves

Every planner item ships through the §5 loop.

**Wave sequencing rules:**
- A wave is *entered* when its predecessor's ledger rows hold the §2 gate with a complete evidence checklist — not when its work merely stops.
- Items inside a wave may run concurrently; items must not be pulled forward from a later wave while any current-wave item is below the gate.
- Cut list stays cut (`02-PLANNER.md`): DWG import, photo-to-floorplan CV, AR/WebXR, team tenancy, IT network config, audit log.

### Wave 1 — In flight now (2026-06-12 batch, four concurrent workstreams)

| # | Workstream | Definition of done | Evidence required |
|---|---|---|---|
| W1.1 | Immersive landing | Animated product-demo hero per §3.1; moves 1–2 and 5 of `16-LANDING-UX-RESEARCH.md` §a landed; reduced-motion handled | Lighthouse on `/planner` at 375/1280 px (LCP < 2.5 s, CLS < 0.1) in `results/audits/`; screenshots; ledger Landing row scored |
| W1.2 | Editor chrome | Tool rail, inspector, layers, modals, AI chat shell rebuilt per §3.2; onboarding re-enabled action-triggered; competitor-naming copy removed | `npm run test:planner` green; browser screenshots of each panel state; ledger Editor row scored |
| W1.3 | 3D viewer quality | Lighting, materials, shadows per §3.5; split view < 1 s; sync < 500 ms | Before/after screenshots of top catalog items in 3D; timing capture; ledger 3D row scored |
| W1.4 | Feature + help pages | All `/planner/features/*` and `/planner/help` per §3.9–3.10 | Build pass; route screenshots at 375/1280 px; ledger Help row scored |

Coordination rule: four agents edit concurrently — `planner.css`, `PlannerWorkspace.tsx`, and `plannerLandingData.ts` are shared hot files. Pull/rebase before each batch; conflicts logged in `Failures.md`, never resolved by discarding another workstream's changes.

### Wave 2 — Next highest leverage

| # | Item | Definition of done | Evidence required |
|---|---|---|---|
| W2.1 | Command palette + keyboard-first | `Ctrl/⌘+K` palette covering tools, catalog search, view modes, export, templates; single-key bindings + `?` overlay (`16-LANDING-UX-RESEARCH.md` §b) | Unit tests for binding map; screenshot of palette + overlay; no conflict with tldraw defaults |
| W2.2 | Opening collision | Doors/windows on the same wall segment reject overlap with visible feedback; no silent stacking | Geometry unit tests in `tests/planner/`; canvas screenshot of rejection state (`08-GEOMETRY-STATUS.md`) |
| W2.3 | INR/GST BOQ | Quote PDF carries INR line items, GST fields, totals; values match catalog data | Generated PDF in `results/`; line-item assertion test |
| W2.4 | Named social proof + BOQ artifact on landing | Named delivered projects (permission confirmed) and an anonymised branded BOQ crop on `/planner` (moves 3–4 of `16-LANDING-UX-RESEARCH.md` §a) | Written permission noted; screenshots; no invented numbers |
| W2.5 | Persistence closure | Admin `planner_saves` migrated to Drizzle or documented as admin-only contract; save round-trip test green | Migration file or signed-off contract in `05-BACKEND-AND-DATA.md`; round-trip test output |

### Wave 3 — After Waves 1–2 hold a ≥ 4.9 score

| # | Item | Definition of done | Evidence required |
|---|---|---|---|
| W3.1 | GLB asset pipeline | Oando models through glTF Transform; per-SKU finish variants; `FurnitureMesh3D` kept as fallback | Bundle-size budget respected; 3D screenshots; load-time capture |
| W3.2 | Collaboration | Read-only share link (`/planner/share/[token]`) first; no pricing/PII for viewers; conflict-safe saves second | Route test; RLS/permission test; `concurrentSaveConflict.test.ts` |
| W3.3 | Showroom / dealer integration | Plan → showroom visit/quote handoff defined with sales; first digital↔showroom link shipped | Product spec signed off; funnel events recorded |

## 5. Verification Loop

### Per feature (mandatory — `03-FINISH-RULES.md` §7)

1. Define the feature and its acceptance evidence before writing code.
2. Implement the smallest complete increment.
3. Run relevant automated and manual tests.
4. Critique the result against usability, visual quality, correctness, regressions, and the ledger.
5. Revise defects or weak results.
6. Retest after revision.

A feature is not done until the loop closes. No placeholder or unused files to imply progress.

### Per batch, in order

1. `npm run typecheck` — 0 errors
2. `npm run lint` — 0 errors
3. `npm run test:planner` — all green
4. `npm run test:e2e:nav` and `npm run test:a11y` — green on touched routes
5. `npm run release:gate` — full gate for significant app work
6. Screenshot every changed surface at 375/768/1280 px into `results/`
7. Score against `03-QUALITY-LEDGER.md`; anything < 4.9 average or any category < 4 → revise → re-score with fresh evidence
8. Log skips/failures in `07-FAILURES-AND-RISKS.md`; update `04-HANDOVER.md`

### Evidence conventions

- Lighthouse and audit output → `results/audits/`. Responsive screenshots → `results/responsive/`. Catalog QA sheets → `results/catalog-qa/`.
- Each ledger entry uses this row shape — date, phase label, one score per category, average, ship verdict with the blocking reason spelled out:

```
| 2026-06-12 | wave-1 <workstream> | <cat scores…> | <avg> | no — <exact blocker> |
```

- A wave is complete only when its ledger rows are at or above the gate **with the evidence checklist filled** — a passing score with an incomplete checklist was already withdrawn once (2026-06-12 score log) and must not recur.

## 6. Risks & Honesty Register

Full register with open failures: `07-FAILURES-AND-RISKS.md`. Summary:

| Risk | Why it can sink the plan | Mitigation |
|---|---|---|
| Lint/CI debt resurfacing | Stale green claims hide red CI | Re-run `release:gate` every batch (`06-TESTING-AND-EVIDENCE.md`) |
| Concurrent-edit conflicts | Silent overwrites on hot files | Rebase; log in `07`; one owner per hot file (`04-HANDOVER.md`) |
| Perf budget vs animation | Hero blows LCP < 2.5 s / JS < 300 KB | Lighthouse after every landing change; hard budgets in `06` |
| Admin `planner_saves` split | Dual persistence drifts | `P1-S1.9` + round-trip test (`05-EXECUTION-CHECKLIST.md`) |
| Score inflation at 4.9 gate | Rounding up under pressure | Evidence rule §2; incomplete checklist = withdrawn score |
| Competitor copy | Legal and credibility damage | No competitor names on any Oando surface |
| Doc drift | Plans claim archived state | `04-HANDOVER.md` is live truth; repo is authority |
| Security debt | 3 critical open in audit | `P1` checklist before public launch promotion |

---

## Cross-References (8-file pack)

| Topic | Doc |
|---|---|
| Pack index & reading order | `00-INDEX.md` |
| Strategy (this file) | `01-MASTER-PLAN.md` |
| **Start rules** | `02-START-RULES.md` |
| **Finish rules** | `03-FINISH-RULES.md` |
| **Handover** | `04-HANDOVER.md` |
| **Checklist** | `05-EXECUTION-CHECKLIST.md` |
| Testing, gates, quality ledger | `06-TESTING-AND-EVIDENCE.md` |
| Failures, risks, blockers | `07-FAILURES-AND-RISKS.md` |

### Archived reference (history only)

| Topic | Doc |
|---|---|
| Capability matrix (2026-06) | `archive/docs/plans/04-PLANNER-CAPABILITY-MATRIX.md` |
| Repository remediation | `archive/docs/plans/05-REPOSITORY-REMEDIATION.md` |
| Launch governance | `docs/ops/audits/website-launch-5-phase-governance-and-metrics.md` |
| Lighthouse / security / a11y audits | `results/audits/` |
