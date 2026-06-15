# 15 — Strategic Gaps and Product Direction

*Created: 2026-06-11 — Product vision, competitive positioning, India-market differentiation, and known suppressors.*
*Updated: 2026-06-13 — 0504 donor strategy and live blocker refresh.*

## Why This File Exists

Product vision, India-market differentiation, and honest technical state — consolidated for decisions that span `07-CAPABILITY-MATRIX.md`, `10-MIGRATION-PHASES.md`, and `02-PLANNER.md` milestones.

---

## 1. Product Vision

**What Oando is building:** A furniture-space planner for the **Indian market** — not a generic home-design app. Value chain:

1. Accurate space drawing (walls, doors, windows, dimensions)
2. Oando catalog (mm footprints, SH/NS semantics, SKUs)
3. Trustworthy BOQ + quote in **INR**

**What it is not:** Planner 5D clone, decor mood board, photoreal pipeline.

**Differentiator:** Every other planner sells generic furniture. Oando's planner sells **Oando** furniture. The BOQ is the product; 3D is reassurance.

**Live proof (2026-06-12):** 121-item SVG catalog QA; SH/NS rules in tests (`07-CAPABILITY-MATRIX.md`).

**0504 product lesson (2026-06-13):** The donor snapshot confirms that professional planner feel comes from workflow depth: layers, draft/session recovery, mobile panels, blueprint import, BOQ/quote bridge, compliance warnings, substitutions, templates, and richer 3D controls. Oando should port these as product capabilities, not as a second technical foundation.

---

## 2. India-Market Specifics

| Feature | Description | Status (2026-06-12) |
|---|---|---|
| INR pricing in BOQ | ₹ in quote outputs | **Partial** — `catalogData.ts` has INR field; PDF not confirmed |
| GST line items | GST breakdown on quote PDF | **Gap** |
| IS code room templates | NBC / IS default room sizes | **Gap** |
| Standard furniture dims | Indian-market defaults in catalog | **Partial** — mm catalog verified |
| Metric-first | cm/m primary | **Yes** — canvas mm, display m |
| Delivery zones | City/pin in quote | **Gap** |

**Action (unchanged):** Add INR + GST to quote schema before BOQ ships to customers.

---

## 3. Known Technical Suppressors (corrected 2026-06-12)

| Suppressor | Location | Effect today | Action |
|---|---|---|---|
| `typescript.ignoreBuildErrors` | `config/build/next.config.js` | **`false`** — build enforces TS | Keep false; run `typecheck` in gate |
| ESLint during build | `next.config.js` | Not ignored in doc audit | Fix 25 current lint errors |
| Duplicate `PlannerDocument` | `model/plannerDocument.ts` vs `shared/document/types.ts` | Two types coexist | Phase 1 deprecate shared copy |
| Vitest vs Jest split | `vitest.config.ts` vs Jest config | Planner tests now 181/181; some non-planner coverage still split | `11-COVERAGE.md` Phase 2 |
| Dual persistence | Drizzle `plans` vs admin `planner_saves` | Drift risk | `05-BACKEND-AND-DATA.md` |
| Legacy import count | Docs said 176 | **3 active** imports | `12-MIGRATION-STATUS.md` |
| 0504 donor contracts | `Final_oando_0504` imported files | Typecheck repaired; lint and contract cleanup still open | `02-PLANNER.md`, `10-MIGRATION-PHASES.md` |
| Git metadata | `.git` in current repo | `git status --short` fails with `fatal: bad object HEAD` | Repair before release/change review claims |

**Before new feature work:** `npm.cmd run typecheck` + `npm.cmd run test:planner` (181/181 on 2026-06-13) — not historical error counts. `npm.cmd run lint` must also be made green before any launch claim.

---

## 4. Guest-to-Registered Conversion Funnel

### Target funnel

```
/planner/guest → work locally (IndexedDB)
    ↓ first edit / export
Banner + signup prompt
    ↓ signup
/login?next=/planner/canvas
    ↓
IndexedDB claim → server save (Drizzle plans)
    ↓
/planner/canvas with plan intact
```

### Live (2026-06-12)

| Step | Status |
|---|---|
| Guest canvas no login wall | **Done** |
| IndexedDB autosave | **Done** |
| Member claim `migrateGuestProjectToMember()` | **Done** + unit test |
| Post-signup server write | **Gap** |
| Persistent guest upgrade banner | **Not verified** |
| Export-triggered signup prompt | **Not verified** |

---

## 5. Template Gallery

Minimum launch set (Admin DB `templates` table — each row = `PlannerDocument` JSON):

| Template | Size |
|---|---|
| Small bedroom | 3×3 m |
| Master bedroom | 4×3.5 m |
| Living room | 5×4 m |
| Home office | 3×3 m |
| Open office pod | 4×4 m |
| Blank room | User-defined |

**Status:** Not shipped — templates table migration + gallery UI open (M5).

---

## 6. Competitive Differentiation Summary

| Differentiator | Oando advantage | Status |
|---|---|---|
| Oando SKUs in BOQ | Real catalog → quote | **Partial** — export works; CRM handoff open |
| INR + GST quoting | India-native | **Gap** |
| CRM handoff | Quote request in Oando CRM | **Partial** — `customer_queries` exists |
| IS room templates | Indian housing stock | **Gap** |
| B2B designer tools | Zones, clusters, multi-floor | **Partial** — zone tool exists |
| Catalog symbol quality | mm-accurate 2.5D SVG | **Ship** — 121-item QA |
| Professional layer workflow | Serious designer control | **Partial** — 0504-inspired layer manager added; lint/browser audit open |
| Blueprint PDF trace workflow | Faster plan digitization | **Partial** — PDF/session/move HUD added; crop/rotate QA open |
| Compliance/substitution advice | Trustworthy fit decisions | **Gap** — 0504 donor ideas need current adapters/tests |

---

## 7. Ops Portal — Current Status

| Question | Current answer |
|---|---|
| Integrated or standalone? | Integrated under `app/ops/` |
| Users | Internal staff (`admin` role) |
| Features | Leads, quotes, catalog admin — scope doc still thin |

**Plan:** Stay integrated unless independent deploy case made (`10-MIGRATION-PHASES.md` Phase 7).

---

## 8. Product Roadmap Alignment

| Phase / Milestone | Product goal | Status (2026-06-12) |
|---|---|---|
| Phase 0 | Restore trust | **In progress** — TS/build/tests pass; lint + gate open |
| Phase 1 | One canonical document | **Partial** — bridge exists; 0504 import repaired; dedup + round-trip open |
| Phase 2 | Clean imports | **Mostly done** — 3 imports left |
| Phase 3 | Consolidated runtime | **In progress** — unified workspace live |
| Phase 4 | Backend aligned | **Partial** — Drizzle user path; admin split |
| M1 Editor shell | Chrome + autosave | **Done** |
| M2 Catalog / blocks | SVG QA | **Done** |
| M3 RoomSketcher mechanics | Blueprint + layers | **Done** |
| M4 Export / persistence | PDF + saves | **In progress** — draft/session imports compile; admin split open |
| M5 Site + onboarding | Typography + funnel | **In progress** — layer/blueprint UX improved; browser audit open |
| M6 Launch | Gate + regression | **Blocked** at lint — 25 current errors |

## 0504-Informed Roadmap Adjustment

1. Keep already-repaired parity increments: layer manager, PDF blueprint session controls, draft/session compatibility, and canonical document adapters.
2. Do not bulk-import more donor UI. Every 0504 candidate needs a current-code adapter, tests, lint pass, and browser UX check.
3. Next high-value 0504 candidates: compliance checks, product substitutions, templates, mobile panel proof, minimap/ruler, and walk/orbit 3D controls.
4. Ship priority still stays Oando-specific: BOQ, INR/GST, persistence, exact dimensions, and quote handoff beat photoreal or generic decor features.

---

## Cross-References

| Topic | Doc |
|---|---|
| Capability matrix | `07-CAPABILITY-MATRIX.md` |
| Migration phases | `10-MIGRATION-PHASES.md` |
| Quality scores | `03-QUALITY-LEDGER.md` |
| UX spec vs live | `14-UX-PATTERNS.md` |
| India BOQ backend | `05-BACKEND-AND-DATA.md` |
