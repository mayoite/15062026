# 07 — Failures & Risks

*Log every failure, skip, blocker, and waiver here the moment it happens.*
*This file replaces root `Failures.md` (removed 2026-06-12).*

---

## How to log

```markdown
### F-YYYY-MM-DD-NN — Short title
- **Severity:** S0 | S1 | S2 | S3
- **Item:** checklist ID (e.g. P1-S1.3)
- **What happened:**
- **Evidence:**
- **Status:** open | fixed | waived | skipped
- **Owner:**
- **Next action:**
```

---

## Severity definitions

| Level | Meaning | Launch rule |
|---|---|---|
| **S0** | Customer-blocking: broken auth, quote, blank page, missing prod env | Cannot launch |
| **S1** | Major trust/conversion/a11y defect | Block unless waived in handover |
| **S2** | Important but workaround exists | Track; fix in current pillar |
| **S3** | Minor / cosmetic | Backlog |

---

## Open failures & blockers

### F-2026-06-13-01 — Release gate not re-baselined
- **Severity:** S2
- **Item:** P0-BASE
- **What happened:** `docs/new/` pack created without running `npm install` + `release:gate`. `tsc` not on PATH without install.
- **Evidence:** Handover verification table 2026-06-13
- **Status:** open
- **Owner:** next operator
- **Next action:** `npm install && npm run release:gate`; save to `results/release-gate-2026-06-13.txt`

### F-2026-06-13-02 — Security audit findings open
- **Severity:** S0 (items 1–3), S1 (items 4–5)
- **Item:** P1-S1.1 through P1-S1.8
- **What happened:** 3 critical + 3 high from `results/audits/security-audit.md` — unauthenticated CDN write, weak admin tokens, hardcoded Supabase URL, open AI/tracking routes.
- **Evidence:** `results/audits/security-audit.md`
- **Status:** open
- **Owner:** —
- **Next action:** Execute P1 checklist in order

### F-2026-06-13-03 — Catalog performance below target
- **Severity:** S1
- **Item:** P2-P2.8
- **What happened:** Lighthouse perf 52 on `/products` (catalog route in audit was `/catalog`).
- **Evidence:** `results/audits/lighthouse-audit.md`
- **Status:** open
- **Owner:** —
- **Next action:** P2-P2.1 through P2-P2.4 bundle wins

### F-2026-06-13-04 — Dual planner persistence
- **Severity:** S1
- **Item:** P1-S1.9
- **What happened:** Drizzle `plans` and admin `planner_saves` both referenced; drift risk.
- **Evidence:** `archive/docs/plans/05-REPOSITORY-REMEDIATION.md`, `01-MASTER-PLAN.md` §3.8
- **Status:** open
- **Owner:** —
- **Next action:** Migration or signed admin-only contract + round-trip test

### F-2026-06-13-05 — Accessibility P1 issues open
- **Severity:** S1
- **Item:** P2-P2.6 (+ related)
- **What happened:** Empty alt on `CategoryGrid.tsx`; backdrop div in `TemplatePickerModal.tsx` without role/keyboard.
- **Evidence:** `results/audits/accessibility-audit.md`
- **Status:** open
- **Owner:** —
- **Next action:** Fix per audit; re-run `test:a11y`

### F-2026-06-13-06 — Lint regressions (stale)
- **Severity:** S3
- **Item:** P0-BASE-LINT
- **What happened:** 2 lint errors reported 2026-06-11: unused import `about/page.tsx`, regex parse `svg-qa.test.ts`.
- **Evidence:** `results/CERTIFICATION.md`, `results/lint-final.txt`
- **Status:** open (unverified since)
- **Owner:** —
- **Next action:** Re-run lint after install; fix if still present

### F-2026-06-13-07 — Quotes localStorage shim
- **Severity:** S1
- **Item:** P1-S1.11
- **What happened:** Archived `quoteSubmission.ts` documents localStorage persistence with TODO for Supabase.
- **Evidence:** `archive/features/oando-planner/lib/quoteSubmission.ts`
- **Status:** open
- **Owner:** —
- **Next action:** Implement Supabase quotes table + API

---

## Resolved (move here when fixed)

| ID | Title | Fixed date | Evidence |
|---|---|---|---|
| — | — | — | — |

---

## Waivers

| ID | Item | Reason | Approved by | Expiry |
|---|---|---|---|---|
| — | — | — | — | — |

*Waivers require explicit note in `04-HANDOVER.md` and must not apply to S0.*

---

## Honesty & risk register

| Risk | Why it sinks the plan | Mitigation | Owner |
|---|---|---|---|
| Stale green claims | Docs say pass; CI red | Re-run `release:gate` every batch; no forward carry | QA |
| Concurrent hot-file conflicts | Four agents overwrite `PlannerWorkspace.tsx` | Rebase; one owner per hot file; log here | Eng |
| Perf vs animation ambition | Hero blows LCP budget | Hard budgets; Lighthouse after every landing change | Frontend |
| Score inflation at 4.9 gate | Rounding up under pressure | Evidence rule; withdrawn-score precedent | Launch lead |
| Competitor copy under deadline | Legal + credibility damage | Copy review before marketing/onboarding ship | Content |
| Doc drift | Plans claim archived state | Live repo + `04-HANDOVER` authority | All |
| Three-database confusion | Wrong client for wrong table | Responsibility map in handover §Architecture | Backend |
| `node_modules` missing on fresh clone | Gates cannot run | P0-BASE first item every onboarding | DevOps |

---

## Skips (intentional deferrals)

| Date | Item | Reason | Revisit when |
|---|---|---|---|
| — | — | — | — |

---

## Cut list reminders (not failures — out of scope)

DWG import · photo-to-floorplan CV · AR/WebXR · team tenancy · IT network config · full audit log
